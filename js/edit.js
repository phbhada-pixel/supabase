function updateEditVillageDropdown() {
    const vSel = document.getElementById('editVillageSelect');
    const fId = document.getElementById('editFormSelect').value;
    const month = document.getElementById('editMonth').value;
    const year = document.getElementById('editYear').value;

    vSel.innerHTML = '<option value="">-- भरलेले गाव / रेकॉर्ड निवडा --</option>';
    if(!user || !fId) return;

    if (isMonthLocked(month, year)) {
        vSel.innerHTML = '<option value="">-- मुदत संपली आहे --</option>';
        document.getElementById('editDynamicFormArea').classList.add('hidden');
        document.getElementById('editSaveBtn').classList.add('hidden');
        document.getElementById('btnFetchEdit').style.display = 'none';
        return;
    } else {
        document.getElementById('btnFetchEdit').style.display = 'block';
    }

    const f = masterData.forms.find(x => x.FormID === fId);
    let allowedRoles = f && f.AllowedRoles ? f.AllowedRoles.split(',').map(r=>String(r).trim().toUpperCase()) : ["ALL"];
    let isAll = allowedRoles.includes("ALL");

    const serverHistory = masterData.filledStats || [];
    let addedVillages = [];

    serverHistory.forEach(h => {
        if(h.formID === fId && String(h.month).trim() === String(month).trim() && String(h.year).trim() === String(year).trim()) {
            if (h.timestamp) {
                let recTime = parseCustomDate(h.timestamp);
                if (!isNaN(recTime)) {
                    let diffHours = (Date.now() - recTime) / (1000 * 60 * 60);
                    if (diffHours > 48 && user.role !== "Admin") { return; }
                }
            }

            let canEdit = false;
            if(user.role === "Admin") canEdit = true;
            else if(isAll && String(h.subcenter).trim().toLowerCase() === String(user.subcenter).trim().toLowerCase()) canEdit = true;
            else if(!isAll && String(h.mobile).trim() === String(user.mobile).trim()) canEdit = true;

            if(canEdit && !addedVillages.includes(h.village)) {
                vSel.innerHTML += `<option value="${h.village}">${h.village}</option>`;
                addedVillages.push(h.village);
            }
        }
    });

    document.getElementById('editDynamicFormArea').classList.add('hidden');
    document.getElementById('editSaveBtn').classList.add('hidden');
}

async function fetchRecordForEdit() {
    const formID = document.getElementById('editFormSelect').value;
    const month = document.getElementById('editMonth').value;
    const year = document.getElementById('editYear').value;
    const village = document.getElementById('editVillageSelect').value;

    if(!formID || !village) { alert("कृपया फॉर्म आणि गाव निवडा."); return; }

    if (isMonthLocked(month, year)) { alert("⏳ क्षमस्व! या महिन्याची माहिती बदलण्याची मुदत (पुढील महिन्याची १० तारीख) संपली आहे."); return; }

    document.getElementById('editLoader').style.display = "block";
    document.getElementById('editDynamicFormArea').classList.add('hidden');
    document.getElementById('editSaveBtn').classList.add('hidden');

    try {
        const payload = { formID: formID, village: village, month: month, year: year, subCenter: user.subcenter, mobileNo: user.mobile, role: user.role };
        const r = await fetch(GAS_URL, { method: "POST", body: JSON.stringify({action:"getRecordForEdit", payload}) });
        const textResponse = await r.text();
        if(textResponse.trim().startsWith("<")) throw new Error("Google Server Blocked the Request.");
        const d = JSON.parse(textResponse);
        
        document.getElementById('editLoader').style.display = "none";

        if(d.success) {
            let recordDateStr = d.formData["तारीख"] || d.formData["Timestamp"];
            if(recordDateStr && user.role !== "Admin") {
                let recTime = parseCustomDate(recordDateStr);
                if(!isNaN(recTime)) {
                    let diffHours = (Date.now() - recTime) / (1000 * 60 * 60);
                    if(diffHours > 48) {
                        alert("⏳ क्षमस्व! हा फॉर्म भरून ४८ तासांपेक्षा जास्त वेळ (२ दिवस) झाला आहे. त्यामुळे आता यामध्ये बदल (Edit) करता येणार नाही.");
                        return; 
                    }
                }
            }
            renderEditForm(formID, d.formData);
        } else {
            alert("रेकॉर्ड सापडला नाही! कदाचित तो डिलीट झाला असेल.");
        }
    } catch(e) {
        document.getElementById('editLoader').style.display = "none";
        alert("डेटा लोड करण्यात एरर आला: " + e.message);
    }
}

function renderEditForm(fId, formData) {
    const area = document.getElementById('editDynamicFormArea');
    area.innerHTML = "";
    const f = masterData.forms.find(x => x.FormID === fId);
    if(!f) return;

    let html = "";
    JSON.parse(f.StructureJSON).forEach((field, i) => {
        let exactLabel = String(field.label).trim();
        let reqStar1 = field.isRequired ? '<span class="req-star">*</span>' : '';

        if (field.type === 'group') {
            html += `<div style="margin-bottom:15px; background:#e3f2fd; padding:12px; border-radius:8px; border:1px solid #f39c12;">
            <h4 style="margin-top:0; color:#d35400; text-align:left; border-bottom:1px solid #ccc; padding-bottom:5px;">${exactLabel}${reqStar1}</h4>`;
            field.subFields.forEach((sf, j) => {
                let exactSfLabel = String(sf.label).trim();
                let reqStar2 = sf.isRequired ? '<span class="req-star">*</span>' : '';

                if(sf.type === 'group') {
                    html += `<div style="margin-bottom:10px; margin-left:10px; background:#e0f7fa; padding:10px; border-radius:5px; border-left:3px solid #00acc1;">
                    <h5 style="margin:0 0 5px 0; color:#00838f;">${exactSfLabel}${reqStar2}</h5>`;
                    sf.subFields.forEach((ssf, k) => {
                        let exactSsfLabel = String(ssf.label).trim();
                        let reqStar3 = ssf.isRequired ? '<span class="req-star">*</span>' : '';
                        let exactSubSubLabel = `${exactLabel} - ${exactSfLabel} - ${exactSsfLabel}`;
                        let val = formData[exactSubSubLabel] || "";
                        html += `<div style="margin-bottom:8px;"><label style="font-size:13px; color:#555;"><b>${exactSsfLabel}${reqStar3}:</b></label>`;
                        html += generateInputHTML(ssf, `edit_inp_${i}_${j}_${k}`, exactSubSubLabel, 'editDynamicFormArea', val);
                        html += `</div>`;
                    });
                    html += `</div>`;
                } else {
                    let exactSubLabel = `${exactLabel} - ${exactSfLabel}`;
                    let val = formData[exactSubLabel] || "";
                    html += `<div style="margin-bottom:10px;"><label style="font-size:14px; color:#555;"><b>${exactSfLabel}${reqStar2}:</b></label>`;
                    html += generateInputHTML(sf, `edit_inp_${i}_${j}`, exactSubLabel, 'editDynamicFormArea', val);
                    html += `</div>`;
                }
            });
            html += `</div>`;
        } else {
            let val = formData[exactLabel] || "";
            html += `<div style="margin-bottom:15px; background:white; padding:10px; border-radius:8px; border:1px solid #ddd;"><label><b>${exactLabel}${reqStar1}:</b></label>`;
            html += generateInputHTML(field, `edit_inp_${i}`, exactLabel, 'editDynamicFormArea', val);
            html += `</div>`;
        }
    });
    area.innerHTML = html;

    area.classList.remove('hidden');
    document.getElementById('editSaveBtn').classList.remove('hidden');

    setTimeout(() => { processAllLogic('editDynamicFormArea'); }, 100);
}

async function saveEditedData() {
    if(isSaving) return;
    const saveBtn = document.getElementById('editSaveBtn');

    let hasValidationError = false;
    let hasRangeError = false;
    let reqInputs = document.getElementById('editDynamicFormArea').querySelectorAll('[data-required="true"]');
    reqInputs.forEach(inp => { if(inp.style.pointerEvents !== "none" && inp.value.trim() === "") { inp.style.border = "2px solid red"; hasValidationError = true; } });
    
    let errInputs = document.getElementById('editDynamicFormArea').querySelectorAll('.error-input');
    if (errInputs.length > 0) hasRangeError = true;

    if (hasValidationError) { alert("⚠️ कृपया लाल रंगाने हायलाईट केलेली सर्व आवश्यक (*) फील्ड्स भरा!"); return; }
    if (hasRangeError) { alert("⚠️ काही फील्ड्समध्ये चुकीची (अवैध) संख्या टाकली आहे. कृपया लाल रंगाची फील्ड्स तपासा."); return; }

    const month = document.getElementById('editMonth').value;
    const year = document.getElementById('editYear').value;

    if (isMonthLocked(month, year)) { alert("⏳ क्षमस्व! या महिन्याची माहिती बदलण्याची मुदत संपली आहे."); return; }

    saveBtn.disabled = true;
    isSaving = true;

    try {
        processAllLogic('editDynamicFormArea');

        const fId = document.getElementById('editFormSelect').value;
        const vName = document.getElementById('editVillageSelect').value;
        const statusText = document.getElementById('editSyncStatus');

        let updatedFormData = {};
        updatedFormData["महिना"] = month;
        updatedFormData["वर्ष"] = year;

        const f = masterData.forms.find(x => x.FormID === fId);
        JSON.parse(f.StructureJSON).forEach((field, i) => {
            let exactL = String(field.label).trim();
            if (field.type === 'group') {
                field.subFields.forEach((sf, j) => {
                    let exactSL = String(sf.label).trim();
                    if(sf.type === 'group') {
                        sf.subFields.forEach((ssf, k) => {
                            let exactSSL = String(ssf.label).trim();
                            updatedFormData[`${exactL} - ${exactSL} - ${exactSSL}`] = document.getElementById(`edit_inp_${i}_${j}_${k}`).value;
                        });
                    } else {
                        updatedFormData[`${exactL} - ${exactSL}`] = document.getElementById(`edit_inp_${i}_${j}`).value;
                    }
                });
            } else {
                updatedFormData[exactL] = document.getElementById(`edit_inp_${i}`).value;
            }
        });

        const payload = { formID: fId, village: vName, month: month, year: year, mobileNo: user.mobile, subCenter: user.subcenter, role: user.role, formData: updatedFormData };

        statusText.style.color = "orange";
        statusText.innerText = "☁️ नवीन बदल गुगल शीटवर सेव्ह होत आहेत...";

        const r = await fetch(GAS_URL, { method: "POST", body: JSON.stringify({action:"updateRecord", payload: payload}) });
        const textResponse = await r.text();
        if(textResponse.trim().startsWith("<")) throw new Error("Google Blocked Request");
        const d = JSON.parse(textResponse);
        
        if(d.success) {
            statusText.style.color = "green";
            statusText.innerText = "✅ बदल यशस्वीरित्या अपडेट झाले!";
            setTimeout(() => { statusText.innerText = ""; }, 4000);

            document.getElementById('editDynamicFormArea').classList.add('hidden');
            saveBtn.classList.add('hidden');
            document.getElementById('netStatus').innerText = "डेटा रिफ्रेश होत आहे...";
            await fetchData(); 
            document.getElementById('netStatus').innerText = "Online";
            updateEditVillageDropdown();
        } else { throw new Error(d.message); }
    } catch(e) {
        const statusText = document.getElementById('editSyncStatus');
        statusText.style.color = "red";
        statusText.innerText = "⚠️ बदल सेव्ह करताना एरर आला. कृपया पुन्हा प्रयत्न करा.";
    } finally {
        saveBtn.disabled = false;
        isSaving = false;
    }
}