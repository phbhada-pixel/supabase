async function loadInitialMasterData() {
    document.getElementById('reportLoader').classList.remove('hidden');

    try {
        const { data: pData } = await supabaseClient.from('phcs').select('*');
        masterData.phcs = pData || [];

        let scQuery = supabaseClient.from('sub_centers').select('*').order('name');
        if (user.role === 'phc_admin' && user.phc_id) {
            scQuery = scQuery.eq('phc_id', user.phc_id);
        }
        const { data: scData } = await scQuery;
        masterData.subCenters = scData || [];

        let scFilter = document.getElementById('reportSubCenterFilter');
        if (scFilter) {
            scFilter.innerHTML = '<option value="सर्व">सर्व उपकेंद्र (All Sub-centers)</option>';
            masterData.subCenters.forEach(sc => { 
                scFilter.innerHTML += `<option value="${sc.name}">${sc.name}</option>`; 
            });
        }

        let vQuery = supabaseClient.from('villages').select('*').order('name');
        if (user.role === 'phc_admin') {
            let scIds = masterData.subCenters.map(s => s.id);
            if (scIds.length > 0) vQuery = vQuery.in('sub_center_id', scIds);
            else vQuery = vQuery.eq('sub_center_id', '00000000-0000-0000-0000-000000000000');
        }
        const { data: vData } = await vQuery;
        masterData.villages = vData || [];

        let eQuery = supabaseClient.from('employees').select('*').order('full_name');
        if (user.role === 'phc_admin' && user.phc_id) eQuery = eQuery.eq('phc_id', user.phc_id);
        const { data: empData } = await eQuery;
        masterData.employees = empData || [];

        const { data: formData, error: formErr } = await supabaseClient.from('dynamic_forms').select('*').eq('is_active', true);
        if (formErr) throw formErr;

        let userRoleStr = String(user.role).trim().toUpperCase();
        let isAdminRole = ['ADMIN', 'TALUKA_ADMIN', 'PHC_ADMIN'].includes(userRoleStr);

        let filteredForms = (formData || []).filter(form => {
            let allowedRoles = form.allowed_roles ? String(form.allowed_roles).trim().toUpperCase() : "ALL";
            if (isAdminRole || allowedRoles === "ALL") return true;
            let rolesArr = allowedRoles.split(',').map(r => r.trim());
            return rolesArr.includes(userRoleStr);
        });

        masterData.forms = filteredForms;
        populateFormsDropdown();

        const { data: respData } = await supabaseClient.from('form_responses').select('id, form_id, village_id, employee_id, report_month, report_year, report_fortnight, created_at');
        masterData.filledStats = respData || [];

    } catch(e) { 
        console.error(e); 
        alert("माहिती लोड करण्यात त्रुटी: " + e.message); 
    }

    document.getElementById('reportLoader').classList.add('hidden');
}

async function fetchReportData() {
    let selectedIDs = getSelectedReportIDs(); 
    if(selectedIDs.length === 0) { alert("कृपया किमान एक अहवाल निवडा!"); return; }

    let freqFilterEl = document.getElementById('frequencyFilter');
    let freqFilter = freqFilterEl ? freqFilterEl.value : 'all';

    let formsToProcess = selectedIDs.includes("ALL") ? masterData.forms.filter(f => {
        let freq = f.schema_json && f.schema_json.frequency ? f.schema_json.frequency : (f.form_type === 'fortnightly' ? 'fortnightly' : 'monthly');
        if (freqFilter === 'all') return true;
        return freq === freqFilter;
    }) : masterData.forms.filter(f => selectedIDs.includes(f.id));
    
    let periodType = document.getElementById('periodType').value;
    let query = supabaseClient.from('form_responses').select('*').limit(10000); 
    
    let periodText = "";
    let selMonthNum = 0, selYear = 0;
    let selMonthName = ""; 
    let selFortnight = "1", selWeek = "1", selDaily = "1";

    if (periodType === 'monthly') {
        selMonthName = document.getElementById('reportMonth').value; 
        selMonthNum = monthNamesMarathi[selMonthName]; 
        selYear = document.getElementById('reportYear').value;
        periodText = `${selMonthName} ${selYear}`;
        
        let fnDiv = document.getElementById('fortnightInputs');
        if (fnDiv && !fnDiv.classList.contains('hidden')) {
            selFortnight = document.getElementById('reportFortnight').value || "1";
            periodText += ` (पंधरवाडा: ${selFortnight == "1" ? '१ ते १५' : '१६ ते अखेर'})`;
        }
        
        let wkDiv = document.getElementById('weekInputs');
        if (wkDiv && !wkDiv.classList.contains('hidden')) {
            selWeek = document.getElementById('reportWeek').value || "1";
            periodText += ` (आठवडा: ${selWeek})`;
        }
        
        let dyDiv = document.getElementById('dailyInputs');
        if (dyDiv && !dyDiv.classList.contains('hidden')) {
            selDaily = document.getElementById('reportDaily').value || "1";
            periodText += ` (तारीख: ${selDaily})`;
        }
    } else {
        let sDate = document.getElementById('startDate').value;
        let eDate = document.getElementById('endDate').value;
        if(!sDate || !eDate) { alert("कृपया सुरुवातीची व शेवटची तारीख निवडा!"); return; }
        
        query = query.gte('created_at', sDate + 'T00:00:00.000Z').lte('created_at', eDate + 'T23:59:59.999Z');
        periodText = `${formatDateToDDMMYYYY(sDate)} ते ${formatDateToDDMMYYYY(eDate)}`;
    }

    let filterSubCenter = document.getElementById('reportSubCenterFilter').value; 
    let groupType = document.getElementById('reportGroupFilter').value;

    if (user.role !== 'admin' && user.role !== 'taluka_admin' && user.role !== 'phc_admin') {
        groupType = 'Village';
    }

    document.getElementById('reportLoader').classList.remove('hidden'); 
    document.getElementById('reportContentArea').classList.add('hidden'); 
    document.getElementById('reportTableContainer').innerHTML = "";

    try {
        if(!selectedIDs.includes("ALL")) query = query.in('form_id', formsToProcess.map(f=>f.id));

        const { data: dbData, error } = await query; 
        document.getElementById('reportLoader').classList.add('hidden');
        
        if (error || !dbData || dbData.length === 0) { 
            alert(`⚠️ डेटाबेसमध्ये कोणताही डेटा सापडला नाही. तुमचे इंटरनेट तपासा किंवा फिल्टर तपासा.`); 
            return; 
        }

        windowDbData = dbData; 
        let finalReports = [];

        formsToProcess.forEach(formObj => {
            let formResp = dbData.filter(r => String(r.form_id) === String(formObj.id)); 
            if(formResp.length === 0) return;
            
            const allFields = formObj.schema_json.fields || [];
            const validDataFields = allFields.filter(f => f.type !== 'group_header');
            const isProgressive = formObj.form_type === 'progressive';
            
            let freq = formObj.schema_json && formObj.schema_json.frequency ? formObj.schema_json.frequency : (formObj.form_type === 'fortnightly' ? 'fortnightly' : 'monthly');

            let fieldMetaList = validDataFields.map(f => {
                let chain = getFieldHierarchyChain(allFields, f);
                return { id: f.id, label: f.label, type: f.type, formula: f.formula, l1: chain[0] || "", l2: chain[1] || "", l3: f.label };
            });

            let fData = [];
            let currentMonthResp = [];
            
            if (periodType === 'monthly') {
                currentMonthResp = formResp.filter(r => {
                    if (freq === 'onetime') return true; 

                    let dbMonth = String(r.report_month).trim().toLowerCase();
                    let rYear = parseInt(r.report_year);
                    if (isNaN(rYear) || rYear === 0) {
                        if(r.created_at) rYear = new Date(r.created_at).getFullYear();
                        else rYear = parseInt(selYear); 
                    }
                    let matchY = (rYear === parseInt(selYear));

                    let matchM = false;
                    if (dbMonth == selMonthNum || dbMonth === `0${selMonthNum}`) matchM = true;
                    else if (selMonthName && dbMonth.includes(selMonthName.toLowerCase())) matchM = true;
                    else if (monthNamesNumeric[selMonthNum] && dbMonth.includes(monthNamesNumeric[selMonthNum].toLowerCase())) matchM = true;
                    
                    if (!matchM && (dbMonth === "null" || dbMonth === "" || dbMonth === "nan")) {
                        if (r.created_at) {
                            let cMonth = new Date(r.created_at).getMonth() + 1;
                            matchM = (cMonth === parseInt(selMonthNum));
                        }
                    }

                    let dbFn = String(r.report_fortnight).trim();
                    if(dbFn === "null" || dbFn === "undefined" || dbFn === "" || dbFn === "NaN" || dbFn === "0") dbFn = "1";

                    let matchFreq = true;
                    if (freq === 'fortnightly') {
                        matchFreq = (dbFn == selFortnight || dbFn === `0${selFortnight}` || (selFortnight == 2 && (dbFn.includes("16") || dbFn.includes("अखेर") || dbFn.includes("२"))) || (selFortnight == 1 && (dbFn.includes("15") || dbFn.includes("१"))));
                    } else if (freq === 'weekly') {
                        matchFreq = (dbFn == selWeek || dbFn === `0${selWeek}` || dbFn.includes(String(selWeek)));
                    } else if (freq === 'daily') {
                        matchFreq = (dbFn == selDaily || dbFn === `0${selDaily}` || dbFn.includes(String(selDaily)));
                    }
                    
                    return matchY && matchM && matchFreq;
                });
            } else {
                currentMonthResp = formResp; 
            }

            currentMonthResp.forEach(res => {
                
                if (formObj.form_type === 'list') {
                    if (res.response_data && res.response_data.is_nil === true) return;

                    let isStringNil = false;
                    for (let key in res.response_data) {
                        if (res.response_data[key] && typeof res.response_data[key].value === 'string') {
                            let v = res.response_data[key].value.trim().toLowerCase();
                            if (v === 'निरंक' || v.includes('निरंक') || v.includes('nil report') || v === 'nil') {
                                isStringNil = true; break;
                            }
                        }
                    }
                    if (isStringNil) return;
                }

                let isAdminRole = ['admin', 'taluka_admin', 'phc_admin'].includes(user.role);
                if (!isAdminRole) {
                    if (String(res.employee_id) !== String(user.id)) return;
                }

                let villageObj = masterData.villages.find(v => String(v.id) === String(res.village_id));
                let empObj = masterData.employees.find(e => String(e.id) === String(res.employee_id));
                let scObj = villageObj ? masterData.subCenters.find(s => String(s.id) === String(villageObj.sub_center_id)) : null;

                if (user.role === 'phc_admin') {
                    if (!scObj || String(scObj.phc_id) !== String(user.phc_id)) return;
                }

                let scName = scObj ? scObj.name : '-';
                if(isAdminRole && filterSubCenter !== "सर्व" && scName !== filterSubCenter) return;

                let vName = villageObj ? villageObj.name : '-';
                let pop = 0; let houses = 0;
                if (formObj.form_type === 'subcenter') {
                    vName = "🏢 संपूर्ण उपकेंद्र (Subcenter Level)";
                } else if (villageObj) {
                    pop = villageObj.population || 0;
                    houses = villageObj.total_houses || 0;
                }

                let row = { 
                    response_id: res.id, report_month: res.report_month, report_year: res.report_year,
                    month: periodText, year: '', subcenter: scName, village: vName, 
                    employee: empObj?empObj.full_name:'-', 
                    population: pop, houses: houses,
                    values: {} 
                };

                validDataFields.forEach(f => {
                    if (!f.formula || String(f.formula).trim() === "") {
                        let monthlyVal = '';
                        
                        if(res.response_data && res.response_data.is_nil) {
                            monthlyVal = 'निरंक';
                        } else if(res.response_data && res.response_data[f.id]) {
                            monthlyVal = res.response_data[f.id].value;
                        }

                        if (f.type === 'date' && monthlyVal && String(monthlyVal).trim() !== '' && monthlyVal !== 'निरंक') {
                            monthlyVal = formatDateToDDMMYYYY(monthlyVal);
                        }

                        if (isProgressive && f.type === 'number') {
                            let sumProg = 0;
                            getProgressiveMonthsList(selMonthNum, selYear).forEach(p => {
                                let pastRes = formResp.find(r => String(r.village_id) === String(res.village_id) && (Number(r.report_month) === p.month || String(r.report_month).trim() === monthNamesNumeric[p.month]) && Number(r.report_year) === p.year);
                                if(pastRes && pastRes.response_data && pastRes.response_data[f.id] && !pastRes.response_data.is_nil) {
                                    sumProg += parseFloat(pastRes.response_data[f.id].value) || 0;
                                }
                            });
                            row.values[f.id] = { M: formatNumberDecimals(monthlyVal), P: formatNumberDecimals(sumProg) };
                        } else { 
                            row.values[f.id] = formatNumberDecimals(monthlyVal); 
                        }
                    }
                });

                validDataFields.forEach(f => {
                    if (f.formula && String(f.formula).trim() !== "") {
                        let evalRowFormula = (type) => {
                            let formulaStr = String(f.formula).toLowerCase().trim();
                            validDataFields.forEach(af => {
                                if (!af.formula || String(af.formula).trim() === "") {
                                    let ph = `[${af.id.toLowerCase()}]`;
                                    if(formulaStr.includes(ph)) {
                                        let val = 0; let afVal = row.values[af.id];
                                        if (typeof afVal === 'object' && afVal !== null) { val = parseFloat(afVal[type]) || 0; } 
                                        else { val = parseFloat(afVal) || 0; }
                                        formulaStr = formulaStr.replaceAll(ph, val);
                                    }
                                }
                            });
                            try {
                                if (/^[0-9.+\-*/() ]+$/.test(formulaStr)) {
                                    let res = eval(formulaStr); 
                                    return isNaN(res) || !isFinite(res) ? 0 : res;
                                }
                            } catch(e) {}
                            return 0;
                        };

                        if (isProgressive && f.type === 'number') {
                            row.values[f.id] = { M: formatNumberDecimals(evalRowFormula('M')), P: formatNumberDecimals(evalRowFormula('P')) };
                        } else {
                            row.values[f.id] = formatNumberDecimals(evalRowFormula('M'));
                        }
                    }
                });

                fData.push(row);
            });

            if(fData.length > 0) {
                let shouldShowPop = false;
                if (formObj.schema_json && formObj.schema_json.show_population === true) {
                    shouldShowPop = true;
                }
                
                let finalPeriodText = periodText;
                if(freq === 'onetime') finalPeriodText = "संपूर्ण अहवाल (All Time)";

                finalReports.push({ 
                    formName: formObj.form_name, 
                    formType: formObj.form_type, 
                    fields: fieldMetaList, 
                    rows: fData, 
                    isProg: isProgressive, 
                    periodText: finalPeriodText,
                    showPopConfig: shouldShowPop
                });
            }
        });

        if(finalReports.length > 0) { 
            currentReports = finalReports; 
            renderMultipleTables(finalReports, groupType); 
            document.getElementById('reportContentArea').classList.remove('hidden'); 
        } else { 
            alert(`⚠️ तुम्ही निवडलेल्या कालावधीचा डेटा फिल्टरमुळे लपवला जात आहे.\n\nकृपया खात्री करा की तुम्ही निवडलेले 'उपकेंद्र' आणि 'वर्ष' अचूक आहेत.`); 
        }
    } catch(e) { alert("एरर: " + e.message); }
}        

async function deleteResponse(responseId) {
    if(!confirm("तुम्हाला खात्री आहे का? हा डेटा कायमचा डिलीट होईल!")) return;
    document.getElementById('reportLoader').classList.remove('hidden');
    const { error } = await supabaseClient.from('form_responses').delete().eq('id', responseId);
    document.getElementById('reportLoader').classList.add('hidden');
    
    if(error) alert("डिलीट करताना त्रुटी: " + error.message);
    else { alert("✅ डेटा डिलीट झाला!"); fetchReportData(); }
}

async function saveEditResponse() {
    if(!currentEditResponseId) return;
    let response = windowDbData.find(r => r.id === currentEditResponseId);
    let formObj = masterData.forms.find(f => f.id === currentEditFormId);
    
    let allFields = formObj.schema_json.fields.filter(f => f.type !== 'group_header' && (!f.formula || String(f.formula).trim() === ""));
    
    let newData = { ...response.response_data };
    allFields.forEach(f => {
        let el = document.getElementById(`edit_f_${f.id}`);
        if(el) {
            newData[f.id] = { value: el.value };
        }
    });
    
    document.getElementById('reportLoader').classList.remove('hidden');
    closeEditModal();
    
    const { error } = await supabaseClient.from('form_responses').update({ response_data: newData }).eq('id', currentEditResponseId);
    
    if(error) alert("अपडेट करताना त्रुटी: " + error.message);
    else {
        alert("✅ डेटा यशस्वीरीत्या अपडेट झाला!");
        fetchReportData();
    }
    document.getElementById('reportLoader').classList.add('hidden');
}