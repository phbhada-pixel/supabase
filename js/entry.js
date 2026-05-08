// 🟢 1. LOGIN & FETCH DATA (Supabase Logic)
async function handleLogin() {
    const mob = document.getElementById('mob').value.trim();
    const pwd = document.getElementById('pwd').value.trim();
    if (!mob || !pwd) { alert("कृपया मोबाईल नंबर आणि पासवर्ड टाका!"); return; }

    document.getElementById('initialLoader').style.display = 'flex';
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('mobile', mob)
            .eq('password', pwd)
            .single();

        if (error || !data) {
            alert("चुकीचा मोबाईल नंबर किंवा पासवर्ड!");
            document.getElementById('initialLoader').style.display = 'none';
            return;
        }

        user = data;
        localStorage.setItem('phc_user', JSON.stringify(user));
        
        document.getElementById('loginBox').classList.add('hidden');
        document.getElementById('dashboardWrapper').classList.remove('hidden');
        document.getElementById('uName').innerText = user.name;
        document.getElementById('uSub').innerText = "उपकेंद्र: " + user.subcenter + " | पद: " + user.role;
        
        if (user.role === 'Admin' || user.role === 'MANAGER' || user.role === 'VIEWER') {
            document.getElementById('tabAdmin').classList.remove('hidden');
            if(document.getElementById('adminRoleFilterDiv')) document.getElementById('adminRoleFilterDiv').style.display = "flex";
        }

        await fetchData();
    } catch (error) {
        alert("लॉगिन करताना अडचण आली: " + error.message);
    } finally {
        document.getElementById('initialLoader').style.display = 'none';
    }
}

// 🟢 UPDATED fetchData Function (Case-Sensitivity & Admin Edit Fix)
async function fetchData() {
    try {
        // 🟢 '.eq('IsActive', true)' काढून टाकले आहे. 
        // यामुळे कॅपिटल/स्मॉल चा एरर येणार नाही आणि ॲडमिनला सर्व (Active/Inactive) फॉर्म्स एडिटसाठी दिसतील.
        const [usersRes, villagesRes, formsRes, statsRes] = await Promise.all([
            supabase.from('users').select('*'),
            supabase.from('villages').select('*'),
            supabase.from('forms').select('*'), // 🟢 हा सर्वात महत्त्वाचा बदल
            supabase.from('filled_stats').select('*')
        ]);

        if (usersRes.error) throw usersRes.error;
        if (villagesRes.error) throw villagesRes.error;
        if (formsRes.error) {
            console.error("Forms Fetch Error:", formsRes.error);
            throw formsRes.error;
        }
        if (statsRes.error) throw statsRes.error;

        // डेटा मास्टर व्हेरिएबलमध्ये सेव्ह करणे
        masterData.users = usersRes.data || [];
        masterData.villages = villagesRes.data || [];
        masterData.forms = formsRes.data || [];
        masterData.filledStats = statsRes.data || [];

        // ऑफलाईन वापरासाठी लोकल स्टोरेजमध्ये सेव्ह करणे
        localStorage.setItem("phc_master_data", JSON.stringify(masterData)); 
        
        // फॉर्म सेव्ह झाल्यानंतर लगेच स्क्रीनवरील ड्रॉपडाऊन आणि लिस्ट अपडेट करणे
        if(typeof updateFormDropdowns === "function") updateFormDropdowns();
        if(typeof updateVillageDropdown === "function") updateVillageDropdown();
        if(typeof renderExistingFormsList === "function") renderExistingFormsList();
        
    } catch (error) {
        console.error("Fetch Data Error:", error);
    }
}
async function submitChangePassword() {
    const oldP = document.getElementById('oldPwd').value;
    const newP = document.getElementById('newPwd').value;
    const confP = document.getElementById('confirmNewPwd').value;
    const msg = document.getElementById('pwdMsg');

    if(!oldP || !newP || !confP) { msg.style.color="red"; msg.innerText="सर्व रकाने भरा!"; return; }
    if(newP.length < 4) { msg.style.color="red"; msg.innerText="नवीन पासवर्ड कमीत कमी ४ अक्षरांचा असावा!"; return; }
    if(newP !== confP) { msg.style.color="red"; msg.innerText="नवीन पासवर्ड जुळत नाही!"; return; }
    if (oldP !== user.password) { msg.style.color="red"; msg.innerText="सध्याचा (जुना) पासवर्ड चुकीचा आहे!"; return; }

    document.getElementById('btnChangePwd').disabled = true;
    msg.style.color = "orange"; msg.innerText = "पासवर्ड बदलत आहे, कृपया थांबा...";

    try {
        const { error } = await supabase.from('users').update({ password: newP }).eq('mobile', user.mobile);
        if (error) throw error;
        user.password = newP;
        localStorage.setItem('phc_user', JSON.stringify(user));
        msg.style.color = "green"; msg.innerText = "✅ पासवर्ड यशस्वीरित्या बदलला!";
        setTimeout(() => { closeChangePassword(); }, 2000);
    } catch (error) {
        msg.style.color = "red"; msg.innerText = "⚠️ एरर: पासवर्ड बदलताना अडचण आली.";
    } finally {
        document.getElementById('btnChangePwd').disabled = false;
    }
}

// 🟢 2. UI AND LOGIC FUNCTIONS (जसेच्या तसे सुरक्षित ठेवले आहेत)
function isFormFilledForVillage(formObj, vName, month, year) {
    const serverHistory = masterData.filledStats || [];
    let allowedRoles = formObj.AllowedRoles ? formObj.AllowedRoles.split(',').map(r=>String(r).trim().toUpperCase()) : ["ALL"];
    let isAll = allowedRoles.includes("ALL");
    let safeVName = String(vName).trim();
    let safeMonth = String(month).trim();
    let safeYear = String(year).trim();
    let safeMobile = String(user.mobile).trim();

    return serverHistory.some(h => {
        if(h.formID !== formObj.FormID || String(h.village).trim() !== safeVName || String(h.month).trim() !== safeMonth || String(h.year).trim() !== safeYear) return false;
        if(h.isAllForm || isAll) return true;
        return String(h.mobileNo).trim() === safeMobile || String(h.mobile).trim() === safeMobile;
    });
}

function updateFormDropdowns() {
    const selForm = document.getElementById('selForm');
    const editForm = document.getElementById('editFormSelect');
    const repForm = document.getElementById('reportFormSelect');

    const entryMonth = document.getElementById('selMonth') ? document.getElementById('selMonth').value : "";
    const entryYear = document.getElementById('selYear') ? document.getElementById('selYear').value : "";

    let currentSel = selForm ? selForm.value : "";
    let currentEdit = editForm ? editForm.value : "";
    let currentRep = repForm ? repForm.value : "";

    if(selForm) {
        selForm.innerHTML = '<option value="">-- निवडा --</option>';
        selForm.innerHTML += '<option id="opt_all_stats" value="ALL_STATS" style="font-weight:bold; color:#d35400;">📝 सर्व आकडेवारी अहवाल एकत्रित भरा (All Stats)</option>';
    }
    if(editForm) editForm.innerHTML = '<option value="">-- निवडा --</option>';
    if(repForm) repForm.innerHTML = '<option value="">-- निवडा --</option><option value="ALL" style="font-weight:bold; color:var(--primary);">सर्व अहवाल एकत्रित (All Forms)</option>';

    if (!masterData || !masterData.forms) return;

    let statsFormRemaining = false;

    masterData.forms.forEach(f => {
        let allowedRoles = f.AllowedRoles ? f.AllowedRoles.split(',').map(r=>String(r).trim().toUpperCase()) : ["ALL"];
        let userRole = user ? String(user.role).trim().toUpperCase() : "";
        let isInactive = isFormInactive(f);
        let formType = String(f.FormType).trim();

        if (userRole === "ADMIN" || userRole === "VIEWER" || userRole === "MANAGER" || allowedRoles.includes("ALL") || allowedRoles.includes(userRole)) {
            if (isInactive && userRole !== "ADMIN") return;

            let isFullyFilled = false;
            if (user && entryMonth && entryYear && formType.includes('Stats')) {
                let hasVillages = false;
                let fullyFilledCheck = true;
                masterData.villages.forEach(v => {
                    const belongsToSubCenter = (userRole === "ADMIN" || userRole === "VIEWER" || userRole === "MANAGER") ? true : (String(v.SubCenterID).trim().toLowerCase() === String(user.subcenter).trim().toLowerCase() || String(v.SubCenterID).trim().toLowerCase() === "all");
                    if(belongsToSubCenter) {
                        hasVillages = true;
                        if (!isFormFilledForVillage(f, v.VillageName, entryMonth, entryYear)) {
                            fullyFilledCheck = false;
                        }
                    }
                });
                if (hasVillages && fullyFilledCheck) { isFullyFilled = true; }
            }

            let opt = `<option value="${f.FormID}">${f.FormName} ${isInactive ? '(Inactive)' : ''}</option>`;

            if(selForm && !isFullyFilled) {
                selForm.innerHTML += opt;
                if(formType.includes('Stats')) { statsFormRemaining = true; }
            }
            if(editForm) editForm.innerHTML += opt;
            if(repForm) repForm.innerHTML += opt; 
        }
    });

    if(selForm && !statsFormRemaining) {
        let optAll = document.getElementById('opt_all_stats');
        if(optAll) optAll.remove();
    }

    if(selForm) {
        if(selForm.querySelector(`option[value="${currentSel}"]`)) selForm.value = currentSel;
        else { selForm.value = ""; if(document.getElementById('dynamicFormArea')) document.getElementById('dynamicFormArea').innerHTML = ""; }
    }
    if(editForm && editForm.querySelector(`option[value="${currentEdit}"]`)) editForm.value = currentEdit;
    if(repForm && repForm.querySelector(`option[value="${currentRep}"]`)) repForm.value = currentRep;
}

function updateVillageDropdown() {
    const vSel = document.getElementById('selVillage');
    const fId = document.getElementById('selForm').value;
    const month = document.getElementById('selMonth').value;
    const year = document.getElementById('selYear').value;

    vSel.innerHTML = '<option value="">-- गाव निवडा --</option>';
    if(!user || !fId) { document.getElementById('dynamicFormArea').innerHTML = ""; return; }

    vSel.innerHTML += '<option value="ALL_VILLAGES" style="font-weight:bold; color:#0056b3;">🏢 सर्व गावे एकत्रित भरा (Bulk Entry)</option>';

    masterData.villages.filter(v => {
        const belongsToSubCenter = String(v.SubCenterID).trim().toLowerCase() === String(user.subcenter).trim().toLowerCase() || String(v.SubCenterID).trim().toLowerCase() === "all";
        if(!belongsToSubCenter) return false;

        if (fId === "ALL_STATS") {
            let statsForms = masterData.forms.filter(f => String(f.FormType).trim().includes('Stats'));
            let userRole = user ? String(user.role).trim().toUpperCase() : "";
            let isFullyFilled = true;
            for (let f of statsForms) {
                let isInactive = isFormInactive(f);
                if (isInactive && userRole !== "ADMIN") continue; 
                let allowedRoles = f.AllowedRoles ? f.AllowedRoles.split(',').map(r=>String(r).trim().toUpperCase()) : ["ALL"];
                if (userRole === "ADMIN" || allowedRoles.includes("ALL") || allowedRoles.includes(userRole)) {
                    if (!isFormFilledForVillage(f, v.VillageName, month, year)) {
                        isFullyFilled = false; break;
                    }
                }
            }
            return !isFullyFilled;
        } else {
            const selectedForm = masterData.forms.find(f => f.FormID === fId);
            if(selectedForm && String(selectedForm.FormType).trim().includes('Stats')) {
                if (isFormFilledForVillage(selectedForm, v.VillageName, month, year)) return false;
            }
        }
        return true;
    }).forEach(v => { vSel.innerHTML += `<option value="${v.VillageName}">${v.VillageName}</option>`; });

    loadDynamicFields();
}

function loadDynamicFields() {
    const fId = document.getElementById('selForm').value;
    const vId = document.getElementById('selVillage').value;
    const area = document.getElementById('dynamicFormArea');
    const nilArea = document.getElementById('nilButtonContainer'); 
    const month = document.getElementById('selMonth').value;
    const year = document.getElementById('selYear').value;

    area.innerHTML = "";
    if(nilArea) nilArea.innerHTML = ""; 
    document.getElementById('mainSaveBtn').style.display = 'none';

    if(!fId) return;

    const selectedForm = masterData.forms.find(x => x.FormID === fId);
    if(selectedForm && String(selectedForm.FormType).trim() === 'List' && nilArea) {
        let remainingVillages = [];
        masterData.villages.forEach(v => {
            const belongsToSubCenter = String(v.SubCenterID).trim().toLowerCase() === String(user.subcenter).trim().toLowerCase() || String(v.SubCenterID).trim().toLowerCase() === "all";
            if(belongsToSubCenter) {
                if (!isFormFilledForVillage(selectedForm, v.VillageName, month, year)) {
                    remainingVillages.push(v.VillageName);
                }
            }
        });

        if (remainingVillages.length === 0) {
            nilArea.innerHTML = `<div style="color:green; text-align:center; font-weight:bold; font-size:15px; padding:10px; border:1px solid #28a745; border-radius:6px; background:#e8f5e9; margin-top:10px; margin-bottom:10px;">✅ या महिन्यासाठी उर्वरित सर्व गावांचा निरंक अहवाल अगोदरच सेव्ह केलेला आहे.</div>`;
        } else {
            nilArea.innerHTML = `
                <button type="button" onclick="submitNilReport('${fId}')" 
                    style="background:#e74c3c; color:white; font-weight:bold; border:none; padding:12px; border-radius:6px; cursor:pointer; width:100%; margin-top:10px; margin-bottom:5px; font-size:15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    ✅ राहिलेली उर्वरित गावे निरंक (Nil) सबमिट करा
                </button>`;
        }
    }

    if(!vId) return;

    if (isMonthLocked(month, year)) {
        area.innerHTML = "<p style='color:red; text-align:center; font-weight:bold; font-size:18px; padding:20px; border:2px solid red; border-radius:8px; background:#fff;'>⏳ क्षमस्व! या महिन्याची माहिती भरण्याची मुदत संपली आहे.</p>";
        return;
    }
    document.getElementById('mainSaveBtn').style.display = 'block';

    let isBulk = (vId === "ALL_VILLAGES");
    let availableVillages = Array.from(document.getElementById('selVillage').options).map(o => o.value).filter(v => v !== "" && v !== "ALL_VILLAGES");

    if (availableVillages.length === 0 && isBulk) {
        area.innerHTML = "<p style='color:green; text-align:center; font-weight:bold; font-size:18px;'>🎉 अभिनंदन! या महिन्यासाठी सर्व गावांचा डेटा आधीच भरून पूर्ण झाला आहे!</p>";
        document.getElementById('mainSaveBtn').style.display = 'none';
        return;
    }

    if (fId === "ALL_STATS") {
        let statsForms = masterData.forms.filter(f => String(f.FormType).trim().includes('Stats'));
        let allHtml = "";
        let userRole = user ? String(user.role).trim().toUpperCase() : "";
        let renderedFormsCount = 0;

        statsForms.forEach(f => {
            let isInactive = isFormInactive(f);
            if (isInactive && userRole !== "ADMIN") return;
            let allowedRoles = f.AllowedRoles ? f.AllowedRoles.split(',').map(r=>String(r).trim().toUpperCase()) : ["ALL"];
            if (userRole === "ADMIN" || allowedRoles.includes("ALL") || allowedRoles.includes(userRole)) {
                let formSpecificVillages = [];
                if(isBulk) { formSpecificVillages = availableVillages.filter(vName => !isFormFilledForVillage(f, vName, month, year)); } 
                else { if(!isFormFilledForVillage(f, vId, month, year)) formSpecificVillages.push(vId); }

                if (formSpecificVillages.length > 0) {
                    let formContainerId = `form_area_${f.FormID}`;
                    allHtml += `<div id="${formContainerId}" style="margin-bottom: 30px; border: 2px solid #00705a; padding: 0; border-radius: 8px; background: #fdfdfd; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow:hidden;">`;
                    allHtml += `<h3 style="background: #00705a; color: white; padding: 10px; margin: 0;">📌 ${f.FormName}</h3>`;
                    if(isBulk) { allHtml += generateBulkTableHTML(f, formSpecificVillages, f.FormID); } 
                    else { allHtml += `<div style="padding:15px;">` + generateFormHTML(f, f.FormID, formContainerId) + `</div>`; }
                    allHtml += `</div>`;
                    renderedFormsCount++;
                }
            }
        });

        if (renderedFormsCount === 0) {
            area.innerHTML = "<p style='color:green; text-align:center; font-weight:bold; font-size:18px;'>🎉 अभिनंदन! या महिन्यासाठी सर्व आकडेवारी फॉर्म्स आधीच भरून पूर्ण झाले आहेत!</p>";
            document.getElementById('mainSaveBtn').style.display = 'none';
        } else { area.innerHTML = allHtml; }
    } else {
        const f = masterData.forms.find(x => x.FormID === fId);
        if(!f) return;

        let formContainerId = `form_area_${f.FormID}`;
        let type = String(f.FormType).trim();

        if (type.includes('Stats')) {
            let formSpecificVillages = [];
            if(isBulk) { formSpecificVillages = availableVillages.filter(vName => !isFormFilledForVillage(f, vName, month, year)); } 
            else { if(!isFormFilledForVillage(f, vId, month, year)) formSpecificVillages.push(vId); }

            if(formSpecificVillages.length === 0) {
                area.innerHTML = "<p style='color:green; text-align:center; font-weight:bold; font-size:18px;'>🎉 अभिनंदन! या महिन्यासाठी हा फॉर्म भरून पूर्ण झाला आहे!</p>";
                document.getElementById('mainSaveBtn').style.display = 'none';
                return;
            }

            if(isBulk) { area.innerHTML = `<div id="${formContainerId}">` + generateBulkTableHTML(f, formSpecificVillages, f.FormID) + `</div>`; } 
            else { area.innerHTML = `<div id="${formContainerId}">` + generateFormHTML(f, "single", formContainerId) + `</div>`; }
        } else {
            if(isBulk) {
                area.innerHTML = "<p style='color:red; text-align:center; font-weight:bold; padding:15px;'>⚠️ यादी (List) प्रकारच्या फॉर्मसाठी 'सर्व गावे' निवडता येत नाहीत. कृपया ड्रॉपडाऊनमधून एक विशिष्ट गाव निवडा.</p>";
                document.getElementById('mainSaveBtn').style.display = 'none';
                return;
            }
            area.innerHTML = `<div id="${formContainerId}" style="border: 2px solid #00705a; border-radius: 8px; background: #fdfdfd; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow:hidden;">` + generateListHTML(f, f.FormID) + `</div>`;
        }
    }

    setTimeout(() => { document.querySelectorAll('[id^="form_area_"], [id^="bulkrow_"], [id^="listrow_"]').forEach(el => { processAllLogic(el.id); }); }, 100);
}

function generateInputHTML(f, id, label, areaId, val="") {
    let html = "";
    if (val === "" && f.defaultValue !== undefined && f.defaultValue !== "" && !id.startsWith('edit_')) { val = f.defaultValue; }

    let fidAttr = f.fid ? `data-fid="${f.fid}"` : ""; 
    let reqAttr = f.isRequired ? `data-required="true"` : "";
    let safeDep = f.dependency ? String(f.dependency).replace(/"/g, "&quot;").replace(/'/g, "&apos;") : "";
    let depAttr = safeDep ? `data-dependency="${safeDep}"` : "";
    let safeForm = (f.options && f.type === 'sum') ? String(f.options).replace(/"/g, "&quot;").replace(/'/g, "&apos;") : "";
    let formulaAttr = safeForm ? `data-formula="${safeForm}" data-sum-targets="${safeForm}"` : "";
    let rangeAttr = f.range ? `data-range="${f.range}"` : "";

    let onEvent = `oninput="this.style.border=''; processAllLogic('${areaId}')" onchange="this.style.border=''; processAllLogic('${areaId}')"`;

    if (f.type === 'dropdown') {
        html += `<select id="${id}" data-label="${label}" ${fidAttr} ${depAttr} ${reqAttr} ${onEvent}><option value="">-- निवडा --</option>`;
        if(f.options) { f.options.split(',').forEach(opt => { let o = opt.trim(); let sel = (o === String(val).trim()) ? "selected" : ""; if(o) html += `<option value="${o}" ${sel}>${o}</option>`; }); }
        html += `</select>`;
    } else if(f.type === 'sum') {
        html += `<input type="text" id="${id}" data-label="${label}" ${fidAttr} ${formulaAttr} value="${val}" readonly style="background:#e9ecef; font-weight:bold; color:var(--primary); cursor:not-allowed;" placeholder="Auto Calculation">`;
    } else if(f.type === 'number') {
        html += `<input type="number" id="${id}" data-label="${label}" ${fidAttr} ${depAttr} ${rangeAttr} ${reqAttr} value="${val}" ${onEvent}>`;
    } else if(f.type === 'mobile') {
        html += `<input type="tel" id="${id}" data-label="${label}" ${fidAttr} ${depAttr} ${reqAttr} value="${val}" maxlength="10" pattern="[0-9]{10}" placeholder="10 अंकी नंबर" oninput="this.value=this.value.replace(/[^0-9]/g,''); this.style.border=''; processAllLogic('${areaId}');">`;
    } else if(f.type === 'date') {
        html += `<input type="date" id="${id}" data-label="${label}" ${fidAttr} ${depAttr} ${reqAttr} value="${val}" ${onEvent}>`;
    } else {
        html += `<input type="text" id="${id}" data-label="${label}" ${fidAttr} ${depAttr} ${reqAttr} value="${val}" ${onEvent}>`;
    }
    return html;
}

function extractFieldsFromForm(f) {
    let fields = [];
    JSON.parse(f.StructureJSON).forEach((field, i) => {
        let exactLabel = String(field.label).trim();
        if (field.type === 'group') {
            field.subFields.forEach((sf, j) => {
                let exactSfLabel = String(sf.label).trim();
                if (sf.type === 'group') {
                    sf.subFields.forEach((ssf, k) => {
                        let label = `${exactLabel} - ${exactSfLabel} - ${String(ssf.label).trim()}`;
                        fields.push({ label, idSuffix: `${i}_${j}_${k}`, orig: ssf });
                    });
                } else {
                    let label = `${exactLabel} - ${exactSfLabel}`;
                    fields.push({ label, idSuffix: `${i}_${j}`, orig: sf });
                }
            });
        } else {
            fields.push({ label: exactLabel, idSuffix: `${i}`, orig: field });
        }
    });
    return fields;
}

function generateFormHTML(f, prefix, areaId) {
    let html = "";
    JSON.parse(f.StructureJSON).forEach((field, i) => {
        let exactLabel = String(field.label).trim();
        let reqStar1 = field.isRequired ? '<span class="req-star">*</span>' : '';

        if (field.type === 'group') {
            html += `<div style="margin-bottom:15px; background:#fffaf0; padding:12px; border-radius:8px; border:1px solid #f5b041;"><h4 style="margin-top:0; color:var(--primary); border-bottom:1px solid #ccc; padding-bottom:5px;">${exactLabel}${reqStar1}</h4>`;
            field.subFields.forEach((sf, j) => {
                let exactSfLabel = String(sf.label).trim();
                let reqStar2 = sf.isRequired ? '<span class="req-star">*</span>' : '';
                if(sf.type === 'group') {
                    html += `<div style="margin-bottom:10px; margin-left:10px; background:#e0f7fa; padding:10px; border-radius:5px; border-left:3px solid #00acc1;"><h5 style="margin:0 0 5px 0; color:#00838f;">${exactSfLabel}${reqStar2}</h5>`;
                    sf.subFields.forEach((ssf, k) => {
                        let exactSsfLabel = String(ssf.label).trim();
                        let reqStar3 = ssf.isRequired ? '<span class="req-star">*</span>' : '';
                        let exactSubSubLabel = `${exactLabel} - ${exactSfLabel} - ${exactSsfLabel}`;
                        html += `<div style="margin-bottom:8px;"><label style="font-size:13px; color:#555;"><b>${exactSsfLabel}${reqStar3}:</b></label>` + generateInputHTML(ssf, `${prefix}_inp_${i}_${j}_${k}`, exactSubSubLabel, areaId, "") + `</div>`;
                    });
                    html += `</div>`;
                } else {
                    let exactSubLabel = `${exactLabel} - ${exactSfLabel}`;
                    html += `<div style="margin-bottom:10px;"><label style="font-size:14px; color:#555;"><b>${exactSfLabel}${reqStar2}:</b></label>` + generateInputHTML(sf, `${prefix}_inp_${i}_${j}`, exactSubLabel, areaId, "") + `</div>`;
                }
            });
            html += `</div>`;
        } else {
            html += `<div style="margin-bottom:15px; background:white; padding:10px; border-radius:8px; border:1px solid #ddd;"><label><b>${exactLabel}${reqStar1}:</b></label>` + generateInputHTML(field, `${prefix}_inp_${i}`, exactLabel, areaId, "") + `</div>`;
        }
    });
    return html;
}

function generateTableHeaders(f) {
    let maxDepth = 1; let struct = JSON.parse(f.StructureJSON);
    struct.forEach(field => { if (field.type === 'group') { maxDepth = Math.max(maxDepth, 2); field.subFields.forEach(sf => { if (sf.type === 'group') maxDepth = 3; }); } });
    let r1 = "", r2 = "", r3 = "";
    r1 += `<th rowspan="${maxDepth}" class="sticky-header-col" style="background:#00705a; color:white; z-index:4; position:sticky; top:0; left:0; border:1px solid #ddd; padding:10px; text-align:center;">गाव (Village)</th>`;

    struct.forEach(field => {
        let exactLabel = String(field.label).trim(); let reqStar1 = field.isRequired ? '<span class="req-star">*</span>' : '';
        if (field.type === 'group') {
            let colSpan1 = 0; let fieldHtml2 = "", fieldHtml3 = "";
            field.subFields.forEach(sf => {
                let exactSfLabel = String(sf.label).trim(); let reqStar2 = sf.isRequired ? '<span class="req-star">*</span>' : '';
                if (sf.type === 'group') {
                    let colSpan2 = sf.subFields.length; colSpan1 += colSpan2;
                    fieldHtml2 += `<th colspan="${colSpan2}" style="background:#00705a; color:white; border:1px solid #ddd; padding:8px; text-align:center;">${exactSfLabel}${reqStar2}</th>`;
                    sf.subFields.forEach(ssf => { let reqStar3 = ssf.isRequired ? '<span class="req-star">*</span>' : ''; fieldHtml3 += `<th style="background:#00705a; color:white; font-size:12px; border:1px solid #ddd; padding:6px; text-align:center;">${String(ssf.label).trim()}${reqStar3}</th>`; });
                } else {
                    colSpan1 += 1; let rs2 = maxDepth === 3 ? 2 : 1;
                    fieldHtml2 += `<th rowspan="${rs2}" style="background:#00705a; color:white; font-size:12px; border:1px solid #ddd; padding:8px; text-align:center;">${exactSfLabel}${reqStar2}</th>`;
                }
            });
            r1 += `<th colspan="${colSpan1}" style="background:#00705a; color:white; border:1px solid #ddd; padding:10px; text-align:center;">${exactLabel}${reqStar1}</th>`;
            r2 += fieldHtml2; r3 += fieldHtml3;
        } else {
            r1 += `<th rowspan="${maxDepth}" style="background:#00705a; color:white; font-size:12px; border:1px solid #ddd; padding:10px; text-align:center;">${exactLabel}${reqStar1}</th>`;
        }
    });

    let thead = `<tr>${r1}</tr>`; if (maxDepth >= 2) thead += `<tr>${r2}</tr>`; if (maxDepth === 3) thead += `<tr>${r3}</tr>`;
    return thead;
}

function generateBulkTableHTML(f, availableVillages, formPrefix) {
    if (isMobile()) {
        let html = "";
        availableVillages.forEach(vName => {
            let safeVName = vName.replace(/\s+/g, '_'); let rowId = `bulkrow_${formPrefix}_${safeVName}`; let inputPrefix = `bulk_${formPrefix}_${safeVName}`;
            html += `<div id="${rowId}" style="background:white; padding:15px; margin-bottom:20px; border-radius:8px; box-shadow:0 4px 8px rgba(0,0,0,0.1); border:2px solid var(--primary);"><h3 style="color:var(--primary); text-align:left; border-bottom:2px solid var(--primary); padding-bottom:5px; margin-top:0; font-size:18px;">🏢 गाव: ${vName}</h3>` + generateFormHTML(f, inputPrefix, rowId) + `</div>`;
        });
        return html;
    }
    let fields = extractFieldsFromForm(f); let headersHtml = generateTableHeaders(f); let rowsHtml = "";
    availableVillages.forEach(vName => {
        let safeVName = vName.replace(/\s+/g, '_'); let rowId = `bulkrow_${formPrefix}_${safeVName}`; let inputPrefix = `bulk_${formPrefix}_${safeVName}`;
        rowsHtml += `<tr id="${rowId}"><td class="sticky-col" style="background:#fdfdfd;">${vName}</td>`;
        fields.forEach(fld => { rowsHtml += `<td>` + generateInputHTML(fld.orig, `${inputPrefix}_inp_${fld.idSuffix}`, fld.label, rowId, "") + `</td>`; });
        rowsHtml += `</tr>`;
    });
    return `<div class="table-responsive" style="max-height: 65vh; overflow: auto; border: 1px solid #ddd; margin-top:0;"><table class="report-table" style="width:100%; border-collapse: separate; border-spacing: 0;"><thead style="position: sticky; top: 0; z-index: 3;">${headersHtml}</thead><tbody>${rowsHtml}</tbody></table></div>`;
}

function generateListHTML(f, formPrefix) {
    let fields = extractFieldsFromForm(f);
    let html = `<h3 style="background: #00705a; color: white; padding: 10px; margin: 0;">📌 ${f.FormName} (रुग्ण/लाभार्थी यादी)</h3>`;
    let initialRowIdx = Date.now();

    if (isMobile()) {
        html += `<div id="list_tbody_${f.FormID}" style="background:#f4f7f6; padding:10px; border-bottom:1px solid #ddd;">` + generateSingleListRowMobile(f, fields, formPrefix, initialRowIdx) + `</div>`;
    } else {
        let headersHtml = `<tr><th class="sticky-header-col" style="background:#00705a; color:white; min-width:60px;">अ.क्र.</th>`;
        JSON.parse(f.StructureJSON).forEach((field, i) => {
            if (field.type === 'group') {
                field.subFields.forEach((sf, j) => {
                    if (sf.type === 'group') {
                        sf.subFields.forEach((ssf, k) => {
                            let reqStar = ssf.isRequired ? '<span class="req-star">*</span>' : '';
                            headersHtml += `<th style="background:#00705a; color:white; font-size:12px; min-width:110px; position:sticky; top:0; z-index:2;">${String(ssf.label).trim()}${reqStar}<br><small style="font-weight:normal; color:#ddd;">(${String(sf.label).trim()})</small></th>`;
                        });
                    } else {
                        let reqStar = sf.isRequired ? '<span class="req-star">*</span>' : '';
                        headersHtml += `<th style="background:#00705a; color:white; font-size:12px; min-width:110px; position:sticky; top:0; z-index:2;">${String(sf.label).trim()}${reqStar}<br><small style="font-weight:normal; color:#ddd;">(${String(field.label).trim()})</small></th>`;
                    }
                });
            } else {
                let reqStar = field.isRequired ? '<span class="req-star">*</span>' : '';
                headersHtml += `<th style="background:#00705a; color:white; font-size:12px; min-width:110px; position:sticky; top:0; z-index:2;">${String(field.label).trim()}${reqStar}</th>`;
            }
        });
        headersHtml += `</tr>`;
        html += `<div class="table-responsive" style="max-height: 65vh; overflow: auto; border: 1px solid #ddd; margin-top:0;"><table class="report-table" style="width:100%; border-collapse: separate; border-spacing: 0;"><thead>${headersHtml}</thead><tbody id="list_tbody_${f.FormID}">` + generateSingleListRowDesktop(f, fields, formPrefix, initialRowIdx) + `</tbody></table></div>`;
    }
    
    html += `<div style="display:flex; justify-content:center; margin-top:15px; margin-bottom:15px;"><button type="button" onclick="addListRow('${f.FormID}')" style="background:#17a2b8; color:white; font-weight:bold; border:none; padding:12px 30px; border-radius:6px; cursor:pointer; font-size:15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">➕ आणखी एक नोंद/रुग्ण जोडा</button></div>`;
    setTimeout(() => updateListRowNumbers(f.FormID), 50);
    return html;
}

function generateSingleListRowDesktop(f, fields, formPrefix, uniqueIdx) {
    let rowId = `listrow_${formPrefix}_${uniqueIdx}`; let inputPrefix = `list_${formPrefix}_${uniqueIdx}`;
    let trHtml = `<tr id="${rowId}"><td class="sticky-col" style="text-align:center; vertical-align:top; padding-top:15px;">- <br><button type="button" tabindex="-1" onclick="this.parentElement.parentElement.remove(); updateListRowNumbers('${f.FormID}');" style="color:red; background:none; border:none; cursor:pointer; font-size:18px; margin-top:5px;" title="ओळ काढून टाका">✖</button></td>`;
    fields.forEach(fld => { trHtml += `<td>` + generateInputHTML(fld.orig, `${inputPrefix}_inp_${fld.idSuffix}`, fld.label, rowId, "") + `</td>`; });
    return trHtml + `</tr>`;
}

function generateSingleListRowMobile(f, fields, formPrefix, uniqueIdx) {
    let rowId = `listrow_${formPrefix}_${uniqueIdx}`; let inputPrefix = `list_${formPrefix}_${uniqueIdx}`;
    let html = `<div class="mobile-list-card" id="${rowId}" style="background:white; padding:15px; margin-bottom:20px; border-radius:8px; box-shadow:0 4px 8px rgba(0,0,0,0.1); border:1px solid #bce8f1; position:relative;">`;
    html += `<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #eee; padding-bottom:8px; margin-bottom:15px;"><span class="row-number" style="color:#00705a; font-weight:bold; font-size:18px;">रुग्ण १</span><button type="button" tabindex="-1" onclick="this.parentElement.parentElement.remove(); updateListRowNumbers('${f.FormID}');" style="color:white; background:#dc3545; border:none; border-radius:4px; padding:6px 12px; cursor:pointer; font-size:13px; width:auto; font-weight:bold;">काढून टाका ✖</button></div>`;
    fields.forEach(fld => { let reqStar = fld.orig.isRequired ? '<span class="req-star">*</span>' : ''; html += `<div style="margin-bottom:12px;"><label style="font-size:14px; font-weight:bold; color:#444; display:block; margin-bottom:5px;">${fld.label}${reqStar}</label>` + generateInputHTML(fld.orig, `${inputPrefix}_inp_${fld.idSuffix}`, fld.label, rowId, "") + `</div>`; });
    return html + `</div>`;
}

function addListRow(fId) {
    const f = masterData.forms.find(x => x.FormID === fId); if(!f) return;
    let tbody = document.getElementById(`list_tbody_${fId}`);
    let rowIdx = Date.now() + Math.floor(Math.random() * 100);
    let fields = extractFieldsFromForm(f);
    let newHtml = isMobile() ? generateSingleListRowMobile(f, fields, fId, rowIdx) : generateSingleListRowDesktop(f, fields, fId, rowIdx);
    tbody.insertAdjacentHTML('beforeend', newHtml);
    updateListRowNumbers(fId);
}

function updateListRowNumbers(fId) {
    let container = document.getElementById(`list_tbody_${fId}`); if(!container) return;
    if (isMobile()) { Array.from(container.children).forEach((card, index) => { let header = card.querySelector('.row-number'); if(header) header.innerText = `नोंद / रुग्ण ${index + 1}`; }); } 
    else { Array.from(container.children).forEach((tr, index) => { tr.children[0].innerHTML = `<b>${index + 1}</b> <br><button type="button" tabindex="-1" onclick="this.parentElement.parentElement.remove(); updateListRowNumbers('${fId}');" style="color:red; background:none; border:none; cursor:pointer; font-size:18px; margin-top:5px;" title="काढून टाका">✖</button>`; }); }
}

function extractFormData(f, prefix) {
    let formData = {};
    JSON.parse(f.StructureJSON).forEach((field, i) => {
        let exactL = String(field.label).trim();
        if (field.type === 'group') {
            field.subFields.forEach((sf, j) => {
                let exactSL = String(sf.label).trim();
                if(sf.type === 'group') {
                    sf.subFields.forEach((ssf, k) => {
                        let exactSSL = String(ssf.label).trim(); let el = document.getElementById(`${prefix}_inp_${i}_${j}_${k}`);
                        if(el) formData[`${exactL} - ${exactSL} - ${exactSSL}`] = el.value;
                    });
                } else {
                    let el = document.getElementById(`${prefix}_inp_${i}_${j}`);
                    if(el) formData[`${exactL} - ${exactSL}`] = el.value;
                }
            });
        } else {
            let el = document.getElementById(`${prefix}_inp_${i}`);
            if(el) formData[exactL] = el.value;
        }
    });
    return formData;
}

// 🟢 3. SAVE DATA TO SERVER (Supabase Logic)
async function saveDataToServer() {
    if(isSaving) return;
    const saveBtn = document.getElementById('mainSaveBtn');

    let hasValidationError = false; let hasRangeError = false; let formsToProcess = [];
    const fId = document.getElementById('selForm').value;
    const vName = document.getElementById('selVillage').value;
    const month = document.getElementById('selMonth').value;
    const year = document.getElementById('selYear').value;

    if(!fId || !vName) { alert("कृपया फॉर्म आणि गाव निवडा!"); return; }
    if (isMonthLocked(month, year)) { alert("⏳ क्षमस्व! मुदत संपली आहे."); return; }

    let isBulk = (vName === "ALL_VILLAGES");
    let baseVillages = [];
    masterData.villages.forEach(v => { if(String(v.SubCenterID).trim().toLowerCase() === String(user.subcenter).trim().toLowerCase() || String(v.SubCenterID).trim().toLowerCase() === "all") { baseVillages.push(v.VillageName); } });
    let availableVillages = isBulk ? baseVillages : [vName];
    let prefixMap = {};

    if (fId === "ALL_STATS") {
        let statsForms = masterData.forms.filter(f => String(f.FormType).trim().includes('Stats'));
        let userRole = user ? String(user.role).trim().toUpperCase() : "";
        statsForms.forEach(f => {
            let isInactive = isFormInactive(f);
            if (isInactive && userRole !== "ADMIN") return;
            let allowedRoles = f.AllowedRoles ? f.AllowedRoles.split(',').map(r=>String(r).trim().toUpperCase()) : ["ALL"];
            if (userRole === "ADMIN" || allowedRoles.includes("ALL") || allowedRoles.includes(userRole)) { formsToProcess.push(f); prefixMap[f.FormID] = f.FormID; }
        });
    } else {
        const f = masterData.forms.find(x => x.FormID === fId);
        if(f) { formsToProcess.push(f); prefixMap[f.FormID] = isBulk ? f.FormID : "single"; }
    }

    formsToProcess.forEach(f => {
        let formPrefix = prefixMap[f.FormID];
        availableVillages.forEach(village => {
            if (String(f.FormType).trim() === 'List') {
                let tbody = document.getElementById(`list_tbody_${f.FormID}`);
                if(tbody) {
                    Array.from(tbody.children).forEach(tr => {
                        let reqInputs = tr.querySelectorAll('[data-required="true"]');
                        reqInputs.forEach(inp => { if(inp.style.pointerEvents !== "none" && inp.value.trim() === "") { inp.style.border = "2px solid red"; hasValidationError = true; } });
                        let errInputs = tr.querySelectorAll('.error-input'); if(errInputs.length > 0) hasRangeError = true;
                    });
                }
            } else {
                let safeVName = village.replace(/\s+/g, '_');
                let containerId = isBulk ? `bulkrow_${formPrefix}_${safeVName}` : `form_area_${f.FormID}`;
                let containerEl = document.getElementById(containerId);
                if (containerEl) {
                    let reqInputs = containerEl.querySelectorAll('[data-required="true"]');
                    reqInputs.forEach(inp => { if(inp.style.pointerEvents !== "none" && inp.value.trim() === "") { inp.style.border = "2px solid red"; hasValidationError = true; } });
                    let errInputs = containerEl.querySelectorAll('.error-input'); if(errInputs.length > 0) hasRangeError = true;
                }
            }
        });
    });

    if(hasValidationError) { alert("⚠️ कृपया लाल रंगाने हायलाईट केलेली सर्व आवश्यक (*) फील्ड्स भरा!"); return; }
    if(hasRangeError) { alert("⚠️ काही फील्ड्समध्ये चुकीची (अवैध) संख्या टाकली आहे. कृपया लाल रंगाची फील्ड्स तपासा."); return; }

    if(saveBtn) saveBtn.disabled = true;
    isSaving = true;
    const statusText = document.getElementById('syncStatus');
    statusText.style.color = "orange"; statusText.innerText = "☁️ डेटा Supabase वर सेव्ह होत आहे... कृपया थांबा.";

    try {
        let dataToSave = [];
        let hasNewData = false;

        formsToProcess.forEach(f => {
            let formPrefix = prefixMap[f.FormID];
            availableVillages.forEach(village => {
                if (String(f.FormType).trim() === 'List') {
                    let tbody = document.getElementById(`list_tbody_${f.FormID}`);
                    if(tbody) {
                        Array.from(tbody.children).forEach(tr => {
                            let rowIdParts = tr.id.split('_'); let rIdx = rowIdParts[rowIdParts.length - 1]; let prefix = `list_${f.FormID}_${rIdx}`;
                            processAllLogic(tr.id);
                            let formData = extractFormData(f, prefix);
                            let isEmpty = true;
                            for(let key in formData) { if(formData[key] !== undefined && String(formData[key]).trim() !== "") { isEmpty = false; break; } }
                            if(!isEmpty) {
                                formData["महिना"] = month; formData["वर्ष"] = year;
                                const entry = { entryID: Date.now().toString() + Math.random().toString().slice(2,7), mobileNo: String(user.mobile).trim(), subCenter: String(user.subcenter).trim(), village: String(village).trim(), formID: f.FormID, month: month, year: year, formData: formData };
                                dataToSave.push(entry); hasNewData = true;
                            }
                        });
                    }
                } else {
                    let safeVName = village.replace(/\s+/g, '_'); let prefix = isBulk ? `bulk_${formPrefix}_${safeVName}` : formPrefix;
                    let containerId = isBulk ? `bulkrow_${formPrefix}_${safeVName}` : `form_area_${f.FormID}`;
                    let containerEl = document.getElementById(containerId);
                    if (!containerEl) return;
                    processAllLogic(containerId);
                    let formData = extractFormData(f, prefix);
                    formData["महिना"] = month; formData["वर्ष"] = year;
                    const entry = { entryID: Date.now().toString() + Math.random().toString().slice(2,7), mobileNo: String(user.mobile).trim(), subCenter: String(user.subcenter).trim(), village: String(village).trim(), formID: f.FormID, month: month, year: year, formData: formData };
                    dataToSave.push(entry); hasNewData = true;
                }
            });
        });

        if(!hasNewData) { alert("⚠️ तुम्ही कोणतीही नवीन माहिती भरलेली नाही! कृपया फॉर्म भरा."); if(saveBtn) saveBtn.disabled = false; isSaving = false; statusText.innerText = ""; return; }

        const { error } = await supabase.from('filled_stats').insert(dataToSave);
        if (error) throw error;
        
        masterData.filledStats.push(...dataToSave); // Local App update

        statusText.style.color = "green"; statusText.innerText = "✅ माहिती यशस्वीरित्या Supabase वर सेव्ह झाली!";
        setTimeout(() => { statusText.innerText = ""; }, 4000);
        
        document.getElementById('selVillage').value = "";
        document.getElementById('dynamicFormArea').innerHTML = "";
        
        let nilArea = document.getElementById('nilButtonContainer');
        if(nilArea) nilArea.innerHTML = "";
        
        updateFormDropdowns(); updateVillageDropdown();
        if(typeof updateEditVillageDropdown === "function") updateEditVillageDropdown();

    } catch (error) {
        console.error("Save Error:", error);
        alert("माहिती जतन करताना तांत्रिक अडचण आली. कृपया इंटरनेट तपासा आणि पुन्हा प्रयत्न करा.");
        statusText.style.color = "red"; statusText.innerText = "⚠️ इंटरनेट एरर! माहिती सेव्ह होऊ शकली नाही.";
        setTimeout(() => { statusText.innerText = ""; }, 5000);
    } finally {
        isSaving = false; if(saveBtn) saveBtn.disabled = false;
    }
}

// 🟢 4. SUBMIT NIL REPORT (Supabase Logic)
async function submitNilReport(fId) {
    if(isSaving) return;
    const month = document.getElementById('selMonth').value;
    const year = document.getElementById('selYear').value;
    const f = masterData.forms.find(x => x.FormID === fId);

    if (isMonthLocked(month, year)) { alert("⏳ क्षमस्व! मुदत संपली आहे."); return; }

    let remainingVillages = [];
    masterData.villages.forEach(v => {
        const belongsToSubCenter = String(v.SubCenterID).trim().toLowerCase() === String(user.subcenter).trim().toLowerCase() || String(v.SubCenterID).trim().toLowerCase() === "all";
        if(belongsToSubCenter) {
            if (!isFormFilledForVillage(f, v.VillageName, month, year)) {
                remainingVillages.push(v.VillageName);
            }
        }
    });

    if(remainingVillages.length === 0) {
        alert("सर्व गावांचा अहवाल आधीच भरलेला आहे किंवा अगोदरच निरंक सेव्ह केलेला आहे!");
        loadDynamicFields(); 
        return;
    }

    if(!confirm(`तुम्हाला खात्री आहे का की ${month} ${year} साठी राहिलेल्या सर्व उर्वरित (${remainingVillages.length}) गावांचा अहवाल 'निरंक' म्हणून सबमिट करायचा आहे?`)) {
        return;
    }

    isSaving = true;
    if(document.getElementById('mainSaveBtn')) document.getElementById('mainSaveBtn').disabled = true;

    let firstFieldLabel = "माहिती";
    try {
        let struct = JSON.parse(f.StructureJSON);
        if (struct && struct.length > 0) {
            let firstF = struct[0];
            if (firstF.type === 'group' && firstF.subFields && firstF.subFields.length > 0) {
                if (firstF.subFields[0].type === 'group' && firstF.subFields[0].subFields && firstF.subFields[0].subFields.length > 0) {
                    firstFieldLabel = firstF.label + " - " + firstF.subFields[0].label + " - " + firstF.subFields[0].subFields[0].label;
                } else { firstFieldLabel = firstF.label + " - " + firstF.subFields[0].label; }
            } else { firstFieldLabel = firstF.label; }
        }
    } catch(e) {}

    let dataToSave = [];
    remainingVillages.forEach(village => {
        let formData = {};
        formData[firstFieldLabel] = "निरंक (Nil Report)";
        formData["महिना"] = month; formData["वर्ष"] = year;
        
        const entry = { 
            entryID: Date.now().toString() + Math.random().toString().slice(2,7), 
            mobileNo: String(user.mobile).trim(), 
            subCenter: String(user.subcenter).trim(), 
            village: String(village).trim(), 
            formID: fId, 
            month: month,
            year: year,
            formData: formData 
        };
        dataToSave.push(entry);
    });

    const statusText = document.getElementById('syncStatus');
    statusText.style.color = "orange";
    statusText.innerText = `☁️ उर्वरित ${remainingVillages.length} गावांचा निरंक (Nil) अहवाल सेव्ह होत आहे...`;

    try {
        const { error } = await supabase.from('filled_stats').insert(dataToSave);
        if(error) throw error;
        
        masterData.filledStats.push(...dataToSave); // Local App update

        statusText.style.color = "green";
        statusText.innerText = "✅ उर्वरित गावांचा निरंक अहवाल यशस्वीरित्या सेव्ह झाला!";
        setTimeout(() => { statusText.innerText = ""; }, 4000);

        document.getElementById('selVillage').value = "";
        document.getElementById('dynamicFormArea').innerHTML = "";
        loadDynamicFields();
        updateVillageDropdown();
    } catch (error) {
        console.error("Save Error:", error);
        alert("माहिती जतन करताना तांत्रिक अडचण आली. कृपया इंटरनेट तपासा आणि पुन्हा प्रयत्न करा.");
        statusText.style.color = "red";
        statusText.innerText = "⚠️ इंटरनेट एरर! माहिती सेव्ह होऊ शकली नाही.";
        setTimeout(() => { statusText.innerText = ""; }, 5000);
    } finally {
        isSaving = false;
        if(document.getElementById('mainSaveBtn')) document.getElementById('mainSaveBtn').disabled = false;
    }
}
