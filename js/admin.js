// 🟢 JS/ADMIN.JS - Supabase, New UI & Advanced Features Logic

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

// 🟢 1. मुख्य प्रश्न डिझाईन (Main Field Builder with Advanced Options)
function addFieldToUI(fieldData = null) {
    const list = document.getElementById('fieldsList');
    const fDiv = document.createElement('div');
    fDiv.className = "field-builder";
    let isReqChecked = (fieldData && fieldData.isRequired) ? "checked" : "";
    
    // Auto-generate unique field ID for formulas if not present
    let fid = fieldData && fieldData.fid ? fieldData.fid : 'f_' + Math.floor(Math.random() * 100000);

    fDiv.innerHTML = `
        <div class="field-builder-row">
            <button type="button" tabindex="-1" onclick="this.parentElement.parentElement.remove()" style="color:white; background:#dc3545; border:none; padding:10px 15px; border-radius:4px; font-weight:bold; cursor:pointer; width:auto; margin:0; flex-shrink:0;">✖ काढून टाका</button>
            
            <input type="text" class="f-label" placeholder="येथे प्रश्नाचे नाव टाका" value="${fieldData ? fieldData.label : ''}" style="flex:2; min-width:200px; padding:10px; border-radius:4px;">
            
            <select class="f-type" style="flex:1; min-width:150px; padding:10px; border-radius:4px; background:#fff;">
                <option value="number" ${(fieldData && fieldData.type === 'number') ? 'selected' : ''}>Number (फक्त आकडे)</option>
                <option value="text" ${(fieldData && fieldData.type === 'text') ? 'selected' : ''}>Text (अक्षरे)</option>
                <option value="dropdown" ${(fieldData && fieldData.type === 'dropdown') ? 'selected' : ''}>Dropdown (उदा. Yes, No)</option>
                <option value="mobile" ${(fieldData && fieldData.type === 'mobile') ? 'selected' : ''}>Mobile No (मोबाईल)</option>
                <option value="date" ${(fieldData && fieldData.type === 'date') ? 'selected' : ''}>Date (तारीख)</option>
                <option value="sum" ${(fieldData && fieldData.type === 'sum') ? 'selected' : ''}>Formula (ऑटो कॅल्क्युलेशन)</option>
                <option value="group" ${(fieldData && fieldData.type === 'group') ? 'selected' : ''}>Group (सब-प्रश्न जोडा)</option>
            </select>

            <label style="display:flex; align-items:center; font-size:14px; font-weight:bold; cursor:pointer; margin:0; flex-shrink:0; background:#e8f5e9; padding:10px; border-radius:4px; border:1px solid #28a745; color:#155724;">
                <input type="checkbox" class="f-req" ${isReqChecked} style="width:18px; height:18px;"> आवश्यक (*)
            </label>
        </div>

        <div style="background:#f4f7f6; padding:10px 15px; margin-top:10px; border-radius:6px; border:1px dashed #aaa;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="font-weight:bold; color:#0056b3; font-size:14px;">⚙️ प्रगत सेटिंग्ज (Advanced Settings)</span>
                <span style="background:#ffeb3b; padding:3px 8px; border-radius:4px; font-size:13px; font-weight:bold; border:1px solid #000; color:#000;">ID: <span class="f-fid-display">${fid}</span></span>
                <input type="hidden" class="f-fid" value="${fid}">
            </div>
            <div class="field-builder-row" style="gap:10px;">
                <div style="flex:1; min-width:130px;">
                    <label style="font-size:12px; color:#555; font-weight:bold;">पर्याय / फॉर्म्युला (Options/Formula):</label>
                    <input type="text" class="f-options" placeholder="Dropdown पर्याय (Yes,No) किंवा फॉर्म्युला (f_1+f_2)" value="${fieldData && fieldData.options ? fieldData.options : ''}" style="padding:6px; font-size:13px;">
                </div>
                <div style="flex:1; min-width:130px;">
                    <label style="font-size:12px; color:#555; font-weight:bold;">डिफॉल्ट व्हॅल्यू (Default):</label>
                    <input type="text" class="f-default" placeholder="उदा. 0 किंवा निरंक" value="${fieldData && fieldData.defaultValue ? fieldData.defaultValue : ''}" style="padding:6px; font-size:13px;">
                </div>
                <div style="flex:1; min-width:130px;">
                    <label style="font-size:12px; color:#555; font-weight:bold;">अट (Dependency):</label>
                    <input type="text" class="f-dependency" placeholder="उदा. f_123>5:'Yes'" value="${fieldData && fieldData.dependency ? fieldData.dependency : ''}" style="padding:6px; font-size:13px;">
                </div>
                <div style="flex:1; min-width:130px;">
                    <label style="font-size:12px; color:#555; font-weight:bold;">मर्यादा (Range):</label>
                    <input type="text" class="f-range" placeholder="उदा. 1-100 किंवा >0" value="${fieldData && fieldData.range ? fieldData.range : ''}" style="padding:6px; font-size:13px;">
                </div>
            </div>
        </div>

        <div class="sub-fields" style="margin-left:30px; border-left:3px solid #17a2b8; padding-left:15px; margin-top:15px;"></div>
        <button type="button" class="add-sub-btn hidden" onclick="addSubField(this.parentElement)" style="margin-left:30px; background:#e0f7fa; border:1px solid #00acc1; color:#00838f; font-weight:bold; padding:8px 15px; border-radius:4px; margin-top:10px; width:auto; cursor:pointer;">➕ नवीन सब-प्रश्न जोडा</button>
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

// 🟢 2. सब-प्रश्न डिझाईन (Sub-Field Builder with Advanced Options)
function addSubFieldToUI(parentDiv, sfData = null) {
    const subList = parentDiv.querySelector('.sub-fields');
    const sDiv = document.createElement('div');
    sDiv.className = "sub-field-builder";
    sDiv.style.marginBottom = "15px";
    let isReqChecked = (sfData && sfData.isRequired) ? "checked" : "";
    
    // Auto-generate ID for sub-field
    let sfid = sfData && sfData.fid ? sfData.fid : 'sf_' + Math.floor(Math.random() * 100000);

    sDiv.innerHTML = `
        <div class="field-builder-row" style="background:#fff; padding:10px; border-radius:6px; border:1px solid #ddd;">
            <button type="button" tabindex="-1" onclick="this.parentElement.parentElement.remove()" style="color:#dc3545; background:none; border:none; font-weight:bold; font-size:18px; cursor:pointer; width:auto; margin:0; padding:0 10px;">✖</button>
            
            <input type="text" class="sf-label" placeholder="सब-प्रश्नाचे नाव" value="${sfData ? sfData.label : ''}" style="flex:2; min-width:180px; padding:8px; border:1px solid #bbb; border-radius:4px;">
            
            <select class="sf-type" style="flex:1; min-width:120px; padding:8px; border:1px solid #bbb; border-radius:4px;">
                <option value="number" ${(sfData && sfData.type === 'number') ? 'selected' : ''}>Number (आकडे)</option>
                <option value="text" ${(sfData && sfData.type === 'text') ? 'selected' : ''}>Text (अक्षरे)</option>
                <option value="dropdown" ${(sfData && sfData.type === 'dropdown') ? 'selected' : ''}>Dropdown</option>
                <option value="mobile" ${(sfData && sfData.type === 'mobile') ? 'selected' : ''}>Mobile No</option>
                <option value="date" ${(sfData && sfData.type === 'date') ? 'selected' : ''}>Date</option>
                <option value="sum" ${(sfData && sfData.type === 'sum') ? 'selected' : ''}>Formula</option>
            </select>

            <label style="display:flex; align-items:center; font-size:13px; font-weight:bold; cursor:pointer; margin:0;">
                <input type="checkbox" class="sf-req" ${isReqChecked} style="width:16px; height:16px;"> आवश्यक (*)
            </label>
        </div>

        <div style="background:#fafafa; padding:8px 10px; border-radius:0 0 6px 6px; border:1px solid #eee; border-top:none;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                <span style="font-size:11px; color:#777; font-weight:bold;">Sub-field Settings | ID: <span style="color:#000;">${sfid}</span></span>
                <input type="hidden" class="sf-fid" value="${sfid}">
            </div>
            <div class="field-builder-row" style="gap:5px;">
                <input type="text" class="sf-options" placeholder="पर्याय / फॉर्म्युला" value="${sfData && sfData.options ? sfData.options : ''}" style="flex:1; padding:5px; font-size:12px; border:1px solid #ddd; min-width:100px;">
                <input type="text" class="sf-default" placeholder="Default Value" value="${sfData && sfData.defaultValue ? sfData.defaultValue : ''}" style="flex:1; padding:5px; font-size:12px; border:1px solid #ddd; min-width:100px;">
                <input type="text" class="sf-dependency" placeholder="Condition" value="${sfData && sfData.dependency ? sfData.dependency : ''}" style="flex:1; padding:5px; font-size:12px; border:1px solid #ddd; min-width:100px;">
                <input type="text" class="sf-range" placeholder="Range (>0)" value="${sfData && sfData.range ? sfData.range : ''}" style="flex:1; padding:5px; font-size:12px; border:1px solid #ddd; min-width:100px;">
            </div>
        </div>
    `;
    subList.appendChild(sDiv);
}

function addSubField(parentDiv) { addSubFieldToUI(parentDiv); }

// 🟢 3. Data Extraction and Saving (Updated to capture all new advanced fields)
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
        let l = fDiv.querySelector('.f-label').value.trim();
        let t = fDiv.querySelector('.f-type').value;
        let r = fDiv.querySelector('.f-req').checked;
        
        let fid = fDiv.querySelector('.f-fid').value;
        let opts = fDiv.querySelector('.f-options').value.trim();
        let def = fDiv.querySelector('.f-default').value.trim();
        let dep = fDiv.querySelector('.f-dependency').value.trim();
        let rng = fDiv.querySelector('.f-range').value.trim();

        if(l) {
            let fieldObj = { label: l, type: t, isRequired: r, fid: fid };
            if (opts) fieldObj.options = opts;
            if (def) fieldObj.defaultValue = def;
            if (dep) fieldObj.dependency = dep;
            if (rng) fieldObj.range = rng;

            if(t === 'group') {
                fieldObj.subFields = [];
                fDiv.querySelectorAll('.sub-fields > .sub-field-builder').forEach(sDiv => {
                    let sl = sDiv.querySelector('.sf-label').value.trim();
                    let st = sDiv.querySelector('.sf-type').value;
                    let sr = sDiv.querySelector('.sf-req').checked;
                    
                    let sfid = sDiv.querySelector('.sf-fid').value;
                    let sopts = sDiv.querySelector('.sf-options').value.trim();
                    let sdef = sDiv.querySelector('.sf-default').value.trim();
                    let sdep = sDiv.querySelector('.sf-dependency').value.trim();
                    let srng = sDiv.querySelector('.sf-range').value.trim();

                    if(sl) {
                        let subFieldObj = { label: sl, type: st, isRequired: sr, fid: sfid };
                        if (sopts) subFieldObj.options = sopts;
                        if (sdef) subFieldObj.defaultValue = sdef;
                        if (sdep) subFieldObj.dependency = sdep;
                        if (srng) subFieldObj.range = srng;
                        
                        fieldObj.subFields.push(subFieldObj);
                    }
                });
            }
            structure.push(fieldObj);
        }
    });

    if(structure.length === 0) { alert("कमीत कमी १ प्रश्न आवश्यक आहे!"); return; }

    let finalFId = fId ? fId : "F_" + Date.now();
    let finalStructureJson = JSON.stringify(structure);

    // 🟢 1. Lowercase Format (Supabase मधील सर्वसाधारण फॉरमॅट)
    let payloadLower = {
        formid: finalFId,
        formname: fName,
        formtype: finalType,
        allowedroles: allowedRoles,
        structurejson: finalStructureJson,
        isactive: isActive
    };

    // 🟢 2. Uppercase Format (तुमच्या जुन्या सिस्टिमप्रमाणे)
    let payloadUpper = {
        FormID: finalFId,
        FormName: fName,
        FormType: finalType,
        AllowedRoles: allowedRoles,
        StructureJSON: finalStructureJson,
        IsActive: isActive
    };

    document.getElementById('mainActionBtn').innerText = "सेव्ह करत आहे...";
    document.getElementById('mainActionBtn').disabled = true;

    try {
        // प्रथम 'Lowercase' वापरून सेव्ह करण्याचा प्रयत्न करू
        let { error } = await supabase.from('forms').upsert([payloadLower]); 

        if (error) {
            // जर कॉलम सापडत नसेल (Could not find column), तर 'Uppercase' वापरून बघू
            if (error.message && error.message.includes("Could not find")) {
                const retry = await supabase.from('forms').upsert([payloadUpper]);
                if (retry.error) throw retry.error;
            } else {
                throw error; // दुसरा कोणताही एरर असल्यास तो पकडा
            }
        }

        alert("✅ फॉर्म यशस्वीरित्या सेव्ह झाला!");
        document.getElementById('formBuilder').classList.add('hidden');
        document.getElementById('mainActionBtn').disabled = false;
        
        await fetchData(); // नवीन फॉर्म लिस्ट रिफ्रेश करा
        if(user.role === 'Admin' || user.role === 'MANAGER' || user.role === 'VIEWER') renderExistingFormsList();
        
    } catch (error) {
        console.error("Form Save Error:", error);
        
        // 🟢 नेमका काय एरर आलाय तो मोबाईलवर अलर्ट द्वारे दाखवा
        let errorMsg = error.message || JSON.stringify(error);
        alert("⚠️ फॉर्म सेव्ह होऊ शकला नाही. Supabase एरर:\n\n" + errorMsg + "\n\n(जर 'row-level security policy' असा एरर असेल, तर Supabase मध्ये 'forms' टेबलसाठी Insert Policy चालू करा.)");
        
        document.getElementById('mainActionBtn').innerText = "फॉर्म सेव्ह करा";
        document.getElementById('mainActionBtn').disabled = false;
    }
}

