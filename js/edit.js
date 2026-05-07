// 🟢 UPDATED Supabase Fetch Logic
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
        // Fetch from Supabase instead of Google Apps Script
        const { data, error } = await supabase
            .from('filled_stats')
            .select('*')
            .eq('formID', formID)
            .eq('village', village)
            .eq('month', month)
            .eq('year', year)
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) throw error;
        document.getElementById('editLoader').style.display = "none";

        if(data && data.length > 0) {
            let record = data[0];
            
            // Time Check for 48 hours
            if(record.created_at && user.role !== "Admin") {
                let recTime = new Date(record.created_at).getTime();
                if(!isNaN(recTime)) {
                    let diffHours = (Date.now() - recTime) / (1000 * 60 * 60);
                    if(diffHours > 48) {
                        alert("⏳ क्षमस्व! हा फॉर्म भरून ४८ तासांपेक्षा जास्त वेळ (२ दिवस) झाला आहे. त्यामुळे आता यामध्ये बदल (Edit) करता येणार नाही.");
                        return; 
                    }
                }
            }
            renderEditForm(formID, record.formData);
        } else {
            alert("रेकॉर्ड सापडला नाही! कदाचित तो डिलीट झाला असेल.");
        }
    } catch(e) {
        document.getElementById('editLoader').style.display = "none";
        console.error("Edit Fetch Error:", e);
        alert("डेटा लोड करण्यात एरर आला. कृपया इंटरनेट तपासा.");
    }
}

// 🟢 UPDATED Supabase Save Logic
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

        statusText.style.color = "orange";
        statusText.innerText = "☁️ नवीन बदल गुगल शीटवर सेव्ह होत आहेत...";

        // Update in Supabase
        const { error } = await supabase
            .from('filled_stats')
            .update({ formData: updatedFormData })
            .eq('formID', fId)
            .eq('village', vName)
            .eq('month', month)
            .eq('year', year);

        if (error) throw error;
        
        statusText.style.color = "green";
        statusText.innerText = "✅ बदल यशस्वीरित्या अपडेट झाले!";
        setTimeout(() => { statusText.innerText = ""; }, 4000);

        document.getElementById('editDynamicFormArea').classList.add('hidden');
        saveBtn.classList.add('hidden');
        document.getElementById('netStatus').innerText = "डेटा रिफ्रेश होत आहे...";
        await fetchData(); 
        document.getElementById('netStatus').innerText = "Online";
        updateEditVillageDropdown();
        
    } catch(e) {
        console.error("Save Edit Error:", e);
        const statusText = document.getElementById('editSyncStatus');
        statusText.style.color = "red";
        statusText.innerText = "⚠️ बदल सेव्ह करताना एरर आला. कृपया पुन्हा प्रयत्न करा.";
    } finally {
        saveBtn.disabled = false;
        isSaving = false;
    }
}
