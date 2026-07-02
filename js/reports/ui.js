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
        if (typeof updateDailyDropdown === 'function') updateDailyDropdown(); // 🟢 नवीन बदल: महिना बदलल्यावर तारीख अपडेट होईल
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
                dataRowsToRender = sub
