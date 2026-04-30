// 🌟 Configuration 🌟
const GAS_URL = "https://script.google.com/macros/s/AKfycby24p9iZjDKp5gGX0zLYvY98Z53pLKAPlWJt7RoZcq_OKGGG-uaXObVGPcVXoXuSVa4/exec";

const CONFIG = {
    hiddenColumns: ["तारीख", "मोबाईल क्र.", "उपकेंद्र", "महिना", "वर्ष", "मूळ डेटा (JSON)", "कर्मचाऱ्याचे नाव"]
};

let masterData = { forms: [], villages: [], filledStats: [], users: [] };
let user = null;
let currentReports = [];
let isSaving = false;
let globalFieldCounter = 1;

// Initialization
window.onload = function() {
    document.getElementById('initialLoader').style.display = 'none'; 
    document.getElementById('mainApp').classList.remove('hidden'); 
    
    const cachedData = localStorage.getItem("phc_master_data");
    if (cachedData) {
        try { masterData = JSON.parse(cachedData); } catch(e){}
    }

    const savedUser = localStorage.getItem("phc_user_session");
    if(savedUser) { 
        user = JSON.parse(savedUser); 
        showAppAfterLogin(); 
        
        document.getElementById('netStatus').innerText = "डेटा अपडेट होत आहे...";
        document.getElementById('netStatus').style.backgroundColor = "#fff3cd";
        document.getElementById('netStatus').style.color = "#856404";
        
        fetchData().then(() => {
            document.getElementById('netStatus').innerText = "Online";
            document.getElementById('netStatus').style.backgroundColor = "#d4edda";
            document.getElementById('netStatus').style.color = "#155724";
        });
    } else {
        document.getElementById('loginBox').classList.remove('hidden');
    }
};

async function fetchData() {
    try {
        const r = await fetch(GAS_URL, { method: "POST", body: JSON.stringify({action:"getInitialData"}) });
        const textResponse = await r.text();
        if(textResponse.trim().startsWith("<")) throw new Error("Google Blocked Request");
        const d = JSON.parse(textResponse);
        if(d.success) {
            masterData = d;
            localStorage.setItem("phc_master_data", JSON.stringify(d)); 
            updateFormDropdowns();
            if(typeof renderFormsListForEdit === "function") renderFormsListForEdit();
        }
    } catch(e) { console.error("Fetch failed", e); }
}

async function handleLogin() {
    const m = document.getElementById('mob').value.trim();
    const p = document.getElementById('pwd').value.trim();
    if(!m || !p) return;
    document.getElementById('netStatus').innerText = "तपासत आहे...";
    try {
        const r = await fetch(GAS_URL, { method: "POST", body: JSON.stringify({action:"login", mobileNo:m, password:p}) });
        const textResponse = await r.text();
        if(textResponse.trim().startsWith("<")) throw new Error("Google Blocked Request");
        const d = JSON.parse(textResponse);
        if(d.success) {
            user = d.user; user.mobile = m;
            localStorage.setItem("phc_user_session", JSON.stringify(user));
            showAppAfterLogin();
        } else { alert(d.message); }
        document.getElementById('netStatus').innerText = "Online";
    } catch(e) { alert("लॉगिन अयशस्वी. कृपया इंटरनेट कनेक्शन तपासा."); document.getElementById('netStatus').innerText = "Offline"; }
}

function showAppAfterLogin() {
    document.getElementById('loginBox').classList.add('hidden');
    document.getElementById('dashboardWrapper').classList.remove('hidden');

    document.getElementById('uName').innerText = user.name + " (" + user.role + ")";
    document.getElementById('uSub').innerText = "उपकेंद्र: " + user.subcenter;

    if(user.role === "Admin") {
        document.getElementById('tabEntry').classList.remove('hidden');
        document.getElementById('tabEdit').classList.remove('hidden');
        document.getElementById('tabAdmin').classList.remove('hidden');
        document.getElementById('adminRoleFilterDiv').style.display = "flex";
        if(typeof renderFormsListForEdit === "function") renderFormsListForEdit();
    } else if (user.role === "VIEWER" || user.role === "MANAGER") {
        document.getElementById('tabEntry').classList.add('hidden');
        document.getElementById('tabEdit').classList.add('hidden');
        document.getElementById('tabAdmin').classList.add('hidden');
        document.getElementById('adminRoleFilterDiv').style.display = "flex"; 
        switchTab('reports');
    } else {
        document.getElementById('tabEntry').classList.remove('hidden');
        document.getElementById('tabEdit').classList.remove('hidden');
        document.getElementById('tabAdmin').classList.add('hidden');
    }

    updateFormDropdowns();
    updateVillageDropdown();
    if(typeof updateEditVillageDropdown === "function") updateEditVillageDropdown();
}

function logoutUser() {
    if(confirm("लॉग आऊट करायचे आहे का?")) { localStorage.removeItem("phc_user_session"); location.reload(); }
}

function switchTab(tab) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('entrySection').classList.add('hidden');
    document.getElementById('editSection').classList.add('hidden');
    document.getElementById('reportsSection').classList.add('hidden');
    document.getElementById('adminSection').classList.add('hidden');

    if(tab === 'entry') {
        document.getElementById('tabEntry').classList.add('active');
        document.getElementById('entrySection').classList.remove('hidden');
        updateFormDropdowns(); 
        updateVillageDropdown();
    } else if(tab === 'edit') {
        document.getElementById('tabEdit').classList.add('active');
        document.getElementById('editSection').classList.remove('hidden');
        if(typeof updateEditVillageDropdown === "function") updateEditVillageDropdown(); 
    } else if(tab === 'reports') {
        document.getElementById('tabReports').classList.add('active');
        document.getElementById('reportsSection').classList.remove('hidden');
    } else if(tab === 'admin') {
        document.getElementById('tabAdmin').classList.add('active');
        document.getElementById('adminSection').classList.remove('hidden');
    }
}

// Common Helper Functions
function isMobile() { return window.innerWidth <= 768; }

function isFormInactive(f) {
    if (f.Status !== undefined && f.Status !== null) {
        let s = String(f.Status).trim().toUpperCase();
        return (s === "INACTIVE" || s === "FALSE");
    }
    if (f.isActive !== undefined && f.isActive !== null) {
        let s = String(f.isActive).trim().toUpperCase();
        return (s === "FALSE" || s === "INACTIVE");
    }
    return false;
}

function isMonthLocked(mStr, yStr) {
    if (user && user.role === "Admin") return false; 
    const months = ["जानेवारी", "फेब्रुवारी", "मार्च", "एप्रिल", "मे", "जून", "जुलै", "ऑगस्ट", "सप्टेंबर", "ऑक्टोबर", "नोव्हेंबर", "डिसेंबर"];
    let mIdx = months.indexOf(mStr);
    if (mIdx === -1) return false;
    let lockDate = new Date(parseInt(yStr), mIdx + 1, 11, 0, 0, 0); 
    return new Date() >= lockDate;
}

function openChangePassword() { document.getElementById('changePasswordBox').classList.remove('hidden'); }
function closeChangePassword() {
    document.getElementById('changePasswordBox').classList.add('hidden');
    document.getElementById('oldPwd').value = "";
    document.getElementById('newPwd').value = "";
    document.getElementById('confirmNewPwd').value = "";
    document.getElementById('pwdMsg').innerText = "";
}

async function submitChangePassword() {
    const oldP = document.getElementById('oldPwd').value.trim();
    const newP = document.getElementById('newPwd').value.trim();
    const confP = document.getElementById('confirmNewPwd').value.trim();
    const msg = document.getElementById('pwdMsg');

    if(!oldP || !newP || !confP) { msg.style.color="red"; msg.innerText="सर्व रकाने भरा!"; return; }
    if(newP !== confP) { msg.style.color="red"; msg.innerText="नवीन पासवर्ड जुळत नाही!"; return; }
    if(newP.length < 4) { msg.style.color="red"; msg.innerText="नवीन पासवर्ड कमीत कमी ४ अक्षरी असावा."; return; }

    const btn = document.getElementById('btnChangePwd');
    btn.disabled = true;
    msg.style.color="orange";
    msg.innerText="पासवर्ड बदलत आहे, कृपया थांबा...";

    try {
        const payload = { mobileNo: user.mobile, oldPassword: oldP, newPassword: newP };
        const r = await fetch(GAS_URL, { method: "POST", body: JSON.stringify({action:"changePassword", payload}) });
        const d = await r.json();
        if(d.success) {
            msg.style.color="green";
            msg.innerText="✅ " + d.message;
            setTimeout(closeChangePassword, 3000);
        } else {
            msg.style.color="red";
            msg.innerText="⚠️ " + d.message;
        }
    } catch(e) {
        msg.style.color="red";
        msg.innerText="इंटरनेट एरर! कृपया पुन्हा प्रयत्न करा.";
    } finally {
        btn.disabled = false;
    }
}

// Global Core Logic Evaluators
function getFieldValueByFid(containerId, fid) {
    let container = document.getElementById(containerId);
    if(!container) return `""`;
    let el = container.querySelector(`[data-fid="${fid}"]`);
    if(el && el.value !== "") {
        let val = String(el.value).trim();
        if(!isNaN(val) && val !== "") return parseFloat(val);
        return `"${val}"`; 
    }
    return `""`; 
}

function evaluateMathFormulas(containerId) {
    let container = document.getElementById(containerId);
    if(!container) return;
    let formulaInputs = container.querySelectorAll('input[data-formula]');
    for(let loop=0; loop<2; loop++) {
        formulaInputs.forEach(input => {
            let rawFormula = input.getAttribute('data-formula');
            if(!rawFormula) return;
            let hasValue = false;
            let evalString = rawFormula.replace(/\bf_\d+\b/g, function(match) {
                let val = getFieldValueByFid(containerId, match);
                if (val !== `""`) hasValue = true;
                return val === `""` ? 0 : val;
            });
            if(hasValue) {
                try {
                    let result = eval(evalString);
                    let finalVal = (result === Infinity || isNaN(result)) ? "" : (Number.isInteger(result) ? result : result.toFixed(2));
                    if (input.value !== String(finalVal)) {
                        input.value = finalVal;
                        input.dispatchEvent(new Event('change'));
                    }
                } catch(e) {}
            } else {
                if (input.value !== "") { input.value = ""; input.dispatchEvent(new Event('change')); }
            }
        });
    }
}

function evaluateConditions(containerId) {
    let container = document.getElementById(containerId);
    if(!container) return;
    let depInputs = container.querySelectorAll('[data-dependency]');
    depInputs.forEach(depInput => {
        let rawCond = depInput.getAttribute('data-dependency');
        if(!rawCond) return;
        let conditions = rawCond.split('|');
        let matchedVal = null;
        let matchedColor = null;

        for(let cond of conditions) {
            let parts = cond.split(':');
            if(parts.length >= 2) {
                let expr = parts[0].trim();
                let resultVal = parts.slice(1).join(':').trim();
                let evalString = expr.replace(/\bf_\d+\b/g, function(match) { return getFieldValueByFid(containerId, match); });
                evalString = evalString.replace(/(?<![<>=!])=(?![=])/g, "==");
                try {
                    if(eval(evalString)) {
                        resultVal = resultVal.replace(/^['"]|['"]$/g, '');
                        let colorMatch = resultVal.match(/\[([a-zA-Z]+)\]/);
                        if (colorMatch) { matchedColor = colorMatch[1]; resultVal = resultVal.replace(colorMatch[0], '').trim(); }
                        matchedVal = resultVal;
                        break;
                    }
                } catch(e) {}
            }
        }

        if(matchedVal !== null) {
            depInput.value = matchedVal;
            depInput.style.pointerEvents = "none";
            depInput.style.backgroundColor = matchedColor || "#e9ecef";
            depInput.style.color = matchedColor ? "white" : "var(--primary)";
            depInput.style.fontWeight = "bold";
            depInput.tabIndex = -1;
        } else {
            if(depInput.style.pointerEvents === "none") {
                depInput.value = "";
                depInput.style.pointerEvents = "auto";
                depInput.style.backgroundColor = "";
                depInput.style.color = "#333";
                depInput.style.fontWeight = "normal";
                depInput.removeAttribute("tabIndex");
            }
        }
    });
}

function evaluateRanges(containerId) {
    let container = document.getElementById(containerId);
    if(!container) return;
    let inputs = container.querySelectorAll('input[data-range]');
    inputs.forEach(input => {
        let r = input.getAttribute('data-range').trim();
        if(!r || input.value === "") { input.style.border = "1px solid #ccc"; input.classList.remove('error-input'); return; }
        let val = parseFloat(input.value);
        if(isNaN(val)) return;

        function parseLimit(str) {
            let s = str.trim();
            if(s.startsWith('f_')) {
                let fVal = getFieldValueByFid(containerId, s);
                return fVal === `""` ? NaN : parseFloat(fVal);
            }
            return parseFloat(s);
        }

        let isError = false;
        if (r.startsWith('<=')) { let max = parseLimit(r.replace('<=', '')); if(!isNaN(max) && val > max) isError = true; } 
        else if (r.startsWith('<')) { let max = parseLimit(r.replace('<', '')); if(!isNaN(max) && val >= max) isError = true; } 
        else if (r.startsWith('>=')) { let min = parseLimit(r.replace('>=', '')); if(!isNaN(min) && val < min) isError = true; } 
        else if (r.startsWith('>')) { let min = parseLimit(r.replace('>', '')); if(!isNaN(min) && val <= min) isError = true; } 
        else if (r.includes('-')) { let parts = r.split('-'); if(parts.length === 2) { let min = parseLimit(parts[0]); let max = parseLimit(parts[1]); if(!isNaN(min) && !isNaN(max) && (val < min || val > max)) isError = true; } }

        if(isError) {
            input.style.border = "2px solid red";
            input.value = ""; 
            input.classList.add('error-input');
            input.setAttribute("placeholder", "अवैध संख्या!");
        } else {
            input.style.border = "1px solid #ccc";
            input.classList.remove('error-input');
            input.removeAttribute("placeholder");
        }
    });
}

function processAllLogic(containerId) {
    evaluateMathFormulas(containerId);
    evaluateConditions(containerId);
    evaluateRanges(containerId); 
}