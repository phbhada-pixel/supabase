const SUPABASE_URL = 'https://qbmjsfiievcautxybaai.supabase.co';
const SUPABASE_KEY = 'sb_publishable_sdgZ9G8ko4H_3Mh9RouYFg_JOQ-4Mdx'; 
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let masterData = { forms: [], villages: [], employees: [], filledStats: [], subCenters: [], phcs: [] };
let currentReports = [];
let user = { role: 'User', subcenter: 'सर्व', mobile: '', phc_id: null, id: null };
let windowDbData = [];
let currentEditResponseId = null;
let currentEditFormId = null;

const monthNamesMarathi = {
    "जानेवारी": 1, "फेब्रुवारी": 2, "मार्च": 3, "एप्रिल": 4, "मे": 5, "जून": 6,
    "जुलै": 7, "ऑगस्ट": 8, "सप्टेंबर": 9, "ऑक्टोबर": 10, "नोव्हेंबर": 11, "डिसेंबर": 12
};
const monthNamesNumeric = {
    1: "जानेवारी", 2: "फेब्रुवारी", 3: "मार्च", 4: "एप्रिल", 5: "मे", 6: "जून",
    7: "जुलै", 8: "ऑगस्ट", 9: "सप्टेंबर", 10: "ऑक्टोबर", 11: "नोव्हेंबर", 12: "डिसेंबर"
};