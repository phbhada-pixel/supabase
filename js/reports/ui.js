function togglePeriodInputs() {
    let val = document.getElementById('periodType').value;
    if (val === 'custom') {
        document.getElementById('monthlyInputs').classList.add('hidden');
        document.getElementById('customDateInputs').classList.remove('hidden');
        let fnDiv = document.getElementById('fortnightInputs');
        if (fnDiv) fnDiv.classList.add('hidden');
        let wkDiv = document.getElementById('weekInputs');
        if (wkDiv) wkDiv.classList.add('hidden');
        let dyDiv = document.getElementById('dailyInputs');
        if (dyDiv) dyDiv.classList.add('hidden');
    } else {
        document.getElementById('monthlyInputs').classList.remove('hidden');
        document.getElementById('customDateInputs').classList.add('hidden');
        updateMultiSelectText();
        if (typeof updateDailyDropdown === 'function') updateDailyDropdown(); 
    }
}

function toggleMultiSelect() {
    let dropdown = document.getElementById('multiSelectDropdown');
    if (dropdown) dropdown.classList.toggle('hidden');
}

function populateFormsDropdown() {
    let select = document.getElementById('reportFormSelect');
    let optionsDiv = document.getElementById('multiSelectOptions');
    let freqFilterEl = document.getElementById('frequencyFilter');
    
    if (!select || !optionsDiv) return;

    select.innerHTML = ''; optionsDiv.innerHTML = '';
    let freqFilter = freqFilterEl ? freqFilterEl.value : 'all';

    let filteredForms = masterData.forms.filter(f => {
        let freq = f.schema_json && f.schema_json.frequency ? f.schema_json.frequency : (f.form_type === 'fortnightly' ? 'fortnightly' : 'monthly');
        if (freqFilter === 'all') return true;
        return freq === freqFilter;
    });

    let btnText = document.getElementById('multiSelectBtnText');
    if(filteredForms.length === 0 && btnText) {
        btnText.innerText = "कोणताही फॉर्म उपलब्ध नाही";
    }

    filteredForms.forEach(f => {
        let opt = document.createElement('option'); opt.value = f.id; opt.text = f.form_name; select.appendChild(opt);
        let div = document.createElement('div');
        
        let freq = f.schema_json && f.schema_json.frequency ? f.schema_json.frequency : (f.form_type === 'fortnightly' ? 'fortnightly' : 'monthly');
        
        let formTypeTag = '';
        if(freq === 'daily') formTypeTag = `<span class="bg-purple-100 text-purple-700 text-[10px] px-1 ml-2 rounded">दैनिक</span>`;
        else if(freq === 'weekly') formTypeTag = `<span class="bg-blue-100 text-blue-700 text-[10px] px-1 ml-2 rounded">आठवडी</span>`;
        else if(freq === 'fortnightly') formTypeTag = `<span class="bg-orange-100 text-orange-700 text-[10px] px-1 ml-2 rounded">पंधरवाडी</span>`;
        else if(freq === 'onetime') formTypeTag = `<span class="bg-gray-200 text-gray-700 text-[10px] px-1 ml-2 rounded">एकदाच</span>`;
        else if(f.form_type === 'list') formTypeTag = `<span class="bg-indigo-100 text-indigo-700 text-[10px] px-1 ml-2 rounded">यादी</span>`;
        else if(f.form_type === 'subcenter') formTypeTag = `<span class="bg-green-100 text-green-700 text-[10px] px-1 ml-2 rounded">उपकेंद्र स्तर</span>`;
        else formTypeTag = `<span class="bg-pink-100 text-pink-700 text-[10px] px-1 ml-2 rounded">मासिक</span>`;
        
        div.className = "hover:bg-gray-100 transition p-2 border-b border-gray-100 cursor-pointer";
        div.innerHTML = `<label style="cursor:pointer; display:flex; align-items:center; gap:8px; font-weight:600;"><input type="checkbox" class="report-chk w-4 h-4" value="${f.id}" checked onchange="checkIndividualReport()"> ${f.form_name} ${formTypeTag}</label>`;
        optionsDiv.appendChild(div);
    });

    let chkAll = document.getElementById('chkAllReports');
    if (chkAll) chkAll.checked = true;
    updateMultiSelectText();
}

function handleFrequencyChange() {
    populateFormsDropdown();
}

function toggleAllReports(chkAll) {
    document.querySelectorAll('.report-chk').forEach(chk => chk.checked = chkAll.checked); 
    updateMultiSelectText();
}

function checkIndividualReport() {
    let allChecked = true; 
    document.querySelectorAll('.report-chk').forEach(chk => { if(!chk.checked) allChecked = false; });
    let chkAll = document.getElementById('chkAllReports');
    if(chkAll) chkAll.checked = allChecked; 
    updateMultiSelectText();
}

function updateMultiSelectText() {
    let chkAll = document.getElementById('chkAllReports');
    let textSpan = document.getElementById('multiSelectBtnText');
    
    let hasFortnightly = false;
    let hasWeekly = false;
    let hasDaily = false;
    let allOnetime = true;
    let hasSelected = false;

    document.querySelectorAll('.report-chk:checked').forEach(chk => {
        hasSelected = true;
        let fObj = masterData.forms.find(f => f.id === chk.value);
        if(fObj) {
            let freq = fObj.schema_json && fObj.schema_json.frequency ? fObj.schema_json.frequency : (fObj.form_type === 'fortnightly' ? 'fortnightly' : 'monthly');
            if (freq === 'fortnightly') hasFortnightly = true;
            if (freq === 'weekly') hasWeekly = true;
            if (freq === 'daily') hasDaily = true;
            if (freq !== 'onetime') allOnetime = false;
        }
    });

    if (!hasSelected) allOnetime = false;

    let fnInputs = document.getElementById('fortnightInputs');
    let wkInputs = document.getElementById('weekInputs');
    let dyInputs = document.getElementById('dailyInputs');
    let periodTypeEl = document.getElementById('periodType');
    let pType = periodTypeEl ? periodTypeEl.value : 'monthly';

    if (fnInputs) {
        if (hasFortnightly && pType !== 'custom') fnInputs.classList.remove('hidden');
        else fnInputs.classList.add('hidden');
    }

    if (wkInputs) {
        if (hasWeekly && pType !== 'custom') wkInputs.classList.remove('hidden');
        else wkInputs.classList.add('hidden');
    }
    
    if (dyInputs) {
        if (hasDaily && pType !== 'custom') dyInputs.classList.remove('hidden');
        else dyInputs.classList.add('hidden');
    }

    let repMonthEl = document.getElementById('reportMonth');
    let repYearEl = document.getElementById('reportYear');
    let freqFilterEl = document.getElementById('frequencyFilter');
    let isOnetimeSelected = freqFilterEl && freqFilterEl.value === 'onetime';

    if (repMonthEl && repYearEl) {
        if (allOnetime || isOnetimeSelected) {
            repMonthEl.parentElement.classList.add('opacity-40', 'pointer-events-none');
            repYearEl.parentElement.classList.add('opacity-40', 'pointer-events-none');
        } else {
            repMonthEl.parentElement.classList.remove('opacity-40', 'pointer-events-none');
            repYearEl.parentElement.classList.remove('opacity-40', 'pointer-events-none');
        }
    }

    if(textSpan) {
        if(chkAll && chkAll.checked) { textSpan.innerText = "सर्व निवडले (All Selected)"; textSpan.style.color = "var(--primary)"; } 
        else {
            let selected = document.querySelectorAll('.report-chk:checked');
            if(selected.length === 0) { textSpan.innerText = "-- कोणताही अहवाल निवडलेला नाही --"; textSpan.style.color = "red"; } 
            else if(selected.length === 1) { let lbl = selected[0].parentElement.innerText.trim(); textSpan.innerText = lbl.length > 35 ? lbl.substring(0, 35) + "..." : lbl; textSpan.style.color = "#d35400"; } 
            else { textSpan.innerText = `✔️ ${selected.length} अहवाल निवडले`; textSpan.style.color = "green"; }
        }
    }
}

function getSelectedReportIDs() {
    let chkAll = document.getElementById('chkAllReports');
    if(chkAll && chkAll.checked) return ["ALL"];
    let selected = []; document.querySelectorAll('.report-chk:checked').forEach(chk => selected.push(chk.value)); return selected;
}

function getCustomHeader(rep) {
    let role = user.role;
    let l1 = "", l2 = "", l3 = "";
    let period = rep.periodText;
    let formName = rep.formName;

    if (role === 'admin' || role === 'taluka_admin') {
        l1 = "तालुका आरोग्य अधिकारी कार्यालय औसा";
        l2 = "प्रगत अहवाल";
        l3 = `${formName} | ${period}`;
    } else if (role === 'phc_admin') {
        let phcObj = masterData.phcs.find(p => String(p.id) === String(user.phc_id));
        let phcName = phcObj ? (phcObj.name || phcObj.phc_name) : "प्राथमिक आरोग्य केंद्र";
        l1 = `प्राथमिक आरोग्य केंद्र ${phcName}`;
        l2 = `${formName}`;
        l3 = `${period}`;
    } else {
        let empObj = masterData.employees.find(e => String(e.id) === String(user.id));
        let empName = empObj ? empObj.full_name : "-";
        let scObj = empObj ? masterData.subCenters.find(s => String(s.id) === String(empObj.sub_center_id)) : null;
        let scName = scObj ? scObj.name : "उपकेंद्र";
        
        if (role === 'बाह्य रुग्ण विभाग सेविका') {
             let phcObj = masterData.phcs.find(p => String(p.id) === String(user.phc_id));
             let phcName = phcObj ? (phcObj.name || phcObj.phc_name) : "";
             scName = `PHC ${phcName} (OPD)`;
        }
        
        l1 = `${formName}`;
        l2 = `कर्मचारी: ${empName} | उपकेंद्र: ${scName} | कालावधी: ${period}`;
        l3 = "";
    }
    return { l1, l2, l3 };
}

function renderMultipleTables(reports, groupType) {
    let container = document.getElementById('reportTableContainer');
    let downArea = document.getElementById('downloadButtonsArea');

    let phcHeaderTxt = "माझे अहवाल";
    if (user.role === 'admin' || user.role === 'taluka_admin') phcHeaderTxt = "तालुका अहवाल - संपूर्ण डेटा";
    if (user.role === 'phc_admin') phcHeaderTxt = "तुमच्या PHC चा अहवाल";

    downArea.innerHTML = `<div class="flex flex-col md:flex-row justify-between items-center gap-2 p-3 bg-gray-50 rounded-lg border shadow-sm mb-4 no-print"><span class="font-bold text-gray-700">${phcHeaderTxt}</span><div class="flex gap-2"><button onclick="downloadConsolidatedExcel()" class="bg-green-600 text-white font-extrabold px-6 py-2 rounded-lg shadow-lg hover:bg-green-700 transition">📥 Excel डाऊनलोड</button><button onclick="window.print()" class="bg-red-600 text-white font-extrabold px-6 py-2 rounded-lg shadow-lg hover:bg-red-700 transition">🖨️ प्रिंट काढा</button></div></div>`;

    let html = '';
    reports.forEach(rep => {
        let columns = rep.fields; let rows = rep.rows;
        let headInfo = getCustomHeader(rep);
        let showPop = rep.showPopConfig === true;

        html += `<div class="mb-8 p-4 border border-gray-300 rounded-xl bg-white shadow-sm overflow-hidden report-block">
                    <div class="text-center border-b pb-3 mb-4 bg-green-50 p-4 rounded-t-lg">                                
                        <h1 class="text-xl font-extrabold text-green-900 mb-1">${headInfo.l1}</h1>
                        <h2 class="text-lg font-bold text-green-800 mb-1">${headInfo.l2}</h2>
                        ${headInfo.l3 !== "" ? `<p class="text-sm font-bold text-gray-700">${headInfo.l3}</p>` : ''}
                    </div>`;

        if(groupType === "SubCenterConsolidated") {
            let phcTotals = calculateSmartTotals(rows, columns, rep.isProg);
            let l1Row = `<tr><th rowspan="${rep.isProg?3:2}" class="border p-2">अ.क्र.</th><th rowspan="${rep.isProg?3:2}" class="border p-2 text-left">तपशील / मुख्य प्रश्न</th>`;
            let l2Row = `<tr>`; let l3Row = rep.isProg ? `<tr>` : ``;

            rows.forEach((r) => {
                let extra = showPop ? `<br/><span class="text-[10px] text-gray-600">लोक.: ${r.population || 0} | घरे: ${r.houses || 0}</span>` : '';
                let vName = r.village ? `${r.village} <br/><span class="text-[10px] text-gray-500">(${r.subcenter})</span>${extra}` : "-";
                
                // 🟢 दुरुस्ती: उपकेंद्र फॉर्म असल्यास 'संपूर्ण उपकेंद्र' ऐवजी प्रत्यक्ष 'उपकेंद्राचे नाव' दाखवा
                if (rep.formType === 'subcenter') {
                    vName = `<span class="text-indigo-900 font-extrabold text-sm">${r.subcenter}</span>${extra}`;
                }

                l1Row += `<th colspan="${rep.isProg ? 2 : 1}" class="border p-2 bg-purple-100">${vName}</th>`;
                if (rep.isProg) { l2Row += `<th class="border p-1 bg-yellow-50 text-[10px]">मासिक</th><th class="border p-1 bg-orange-50 text-[10px]">प्रगत</th></tr>`; }
            });
            
            if(rep.formType !== 'list') {
                l1Row += `<th colspan="${rep.isProg ? 2 : 1}" class="border p-2 bg-green-200">एकूण PHC Total</th></tr>`;
                if (rep.isProg) { l2Row += `<th class="border p-1 bg-green-100 text-[10px]">मासिक</th><th class="border p-1 bg-green-100 text-[10px]">प्रगत</th></tr>`; }
            } else {
                l1Row += `</tr>`;
            }

            let tbodyHtml = '';
            columns.forEach((c, vIndex) => {
                let fLabel = ""; if(c.l1) fLabel += c.l1+" - "; if(c.l2) fLabel += c.l2+" - "; fLabel += c.l3;
                tbodyHtml += `<tr class="hover:bg-gray-50 text-xs"><td class="border p-2 text-center font-bold">${vIndex+1}</td><td class="border p-2 font-bold text-gray-800 text-left">${fLabel}</td>`;
                rows.forEach(r => {
                    let val = r.values[c.id];
                    if(typeof val === 'object' && val !== null) { tbodyHtml += `<td class="border p-2 text-center text-blue-700">${val.M}</td><td class="border p-2 font-medium bg-orange-50/30 text-center text-orange-700">${val.P}</td>`; } 
                    else { tbodyHtml += `<td class="border p-2 text-center">${val !== '' ? val : '-'}</td>`; }
                });
                
                if(rep.formType !== 'list') {
                    let smartM = phcTotals[c.id].isNum ? formatNumberDecimals(phcTotals[c.id].M) : "-";
                    let smartP = rep.isProg && phcTotals[c.id].isNum ? formatNumberDecimals(phcTotals[c.id].P) : "-";
                    tbodyHtml += `<td class="border p-2 font-extrabold bg-green-50 text-green-900 text-center">${smartM}</td>`;
                    if (rep.isProg) tbodyHtml += `<td class="border p-2 font-extrabold bg-green-50 text-green-900 text-center">${smartP}</td>`;
                }
                tbodyHtml += `</tr>`;
            });

            html += `<div class="table-responsive"><table class="report-table"><thead>${l1Row + l2Row + l3Row}</thead><tbody>${tbodyHtml}</tbody></table></div>`;
        
        } else if (groupType === "SubCenterSum" || groupType === "SubCenterFlat") {
            let dataRowsToRender = rows;

            if(groupType === "SubCenterSum") {
                let scGroups = {};
                rows.forEach(r => { if(!scGroups[r.subcenter]) scGroups[r.subcenter] = []; scGroups[r.subcenter].push(r); });
                let subCenterAggregatedRows = [];
                Object.keys(scGroups).sort().forEach(sc => {
                    let scRows = scGroups[sc];
                    let scSmartTotals = calculateSmartTotals(scRows, columns, rep.isProg);
                    
                    let sumPop = 0, sumHouses = 0;
                    scRows.forEach(sr => { sumPop += (parseInt(sr.population) || 0); sumHouses += (parseInt(sr.houses) || 0); });
                    
                    let scNewRow = { subcenter: sc, village: "एकत्रित", employee: "-", population: sumPop, houses: sumHouses, values: {} };
                    
                    columns.forEach((c, idx) => {
                        if (rep.formType === 'list') {
                            if (idx === 0) { scNewRow.values[c.id] = `एकूण नोंदी: ${scRows.length}`; } else { scNewRow.values[c.id] = '-'; }
                        } else {
                            let t = scSmartTotals[c.id];
                            if(rep.isProg && c.type === 'number') { scNewRow.values[c.id] = { M: t.isNum ? t.M : '-', P: t.isNum ? t.P : '-' }; } 
                            else { scNewRow.values[c.id] = t.isNum ? t.M : '-'; }
                        }
                    });
                    subCenterAggregatedRows.push(scNewRow);
                });
                dataRowsToRender = subCenterAggregatedRows;
            } else if (groupType === "SubCenterFlat") {
                dataRowsToRender = rows.sort((a,b) => a.subcenter.localeCompare(b.subcenter) || a.employee.localeCompare(b.employee) || a.village.localeCompare(b.village));
            }

            // 🟢 दुरुस्ती: 'उपकेंद्र' फॉर्म असल्यास 'गाव' कॉलम लपवा
            let l1Row = `<tr><th rowspan="${rep.isProg?4:3}" class="border p-2">अ.क्र.</th><th rowspan="${rep.isProg?4:3}" class="border p-2">उपकेंद्र</th>`;
            if (groupType === 'SubCenterFlat') {
                if (rep.formType !== 'subcenter') {
                    l1Row += `<th rowspan="${rep.isProg?4:3}" class="border p-2">गाव/कार्यक्षेत्र</th>`;
                }
                l1Row += `<th rowspan="${rep.isProg?4:3}" class="border p-2">कर्मचारी</th>`;
            }
            
            if (showPop) {
                l1Row += `<th rowspan="${rep.isProg?4:3}" class="border p-2 bg-yellow-50">लोकसंख्या</th>`;
                l1Row += `<th rowspan="${rep.isProg?4:3}" class="border p-2 bg-yellow-50">कुटुंब संख्या</th>`;
            }
            
            let l2Row = `<tr>`; let l3Row = `<tr>`; let l4Row = rep.isProg ? `<tr>` : ``;

            let i = 0;
            while(i < columns.length) {
                let c = columns[i]; let j = i + 1;
                if(c.l1 !== "") {
                    while(j < columns.length && columns[j].l1 === c.l1) { j++; }
                    let totalL1Span = 0; for(let k=i; k<j; k++) totalL1Span += (rep.isProg && columns[k].type === 'number') ? 2 : 1;
                    l1Row += `<th colspan="${totalL1Span}" class="border p-2 bg-purple-100 text-purple-900">${c.l1}</th>`;

                    let k = i;
                    while(k < j) {
                        let c2 = columns[k]; let m = k + 1;
                        if(c2.l2 !== "") {
                            while(m < j && columns[m].l2 === c2.l2) { m++; }
                            let totalL2Span = 0; for(let n=k; n<m; n++) totalL2Span += (rep.isProg && columns[n].type === 'number') ? 2 : 1;
                            l2Row += `<th colspan="${totalL2Span}" class="border p-2 bg-blue-50 text-blue-900">${c2.l2}</th>`;
                            for(let n=k; n<m; n++) {
                                let w = (rep.isProg && columns[n].type === 'number') ? 2 : 1;
                                if(w===2) { l3Row += `<th colspan="2" class="border p-2 text-xs">${columns[n].l3}</th>`; l4Row += `<th class="border p-1 bg-yellow-50 text-[10px]">मासिक</th><th class="border p-1 bg-orange-50 text-[10px]">प्रगत</th>`; } 
                                else { l3Row += `<th rowspan="${rep.isProg?2:1}" class="border p-2 text-xs">${columns[n].l3}</th>`; }
                            }
                            k = m;
                        } else {
                            let mult2 = (rep.isProg && c2.type === 'number') ? 2 : 1;
                            if(mult2 === 2) { l2Row += `<th colspan="2" rowspan="2" class="border p-2 text-xs">${c2.l3}</th>`; l4Row += `<th class="border p-1 bg-yellow-50 text-[10px]">मासिक</th><th class="border p-1 bg-orange-50 text-[10px]">प्रगत</th>`; } 
                            else { l2Row += `<th rowspan="${rep.isProg?3:2}" class="border p-2 text-xs">${c2.l3}</th>`; }
                            k++;
                        }
                    }
                    i = j;
                } else {
                    let mult = (rep.isProg && c.type === 'number') ? 2 : 1;
                    if(mult === 2) { l1Row += `<th colspan="2" rowspan="3" class="border p-2 text-xs">${c.l3}</th>`; l4Row += `<th class="border p-1 bg-yellow-50 text-[10px]">मासिक</th><th class="border p-1 bg-orange-50 text-[10px]">प्रगत</th>`; } 
                    else { l1Row += `<th rowspan="${rep.isProg?4:3}" class="border p-2 text-xs">${c.l3}</th>`; }
                    i++;
                }
            }
            l1Row += `</tr>`; l2Row += `</tr>`; l3Row += `</tr>`; if(rep.isProg) l4Row += `</tr>`;

            let tbodyHtml = '';
            dataRowsToRender.forEach((r, rIdx) => {
                let actionHtml = '';
                if (user.role === 'phc_admin' && r.response_id && isEditingAllowed(r.report_month, r.report_year)) {
                    actionHtml = `<div class="mt-1 flex gap-1 justify-start no-print"><button onclick="openEditModal('${r.response_id}')" class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm hover:bg-blue-200">✏️</button><button onclick="deleteResponse('${r.response_id}')" class="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm hover:bg-red-200">🗑️</button></div>`;
                }

                tbodyHtml += `<tr class="hover:bg-gray-50 text-xs"><td class="border p-2 text-center font-bold">${rIdx+1}</td>`;
                
                // 🟢 दुरुस्ती: उपकेंद्र फॉर्म असल्यास 'गाव' कॉलम लपवा आणि ॲक्शन बटन उपकेंद्राच्या नावासोबत द्या
                if (groupType === 'SubCenterFlat') {
                    if (rep.formType === 'subcenter') {
                        tbodyHtml += `<td class="border p-2 font-bold text-gray-800 text-left">${r.subcenter} ${actionHtml}</td>`;
                        tbodyHtml += `<td class="border p-2 font-medium text-gray-700 text-left">${r.employee}</td>`;
                    } else {
                        tbodyHtml += `<td class="border p-2 font-bold text-gray-800 text-left">${r.subcenter}</td>`;
                        tbodyHtml += `<td class="border p-2 font-bold text-gray-800 text-left">${r.village} ${actionHtml}</td>`;
                        tbodyHtml += `<td class="border p-2 font-medium text-gray-700 text-left">${r.employee}</td>`;
                    }
                } else {
                    tbodyHtml += `<td class="border p-2 font-bold text-gray-800 text-left">${r.subcenter}</td>`;
                }

                if(showPop) {
                    tbodyHtml += `<td class="border p-2 text-center font-bold text-gray-700">${r.population || 0}</td>`;
                    tbodyHtml += `<td class="border p-2 text-center font-bold text-gray-700">${r.houses || 0}</td>`;
                }
                
                columns.forEach(c => {
                    let val = r.values[c.id];
                    if(typeof val === 'object' && val !== null) { tbodyHtml += `<td class="border p-2 text-blue-800 text-center font-bold">${val.M}</td><td class="border p-2 font-bold bg-orange-50/30 text-orange-800 text-center">${val.P}</td>`; } 
                    else { tbodyHtml += `<td class="border p-2 text-center">${val !== '' ? val : '-'}</td>`; }
                });
                tbodyHtml += `</tr>`;
            });

            if (((user.role === 'admin' || user.role === 'taluka_admin' || user.role === 'phc_admin')) && rep.formType !== 'list') {
                let phcTotals = calculateSmartTotals(dataRowsToRender, columns, rep.isProg);
                
                let totalBaseCols = groupType === 'SubCenterFlat' ? (showPop ? 6 : 4) : (showPop ? 4 : 2); 
                if (groupType === 'SubCenterFlat' && rep.formType === 'subcenter') totalBaseCols -= 1; // गाव कॉलम नसल्याने एक कमी करा

                tbodyHtml += `<tr class="bg-green-100 font-extrabold text-green-900 text-sm"><td class="border p-2 text-left" colspan="${totalBaseCols}">एकूण Total</td>`;
                columns.forEach(c => {
                    let pVal = phcTotals[c.id];
                    if(rep.isProg && c.type === 'number') { tbodyHtml += `<td class="border p-2 text-center">${pVal.isNum ? formatNumberDecimals(pVal.M) : '-'}</td><td class="border p-2 text-center">${pVal.isNum ? formatNumberDecimals(pVal.P) : '-'}</td>`; }
                    else { tbodyHtml += `<td class="border p-2 text-center">${pVal.isNum ? formatNumberDecimals(pVal.M) : '-'}</td>`; }
                });
                tbodyHtml += `</tr>`;
            }

            html += `<div class="table-responsive"><table class="report-table"><thead>${l1Row + l2Row + l3Row + l4Row}</thead><tbody>${tbodyHtml}</tbody></table></div>`;
        
        } else {
            let employeeGroups = {};
            rows.forEach(r => { let key = `${r.subcenter}###${r.employee}`; if(!employeeGroups[key]) employeeGroups[key] = []; employeeGroups[key].push(r); });

            let headInfo = getCustomHeader(rep);

            Object.keys(employeeGroups).sort().forEach(empKey => {
                let [scName, empName] = empKey.split("###");
                let subRows = employeeGroups[empKey];

                if (user.role === 'admin' || user.role === 'taluka_admin' || user.role === 'phc_admin') {
                    html += `<div style="margin-top:20px; margin-bottom:10px; background:#00705a; color:#ffffff; padding:10px; border-radius:4px; font-weight:bold; font-size:14px;">🏢 उपकेंद्र: ${scName} | 🧑‍⚕️ कर्मचारी: ${empName}</div>`;
                }

                // 🟢 दुरुस्ती: कर्मचारी अहवालातही उपकेंद्र फॉर्म असल्यास गाव लपवा
                let l1Row = `<tr><th rowspan="${rep.isProg?4:3}" class="border p-2">अ.क्र.</th>`;
                if (rep.formType !== 'subcenter') {
                    l1Row += `<th rowspan="${rep.isProg?4:3}" class="border p-2">गाव/कार्यक्षेत्र</th>`;
                } else {
                    l1Row += `<th rowspan="${rep.isProg?4:3}" class="border p-2">उपकेंद्र</th>`;
                }
                
                if (showPop) {
                    l1Row += `<th rowspan="${rep.isProg?4:3}" class="border p-2 bg-yellow-50">लोकसंख्या</th>`;
                    l1Row += `<th rowspan="${rep.isProg?4:3}" class="border p-2 bg-yellow-50">कुटुंब संख्या</th>`;
                }
                
                let l2Row = `<tr>`; let l3Row = `<tr>`; let l4Row = rep.isProg ? `<tr>` : ``;

                let i = 0;
                while(i < columns.length) {
                    let c = columns[i]; let j = i + 1;
                    if(c.l1 !== "") {
                        while(j < columns.length && columns[j].l1 === c.l1) { j++; }
                        let totalL1Span = 0; for(let k=i; k<j; k++) totalL1Span += (rep.isProg && columns[k].type === 'number') ? 2 : 1;
                        l1Row += `<th colspan="${totalL1Span}" class="border p-2 bg-purple-100 text-purple-900">${c.l1}</th>`;

                        let k = i;
                        while(k < j) {
                            let c2 = columns[k]; let m = k + 1;
                            if(c2.l2 !== "") {
                                while(m < j && columns[m].l2 === c2.l2) { m++; }
                                let totalL2Span = 0; for(let n=k; n<m; n++) totalL2Span += (rep.isProg && columns[n].type === 'number') ? 2 : 1;
                                l2Row += `<th colspan="${totalL2Span}" class="border p-2 bg-blue-50 text-blue-900">${c2.l2}</th>`;
                                for(let n=k; n<m; n++) {
                                    let w = (rep.isProg && columns[n].type === 'number') ? 2 : 1;
                                    if(w===2) { l3Row += `<th colspan="2" class="border p-2 text-xs">${columns[n].l3}</th>`; l4Row += `<th class="border p-1 bg-yellow-50 text-[10px]">मासिक</th><th class="border p-1 bg-orange-50 text-[10px]">प्रगत</th>`; } 
                                    else { l3Row += `<th rowspan="${rep.isProg?2:1}" class="border p-2 text-xs">${columns[n].l3}</th>`; }
                                }
                                k = m;
                            } else {
                                let mult2 = (rep.isProg && c2.type === 'number') ? 2 : 1;
                                if(mult2 === 2) { l2Row += `<th colspan="2" rowspan="2" class="border p-2 text-xs">${c2.l3}</th>`; l4Row += `<th class="border p-1 bg-yellow-50 text-[10px]">मासिक</th><th class="border p-1 bg-orange-50 text-[10px]">प्रगत</th>`; } 
                                else { l2Row += `<th rowspan="${rep.isProg?3:2}" class="border p-2 text-xs">${c2.l3}</th>`; }
                                k++;
                            }
                        }
                        i = j;
                    } else {
                        let mult = (rep.isProg && c.type === 'number') ? 2 : 1;
                        if(mult === 2) { l1Row += `<th colspan="2" rowspan="3" class="border p-2 text-xs">${c.l3}</th>`; l4Row += `<th class="border p-1 bg-yellow-50 text-[10px]">मासिक</th><th class="border p-1 bg-orange-50 text-[10px]">प्रगत</th>`; } 
                        else { l1Row += `<th rowspan="${rep.isProg?4:3}" class="border p-2 text-xs">${c.l3}</th>`; }
                        i++;
                    }
                }
                l1Row += `</tr>`; l2Row += `</tr>`; l3Row += `</tr>`; if(rep.isProg) l4Row += `</tr>`;

                let tbodyHtml = '';
                subRows.forEach((r, rIdx) => {
                    let actionHtml = '';
                    if (user.role === 'phc_admin' && r.response_id && isEditingAllowed(r.report_month, r.report_year)) {
                        actionHtml = `<div class="mt-1 flex gap-1 justify-start no-print"><button onclick="openEditModal('${r.response_id}')" class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm hover:bg-blue-200">✏️</button><button onclick="deleteResponse('${r.response_id}')" class="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm hover:bg-red-200">🗑️</button></div>`;
                    }

                    tbodyHtml += `<tr class="hover:bg-gray-50 text-xs"><td class="border p-2 text-center font-bold">${rIdx+1}</td>`;
                    
                    if (rep.formType === 'subcenter') {
                        tbodyHtml += `<td class="border p-2 font-bold text-gray-800 text-left">${r.subcenter} ${actionHtml}</td>`;
                    } else {
                        tbodyHtml += `<td class="border p-2 font-bold text-gray-800 text-left">${r.village} ${actionHtml}</td>`;
                    }

                    if(showPop) {
                        tbodyHtml += `<td class="border p-2 text-center font-bold text-gray-700">${r.population || 0}</td>`;
                        tbodyHtml += `<td class="border p-2 text-center font-bold text-gray-700">${r.houses || 0}</td>`;
                    }
                    
                    columns.forEach(c => {
                        let val = r.values[c.id];
                        if(typeof val === 'object' && val !== null) { tbodyHtml += `<td class="border p-2 text-blue-800 text-center font-bold">${val.M}</td><td class="border p-2 font-bold bg-orange-50/30 text-orange-800 text-center">${val.P}</td>`; } 
                        else { tbodyHtml += `<td class="border p-2 text-center">${val !== '' ? val : '-'}</td>`; }
                    });
                    tbodyHtml += `</tr>`;
                });

                if(rep.formType !== 'list') {
                    let colspanTotal = showPop ? 4 : 2;
                    let groupTotals = calculateSmartTotals(subRows, columns, rep.isProg);
                    tbodyHtml += `<tr class="bg-blue-50 font-bold text-blue-900 text-xs"><td class="border p-2 text-left" colspan="${colspanTotal}">गटाची एकूण बेरीज</td>`;
                    columns.forEach(c => {
                        let gVal = groupTotals[c.id];
                        if(rep.isProg && c.type === 'number') { tbodyHtml += `<td class="border p-2 text-center">${gVal.isNum ? formatNumberDecimals(gVal.M) : '-'}</td><td class="border p-2 text-center">${gVal.isNum ? formatNumberDecimals(gVal.P) : '-'}</td>`; }
                        else { tbodyHtml += `<td class="border p-2 text-center">${gVal.isNum ? formatNumberDecimals(gVal.M) : '-'}</td>`; }
                    });
                    tbodyHtml += `</tr>`;
                }

                html += `<div class="table-responsive"><table class="report-table"><thead>${l1Row + l2Row + l3Row + l4Row}</thead><tbody>${tbodyHtml}</tbody></table></div>`;
            });

            if ((user.role === 'admin' || user.role === 'taluka_admin' || user.role === 'phc_admin') && rep.formType !== 'list') {
                let colspanTotal = showPop ? 4 : 2;
                let phcTotals = calculateSmartTotals(rows, columns, rep.isProg);
                html += `<div class="table-responsive"><table class="report-table"><tbody><tr class="bg-green-100 font-extrabold text-green-900 text-sm"><td class="border p-2 text-left" colspan="${colspanTotal}">एकूण Total</td>`;
                columns.forEach(c => {
                    let pVal = phcTotals[c.id];
                    if(rep.isProg && c.type === 'number') { html += `<td class="border p-2 text-center">${pVal.isNum ? formatNumberDecimals(pVal.M) : '-'}</td><td class="border p-2 text-center">${pVal.isNum ? formatNumberDecimals(pVal.P) : '-'}</td>`; }
                    else { html += `<td class="border p-2 text-center">${pVal.isNum ? formatNumberDecimals(pVal.M) : '-'}</td>`; }
                });
                html += `</tr></tbody></table></div>`;
            }
        }
        html += `</div>`;
    });
    container.innerHTML = html;
}

function openEditModal(respId) {
    let response = windowDbData.find(r => r.id === respId);
    if(!response) return;
    
    currentEditResponseId = respId;
    currentEditFormId = response.form_id;
    
    let formObj = masterData.forms.find(f => f.id === response.form_id);
    if(!formObj) return;

    let allFields = formObj.schema_json.fields.filter(f => f.type !== 'group_header');
    
    let html = `<div class="space-y-4">`;
    allFields.forEach(f => {
        if(f.formula && String(f.formula).trim() !== "") return; 
        
        let val = "";
        if(response.response_data && response.response_data[f.id]) {
            val = response.response_data[f.id].value;
        }
        
        let chain = getFieldHierarchyChain(formObj.schema_json.fields, f);
        let fullLabel = chain.join(" > ") + (chain.length > 0 ? " > " : "") + f.label;
        
        let inputType = f.type === 'number' ? 'number' : 'text';
        
        html += `<div>
            <label class="block text-xs font-bold text-gray-700 mb-1">${fullLabel}</label>
            <input type="${inputType}" id="edit_f_${f.id}" value="${val}" class="w-full p-2 border-2 border-gray-300 rounded font-bold text-blue-900 focus:ring focus:ring-blue-200">
        </div>`;
    });
    html += `</div>`;
    
    document.getElementById('editModalBody').innerHTML = html;
    document.getElementById('editModal').classList.remove('hidden');
}

function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
    currentEditResponseId = null;
    currentEditFormId = null;
}

function updateDailyDropdown() {
    let monthSelect = document.getElementById('reportMonth');
    let yearSelect = document.getElementById('reportYear');
    let dailySelect = document.getElementById('reportDaily');
    
    if (!monthSelect || !yearSelect || !dailySelect) return;

    let selMonthName = monthSelect.value; 
    let selYear = parseInt(yearSelect.value);
    if(isNaN(selYear)) selYear = new Date().getFullYear();
    
    const months = {"जानेवारी":1,"फेब्रुवारी":2,"मार्च":3,"एप्रिल":4,"मे":5,"जून":6,"जुलै":7,"ऑगस्ट":8,"सप्टेंबर":9,"ऑक्टोबर":10,"नोव्हेंबर":11,"डिसेंबर":12};
    let mNum = months[selMonthName] || (new Date().getMonth() + 1);
    
    let daysInMonth = new Date(selYear, mNum, 0).getDate();
    let userSelected = dailySelect.getAttribute('data-user-selected');
    
    dailySelect.innerHTML = '';
    
    for(let i=1; i<=daysInMonth; i++) {
        let dStr = i < 10 ? '0'+i : i;
        let mStr = mNum < 10 ? '0'+mNum : mNum;
        let dateStr = `${dStr}-${mStr}-${selYear}`;
        dailySelect.innerHTML += `<option value="${i}">${dateStr}</option>`;
    }
    
    let today = new Date();
    let isCurrentMonth = ((today.getMonth() + 1) === mNum && today.getFullYear() === selYear);
    
    if (userSelected && parseInt(userSelected) <= daysInMonth) {
        dailySelect.value = userSelected;
    } else if (isCurrentMonth) {
        dailySelect.value = today.getDate().toString();
    } else {
        dailySelect.value = "1";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        let mSel = document.getElementById('reportMonth');
        let ySel = document.getElementById('reportYear');
        let dSel = document.getElementById('reportDaily');
        
        if (mSel) mSel.addEventListener('change', () => { if(dSel) dSel.removeAttribute('data-user-selected'); updateDailyDropdown(); });
        if (ySel) ySel.addEventListener('change', () => { if(dSel) dSel.removeAttribute('data-user-selected'); updateDailyDropdown(); });
        
        if (dSel) {
            dSel.addEventListener('change', function() {
                this.setAttribute('data-user-selected', this.value);
            });
        }
        updateDailyDropdown();
    }, 500);
});
