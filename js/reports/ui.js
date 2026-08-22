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
        l2 = `कर्मचारी: ${empName} | उपकेंद्र: ${scName} | کاलावधी: ${period}`;
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
                    let isNumCol = (c.type === 'number');
                    if(typeof val === 'object' && val !== null) { 
                        let vM = (val.M === 'निरंक' || val.M === 'NIL') && isNumCol ? 0 : val.M;
                        let vP = (val.P === 'निरंक' || val.P === 'NIL') && isNumCol ? 0 : val.P;
                        tbodyHtml += `<td class="border p-2 text-center text-blue-700">${vM}</td><td class="border p-2 font-medium bg-orange-50/30 text-center text-orange-700">${vP}</td>`; 
                    } 
                    else { 
                        let vS = (val === 'निरंक' || val === 'NIL') && isNumCol ? 0 : val;
                        tbodyHtml += `<td class="border p-2 text-center">${vS !== '' ? vS : '-'}</td>`; 
                    }
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
                
                // 🟢 FIX: 'एकदाच' (Onetime) फॉर्म असल्यास PHC Admin ला नेहमी Edit/Delete करता येईल.
                let canEdit = (rep.periodText.includes("All Time") || (typeof isEditingAllowed === 'function' && isEditingAllowed(r.report_month, r.report_year)));
                if (user.role === 'phc_admin' && r.response_id && canEdit) {
                    actionHtml = `<div class="mt-1 flex gap-1 justify-start no-print"><button onclick="openEditModal('${r.response_id}')" class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm hover:bg-blue-200">✏️</button><button onclick="deleteResponse('${r.response_id}')" class="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm hover:bg-red-200">🗑️</button></div>`;
                }

                tbodyHtml += `<tr class="hover:bg-gray-50 text-xs"><td class="border p-2 text-center font-bold">${rIdx+1}</td>`;
                
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
                    let isNumCol = (c.type === 'number');
                    if(typeof val === 'object' && val !== null) { 
                        let vM = val.M; let vP = val.P;
                        if ((vM === 'निरंक' || vM === 'NIL') && isNumCol) vM = 0;
                        if ((vP === 'निरंक' || vP === 'NIL') && isNumCol) vP = 0;
                        tbodyHtml += `<td class="border p-2 text-blue-800 text-center font-bold">${vM}</td><td class="border p-2 font-bold bg-orange-50/30 text-orange-800 text-center">${vP}</td>`; 
                    } 
                    else { 
                        let vS = val;
                        if ((vS === 'निरंक' || vS === 'NIL') && isNumCol) vS = 0;
                        tbodyHtml += `<td class="border p-2 text-center">${vS !== '' ? vS : '-'}</td>`; 
                    }
                });
                tbodyHtml += `</tr>`;
            });

            if (((user.role === 'admin' || user.role === 'taluka_admin' || user.role === 'phc_admin')) && rep.formType !== 'list') {
                let phcTotals = calculateSmartTotals(dataRowsToRender, columns, rep.isProg);
                
                let totalBaseCols = groupType === 'SubCenterFlat' ? (showPop ? 6 : 4) : (showPop ? 4 : 2); 
                if (groupType === 'SubCenterFlat' && rep.formType === 'subcenter') totalBaseCols -= 1; 

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
                    
                    let canEdit = (rep.periodText.includes("All Time") || (typeof isEditingAllowed === 'function' && isEditingAllowed(r.report_month, r.report_year)));
                    if (user.role === 'phc_admin' && r.response_id && canEdit) {
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
                        let isNumCol = (c.type === 'number');
                        if(typeof val === 'object' && val !== null) { 
                            let vM = val.M; let vP = val.P;
                            if ((vM === 'निरंक' || vM === 'NIL') && isNumCol) vM = 0;
                            if ((vP === 'निरंक' || vP === 'NIL') && isNumCol) vP = 0;
                            tbodyHtml += `<td class="border p-2 text-blue-800 text-center font-bold">${vM}</td><td class="border p-2 font-bold bg-orange-50/30 text-orange-800 text-center">${vP}</td>`; 
                        } 
                        else { 
                            let vS = val;
                            if ((vS === 'निरंक' || vS === 'NIL') && isNumCol) vS = 0;
                            tbodyHtml += `<td class="border p-2 text-center">${vS !== '' ? vS : '-'}</td>`; 
                        }
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







































function generatePendingReport() {
    let periodType = document.getElementById('periodType').value;
    if (periodType === 'custom') {
        alert("अपूर्ण यादी (Pending Report) शोधण्यासाठी कृपया 'महिन्यानुसार' कालावधी निवडा. कस्टम तारखांसाठी हे उपलब्ध नाही.");
        return;
    }

    const selMonth = document.getElementById('reportMonth').value;
    const selMonthNum = monthNamesMarathi[selMonth];
    const selYear = document.getElementById('reportYear').value;

    let selFortnight = document.getElementById('reportFortnight') ? document.getElementById('reportFortnight').value : "1";
    let selWeek = document.getElementById('reportWeek') ? document.getElementById('reportWeek').value : "1";
    let selDaily = document.getElementById('reportDaily') ? document.getElementById('reportDaily').value : "1";

    let selectedIDs = getSelectedReportIDs();
    if (selectedIDs.length === 0) { alert("कृपया किमान एक अहवाल निवडा!"); return; }

    let filterSubCenter = document.getElementById('reportSubCenterFilter').value;
    let pendingGroupType = document.getElementById('pendingGroupFilter').value;

    let freqFilterEl = document.getElementById('frequencyFilter');
    let freqFilter = freqFilterEl ? freqFilterEl.value : 'all';

    let formsToCheck = masterData.forms.filter(f => {
        let freq = f.schema_json && f.schema_json.frequency ? f.schema_json.frequency : (f.form_type === 'fortnightly' ? 'fortnightly' : 'monthly');
        if (freqFilter === 'all') return true;
        return freq === freqFilter;
    });

    if(!selectedIDs.includes("ALL")) formsToCheck = formsToCheck.filter(f => selectedIDs.includes(f.id));

    let rawPendingData = [];

    formsToCheck.forEach(f => {
        let freq = f.schema_json && f.schema_json.frequency ? f.schema_json.frequency : (f.form_type === 'fortnightly' ? 'fortnightly' : 'monthly');

        masterData.employees.forEach(u => {
            let empRole = String(u.role).toUpperCase().trim();
            if (['ADMIN', 'TALUKA_ADMIN', 'PHC_ADMIN'].includes(empRole)) return;
            if (!u.sub_center_id || u.sub_center_id === '00000000-0000-0000-0000-000000000000') return;

            if (f.allowed_roles && f.allowed_roles.toUpperCase() !== 'ALL') {
                let allowedArray = f.allowed_roles.split(',').map(r => r.trim().toUpperCase());
                if (!allowedArray.includes(empRole)) return; 
            }

            let isAdminRole = ['admin', 'taluka_admin', 'phc_admin'].includes(user.role);

            if (user.role === 'phc_admin' && u.phc_id !== user.phc_id) return;
            if (!isAdminRole && String(u.mobile_number).trim() !== String(user.mobile).trim()) return;

            let scObj = masterData.subCenters.find(s => String(s.id) === String(u.sub_center_id));
            let scName = scObj ? scObj.name : "Unknown";
            if (isAdminRole && filterSubCenter !== "सर्व" && scName !== filterSubCenter) return;

            if (f.form_type === 'subcenter') {
                let scVillageIDs = masterData.villages.filter(v => String(v.sub_center_id) === String(u.sub_center_id)).map(v => String(v.id));

                let isFilled = masterData.filledStats.some(h => {
                    if (String(h.form_id) !== String(f.id)) return false;
                    if (!scVillageIDs.includes(String(h.village_id))) return false;

                    let mode = f.data_entry_mode || 'shared';
                    if (mode === 'individual' && String(h.employee_id) !== String(u.id)) return false;

                    if (freq === 'onetime') return true; 

                    let rYear = parseInt(h.report_year);
                    if (isNaN(rYear) || rYear === 0) {
                        if(h.created_at) rYear = new Date(h.created_at).getFullYear();
                        else rYear = parseInt(selYear);
                    }
                    let matchY = (rYear === parseInt(selYear));

                    let mStr = String(h.report_month).trim().toLowerCase();
                    let dbMonthNum = parseInt(mStr);

                    if (isNaN(dbMonthNum) || dbMonthNum === 0) {
                        for (const [mName, mNum] of Object.entries(monthNamesMarathi)) {
                            if (mStr.includes(mName.toLowerCase())) { dbMonthNum = mNum; break; }
                        }
                        if (isNaN(dbMonthNum) || dbMonthNum === 0) {
                            if(h.created_at) dbMonthNum = new Date(h.created_at).getMonth() + 1;
                            else dbMonthNum = parseInt(selMonthNum);
                        }
                    }
                    let matchM = (dbMonthNum === parseInt(selMonthNum));

                    let fnStr = String(h.report_fortnight).trim();
                    let dbFn = 1; 

                    // 🟢 FIX: दैनिक आणि साप्ताहिक तारखांची अचूक तपासणी
                    if (freq === 'daily' || freq === 'weekly') {
                        let pFn = parseInt(fnStr);
                        if (!isNaN(pFn) && pFn > 0) dbFn = pFn;
                    } else {
                        // पंधरवाडा तपासणी सुधारित केली
                        if (fnStr === "2" || fnStr === "२" || fnStr.includes("16") || fnStr.includes("१६") || fnStr.includes("अखेर") || fnStr.includes("दुसरा")) {
                            dbFn = 2;
                        } else if (fnStr === "3" || fnStr === "३" || fnStr.includes("तिसरा")) {
                            dbFn = 3;
                        } else if (fnStr === "4" || fnStr === "४" || fnStr.includes("चौथा")) {
                            dbFn = 4;
                        } else if (fnStr === "5" || fnStr === "५" || fnStr.includes("पाचवा")) {
                            dbFn = 5;
                        } else {
                            let pFn = parseInt(fnStr);
                            if (!isNaN(pFn) && pFn > 0) dbFn = pFn;
                        }
                    }

                    let matchFreq = true;
                    if (freq === 'fortnightly') matchFreq = (dbFn === parseInt(selFortnight));
                    else if (freq === 'weekly') matchFreq = (dbFn === parseInt(selWeek));
                    else if (freq === 'daily') matchFreq = (dbFn === parseInt(selDaily));

                    return matchM && matchY && matchFreq;
                });

                if (!isFilled) {
                    rawPendingData.push({
                        formName: f.form_name,
                        empName: u.full_name,
                        role: u.role,
                        sc: scName,
                        village: "🏢 संपूर्ण उपकेंद्र (Subcenter Level)"
                    });
                }
            } else {
                let userVillages = masterData.villages.filter(v => String(v.sub_center_id) === String(u.sub_center_id));
                userVillages.forEach(v => {
                    let isFilled = masterData.filledStats.some(h => {
                        if (String(h.form_id) !== String(f.id) || String(h.village_id) !== String(v.id)) return false;

                        let mode = f.data_entry_mode || 'shared';
                        if (mode === 'individual' && String(h.employee_id) !== String(u.id)) return false;

                        if (freq === 'onetime') return true; 

                        let rYear = parseInt(h.report_year);
                        if (isNaN(rYear) || rYear === 0) {
                            if(h.created_at) rYear = new Date(h.created_at).getFullYear();
                            else rYear = parseInt(selYear);
                        }
                        let matchY = (rYear === parseInt(selYear));

                        let mStr = String(h.report_month).trim().toLowerCase();
                        let dbMonthNum = parseInt(mStr);

                        if (isNaN(dbMonthNum) || dbMonthNum === 0) {
                            for (const [mName, mNum] of Object.entries(monthNamesMarathi)) {
                                if (mStr.includes(mName.toLowerCase())) { dbMonthNum = mNum; break; }
                            }
                            if (isNaN(dbMonthNum) || dbMonthNum === 0) {
                                if(h.created_at) dbMonthNum = new Date(h.created_at).getMonth() + 1;
                                else dbMonthNum = parseInt(selMonthNum);
                            }
                        }
                        let matchM = (dbMonthNum === parseInt(selMonthNum));

                        let fnStr = String(h.report_fortnight).trim();
                        let dbFn = 1; 

                        // 🟢 FIX: दैनिक आणि साप्ताहिक तारखांची अचूक तपासणी
                        if (freq === 'daily' || freq === 'weekly') {
                            let pFn = parseInt(fnStr);
                            if (!isNaN(pFn) && pFn > 0) dbFn = pFn;
                        } else {
                            if (fnStr === "2" || fnStr === "२" || fnStr.includes("16") || fnStr.includes("१६") || fnStr.includes("अखेर") || fnStr.includes("दुसरा")) {
                                dbFn = 2;
                            } else if (fnStr === "3" || fnStr === "३" || fnStr.includes("तिसरा")) {
                                dbFn = 3;
                            } else if (fnStr === "4" || fnStr === "४" || fnStr.includes("चौथा")) {
                                dbFn = 4;
                            } else if (fnStr === "5" || fnStr === "५" || fnStr.includes("पाचवा")) {
                                dbFn = 5;
                            } else {
                                let pFn = parseInt(fnStr);
                                if (!isNaN(pFn) && pFn > 0) dbFn = pFn;
                            }
                        }

                        let matchFreq = true;
                        if (freq === 'fortnightly') matchFreq = (dbFn === parseInt(selFortnight));
                        else if (freq === 'weekly') matchFreq = (dbFn === parseInt(selWeek));
                        else if (freq === 'daily') matchFreq = (dbFn === parseInt(selDaily));

                        return matchM && matchY && matchFreq;
                    });

                    if (!isFilled) {
                        rawPendingData.push({
                            formName: f.form_name,
                            empName: u.full_name,
                            role: u.role,
                            sc: scName,
                            village: v.name
                        });
                    }
                });
            }
        });
    });

    let container = document.getElementById('reportTableContainer'); let downArea = document.getElementById('downloadButtonsArea');
    downArea.innerHTML = `<div class="no-print flex justify-end gap-2 mb-3"><button onclick="copyPendingListText()" class="bg-gray-600 text-white px-4 py-2 rounded text-xs font-bold shadow">📋 यादी कॉपी करा</button><button onclick="window.print()" class="bg-red-600 text-white px-4 py-2 rounded text-xs font-bold shadow">🖨️ प्रिंट काढा</button></div>`;

    let phcHeader = "तालुका आरोग्य प्रणाली";
    if (user.role === 'phc_admin') phcHeader = "तुमची अपूर्ण यादी";
    if (filterSubCenter !== 'सर्व') phcHeader += ` (उपकेंद्र: ${filterSubCenter})`;

    let isFnVisible = document.getElementById('fortnightInputs') && !document.getElementById('fortnightInputs').classList.contains('hidden');
    let isWnVisible = document.getElementById('weekInputs') && !document.getElementById('weekInputs').classList.contains('hidden');
    let isDyVisible = document.getElementById('dailyInputs') && !document.getElementById('dailyInputs').classList.contains('hidden');
    let isOnetime = freqFilter === 'onetime';

    let periodDisplay = isOnetime ? "संपूर्ण अहवाल (All Time)" : `${selMonth} ${selYear}`;
    if(isFnVisible && !isOnetime) periodDisplay += ` (पंधरवाडा: ${selFortnight == "1" ? '१ ते १५ तारीख' : '१६ ते महिनाअखेर'})`;
    if(isWnVisible && !isOnetime) periodDisplay += ` (आठवडा: ${selWeek})`;
    
    if(isDyVisible && !isOnetime) {
        let dVal = parseInt(selDaily);
        let mVal = parseInt(selMonthNum);
        let yVal = parseInt(selYear);
        let fullDateStr = `${dVal < 10 ? '0'+dVal : dVal}-${mVal < 10 ? '0'+mVal : mVal}-${yVal}`;
        periodDisplay += ` (दिनांक: ${fullDateStr})`;
    }

    let html = `<div id="pdfExportArea" class="pdf-container"><div style="text-align:center; border-bottom: 2px solid var(--primary); padding-bottom:10px; margin-bottom:20px;"><h2 style="margin:0; color:var(--primary); font-size:24px;">${phcHeader}</h2><h3 style="margin:5px 0 0 0; color:#444; font-size:18px;">अपूर्ण अहवाल यादी - कालावधी: ${periodDisplay}</h3></div>`;

    if(rawPendingData.length === 0) { 
        html = `<h3 style="text-align:center; color:green; padding:30px; font-weight:bold;">🎉 उत्कृष्ट! तुमचे सर्व अहवाल पूर्ण भरले आहेत.</h3>`; 
        downArea.innerHTML = ""; 
        container.innerHTML = html + `</div>`; 
        document.getElementById('reportContentArea').classList.remove('hidden');
        return;
    }

    let isFirstPending = true;

    if (pendingGroupType === 'employee') {
        let groupedByEmp = {};
        rawPendingData.forEach(item => {
            let key = item.empName + "###" + item.sc + "###" + item.role;
            if(!groupedByEmp[key]) groupedByEmp[key] = [];
            groupedByEmp[key].push(item);
        });

        let sortedEmpKeys = Object.keys(groupedByEmp).sort();

        sortedEmpKeys.forEach(empKey => {
            let pbClass = isFirstPending ? "" : "page-break"; isFirstPending = false;
            let [empName, scName, empRole] = empKey.split("###");

            let formMap = {};
            groupedByEmp[empKey].forEach(p => {
                if(!formMap[p.formName]) formMap[p.formName] = [];
                formMap[p.formName].push(p.village);
            });

            let noticeDataArr = [];
            let rowsHtml = '';
            let idx = 1;

            Object.keys(formMap).sort().forEach(fName => {
                let villagesStr = formMap[fName].join(", ");
                noticeDataArr.push(`${fName} (${villagesStr})`);

                rowsHtml += `<tr>
                    <td style="border: 1px solid #ccc; padding: 8px; text-align:center; font-weight:bold;">${idx++}</td>
                    <td style="border: 1px solid #ccc; padding: 8px; text-align:left; font-size:15px; font-weight:bold; color:#0056b3;">${fName}</td>
                    <td style="border: 1px solid #ccc; padding: 8px; text-align:left; font-size:14px; font-weight:bold; color:#28a745;">${villagesStr}</td>
                </tr>`;
            });

            let noticeDataStr = noticeDataArr.join('|||');

            html += `<div class="${pbClass}">
                        <div class="pdf-group-header" style="background:#f8f9fa; color:#c0392b; padding:10px; font-weight:bold; font-size:16px; margin-top:10px; border:1px solid #ddd; display:flex; justify-content:space-between; align-items:center;">
                            <span>🧑‍⚕️ कर्मचारी: ${empName} (${scName})</span>
                            <button onclick="generateNotice('${empName}', '${empRole}', '${scName}', '${noticeDataStr}')" class="bg-red-100 text-red-700 px-3 py-1 rounded text-xs font-bold shadow-sm hover:bg-red-200 no-print border border-red-300">⚠️ सर्व प्रलंबित अहवालांची नोटीस काढा</button>
                        </div>
                        <table class="report-table pending-data-table" style="width:100%; border-collapse:collapse; margin-bottom:30px;">
                            <thead style="background:#f4f7f6;">
                                <tr>
                                    <th style="border: 1px solid #ccc; padding: 8px; width:10%; text-align:center;">अ.क्र.</th>
                                    <th style="border: 1px solid #ccc; padding: 8px; text-align:left; width:45%;">प्रलंबित अहवाल (फॉर्म)</th>
                                    <th style="border: 1px solid #ccc; padding: 8px; text-align:left; width:45%;">अपूर्ण गावे / कार्यक्षेत्र</th>
                                </tr>
                            </thead>
                            <tbody>${rowsHtml}</tbody>
                        </table>
                     </div>`;
        });

    } else {
        let groupedByForm = {};
        rawPendingData.forEach(item => {
            if(!groupedByForm[item.formName]) groupedByForm[item.formName] = [];
            groupedByForm[item.formName].push(item);
        });

        let sortedFormKeys = Object.keys(groupedByForm).sort();

        sortedFormKeys.forEach(fName => {
            let pbClass = isFirstPending ? "" : "page-break"; isFirstPending = false;
            html += `<div class="${pbClass}"><div class="pdf-group-header" style="background:#f8f9fa; color:#c0392b; padding:10px; font-weight:bold; font-size:16px; margin-top:10px; border:1px solid #ddd;">📄 फॉर्म: ${fName}</div><table class="report-table pending-data-table" style="width:100%; border-collapse:collapse; margin-bottom:30px;"><thead style="background:#f4f7f6;"><tr><th style="border: 1px solid #ccc; padding: 8px; width:10%; text-align:center;">अ.क्र.</th><th style="border: 1px solid #ccc; padding: 8px; text-align:left;">अहवाल प्रलंबित असणारे कर्मचारी (उपकेंद्र) - अपूर्ण गावे</th></tr></thead><tbody>`;

            let empMap = {}; 
            groupedByForm[fName].forEach(p => { 
                let key = p.empName + "###" + p.sc + "###" + p.role; 
                if(!empMap[key]) empMap[key] = []; 
                empMap[key].push(p.village); 
            });

            let sortedKeys = Object.keys(empMap).sort();
            sortedKeys.forEach((key, idx) => {
                let [empName, scName, empRole] = key.split("###"); 
                let villagesStr = empMap[key].join(", ");

                let noticeDataStr = `${fName} (${villagesStr})`;

                html += `<tr>
                            <td style="border: 1px solid #ccc; padding: 8px; text-align:center; font-weight:bold;">${idx+1}</td>
                            <td style="border: 1px solid #ccc; padding: 8px; text-align:left; font-size:15px; display:flex; justify-content:space-between; align-items:center;">
                                <div>
                                    <span style="color:#0056b3; font-weight:bold;">${empName}</span> - 
                                    <span style="color:#d35400; font-weight:bold;">${scName}</span> 
                                    <span style="color:#28a745; font-weight:bold;">(${villagesStr})</span>
                                </div>
                                <button onclick="generateNotice('${empName}', '${empRole}', '${scName}', '${noticeDataStr}')" class="bg-red-100 text-red-700 px-3 py-1 rounded text-xs font-bold shadow-sm hover:bg-red-200 no-print border border-red-300">⚠️ नोटीस</button>
                            </td>
                        </tr>`;
            });
            html += `</tbody></table></div>`;
        });
    }

    container.innerHTML = html + `</div>`; 
    document.getElementById('reportContentArea').classList.remove('hidden');
}

















function copyPendingListText() {
    let textToCopy = `*अपूर्ण अहवाल यादी*\n\n`;
    let tables = document.querySelectorAll('.pending-data-table'); if(tables.length === 0) return;
    let formHeaders = document.querySelectorAll('.pdf-group-header');

    tables.forEach((table, tableIndex) => {
        let headerText = formHeaders[tableIndex] ? formHeaders[tableIndex].innerText : "अहवाल";
        headerText = headerText.replace('⚠️ नोटीस काढा', '').replace('⚠️ सर्व प्रलंबित अहवालांची नोटीस काढा', '').trim();
        textToCopy += `📌 *${headerText}*\n`;

        table.querySelectorAll('tbody tr').forEach((row, rowIndex) => { 
            let cells = row.querySelectorAll('td'); 
            if(cells.length >= 2) {
                let rowContent = "";
                for(let i=1; i<cells.length; i++) {
                    rowContent += cells[i].innerText.replace(/\n/g, " ").replace("⚠️ नोटीस", "").trim() + " ";
                }
                textToCopy += `${rowIndex + 1}. ${rowContent.trim()}\n`; 
            }
        });
        textToCopy += `\n`;
    });
    navigator.clipboard.writeText(textToCopy).then(() => { alert("✅ यादी व्हॉट्सॲप मेसेजसाठी कॉपी झाली आहे!"); });
}

function generateNotice(empName, empRole, scName, noticeDataStr) {
    const today = new Date().toLocaleDateString('mr-IN');
    const noticeWindow = window.open('', '_blank', 'width=900,height=800');

    let pendingItems = noticeDataStr.split('|||');

    let formsHtml = pendingItems.map((item, i) => {
        let parts = item.split(' (');
        let villages = parts[1] ? parts[1] : ''; 
        if(villages.endsWith(')')) villages = villages.slice(0, -1);

        return `<li style="margin-bottom: 5px; padding-left: 5px; line-height: 1.4;">
                    <strong style="font-size: 15px; color: #b71c1c;">${parts[0]}</strong> 
                    <span style="font-size: 13px; color: #444;">(${villages})</span>
                </li>`;
    }).join('');

    noticeWindow.document.write(`
        <html lang="mr">
        <head>
            <title>कारणे दाखवा नोटीस - ${empName}</title>
            <style>
                body { font-family: 'Arial', sans-serif; background: #e9ecef; margin: 0; padding: 20px; color: #222;} 
                .notice-wrapper { background: #fff; padding: 30px 40px; max-width: 210mm; min-height: 297mm; margin: auto; box-sizing: border-box; position: relative; box-shadow: 0px 5px 15px rgba(0,0,0,0.3); border: none; outline: none; }
                .title-block { text-align: center; border-bottom: 2px solid #222; padding-bottom: 15px; margin-bottom: 25px; }
                .title { font-weight: 900; font-size: 26px; color: #000; margin-bottom: 5px; }
                .subtitle { font-size: 18px; font-weight: bold; color: #333; }
                .header-info { display: flex; justify-content: space-between; margin-bottom: 20px; font-weight: bold; font-size: 15px;}
                .to-address { margin-bottom: 20px; font-weight: bold; font-size: 16px; line-height: 1.5; padding-left: 10px; border-left: 3px solid #b71c1c;}
                .subject-box { background: #f4f4f4; padding: 12px; border: 1px dashed #666; font-weight: bold; margin-bottom: 20px; text-align: center; font-size: 16px;}
                .content { text-align: justify; font-size: 16px; line-height: 1.6; margin-bottom: 15px;}
                .content p { text-indent: 50px; margin-bottom: 8px; }
                .forms-box { margin: 15px 0 15px 40px; padding: 15px 15px 15px 10px; border: 1px solid #ccc; background-color: #fafafa; border-radius: 5px; box-shadow: inset 0 0 5px rgba(0,0,0,0.05);}
                .forms-box ul { margin: 0; padding-left: 20px; list-style-type: decimal; }
                .sign-block { text-align: right; margin-top: 30px; font-weight: bold; font-size: 16px; line-height: 1.5; }
                .copy-to { margin-top: 40px; font-size: 15px; font-weight: bold; line-height: 1.6; }
                
                @media print { 
                    body { background: #fff; padding: 0; }
                    .notice-wrapper { border: none; outline: none; margin: 0; padding: 20px; min-height: auto; box-shadow: none;}
                    .no-print { display: none; } 
                }
            </style>
        </head>
        <body>
            <div id="noticeContent" class="notice-wrapper">
                <div class="title-block">
                    <div class="title">महाराष्ट्र शासन</div>
                    <div class="subtitle">कार्यालय: वैद्यकीय अधिकारी, प्राथमिक आरोग्य केंद्र, भादा</div>
                    <div style="font-size: 15px; margin-top: 5px; color: #555;">ता. औसा जि. लातूर</div>
                </div>
                
                <div class="header-info">
                    <div>जावक क्र. प्राआकें/भादा/नोटीस/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/२०२६</div>
                    <div>दिनांक: ${today}</div>
                </div>
                
                <div class="to-address">
                    प्रति,<br>
                    श्री./सौ. <span style="font-size: 18px; color: #b71c1c;">${empName}</span>,<br>
                    ${empRole}, उपकेंद्र: ${scName}.
                </div>
                
                <div class="subject-box">
                    <span style="text-decoration: underline;">विषय:</span> प्रलंबित अहवाल विहित वेळेत सादर न केल्याबाबत <strong>कारणे दाखवा नोटीस</strong>.
                </div>
                
                <div class="content">
                    <p>उपरोक्त विषयान्वये आपणास या नोटीसीद्वारे कळविण्यात येते की, आपल्या कार्यक्षेत्रातील खालील अत्यंत महत्त्वाच्या कार्यक्रमांचे अहवाल आपण अद्यापपर्यंत कार्यालयास सादर केलेले नाहीत.</p>
                </div>
                
                <div class="forms-box">
                    <ul>
                        ${formsHtml}
                    </ul>
                </div>

                <div class="content">
                    <p>शासकीय अहवाल विहित वेळेत सादर न करणे ही अत्यंत गंभीर व प्रशासकीय दृष्ट्या अक्षम्य बाब असून, हे आपल्या कामातील हलगर्जीपणाचे व वरिष्ठांच्या आदेशाचे जाणीवपूर्वक उल्लंघन केल्याचे स्पष्ट लक्षण आहे.</p>
                    
                    <p>तरी, ही नोटीस प्राप्त होताच <strong>पुढील २४ तासांच्या आत</strong> सदर सर्व प्रलंबित अहवाल प्रणालीवर अचूकपणे अद्ययावत करावेत आणि विहित वेळेत अहवाल न पाठवल्याबाबतचा आपला खुलासा लेखी स्वरूपात त्वरित या कार्यालयास सादर करावा.</p>
                    
                    <p>आपला खुलासा असमाधानकारक आढळल्यास किंवा मुदतीत प्राप्त न झाल्यास, आपल्यावर 'महाराष्ट्र नागरी सेवा (शिस्त व अपील) नियम' नुसार <strong>कठोर प्रशासकीय कारवाई</strong> का प्रस्तावित करू नये, याबाबत आपली भूमिका स्पष्ट करावी.</p>
                </div>
                
                <div class="sign-block">
                    <strong>वैद्यकीय अधिकारी</strong>,<br>
                    प्राथमिक आरोग्य केंद्र, भादा
                </div>
                
                <div class="copy-to">
                    प्रत माहितीस्तव सविनय सादर,<br>
                    १. मा. जिल्हा आरोग्य अधिकारी, जिल्हा परिषद, लातूर.<br>
                    २. मा. तालुका आरोग्य अधिकारी, तालुका कार्यालय, औसा.
                </div>
                
                <div class="sign-block" style="margin-top: 20px;">
                    <strong>वैद्यकीय अधिकारी</strong>,<br>
                    प्राथमिक आरोग्य केंद्र, भादा
                </div>
            </div>

            <div style="text-align: center; margin-top: 30px; display: flex; justify-content: center; gap: 15px;" class="no-print">
                <button onclick="window.print()" style="padding: 12px 25px; background-color: #007bff; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">🖨️ डायरेक्ट प्रिंट काढा</button>
            </div>
        </body>
        </html>
    `);
    noticeWindow.document.close();
}
