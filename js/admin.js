function toggleRoles(checkbox) {
    document.getElementById('specificRoles').style.display = checkbox.checked ? 'none' : 'block';
    if(checkbox.checked) { document.querySelectorAll('.form-role').forEach(cb => cb.checked = false); }
}

function getSelectedRoles() {
    if(document.getElementById('roleAll').checked) return "ALL";
    let roles = []; document.querySelectorAll('.form-role:checked').forEach(cb => roles.push(cb.value));
    return roles.length > 0 ? roles.join(',') : "ALL";
}

function openNewFormBuilder() {
    document.getElementById('existingFormsArea').classList.add('hidden');
    document.getElementById('formBuilder').classList.remove('hidden');
    document.getElementById('builderTitle').innerText = "नवीन फॉर्म तयार करा";
    document.getElementById('editFormID').value = ""; document.getElementById('newFormName').value = "";
    document.getElementById('formIsActive').checked = true; document.getElementById('newFormType').value = "List";
    document.getElementById('layoutDiv').style.display = "none";
    document.getElementById('roleAll').checked = true; toggleRoles(document.getElementById('roleAll'));
    document.getElementById('fieldsList').innerHTML = ""; globalFieldCounter = 1; 
    document.getElementById('mainActionBtn').innerText = "फॉर्म सेव्ह करा"; document.getElementById('mainActionBtn').onclick = saveFullForm;
}

function renderFormsListForEdit() {
    const listDiv = document.getElementById('formsEditList'); listDiv.innerHTML = "";
    masterData.forms.forEach(f => {
        let isInactive = isFormInactive(f);
        let nameDisplay = f.FormName + (isInactive ? ' <span style="color:red; font-size:14px;">(Inactive)</span>' : '');
        listDiv.innerHTML += `<div class="edit-row" style="background:white; padding:10px; margin-bottom:5px; border-radius:5px; border:1px solid #ddd; display:flex; justify-content:space-between; align-items:center;">
        <span><b>${nameDisplay}</b></span><button class="btn-edit-tab" style="padding:6px 15px; width:auto; border-radius:4px;" onclick="startEditing('${f.FormID}')">Edit</button></div>`;
    });
}

function startEditing(fId) {
    const f = masterData.forms.find(x => x.FormID === fId); if(!f) return;
    document.getElementById('existingFormsArea').classList.add('hidden');
    document.getElementById('formBuilder').classList.remove('hidden');
    document.getElementById('builderTitle').innerText = "फॉर्म एडिट: " + f.FormName;
    document.getElementById('editFormID').value = f.FormID;

    let typeParts = String(f.FormType).trim().split('_'); document.getElementById('newFormType').value = typeParts[0];
    if(typeParts[1]) { document.getElementById('newFormLayout').value = typeParts[1]; document.getElementById('layoutDiv').style.display = "block"; } 
    else { document.getElementById('layoutDiv').style.display = "none"; }

    document.getElementById('newFormName').value = f.FormName; document.getElementById('formIsActive').checked = !isFormInactive(f);

    let roles = f.AllowedRoles ? f.AllowedRoles.split(',').map(r=>String(r).trim().toUpperCase()) : ["ALL"];
    if(roles.includes("ALL")) { document.getElementById('roleAll').checked = true; toggleRoles(document.getElementById('roleAll')); } 
    else { document.getElementById('roleAll').checked = false; toggleRoles(document.getElementById('roleAll')); document.querySelectorAll('.form-role').forEach(cb => { cb.checked = roles.includes(cb.value.toUpperCase()); }); }

    document.getElementById('fieldsList').innerHTML = "";
    let maxFid = 0;
    JSON.parse(f.StructureJSON).forEach(field => {
        if(field.fid) { let num = parseInt(field.fid.replace('f_','')); if(num > maxFid) maxFid = num; }
        if(field.subFields) field.subFields.forEach(sf => {
            if(sf.fid) { let num = parseInt(sf.fid.replace('f_','')); if(num > maxFid) maxFid = num; }
            if(sf.subFields) sf.subFields.forEach(ssf => { if(ssf.fid) { let num = parseInt(ssf.fid.replace('f_','')); if(num > maxFid) maxFid = num; } });
        });
    });
    globalFieldCounter = maxFid + 1;

    document.getElementById('mainActionBtn').innerText = "बदल अपडेट करा (Update)"; document.getElementById('mainActionBtn').onclick = updateExistingForm;
    JSON.parse(f.StructureJSON).forEach(field => addField(field));
}

function generateFid() { return "f_" + (globalFieldCounter++); }

function addField(data = null) {
    const id = Math.floor(Math.random() * 1000000); const fid = data && data.fid ? data.fid : generateFid(); 
    const html = `
    <div class="field-card" id="f_${id}"><span class="fid-badge">ID: ${fid}</span><input type="hidden" class="hidden-fid" value="${fid}">
    <button type="button" class="btn-remove" onclick="this.parentElement.remove()">X</button>
    <div style="display:flex; flex-direction:column; gap:5px; margin-top: 5px;"><label style="font-size:14px; color:#555; font-weight:bold;">मुख्य प्रश्नाचे नाव:</label><input type="text" placeholder="उदा. ब्लिचिंग पावडर" class="fname" style="width:100%; margin-top:0;" value="${data ? data.label : ''}"></div>
    <select class="ftype" onchange="toggleFieldOptions('${id}', this.value)" style="margin-top:10px; background:#f0f8ff;"><option value="text" ${data && data.type==='text'?'selected':''}>Text (साधा मजकूर)</option><option value="number" ${data && data.type==='number'?'selected':''}>Number (आकडे)</option><option value="mobile" ${data && data.type==='mobile'?'selected':''}>Mobile No. (मोबाईल नंबर)</option><option value="date" ${data && data.type==='date'?'selected':''}>Date (तारीख)</option><option value="dropdown" ${data && data.type==='dropdown'?'selected':''}>Dropdown (पर्याय)</option><option value="group" ${data && data.type==='group'?'selected':''}>Group / गट (उप-प्रश्न)</option><option value="sum" ${data && data.type==='sum'?'selected':''}>Calculation / सूत्र (+ - * /)</option></select>
    <div id="opts_${id}" style="display:${data && (data.type==='dropdown' || data.type==='sum') ? 'block' : 'none'}; margin-top:10px; background:#ffe4b5; padding:10px; border-radius:5px;"><label style="font-size:12px; font-weight:bold; color:#d35400;">${data && data.type==='sum' ? 'सूत्र लिहा (उदा. f_1 + f_2 * f_3):' : 'येथे पर्याय लिहा (स्वल्पविरामाने , वेगळे करा):'}</label><input type="text" placeholder="${data && data.type==='sum' ? 'f_1 + f_2 / 2' : 'उदा. होय, नाही'}" class="foptions" value="${data ? (data.options || '') : ''}"></div>
    <div id="def_${id}" style="margin-top:10px; background:#f5eef8; padding:10px; border-radius:5px; border-left: 3px solid #8e44ad;"><label style="font-size:12px; font-weight:bold; color:#8e44ad;">📌 डिफॉल्ट व्हॅल्यू (Default Value - Optional):</label><input type="text" placeholder="उदा. 0 किंवा लागू नाही" class="fdefault" style="width: 100%; margin-top: 5px; font-size:12px;" value="${data && data.defaultValue !== undefined ? data.defaultValue : ''}"></div>
    <div id="rng_${id}" style="display:${data && data.type==='number' ? 'block' : 'none'}; margin-top:10px; background:#e8f5e9; padding:10px; border-radius:5px; border-left: 3px solid #2e7d32;"><label style="font-size:12px; font-weight:bold; color:#2e7d32;">🔢 संख्या मर्यादा / Range (Optional):<br><span style="font-weight:normal; font-size:11px;">उदा. जर वय 15 ते 45 च्या दरम्यान हवे असेल तर खाली 15-45 लिहा.</span></label><input type="text" placeholder="उदा. 15-45" class="frange" style="width: 100%; margin-top: 5px; font-size:12px;" value="${data ? (data.range || '') : ''}"></div>
    <div id="dep_${id}" style="display:${data && (data.type==='dropdown' || data.type==='number' || data.type==='text' || data.type==='mobile') ? 'block' : 'none'}; margin-top:10px; background:#e0f7fa; padding:10px; border-radius:5px; border-left: 3px solid #00acc1;"><label style="font-size:12px; font-weight:bold; color:#00838f;">🔗 अटी (Conditional Logic):<br><span style="font-weight:normal; font-size:11px;">उदा. जर f_1 मधील व्हॅल्यू ५० पेक्षा मोठी असेल तर "High" सेट करा: <b>f_1 > 50 : High [red] | f_1 <= 50 : Low [green]</b></span></label><input type="text" placeholder="उदा. f_1 > 50 : High [red]" class="fdepend" style="width: 100%; margin-top: 5px; font-size:12px;" value="${data ? (data.dependency || '') : ''}"></div>
    <div style="margin-top:8px;"><input type="checkbox" class="freq" ${data ? (data.isRequired !== false ? 'checked' : '') : 'checked'}> <label style="font-size:12px; font-weight:bold; color:#c0392b;">सक्तीचे आहे (Required)</label></div>
    <div id="group_${id}" style="display:${data && data.type==='group' ? 'block' : 'none'}; margin-top:10px; background:#eef; padding:10px; border-radius:5px; border-left: 3px solid var(--primary);"><label style="font-size:13px; font-weight:bold; color:var(--primary);">या गटातील उप-प्रश्न जोडा:</label><div id="subfields_container_${id}"></div><button type="button" onclick="addSubFieldUI('${id}')" style="margin-top:10px; font-size:13px; background:#fff; border:1px solid #ccc; padding:6px; cursor:pointer; width:100%;">+ उप-प्रश्न जोडा</button></div>
    </div>`;
    document.getElementById('fieldsList').insertAdjacentHTML('beforeend', html);
    if(data && data.type === 'group' && data.subFields) { data.subFields.forEach(sf => addSubFieldUI(id, sf)); } else if (data && data.type === 'group') { addSubFieldUI(id); }
}

function addSubFieldUI(parentId, sfData = null) {
    const sfId = Math.floor(Math.random() * 1000000); const fid = sfData && sfData.fid ? sfData.fid : generateFid(); 
    const html = `
    <div class="sub-field-item" id="sf_${sfId}"><span class="fid-badge" style="background:#e67e22 !important;">ID: ${fid}</span><input type="hidden" class="hidden-fid" value="${fid}"><button type="button" class="btn-remove" onclick="this.parentElement.remove()">X</button><input type="text" placeholder="उप-प्रश्नाचे नाव" class="sfname" style="width: 100%; margin-top: 5px;" value="${sfData ? sfData.label : ''}"><select class="sftype" style="width: 100%; margin-top: 5px;" onchange="toggleSubFieldOptions('${sfId}', this.value)"><option value="text" ${sfData && sfData.type==='text'?'selected':''}>Text (मजकूर)</option><option value="number" ${sfData && sfData.type==='number'?'selected':''}>Number (आकडे)</option><option value="mobile" ${sfData && sfData.type==='mobile'?'selected':''}>Mobile No. (मोबाईल नंबर)</option><option value="date" ${sfData && sfData.type==='date'?'selected':''}>Date (तारीख)</option><option value="dropdown" ${sfData && sfData.type==='dropdown'?'selected':''}>Dropdown (पर्याय)</option><option value="sum" ${sfData && sfData.type==='sum'?'selected':''}>Calculation / सूत्र</option><option value="group" ${sfData && sfData.type==='group'?'selected':''}>Group / उप-गट</option></select>
    <div id="sfopts_container_${sfId}" style="display:${sfData && (sfData.type==='dropdown' || sfData.type==='sum') ? 'block' : 'none'}; margin-top: 5px; background:#fff3e0; padding:8px; border-radius:4px;"><label id="sflabel_${sfId}" style="font-size:11px; font-weight:bold; color:#d35400;">${sfData && sfData.type==='sum' ? 'सूत्र (f_1 + f_2):' : 'पर्याय लिहा:'}</label><input type="text" id="sfopts_${sfId}" placeholder="..." class="sfopts" style="width: 100%; margin-top: 2px;" value="${sfData ? (sfData.options || '') : ''}"></div>
    <div id="sfdef_container_${sfId}" style="margin-top: 5px; background:#f5eef8; padding:8px; border-radius:4px; border-left: 2px solid #8e44ad;"><label style="font-size:11px; font-weight:bold; color:#8e44ad;">📌 डिफॉल्ट व्हॅल्यू (Optional):</label><input type="text" placeholder="उदा. 0" class="sfdefault" style="width: 100%; margin-top: 2px; font-size:12px;" value="${sfData && sfData.defaultValue !== undefined ? sfData.defaultValue : ''}"></div>
    <div id="sfrng_container_${sfId}" style="display:${sfData && sfData.type==='number' ? 'block' : 'none'}; margin-top: 5px; background:#e8f5e9; padding:8px; border-radius:4px; border-left: 2px solid #2e7d32;"><label style="font-size:11px; font-weight:bold; color:#2e7d32;">🔢 संख्या मर्यादा (उदा. 15-45):</label><input type="text" placeholder="15-45" class="sfrange" style="width: 100%; margin-top: 2px; font-size:12px;" value="${sfData ? (sfData.range || '') : ''}"></div>
    <div id="sfdep_container_${sfId}" style="display:${sfData && (sfData.type==='dropdown' || sfData.type==='number' || sfData.type==='text' || sfData.type==='mobile') ? 'block' : 'none'}; margin-top: 5px; background:#e0f7fa; padding:8px; border-radius:4px; border-left: 2px solid #00acc1;"><label style="font-size:11px; font-weight:bold; color:#00838f;">🔗 अटी (f_1 > 10 : High [red]):</label><input type="text" placeholder="..." class="sfdepend" style="width: 100%; margin-top: 2px; font-size:12px;" value="${sfData ? (sfData.dependency || '') : ''}"></div>
    <div style="margin-top:8px;"><input type="checkbox" class="freq" ${sfData ? (sfData.isRequired !== false ? 'checked' : '') : 'checked'}> <label style="font-size:12px; font-weight:bold; color:#c0392b;">सक्तीचे आहे (Required)</label></div>
    <div id="ssf_group_${sfId}" style="display:${sfData && sfData.type==='group' ? 'block' : 'none'}; margin-top:10px; background:#e0f7fa; padding:10px; border-radius:5px; border-left: 3px solid #00acc1;"><label style="font-size:12px; font-weight:bold; color:#00838f;">या उप-गटातील प्रश्न जोडा:</label><div id="subsubfields_container_${sfId}"></div><button type="button" onclick="addSubSubFieldUI('${sfId}')" style="margin-top:10px; font-size:12px; background:#fff; border:1px solid #ccc; padding:4px; cursor:pointer; width:100%;">+ उप-गटातील प्रश्न जोडा</button></div>
    </div>`;
    document.getElementById('subfields_container_' + parentId).insertAdjacentHTML('beforeend', html);
    if(sfData && sfData.type === 'group' && sfData.subFields) { sfData.subFields.forEach(ssf => addSubSubFieldUI(sfId, ssf)); } else if (sfData && sfData.type === 'group') { addSubSubFieldUI(sfId); }
}

function addSubSubFieldUI(parentId, ssfData = null) {
    const ssfId = Math.floor(Math.random() * 1000000); const fid = ssfData && ssfData.fid ? ssfData.fid : generateFid(); 
    const html = `
    <div class="sub-sub-field-item" id="ssf_${ssfId}"><span class="fid-badge" style="background:#8e44ad !important; top:2px; left:2px; font-size:11px;">ID: ${fid}</span><input type="hidden" class="hidden-fid" value="${fid}"><button type="button" class="btn-remove" style="padding:2px 6px !important; font-size:10px !important; top:4px !important; right:4px !important;" onclick="this.parentElement.remove()">X</button><input type="text" placeholder="प्रश्नाचे नाव" class="ssfname" style="width: 100%; font-size:13px; padding:6px; margin-top:15px;" value="${ssfData ? ssfData.label : ''}"><select class="ssftype" style="width: 100%; font-size:13px; padding:6px; margin-top: 5px;" onchange="toggleSubSubFieldOptions('${ssfId}', this.value)"><option value="text" ${ssfData && ssfData.type==='text'?'selected':''}>Text</option><option value="number" ${ssfData && ssfData.type==='number'?'selected':''}>Number</option><option value="mobile" ${ssfData && ssfData.type==='mobile'?'selected':''}>Mobile</option><option value="date" ${ssfData && ssfData.type==='date'?'selected':''}>Date</option><option value="dropdown" ${ssfData && ssfData.type==='dropdown'?'selected':''}>Dropdown</option><option value="sum" ${ssfData && ssfData.type==='sum'?'selected':''}>Calculation / सूत्र</option></select>
    <div id="ssfopts_container_${ssfId}" style="display:${ssfData && (ssfData.type==='dropdown' || ssfData.type==='sum') ? 'block' : 'none'}; margin-top: 5px; background:#f3e5f5; padding:6px; border-radius:4px;"><input type="text" id="ssfopts_${ssfId}" placeholder="${ssfData && ssfData.type==='sum' ? 'सूत्र...' : 'पर्याय...'}" class="ssfopts" style="width: 100%; font-size:12px; padding:4px;" value="${ssfData ? (ssfData.options || '') : ''}"></div>
    <div id="ssfdef_container_${ssfId}" style="margin-top: 5px; background:#f5eef8; padding:6px; border-radius:4px; border-left: 2px solid #8e44ad;"><input type="text" placeholder="डिफॉल्ट व्हॅल्यू..." class="ssfdefault" style="width: 100%; font-size:12px; padding:4px;" value="${ssfData && ssfData.defaultValue !== undefined ? ssfData.defaultValue : ''}"></div>
    <div id="ssfrng_container_${ssfId}" style="display:${ssfData && ssfData.type==='number' ? 'block' : 'none'}; margin-top: 5px; background:#e8f5e9; padding:6px; border-radius:4px; border-left: 2px solid #2e7d32;"><input type="text" placeholder="संख्या मर्यादा (उदा. 15-45)" class="ssfrange" style="width: 100%; font-size:12px; padding:4px; margin-top:2px;" value="${ssfData ? (ssfData.range || '') : ''}"></div>
    <div id="ssfdep_container_${ssfId}" style="display:${ssfData && (ssfData.type==='dropdown' || ssfData.type==='number' || ssfData.type==='text' || ssfData.type==='mobile') ? 'block' : 'none'}; margin-top: 5px; background:#e0f7fa; padding:6px; border-radius:4px; border-left: 2px solid #00acc1;"><input type="text" placeholder="अटी (उदा. f_1>10:Ok [green])" class="ssfdepend" style="width: 100%; font-size:12px; padding:4px; margin-top:2px;" value="${ssfData ? (ssfData.dependency || '') : ''}"></div>
    <div style="margin-top:8px;"><input type="checkbox" class="freq" ${ssfData ? (ssfData.isRequired !== false ? 'checked' : '') : 'checked'}> <label style="font-size:12px; font-weight:bold; color:#c0392b;">सक्तीचे (Required)</label></div>
    </div>`;
    document.getElementById('subsubfields_container_' + parentId).insertAdjacentHTML('beforeend', html);
}

function getFieldsData() {
    let fields = [];
    document.querySelectorAll('.field-card').forEach(el => {
        let fieldObj = { fid: el.querySelector('.hidden-fid').value, label: String(el.querySelector('.fname').value).trim(), type: el.querySelector('.ftype').value, options: el.querySelector('.foptions') ? el.querySelector('.foptions').value : "", range: el.querySelector('.frange') ? el.querySelector('.frange').value : "", dependency: el.querySelector('.fdepend') ? el.querySelector('.fdepend').value : "", isRequired: el.querySelector('.freq').checked, defaultValue: el.querySelector('.fdefault') ? el.querySelector('.fdefault').value : "" };
        if (fieldObj.type === 'group') {
            fieldObj.subFields = [];
            el.querySelectorAll('.sub-field-item').forEach(sfEl => {
                let sfObj = { fid: sfEl.querySelector('.hidden-fid').value, label: String(sfEl.querySelector('.sfname').value).trim(), type: sfEl.querySelector('.sftype').value, options: sfEl.querySelector('.sfopts') ? sfEl.querySelector('.sfopts').value : "", range: sfEl.querySelector('.sfrange') ? sfEl.querySelector('.sfrange').value : "", dependency: sfEl.querySelector('.sfdepend') ? sfEl.querySelector('.sfdepend').value : "", isRequired: sfEl.querySelector('.freq').checked, defaultValue: sfEl.querySelector('.sfdefault') ? sfEl.querySelector('.sfdefault').value : "" };
                if(sfObj.type === 'group') {
                    sfObj.subFields = [];
                    sfEl.querySelectorAll('.sub-sub-field-item').forEach(ssfEl => { sfObj.subFields.push({ fid: ssfEl.querySelector('.hidden-fid').value, label: String(ssfEl.querySelector('.ssfname').value).trim(), type: ssfEl.querySelector('.ssftype').value, options: ssfEl.querySelector('.ssfopts') ? ssfEl.querySelector('.ssfopts').value : "", range: ssfEl.querySelector('.ssfrange') ? ssfEl.querySelector('.ssfrange').value : "", dependency: ssfEl.querySelector('.ssfdepend') ? ssfEl.querySelector('.ssfdepend').value : "", isRequired: ssfEl.querySelector('.freq').checked, defaultValue: ssfEl.querySelector('.ssfdefault') ? ssfEl.querySelector('.ssfdefault').value : "" }); });
                }
                fieldObj.subFields.push(sfObj);
            });
        }
        fields.push(fieldObj);
    });
    return fields;
}

async function saveFullForm() {
    const name = document.getElementById('newFormName').value; let type = document.getElementById('newFormType').value; if(type !== 'List') type += "_" + document.getElementById('newFormLayout').value;
    const isActive = document.getElementById('formIsActive').checked; const statusText = isActive ? "Active" : "Inactive"; const allowedRoles = getSelectedRoles();
    if(!name) { alert("फॉर्मचे नाव टाका"); return; } if(allowedRoles === "" && !document.getElementById('roleAll').checked) { alert("कृपया किमान एक Role निवडा."); return; }
    const payload = { name, type, allowedRoles, isActive, status: statusText, fields: getFieldsData(), adminMobile: user.mobile };
    const r = await fetch(GAS_URL, { method: "POST", body: JSON.stringify({action:"createForm", payload}) }); const d = await r.json(); if(d.success) { alert(d.message); location.reload(); }
}

async function updateExistingForm() {
    const formID = document.getElementById('editFormID').value; const name = document.getElementById('newFormName').value; let type = document.getElementById('newFormType').value; if(type !== 'List') type += "_" + document.getElementById('newFormLayout').value;
    const isActive = document.getElementById('formIsActive').checked; const statusText = isActive ? "Active" : "Inactive"; const allowedRoles = getSelectedRoles();
    if(allowedRoles === "" && !document.getElementById('roleAll').checked) { alert("कृपया किमान एक Role निवडा."); return; }
    const payload = { formID, name, type, allowedRoles, isActive, status: statusText, fields: getFieldsData() };
    const r = await fetch(GAS_URL, { method: "POST", body: JSON.stringify({action:"updateForm", payload}) }); const d = await r.json(); if(d.success) { alert(d.message); location.reload(); }
}