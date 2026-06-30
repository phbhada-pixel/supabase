function isEditingAllowed(reportMonth, reportYear) {
    if (!reportMonth || !reportYear) return false;
    let today = new Date();
    let lockDate = new Date(reportYear, reportMonth, 10, 23, 59, 59); 
    return today <= lockDate;
}

function formatDateToDDMMYYYY(dateString) {
    if (dateString === null || dateString === undefined || dateString === "") return "";
    let val = String(dateString).trim();
    let numVal = Number(val);
    if (!isNaN(numVal) && numVal > 30000 && numVal < 60000) {
        let jsDate = new Date(Math.round((numVal - 25569) * 86400 * 1000));
        if (!isNaN(jsDate.getTime())) {
            return `${String(jsDate.getUTCDate()).padStart(2, '0')}-${String(jsDate.getUTCMonth() + 1).padStart(2, '0')}-${jsDate.getUTCFullYear()}`;
        }
    }
    try {
        let dStr = val.split('T')[0];
        let parts = dStr.split(/[-/]/); 
        if(parts.length === 3) {
            if (parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
            else if (parts[2].length === 4) return `${parts[0]}-${parts[1]}-${parts[2]}`; 
        }
        let dt = new Date(val);
        if (!isNaN(dt.getTime())) return `${String(dt.getDate()).padStart(2, '0')}-${String(dt.getMonth() + 1).padStart(2, '0')}-${dt.getFullYear()}`;
    } catch(e) {}
    return val;
}

function getFieldHierarchyChain(fields, fieldObj) {
    let chain = []; let current = fieldObj;
    while (current && current.parent_id) {
        let parent = fields.find(f => f.id === current.parent_id);
        if (parent) { if (parent.type === 'group_header') chain.unshift(parent.label); current = parent; } 
        else { break; }
    }
    return chain; 
}

function getProgressiveMonthsList(targetMonthNumeric, targetYear) {
    let startYear = parseInt(targetYear); let targetMonth = parseInt(targetMonthNumeric); let periods = [];
    if (targetMonth >= 4) { for (let m = 4; m <= targetMonth; m++) periods.push({ month: m, year: startYear }); } 
    else {
        for (let m = 4; m <= 12; m++) periods.push({ month: m, year: startYear - 1 });
        for (let m = 1; m <= targetMonth; m++) periods.push({ month: m, year: startYear });
    }
    return periods;
}

function formatNumberDecimals(val) {
    if (val === "" || val === null || val === undefined || val === "-" || String(val).trim() === "") return val;
    if (typeof val === 'string' && val.match(/^\d{2}-\d{2}-\d{4}$/)) return val;

    let n = Number(val);
    if (!isNaN(n)) { return Number.isInteger(n) ? n : parseFloat(n.toFixed(2)); }
    return val;
}

function calculateSmartTotals(rows, fields, isProg) {
    let sums = { M: {}, P: {} };
    let results = {};

    fields.forEach(f => {
        let sumM = 0, sumP = 0, isNum = false;
        rows.forEach(r => {
            let cv = r.values[f.id];
            if(typeof cv === 'object' && cv !== null) {
                sumM += parseFloat(cv.M || 0); sumP += parseFloat(cv.P || 0); isNum = true;
            } else {
                let n = parseFloat(cv);
                if(!isNaN(n)) { sumM += n; isNum = true; }
            }
        });
        sums.M[f.id] = sumM; sums.P[f.id] = sumP;
        results[f.id] = { M: sumM, P: sumP, isNum: isNum };
    });

    fields.forEach(f => {
        if(f.formula && String(f.formula).trim() !== "") {
            let evalFormulaForTotals = (type) => {
                let formulaStr = String(f.formula).toLowerCase().trim();
                fields.forEach(af => {
                    let ph = `[${af.id.toLowerCase()}]`;
                    if(formulaStr.includes(ph)) { formulaStr = formulaStr.replaceAll(ph, sums[type][af.id] || 0); }
                });
                try {
                    if (/^[0-9.+\-*/() ]+$/.test(formulaStr)) {
                        let res = eval(formulaStr); return isNaN(res) || !isFinite(res) ? 0 : res;
                    }
                } catch(e) {}
                return 0;
            };

            let finalM = evalFormulaForTotals('M'); 
            let finalP = isProg ? evalFormulaForTotals('P') : 0;
            sums.M[f.id] = finalM; sums.P[f.id] = finalP;
            results[f.id] = { M: finalM, P: finalP, isNum: true };
        }
    });
    return results;
}