window.onload = async function() {
    const userDataString = localStorage.getItem('loggedInUser');
    if (!userDataString) { window.location.href = "index.html"; return; }
    const sessionUser = JSON.parse(userDataString);

    let roleStr = String(sessionUser.role || '').toLowerCase().trim();
    user.role = roleStr;
    user.mobile = sessionUser.mobile_number || '';
    user.phc_id = sessionUser.phc_id || null;
    user.id = sessionUser.id;

    let subtitle = document.getElementById('roleSubtitle');

    if (roleStr === 'admin' || roleStr === 'taluka_admin') {
        subtitle.innerHTML = "👨‍💼 तालुका ॲडमिन (संपूर्ण तालुक्याचा डेटा)";
    } else if (roleStr === 'phc_admin') {
        subtitle.innerHTML = "🏥 PHC ॲडमिन (फक्त तुमच्या PHC चा डेटा)";
    } else {
        subtitle.innerHTML = "🧑‍⚕️ कर्मचारी (फक्त तुम्ही भरलेला स्वतःचा डेटा)";
        document.getElementById('subcenterFilterDiv').classList.add('hidden');
        document.getElementById('groupFilterDiv').classList.add('hidden');
        document.getElementById('pendingReportBtn').classList.add('hidden');
        document.getElementById('pendingFilterDiv').classList.add('hidden');
        document.getElementById('mainTitle').innerHTML = "📊 माझे अहवाल केंद्र (My Reports)";
    }

    const mIdx = new Date().getMonth() + 1;
    document.getElementById('reportMonth').value = monthNamesNumeric[mIdx];
    document.getElementById('reportYear').value = new Date().getFullYear();

    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0');
    let yyyy = today.getFullYear();
    let todayFormatted = yyyy + '-' + mm + '-' + dd;
    document.getElementById('startDate').value = todayFormatted;
    document.getElementById('endDate').value = todayFormatted;

    let dSelect = document.getElementById('reportDaily');
    if(dSelect) {
        let dHtml = '';
        for(let i=1; i<=31; i++) dHtml += `<option value="${i}">${i} तारीख</option>`;
        dSelect.innerHTML = dHtml;
    }

    // Call the initialized API wrapper functions
    await loadInitialMasterData();
};

document.addEventListener('click', function(event) {
    let container = document.getElementById('multiSelectContainer');
    if (container && !container.contains(event.target)) {
        let dropdown = document.getElementById('multiSelectDropdown');
        if (dropdown && !dropdown.classList.contains('hidden')) {
            dropdown.classList.add('hidden');
        }
    }
});