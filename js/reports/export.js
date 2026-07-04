function downloadConsolidatedExcel() {
    if(currentReports.length === 0) return;
    let groupType = document.getElementById('reportGroupFilter').value;

    if (user.role !== 'admin' && user.role !== 'taluka_admin' && user.role !== 'phc_admin') groupType = 'Village';

    let wb = XLSX.utils.book_new();

    currentReports.forEach((rep) => {
        let columns = rep.fields; let rows = rep.rows;
        let sheetData = []; let merges = []; let titleHeaderRows = []; let masterHeaderRows = []; let subTitleHeaderRows = []; let groupTotalRows = []; let phcTotalRows = [];
        let showPop = rep.showPopConfig === true;

        let totalBaseCols = 2; // Default for Employee Group and Consolidated fallback
        if (groupType === 'SubCenterFlat') {
            totalBaseCols = showPop ? 6 : 4;
            if (rep.formType === 'subcenter') totalBaseCols -= 1; // 🟢 'गाव' कॉलम वगळल्यामुळे एक कॉलम कमी केला
        } else if (groupType === 'SubCenterSum') {
            totalBaseCols = showPop ? 4 : 2;
        } else {
            totalBaseCols = showPop ? 4 : 2;
        }

        if (groupType === "SubCenterConsolidated") {
            let verticalColCount = 2 + (rows.length * (rep.isProg ? 2 : 1)) + (rep.isProg ? 2 : 1);

            let headInfo = getCustomHeader(rep);
            let startIdx = sheetData.length;
            sheetData.push([headInfo.l1]); titleHeaderRows.push(startIdx); merges.push({ s: { r: startIdx, c: 0 }, e: { r: startIdx, c: verticalColCount - 1 } });
            sheetData.push([headInfo.l2]); titleHeaderRows.push(startIdx+1); merges.push({ s: { r: startIdx+1, c: 0 }, e: { r: startIdx+1, c: verticalColCount - 1 } });
            let startR = startIdx + 2;
            if(headInfo.l3 !== "") { 
                sheetData.push([headInfo.l3]); titleHeaderRows.push(startIdx+2); merges.push({ s: { r: startIdx+2, c: 0 }, e: { r: startIdx+2, c: verticalColCount - 1 } }); 
                startR = startIdx + 3;
            }

            let r1 = ["अ.क्र.", "तपशील / मुख्य निर्देशांक प्रश्न"];
            let r2 = rep.isProg ? ["", ""] : null;
            if(rep.isProg) { merges.push({ s: { r: startR, c: 0 }, e: { r: startR+1, c: 0 } }); merges.push({ s: { r: startR, c: 1 }, e: { r: startR+1, c: 1 } }); }

            let ccIdx = 2;
            rows.forEach(r => {
                let extra = showPop ? `\n(लोक.: ${r.population} | घरे: ${r.houses})` : '';
                let vName = r.village ? `${r.village} (${r.subcenter})${extra}` : "-";
                
                // 🟢 एक्सेलमध्ये "संपूर्ण उपकेंद्र" ऐवजी थेट नाव दाखवा
                if (rep.formType === 'subcenter') {
                    vName = `${r.subcenter}${extra}`;
                }

                r1.push(vName); if(rep.isProg) r1.push("");
                if(rep.isProg) { merges.push({ s: { r: startR, c: ccIdx }, e: { r: startR, c: ccIdx + 1 } }); r2.push("मासिक"); r2.push("प्रगत"); ccIdx += 2; } else { ccIdx += 1; }
            });

            if(rep.formType !== 'list') {
                r1.push("एकूण Total"); if(rep.isProg) r1.push("");
                if(rep.isProg) { merges.push({ s: { r: startR, c: ccIdx }, e: { r: startR, c: ccIdx + 1 } }); r2.push("मासिक"); r2.push("प्रगत"); }
            }

            sheetData.push(r1); subTitleHeaderRows.push(startR);
            if(rep.isProg) { sheetData.push(r2); subTitleHeaderRows.push(startR+1); }

            let phcTotals = calculateSmartTotals(rows, columns, rep.isProg);

            columns.forEach((c, vIndex) => {
                let fLabel = ""; if(c.l1) fLabel += c.l1+" - "; if(c.l2) fLabel += c.l2+" - "; fLabel += c.l3;
                let rowData = [vIndex + 1, fLabel];
                rows.forEach(r => {
                    let val = r.values[c.id]; let mObj = (typeof val === 'object' && val !== null) ? val.M : val;
                    rowData.push(mObj !== undefined && mObj !== "" ? (isNaN(Number(mObj)) ? String(mObj) : Number(mObj)) : 0);

                    if(rep.isProg) { 
                        let pObj = (typeof val === 'object' && val !== null) ? val.P : val; 
                        rowData.push(pObj !== undefined && pObj !== "" ? (isNaN(Number(pObj)) ? String(pObj) : Number(pObj)) : 0); 
                    }
                });

                if(rep.formType !== 'list') {
                    let tM = phcTotals[c.id].isNum ? Number(phcTotals[c.id].M) : "-";
                    let tP = phcTotals[c.id].isNum ? Number(phcTotals[c.id].P) : "-";
                    rowData.push(tM); if(rep.isProg) rowData.push(tP);
                }
                sheetData.push(rowData); 
            });

        } else if (groupType === "SubCenterSum" || groupType === "SubCenterFlat") {
            let dataRowsToRender = rows;

            if(groupType === "SubCenterSum") {
                let scGroups = {};
                rows.forEach(r => { if(!scGroups[r.subcenter]) scGroups[r.subcenter] = []; scGroups[r.subcenter].push(r); });
                let subCenterAggregatedRows = [];
                Object.keys(scGroups).sort().forEach(sc => {
                    let scRows = scGroups[sc];
                    let scSmartTotals = calculateSmartTotals(scRows, columns, rep.isProg);

                    let sumPop = 0, sumHouses = 0;
                    scRows.forEach(sr => { sumPop += (parseInt(sr.population) || 0); sumHouses += (parseInt(sr.houses) || 0); });

                    let scNewRow = { subcenter: sc, village: "एकत्रित", employee: "-", population: sumPop, houses: sumHouses, values: {} };

                    columns.forEach((c, idx) => {
                        if (rep.formType === 'list') {
                            if (idx === 0) { scNewRow.values[c.id] = `एकूण नोंदी: ${scRows.length}`; } else { scNewRow.values[c.id] = '-'; }
                        } else {
                            let t = scSmartTotals[c.id];
                            if(rep.isProg && c.type === 'number') { scNewRow.values[c.id] = { M: t.isNum ? t.M : '-', P: t.isNum ? t.P : '-' }; } 
                            else { scNewRow.values[c.id] = t.isNum ? t.M : '-'; }
                        }
                    });
                    subCenterAggregatedRows.push(scNewRow);
                });
                dataRowsToRender = subCenterAggregatedRows;
            } else if (groupType === "SubCenterFlat") {
                dataRowsToRender = rows.sort((a,b) => a.subcenter.localeCompare(b.subcenter) || a.employee.localeCompare(b.employee) || a.village.localeCompare(b.village));
            }

            let totalColumnsCount = totalBaseCols; columns.forEach(c => { totalColumnsCount += (rep.isProg && c.type === 'number') ? 2 : 1; });

            let headInfo = getCustomHeader(rep);
            let startIdx = sheetData.length;
            sheetData.push([headInfo.l1]); titleHeaderRows.push(startIdx); merges.push({ s: { r: startIdx, c: 0 }, e: { r: startIdx, c: totalColumnsCount - 1 } });
            sheetData.push([headInfo.l2]); titleHeaderRows.push(startIdx+1); merges.push({ s: { r: startIdx+1, c: 0 }, e: { r: startIdx+1, c: totalColumnsCount - 1 } });
            let startR = startIdx + 2;
            if(headInfo.l3 !== "") { 
                sheetData.push([headInfo.l3]); titleHeaderRows.push(startIdx+2); merges.push({ s: { r: startIdx+2, c: 0 }, e: { r: startIdx+2, c: totalColumnsCount - 1 } }); 
                startR = startIdx + 3;
            }

            let r1 = ["अ.क्र.", "उपकेंद्र"]; 
            if(groupType === 'SubCenterFlat') {
                if (rep.formType !== 'subcenter') {
                    r1.push("गाव/कार्यक्षेत्र"); // 🟢 'उपकेंद्र' फॉर्म असेल तर हा रकाना टाळला जाईल
                }
                r1.push("कर्मचारी");
            }
            if (showPop) {
                r1.push("लोकसंख्या");
                r1.push("कुटुंब संख्या");
            }

            let r2 = []; let r3 = []; let r4 = rep.isProg ? [] : null;

            for(let x=0; x<totalBaseCols; x++) { r2.push(""); r3.push(""); if(rep.isProg) r4.push(""); }
            let totalHeaderRows = rep.isProg ? 4 : 3;
            for(let x=0; x<totalBaseCols; x++) merges.push({ s: { r: startR, c: x }, e: { r: startR + totalHeaderRows - 1, c: x } });

            let i = 0;
            while(i < columns.length) {
                let c = columns[i]; let j = i + 1;
                if(c.l1 !== "") {
                    while(j < columns.length && columns[j].l1 === c.l1) { j++; }
                    let totalL1Span = 0; for(let k=i; k<j; k++) totalL1Span += (rep.isProg && columns[k].type === 'number') ? 2 : 1;
                    r1.push(c.l1); for(let s=1; s<totalL1Span; s++) r1.push("");
                    merges.push({ s: { r: startR, c: r1.length - totalL1Span }, e: { r: startR, c: r1.length - 1 } });

                    let k = i;
                    while(k < j) {
                        let c2 = columns[k]; let m = k + 1;
                        if(c2.l2 !== "") {
                            while(m < j && columns[m].l2 === c2.l2) { m++; }
                            let totalL2Span = 0; for(let n=k; n<m; n++) totalL2Span += (rep.isProg && columns[n].type === 'number') ? 2 : 1;
                            r2.push(c2.l2); for(let s=1; s<totalL2Span; s++) r2.push("");
                            merges.push({ s: { r: startR+1, c: r2.length - totalL2Span }, e: { r: startR+1, c: r2.length - 1 } });

                            for(let n=k; n<m; n++) {
                                let cn = columns[n]; let w = (rep.isProg && cn.type === 'number') ? 2 : 1;
                                r3.push(cn.l3);
                                if(w === 2) {
                                    r3.push(""); merges.push({ s: { r: startR+2, c: r3.length - 2 }, e: { r: startR+2, c: r3.length - 1 } });
                                    r4.push("मासिक"); r4.push("प्रगत");
                                } else { if(rep.isProg) { merges.push({ s: { r: startR+2, c: r3.length - 1 }, e: { r: startR+3, c: r3.length - 1 } }); r4.push(""); } }
                            }
                            k = m;
                        } else {
                            let mult2 = (rep.isProg && c2.type === 'number') ? 2 : 1;
                            if(mult2 === 2) { 
                                r2.push(c2.l3); r2.push(""); merges.push({ s: { r: startR+1, c: r2.length - 2 }, e: { r: startR+2, c: r2.length - 1 } }); 
                                r3.push(""); r3.push(""); r4.push("मासिक"); r4.push("प्रगत"); 
                            } else { 
                                r2.push(c2.l3); 
                                if(rep.isProg) {
                                    merges.push({ s: { r: startR+1, c: r2.length - 1 }, e: { r: startR+3, c: r2.length - 1 } }); 
                                    r3.push(""); r4.push(""); 
                                } else {
                                    merges.push({ s: { r: startR+1, c: r2.length - 1 }, e: { r: startR+2, c: r2.length - 1 } }); 
                                    r3.push(""); 
                                }
                            }
                            k++;
                        }
                    }
                    i = j;
                } else {
                    let w = (rep.isProg && c.type === 'number') ? 2 : 1;
                    r1.push(c.l3);
                    if(w === 2) {
                        r1.push(""); merges.push({ s: { r: startR, c: r1.length - 2 }, e: { r: startR+2, c: r1.length - 1 } }); 
                        r2.push(""); r2.push(""); r3.push(""); r3.push(""); r4.push("मासिक"); r4.push("प्रगत");
                    } else {
                        let bottomR = rep.isProg ? startR+3 : startR+2;
                        merges.push({ s: { r: startR, c: r1.length - 1 }, e: { r: bottomR, c: r1.length - 1 } });
                        r2.push(""); r3.push(""); if(rep.isProg) r4.push("");
                    }
                    i++;
                }
            }

            sheetData.push(r1); subTitleHeaderRows.push(startR);
            sheetData.push(r2); subTitleHeaderRows.push(startR + 1);
            sheetData.push(r3); subTitleHeaderRows.push(startR + 2);
            if(rep.isProg) { sheetData.push(r4); subTitleHeaderRows.push(startR + 3); }

            dataRowsToRender.forEach((r, rIdx) => {
                let rowData = [rIdx + 1, r.subcenter];
                if(groupType === 'SubCenterFlat') {
                    if (rep.formType !== 'subcenter') {
                        rowData.push(r.village); // 🟢 इथेही गाव वगळले आहे
                    }
                    rowData.push(r.employee);
                }
                if(showPop) {
                    rowData.push(r.population || 0);
                    rowData.push(r.houses || 0);
                }

                columns.forEach(c => {
                    let val = r.values[c.id];
                    if(typeof val === 'object' && val !== null) { 
                        rowData.push(val.M !== '' ? (isNaN(Number(val.M)) ? String(val.M) : Number(val.M)) : 0); 
                        rowData.push(val.P !== '' ? (isNaN(Number(val.P)) ? String(val.P) : Number(val.P)) : 0); 
                    } else { 
                        rowData.push(val !== '' ? (isNaN(Number(val)) ? String(val) : Number(val)) : ''); 
                    }
                });
                sheetData.push(rowData);
            });

            if ((user.role === 'admin' || user.role === 'taluka_admin' || user.role === 'phc_admin') && rep.formType !== 'list') {
                let phcTotals = calculateSmartTotals(dataRowsToRender, columns, rep.isProg);
                let pRow = ["एकूण Total"];
                for(let x=1; x<totalBaseCols; x++) pRow.push("");
                merges.push({ s: { r: sheetData.length, c: 0 }, e: { r: sheetData.length, c: totalBaseCols - 1 } });

                columns.forEach(c => {
                    let pVal = phcTotals[c.id];
                    if(rep.isProg && c.type === 'number') { pRow.push(pVal.isNum ? Number(pVal.M) : '-'); pRow.push(pVal.isNum ? Number(pVal.P) : '-'); }
                    else { pRow.push(pVal.isNum ? Number(pVal.M) : '-'); }
                });
                phcTotalRows.push(sheetData.length);
                sheetData.push(pRow);
            }

        } else {
            let employeeGroups = {};
            rows.forEach(r => { let key = `${r.subcenter}###${r.employee}`; if(!employeeGroups[key]) employeeGroups[key] = []; employeeGroups[key].push(r); });

            let totalColumnsCount = totalBaseCols; columns.forEach(c => { totalColumnsCount += (rep.isProg && c.type === 'number') ? 2 : 1; });

            let headInfo = getCustomHeader(rep);
            let startIdx = sheetData.length;
            sheetData.push([headInfo.l1]); titleHeaderRows.push(startIdx); merges.push({ s: { r: startIdx, c: 0 }, e: { r: startIdx, c: totalColumnsCount - 1 } });
            sheetData.push([headInfo.l2]); titleHeaderRows.push(startIdx+1); merges.push({ s: { r: startIdx+1, c: 0 }, e: { r: startIdx+1, c: totalColumnsCount - 1 } });

            if(headInfo.l3 !== "") { 
                sheetData.push([headInfo.l3]); titleHeaderRows.push(startIdx+2); merges.push({ s: { r: startIdx+2, c: 0 }, e: { r: startIdx+2, c: totalColumnsCount - 1 } }); 
            }

            Object.keys(employeeGroups).sort().forEach(empKey => {
                let [scName, empName] = empKey.split("###"); let subRows = employeeGroups[empKey];

                if (user.role === 'admin' || user.role === 'taluka_admin' || user.role === 'phc_admin') {
                    let currentMetaIndex = sheetData.length;
                    sheetData.push([`🏢 उपकेंद्र: ${scName} | 🧑‍⚕️ कर्मचारी: ${empName}`]);
                    masterHeaderRows.push(currentMetaIndex); merges.push({ s: { r: currentMetaIndex, c: 0 }, e: { r: currentMetaIndex, c: totalColumnsCount - 1 } });
                }

                let startR = sheetData.length;
                let r1 = ["अ.क्र.", rep.formType === 'subcenter' ? "उपकेंद्र" : "गाव/कार्यक्षेत्र"]; 
                if (showPop) {
                    r1.push("लोकसंख्या");
                    r1.push("कुटुंब संख्या");
                }

                let r2 = []; let r3 = []; let r4 = rep.isProg ? [] : null;

                for(let x=0; x<totalBaseCols; x++) { r2.push(""); r3.push(""); if(rep.isProg) r4.push(""); }
                let totalHeaderRows = rep.isProg ? 4 : 3;
                for(let x=0; x<totalBaseCols; x++) merges.push({ s: { r: startR, c: x }, e: { r: startR + totalHeaderRows - 1, c: x } });

                let i = 0;
                while(i < columns.length) {
                    let c = columns[i]; let j = i + 1;
                    if(c.l1 !== "") {
                        while(j < columns.length && columns[j].l1 === c.l1) { j++; }
                        let totalL1Span = 0; for(let k=i; k<j; k++) totalL1Span += (rep.isProg && columns[k].type === 'number') ? 2 : 1;
                        r1.push(c.l1); for(let s=1; s<totalL1Span; s++) r1.push("");
                        merges.push({ s: { r: startR, c: r1.length - totalL1Span }, e: { r: startR, c: r1.length - 1 } });

                        let k = i;
                        while(k < j) {
                            let c2 = columns[k]; let m = k + 1;
                            if(c2.l2 !== "") {
                                while(m < j && columns[m].l2 === c2.l2) { m++; }
                                let totalL2Span = 0; for(let n=k; n<m; n++) totalL2Span += (rep.isProg && columns[n].type === 'number') ? 2 : 1;
                                r2.push(c2.l2); for(let s=1; s<totalL2Span; s++) r2.push("");
                                merges.push({ s: { r: startR+1, c: r2.length - totalL2Span }, e: { r: startR+1, c: r2.length - 1 } });

                                for(let n=k; n<m; n++) {
                                    let cn = columns[n]; let w = (rep.isProg && cn.type === 'number') ? 2 : 1;
                                    r3.push(cn.l3);
                                    if(w === 2) {
                                        r3.push(""); merges.push({ s: { r: startR+2, c: r3.length - 2 }, e: { r: startR+2, c: r3.length - 1 } });
                                        r4.push("मासिक"); r4.push("प्रगत");
                                    } else {
                                        if(rep.isProg) { merges.push({ s: { r: startR+2, c: r3.length - 1 }, e: { r: startR+3, c: r3.length - 1 } }); r4.push(""); }
                                    }
                                }
                                k = m;
                            } else {
                                let w = (rep.isProg && c2.type === 'number') ? 2 : 1;
                                if(w === 2) { 
                                    r2.push(c2.l3); r2.push(""); merges.push({ s: { r: startR+1, c: r2.length - 2 }, e: { r: startR+2, c: r2.length - 1 } }); 
                                    r3.push(""); r3.push(""); r4.push("मासिक"); r4.push("प्रगत"); 
                                } else { 
                                    r2.push(c2.l3); 
                                    if(rep.isProg) {
                                        merges.push({ s: { r: startR+1, c: r2.length - 1 }, e: { r: startR+3, c: r2.length - 1 } }); 
                                        r3.push(""); r4.push(""); 
                                    } else {
                                        merges.push({ s: { r: startR+1, c: r2.length - 1 }, e: { r: startR+2, c: r2.length - 1 } }); 
                                        r3.push(""); 
                                    }
                                }
                                k++;
                            }
                        }
                        i = j;
                    } else {
                        let w = (rep.isProg && c.type === 'number') ? 2 : 1;
                        r1.push(c.l3);
                        if(w === 2) {
                            r1.push(""); merges.push({ s: { r: startR, c: r1.length - 2 }, e: { r: startR+2, c: r1.length - 1 } }); 
                            r2.push(""); r2.push(""); r3.push(""); r3.push(""); r4.push("मासिक"); r4.push("प्रगत");
                        } else {
                            let bottomR = rep.isProg ? startR+3 : startR+2;
                            merges.push({ s: { r: startR, c: r1.length - 1 }, e: { r: bottomR, c: r1.length - 1 } });
                            r2.push(""); r3.push(""); if(rep.isProg) r4.push("");
                        }
                        i++;
                    }
                }

                sheetData.push(r1); subTitleHeaderRows.push(startR);
                sheetData.push(r2); subTitleHeaderRows.push(startR + 1);
                sheetData.push(r3); subTitleHeaderRows.push(startR + 2);
                if(rep.isProg) { sheetData.push(r4); subTitleHeaderRows.push(startR + 3); }

                subRows.forEach((r, rIdx) => {
                    let rowData = [rIdx + 1, rep.formType === 'subcenter' ? r.subcenter : r.village];
                    if(showPop) {
                        rowData.push(r.population || 0);
                        rowData.push(r.houses || 0);
                    }

                    columns.forEach(c => {
                        let val = r.values[c.id];
                        if(typeof val === 'object' && val !== null) { 
                            rowData.push(val.M !== '' ? (isNaN(Number(val.M)) ? String(val.M) : Number(val.M)) : 0); 
                            rowData.push(val.P !== '' ? (isNaN(Number(val.P)) ? String(val.P) : Number(val.P)) : 0); 
                        } else { 
                            rowData.push(val !== '' ? (isNaN(Number(val)) ? String(val) : Number(val)) : ''); 
                        }
                    });
                    sheetData.push(rowData);
                });

                if(rep.formType !== 'list') {
                    let groupTotals = calculateSmartTotals(subRows, columns, rep.isProg);
                    let gRow = ["गटाची एकूण बेरीज"];
                    for(let x=1; x<totalBaseCols; x++) gRow.push("");

                    columns.forEach(c => {
                        let gVal = groupTotals[c.id];
                        if(rep.isProg && c.type === 'number') { gRow.push(gVal.isNum ? Number(gVal.M) : '-'); gRow.push(gVal.isNum ? Number(gVal.P) : '-'); }
                        else { gRow.push(gVal.isNum ? Number(gVal.M) : '-'); }
                    });
                    let gRowIdx = sheetData.length;
                    sheetData.push(gRow); groupTotalRows.push(gRowIdx);
                    merges.push({ s: { r: gRowIdx, c: 0 }, e: { r: gRowIdx, c: totalBaseCols - 1 } });
                }

                sheetData.push(Array(totalColumnsCount).fill(""));
            });

            if ((user.role === 'admin' || user.role === 'taluka_admin' || user.role === 'phc_admin') && rep.formType !== 'list') {
                let phcTotals = calculateSmartTotals(rows, columns, rep.isProg);
                let pRow = ["एकूण Total"];
                for(let x=1; x<totalBaseCols; x++) pRow.push("");
                merges.push({ s: { r: sheetData.length, c: 0 }, e: { r: sheetData.length, c: totalBaseCols - 1 } });

                columns.forEach(c => {
                    let pVal = phcTotals[c.id];
                    if(rep.isProg && c.type === 'number') { pRow.push(pVal.isNum ? Number(pVal.M) : '-'); pRow.push(pVal.isNum ? Number(pVal.P) : '-'); }
                    else { pRow.push(pVal.isNum ? Number(pVal.M) : '-'); }
                });
                let pRowIdx = sheetData.length;
                sheetData.push(pRow); phcTotalRows.push(pRowIdx);
                merges.push({ s: { r: pRowIdx, c: 0 }, e: { r: pRowIdx, c: totalBaseCols - 1 } });
            }
        }

        let ws = XLSX.utils.aoa_to_sheet(sheetData); ws["!merges"] = merges;
        let finalColLimit = sheetData[3] ? sheetData[3].length : 60;

        for(let R=0; R<sheetData.length; R++) {
            for(let C=0; C<finalColLimit; C++) { 
                let cellRef = XLSX.utils.encode_cell({r: R, c: C}); if(!ws[cellRef]) ws[cellRef] = { t: "s", v: "" }; 
                let style = { font: { name: "Arial", sz: 10 }, alignment: { vertical: "center", horizontal: "center", wrapText: true }, border: { top:{style:"thin",color:{rgb:"000000"}}, bottom:{style:"thin",color:{rgb:"000000"}}, left:{style:"thin",color:{rgb:"000000"}}, right:{style:"thin",color:{rgb:"000000"}} } };

                if (typeof ws[cellRef].v === 'string' && ws[cellRef].v.match(/^\d{2}-\d{2}-\d{4}$/)) {
                    ws[cellRef].t = "s"; 
                }

                if(titleHeaderRows.includes(R)) { 
                    style.fill = { fgColor: { rgb: "E8F5E9" } }; style.font = { sz: 14, bold: true, color: { rgb: "1B5E20" } }; style.alignment.horizontal = "center"; 
                } else if(masterHeaderRows.includes(R)) { 
                    style.fill = { fgColor: { rgb: "00705A" } }; style.font = { sz: 12, bold: true, color: { rgb: "FFFFFF" } }; style.alignment.horizontal = "left"; 
                } else if(subTitleHeaderRows.includes(R)) {
                    let idxInGroup = subTitleHeaderRows.indexOf(R) % (rep.isProg?4:3);
                    if(idxInGroup === 0) style.fill = { fgColor: { rgb: "E1BEE7" } }; 
                    else if(idxInGroup === 1) style.fill = { fgColor: { rgb: "E3F2FD" } }; 
                    else if(idxInGroup === 2) style.fill = { fgColor: { rgb: "FFF9C4" } }; 
                    else style.fill = { fgColor: { rgb: "FFE0B2" } }; 
                    style.font.bold = true;
                } else if (groupTotalRows.includes(R)) {
                    style.fill = { fgColor: { rgb: "E3F2FD" } }; style.font.bold = true; style.font.color = { rgb: "0D47A1" };
                } else if (phcTotalRows.includes(R)) {
                    style.fill = { fgColor: { rgb: "C8E6C9" } }; style.font.bold = true; style.font.color = { rgb: "1B5E20" };
                } else if (sheetData[R][0] === "") {
                    style = {}; 
                } else {
                    if (C === 1 || (groupType === 'SubCenterFlat' && C === 2)) { style.alignment.horizontal = "left"; style.font.bold = true; }
                    if (groupType === "SubCenterConsolidated" && C === 1) { style.alignment.horizontal = "left"; style.font.bold = true; }

                    let offset = (groupType === "SubCenterConsolidated") ? 2 : totalBaseCols;
                    if (rep.isProg && C >= offset && (C - offset) % 2 === 1) style.fill = { fgColor: { rgb: "FFF9F2" } }; 
                }
                ws[cellRef].s = style;
            }
        }

        let wscols = [{ wch: 6 }, { wch: 25 }];
        if(groupType === 'SubCenterFlat') {
            if (rep.formType !== 'subcenter') {
                wscols.push({ wch: 20 }); 
            }
            wscols.push({ wch: 25 }); 
        }

        if (groupType !== "SubCenterConsolidated" && showPop) {
            wscols.push({ wch: 10 });
            wscols.push({ wch: 10 });
        }

        if (groupType === "SubCenterConsolidated") { wscols[1] = { wch: 45 }; }
        for(let c=wscols.length; c<finalColLimit; c++) wscols.push({ wch: 14 });
        ws["!cols"] = wscols;

        XLSX.utils.book_append_sheet(wb, ws, rep.formName.substring(0, 30).replace(/[\\/*?:\[\]]/g, ''));
    });

    let dlName = `अहवाल_${document.getElementById('periodType').value === 'custom' ? 'Custom' : document.getElementById('reportMonth').value}_${document.getElementById('reportYear').value}.xlsx`;
    XLSX.writeFile(wb, dlName);
}
