// 🟢 JS/ADMIN.JS - Supabase Logic

function openNewFormBuilder() {
    document.getElementById('formBuilder').classList.remove('hidden');
    document.getElementById('builderTitle').innerText = "नवीन फॉर्म तयार करा";
    document.getElementById('editFormID').value = "";
    document.getElementById('newFormName').value = "";
    document.getElementById('newFormType').value = "Stats";
    document.getElementById('newFormLayout').value = "Horizontal";
    document.getElementById('formIsActive').checked = true;
    document.getElementById('roleAll').checked = true;
    document.getElementById('specificRoles').style.display = "none";
    document.querySelectorAll('.form-role').forEach(cb => cb.checked = false);
    document.getElementById('fieldsList').innerHTML = "";
    document.getElementById('mainActionBtn').innerText = "फॉर्म सेव्ह करा";
    toggleLayoutOption();
    addField(); 
}

function toggleLayoutOption() {
    const type = document.getElementById('newFormType').value;
    const layoutDiv = document.getElementById('layoutDiv');
    if(type === 'ProgressiveStats') { layoutDiv.style.display = "block"; } 
    else { layoutDiv.style.display = "none"; }
}

function toggleRoles(checkbox) {
    const rolesDiv = document.getElementById('specificRoles');
    if (checkbox.checked) { rolesDiv.style.display = "none"; } 
    else { rolesDiv.style.display = "block"; }
}

function renderExistingFormsList() {
    const area = document.getElementById('formsEditList');
    if(!area) return;
    area.innerHTML = "";
    masterData.forms.forEach(f => {
        let btn = document.createElement('button');
        btn.innerText = `✏️ ${f.FormName} ${isFormInactive(f) ? '(Inactive)' : ''}`;
        btn.className = "btn-edit-tab";
        btn.style.margin = "5px";
        btn.onclick = () => loadFormForEdit(f);
        area.appendChild(btn);
    });
}

function isFormInactive(f) {
    if (f.IsActive !== undefined) return !f.IsActive;
    return false;
}

function loadFormForEdit(f) {
    document.getElementById('formBuilder').classList.remove('hidden');
    document.getElementById('builderTitle').innerText = "फॉर्म एडिट करा: " + f.FormName;
    document.getElementById('editFormID').value = f.FormID;
    document.getElementById('newFormName').value = f.FormName;
    
    let typeStr = String(f.FormType).trim();
    if(typeStr.includes('Vertical')) { document.getElementById('newFormType').value = "ProgressiveStats"; document.getElementById('newFormLayout').value = "Vertical"; } 
    else if(typeStr.includes('ProgressiveStats')) { document.getElementById('newFormType').value = "ProgressiveStats"; document.getElementById('newFormLayout').value = "Horizontal"; } 
    else if(typeStr.includes('List')) { document.getElementById('newFormType').value = "List"; document.getElementById('newFormLayout').value = "Horizontal"; } 
    else { document.getElementById('newFormType').value = "Stats"; document.getElementById('newFormLayout').value = "Horizontal"; }
    
    toggleLayoutOption();

    if (f.IsActive !== undefined) { document.getElementById('formIsActive').checked = f.IsActive; } 
    else { document.getElementById('formIsActive').checked = true; }

    let roles = f.AllowedRoles ? f.AllowedRoles.split(',').map(r=>r.trim().toUpperCase()) : ["ALL"];
    if (roles.includes("ALL")) {
        document.getElementById('roleAll').checked = true;
        document.getElementById('specificRoles').style.display = "none";
        document.querySelectorAll('.form-role').forEach(cb => cb.checked = false);
    } else {
        document.getElementById('roleAll').checked = false;
        document.getElementById('specificRoles').style.display = "block";
        document.querySelectorAll('.form-role').forEach(cb => { cb.checked = roles.includes(cb.value.toUpperCase()); });
    }

    document.getElementById('fieldsList').innerHTML = "";
    document.getElementById('mainActionBtn').innerText = "बदल सेव्ह करा (Update)";

    let structure = [];
    try { structure = JSON.parse(f.StructureJSON); } catch(e) {}
    
    if(structure.length === 0) { addField(); } 
    else { structure.forEach(field => addFieldToUI(field)); }
}

function addFieldToUI(fieldData = null) {
    const list = document.getElementById('fieldsList');
    const fDiv = document.createElement('div');
    fDiv.className = "field-builder";
    let isReqChecked = (fieldData && fieldData.isRequired) ? "checked" : "";
    fDiv.innerHTML = `
        <div style="display:flex; gap:10px; align-items:center;">
            <button onclick="this.parentElement.parentElement.remove()" style="color:red; font-weight:bold; background:none; border:none; font-size:18px;">✖</button>
            <input type="text" class="f-label" placeholder="प्रश्नाचे नाव" value="${fieldData ? fieldData.label : ''}" style="flex:2; padding:8px; border:1px solid #ccc; border-radius:4px;">
            <select class="f-type" style="flex:1; padding:8px; border:1px solid #ccc; border-radius:4px;">
                <option value="number" ${(fieldData && fieldData.type === 'number') ? 'selected' : ''}>Number</option>
                <option value="text" ${(fieldData && fieldData.type === 'text') ? 'selected' : ''}>Text</option>
                <option value="dropdown" ${(fieldData && fieldData.type === 'dropdown') ? 'selected' : ''}>Dropdown</option>
                <option value="group" ${(fieldData && fieldData.type === 'group') ? 'selected' : ''}>Group (Sub-questions)</option>
            </select>
        </div>
        <div style="margin-left: 30px; margin-top: 5px;">
            <label style="font-size:12px;"><input type="checkbox" class="f-req" ${isReqChecked}> आवश्यक आहे (*)</label>
        </div>
        <div class="sub-fields" style="margin-left:20px; border-left:2px dashed #bbb; padding-left:10px; margin-top:10px;"></div>
        <button class="add-sub-btn hidden" onclick="addSubField(this.parentElement)" style="margin-left:20px; background:#f8f9fa; border:1px solid #ccc; color:#333; font-size:12px; margin-top:5px;">+ सब-प्रश्न जोडा</button>
    `;
    list.appendChild(fDiv);
    let typeSel = fDiv.querySelector('.f-type');
    let addSubBtn = fDiv.querySelector('.add-sub-btn');
    typeSel.onchange = () => { if (typeSel.value === 'group') { addSubBtn.classList.remove('hidden'); } else { addSubBtn.classList.add('hidden'); fDiv.querySelector('.sub-fields').innerHTML = ""; } };
    
    if (fieldData && fieldData.type === 'group') {
        addSubBtn.classList.remove('hidden');
        if(fieldData.subFields) { fieldData.subFields.forEach(sf => addSubFieldToUI(fDiv, sf)); }
    }
}

function addField() { addFieldToUI(); }

function addSubFieldToUI(parentDiv, sfData = null) {
    const subList = parentDiv.querySelector('.sub-fields');
    const sDiv = document.createElement('div');
    sDiv.style.marginBottom = "10px";
    let isReqChecked = (sfData && sfData.isRequired) ? "checked" : "";
    sDiv.innerHTML = `
        <div style="display:flex; gap:10px; align-items:center;">
            <button onclick="this.parentElement.parentElement.remove()" style="color:orange; font-weight:bold; background:none; border:none; font-size:16px;">✖</button>
            <input type="text" class="sf-label" placeholder="सब-प्रश्नाचे नाव" value="${sfData ? sfData.label : ''}" style="flex:2; padding:6px; border:1px solid #bbb; border-radius:4px;">
            <select class="sf-type" style="flex:1; padding:6px; border:1px solid #bbb; border-radius:4px;">
                <option value="number" ${(sfData && sfData.type === 'number') ? 'selected' : ''}>Number</option>
                <option value="text" ${(sfData && sfData.type === 'text') ? 'selected' : ''}>Text</option>
            </select>
        </div>
        <div style="margin-left: 25px; margin-top: 3px;">
            <label style="font-size:12px;"><input type="checkbox" class="sf-req" ${isReqChecked}> आवश्यक आहे (*)</label>
        </div>
    `;
    subList.appendChild(sDiv);
}

function addSubField(parentDiv) { addSubFieldToUI(parentDiv); }

async function saveFullForm() {
    let fId = document.getElementById('editFormID').value;
    let fName = document.getElementById('newFormName').value;
    let baseType = document.getElementById('newFormType').value;
    let layout = document.getElementById('newFormLayout').value;
    let isActive = document.getElementById('formIsActive').checked;
    
    let isAllRoles = document.getElementById('roleAll').checked;
    let allowedRoles = "ALL";
    if (!isAllRoles) {
        let checkedRoles = [];
        document.querySelectorAll('.form-role').forEach(cb => { if(cb.checked) checkedRoles.push(cb.value); });
        if(checkedRoles.length > 0) allowedRoles = checkedRoles.join(',');
    }

    let finalType = baseType;
    if(baseType === 'ProgressiveStats' && layout === 'Vertical') finalType = 'ProgressiveStats_Vertical';

    if(!fName) { alert("फॉर्मचे नाव आवश्यक आहे!"); return; }

    let structure = [];
    document.querySelectorAll('.field-builder').forEach(fDiv => {
        let l = fDiv.querySelector('.f-label').value;
        let t = fDiv.querySelector('.f-type').value;
        let r = fDiv.querySelector('.f-req').checked;
        if(l) {
            let fieldObj = { label: l, type: t, isRequired: r };
            if(t === 'group') {
                fieldObj.subFields = [];
                fDiv.querySelectorAll('.sub-fields > div').forEach(sDiv => {
                    let sl = sDiv.querySelector('.sf-label').value;
                    let st = sDiv.querySelector('.sf-type').value;
                    let sr = sDiv.querySelector('.sf-req').checked;
                    if(sl) fieldObj.subFields.push({ label: sl, type: st, isRequired: sr });
                });
            }
            structure.push(fieldObj);
        }
    });

    if(structure.length === 0) { alert("कमीत कमी १ प्रश्न आवश्यक आहे!"); return; }

    // ⚠️ IMPORTANT: If your columns in Supabase are all lowercase (e.g., 'formid'), 
    // you MUST change 'FormID' to 'formid' here.
    let formPayload = {
        FormID: fId ? fId : "F_" + Date.now(),
        FormName: fName,
        FormType: finalType,
        AllowedRoles: allowedRoles,
        StructureJSON: JSON.stringify(structure),
        IsActive: isActive
    };

    document.getElementById('mainActionBtn').innerText = "सेव्ह करत आहे...";
    document.getElementById('mainActionBtn').disabled = true;

    try {
        const { error } = await supabase.from('forms').upsert([formPayload]); // Create or Update

        if (error) {
            console.error("SUPABASE ERROR DETAILS:", error); // 🟢 This will show the exact reason it failed in the console
            throw error;
        }

        alert("✅ फॉर्म यशस्वीरित्या सेव्ह झाला!");
        document.getElementById('formBuilder').classList.add('hidden');
        document.getElementById('mainActionBtn').disabled = false;
        
        await fetchData(); // नवीन फॉर्म लिस्ट रिफ्रेश करा
        if(user.role === 'Admin' || user.role === 'MANAGER' || user.role === 'VIEWER') renderExistingFormsList();
    } catch (error) {
        console.error("Form Save Error:", error);
        alert("एरर: फॉर्म सेव्ह होऊ शकला नाही. (Console तपासा)");
        document.getElementById('mainActionBtn').innerText = "फॉर्म सेव्ह करा";
        document.getElementById('mainActionBtn').disabled = false;
    }
}
