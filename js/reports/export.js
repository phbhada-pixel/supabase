function downloadConsolidatedExcel() {
    if(currentReports.length === 0) return;
    let groupType = document.getElementById('reportGroupFilter').value;

    if (user.role !== 'admin' && user.role !== 'taluka_admin' && user.role !== 'phc_admin') groupType = 'Village';

    let wb = XLSX.utils.book_new();

    currentReports.forEach((rep) => {
        let columns = rep.fields; let rows = rep.rows;
        let sheetData = []; let merges = []; let titleHeaderRows = []; let masterHeaderRows = []; let subTitleHeaderRows = []; let groupTotalRows = []; let phcTotalRows = [];
        let showPop = rep.showPopConfig === true;

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

            let totalBaseCols = groupType === 'SubCenterFlat' ? (showPop ? 6 : 4) : (showPop ? 4 : 2); 
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
                r1.push("गाव/कार्यक्षेत्र");
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
                    rowData.push(r.village);
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

            let totalBaseCols = showPop ? 4 : 2; 
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
                let r1 = ["अ.क्र.", "गाव/कार्यक्षेत्र"]; 
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
                    let rowData = [rIdx + 1, r.village];
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

                    let offset = (groupType === "SubCenterConsolidated" || groupType === "SubCenterSum") ? 2 : (groupType === 'SubCenterFlat' ? 3 : 2);
                    if (rep.isProg && C >= offset && C % 2 !== (offset%2)) style.fill = { fgColor: { rgb: "FFF9F2" } }; 
                }
                ws[cellRef].s = style;
            }
        }

        let wscols = [{ wch: 6 }, { wch: 25 }];
        if(groupType === 'SubCenterFlat') {
            wscols.push({ wch: 20 }); 
            wscols.push({ wch: 25 }); 
        }
        
        if (groupType !== "SubCenterConsolidated" && showPop) {
            wscols.push({ wch: 10 });
            wscols.push({ wch: 10 });
        }

        if (groupType === "SubCenterConsolidated") { wscols[1] = { wch: 45 }; }
        for(let c=wscols.length; c<finalColLimit; c++) wscols.push({ wch: 14 });
        ws["!cols"] = wscols;

        XLSX.utils.book_append_sheet(wb, ws, rep.formName.substring(0, 30));
    });

    let dlName = `अहवाल_${document.getElementById('periodType').value === 'custom' ? 'Custom' : document.getElementById('reportMonth').value}_${document.getElementById('reportYear').value}.xlsx`;
    XLSX.writeFile(wb, dlName);
}

function generatePendingReport() {
    let periodType = document.getElementById('periodType').value;
    if (periodType === 'custom') {
        alert("अपूर्ण यादी (Pending Report) शोधण्यासाठी कृपया 'महिन्यानुसार' कालावधी निवडा. कस्टम तारखांसाठी हे उपलब्ध नाही.");
        return;
    }

    const selMonth = document.getElementById('reportMonth').value;
    const selMonthNum = monthNamesMarathi[selMonth];
    const selYear = document.getElementById('reportYear').value;
    
    let selFortnight = document.getElementById('reportFortnight') ? document.getElementById('reportFortnight').value : "1";
    let selWeek = document.getElementById('reportWeek') ? document.getElementById('reportWeek').value : "1";
    let selDaily = document.getElementById('reportDaily') ? document.getElementById('reportDaily').value : "1";
    
    let selectedIDs = getSelectedReportIDs();
    if (selectedIDs.length === 0) { alert("कृपया किमान एक अहवाल निवडा!"); return; }

    let filterSubCenter = document.getElementById('reportSubCenterFilter').value;
    let pendingGroupType = document.getElementById('pendingGroupFilter').value;
    
    let freqFilterEl = document.getElementById('frequencyFilter');
    let freqFilter = freqFilterEl ? freqFilterEl.value : 'all';

    let formsToCheck = masterData.forms.filter(f => {
        let freq = f.schema_json && f.schema_json.frequency ? f.schema_json.frequency : (f.form_type === 'fortnightly' ? 'fortnightly' : 'monthly');
        if (freqFilter === 'all') return true;
        return freq === freqFilter;
    });
    
    if(!selectedIDs.includes("ALL")) formsToCheck = formsToCheck.filter(f => selectedIDs.includes(f.id));

    let rawPendingData = [];

    formsToCheck.forEach(f => {
        let freq = f.schema_json && f.schema_json.frequency ? f.schema_json.frequency : (f.form_type === 'fortnightly' ? 'fortnightly' : 'monthly');

        masterData.employees.forEach(u => {
            let empRole = String(u.role).toUpperCase().trim();
            if (['ADMIN', 'TALUKA_ADMIN', 'PHC_ADMIN'].includes(empRole)) return;
            if (!u.sub_center_id || u.sub_center_id === '00000000-0000-0000-0000-000000000000') return;
            
            if (f.allowed_roles && f.allowed_roles.toUpperCase() !== 'ALL') {
                let allowedArray = f.allowed_roles.split(',').map(r => r.trim().toUpperCase());
                if (!allowedArray.includes(empRole)) return; 
            }

            let isAdminRole = ['admin', 'taluka_admin', 'phc_admin'].includes(user.role);

            if (user.role === 'phc_admin' && u.phc_id !== user.phc_id) return;
            if (!isAdminRole && String(u.mobile_number).trim() !== String(user.mobile).trim()) return;

            let scObj = masterData.subCenters.find(s => String(s.id) === String(u.sub_center_id));
            let scName = scObj ? scObj.name : "Unknown";
            if (isAdminRole && filterSubCenter !== "सर्व" && scName !== filterSubCenter) return;

            let userVillages = masterData.villages.filter(v => String(v.sub_center_id) === String(u.sub_center_id));
            userVillages.forEach(v => {
                let isFilled = masterData.filledStats.some(h => {
                    if (String(h.form_id) !== String(f.id) || String(h.village_id) !== String(v.id)) return false;
                    
                    let mode = f.data_entry_mode || 'shared';
                    if (mode === 'individual' && String(h.employee_id) !== String(u.id)) return false;

                    if (freq === 'onetime') return true; 
                    
                    let rYear = parseInt(h.report_year);
                    if (isNaN(rYear) || rYear === 0) {
                        if(h.created_at) rYear = new Date(h.created_at).getFullYear();
                        else rYear = parseInt(selYear);
                    }
                    let matchY = (rYear === parseInt(selYear));

                    let mStr = String(h.report_month).trim().toLowerCase();
                    let dbMonthNum = parseInt(mStr);
                    
                    if (isNaN(dbMonthNum) || dbMonthNum === 0) {
                        for (const [mName, mNum] of Object.entries(monthNamesMarathi)) {
                            if (mStr.includes(mName.toLowerCase())) { dbMonthNum = mNum; break; }
                        }
                        if (isNaN(dbMonthNum) || dbMonthNum === 0) {
                            if(h.created_at) dbMonthNum = new Date(h.created_at).getMonth() + 1;
                            else dbMonthNum = parseInt(selMonthNum);
                        }
                    }
                    let matchM = (dbMonthNum === parseInt(selMonthNum));

                    let fnStr = String(h.report_fortnight).trim();
                    let dbFn = 1; 
                    
                    if (fnStr.includes("2") || fnStr.includes("२") || fnStr.includes("16") || fnStr.includes("१६") || fnStr.includes("अखेर") || fnStr.includes("दुसरा")) {
                        dbFn = 2;
                    } else if (fnStr.includes("3") || fnStr.includes("३") || fnStr.includes("तिसरा")) {
                        dbFn = 3;
                    } else if (fnStr.includes("4") || fnStr.includes("४") || fnStr.includes("चौथा")) {
                        dbFn = 4;
                    } else if (fnStr.includes("5") || fnStr.includes("५") || fnStr.includes("पाचवा")) {
                        dbFn = 5;
                    } else if (freq === 'daily') {
                        let pFn = parseInt(fnStr);
                        if (!isNaN(pFn) && pFn > 0) dbFn = pFn;
                    } else {
                        dbFn = 1;
                    }

                    let matchFreq = true;
                    if (freq === 'fortnightly') matchFreq = (dbFn === parseInt(selFortnight));
                    else if (freq === 'weekly') matchFreq = (dbFn === parseInt(selWeek));
                    else if (freq === 'daily') matchFreq = (dbFn === parseInt(selDaily));
                    
                    return matchM && matchY && matchFreq;
                });

                if (!isFilled) {
                    rawPendingData.push({
                        formName: f.form_name,
                        empName: u.full_name,
                        role: u.role,
                        sc: scName,
                        village: v.name
                    });
                }
            });
        });
    });

    let container = document.getElementById('reportTableContainer'); let downArea = document.getElementById('downloadButtonsArea');
    downArea.innerHTML = `<div class="no-print flex justify-end gap-2 mb-3"><button onclick="copyPendingListText()" class="bg-gray-600 text-white px-4 py-2 rounded text-xs font-bold shadow">📋 यादी कॉपी करा</button><button onclick="window.print()" class="bg-red-600 text-white px-4 py-2 rounded text-xs font-bold shadow">🖨️ प्रिंट काढा</button></div>`;

    let phcHeader = "तालुका आरोग्य प्रणाली";
    if (user.role === 'phc_admin') phcHeader = "तुमची अपूर्ण यादी";
    if (filterSubCenter !== 'सर्व') phcHeader += ` (उपकेंद्र: ${filterSubCenter})`;

    let isFnVisible = document.getElementById('fortnightInputs') && !document.getElementById('fortnightInputs').classList.contains('hidden');
    let isWnVisible = document.getElementById('weekInputs') && !document.getElementById('weekInputs').classList.contains('hidden');
    let isDyVisible = document.getElementById('dailyInputs') && !document.getElementById('dailyInputs').classList.contains('hidden');
    let isOnetime = freqFilter === 'onetime';
    
    let periodDisplay = isOnetime ? "संपूर्ण अहवाल (All Time)" : `${selMonth} ${selYear}`;
    if(isFnVisible && !isOnetime) periodDisplay += ` (पंधरवाडा: ${selFortnight == "1" ? '१ ते १५ तारीख' : '१६ ते महिनाअखेर'})`;
    if(isWnVisible && !isOnetime) periodDisplay += ` (आठवडा: ${selWeek})`;
    if(isDyVisible && !isOnetime) periodDisplay += ` (तारीख: ${selDaily})`;

    let html = `<div id="pdfExportArea" class="pdf-container"><div style="text-align:center; border-bottom: 2px solid var(--primary); padding-bottom:10px; margin-bottom:20px;"><h2 style="margin:0; color:var(--primary); font-size:24px;">${phcHeader}</h2><h3 style="margin:5px 0 0 0; color:#444; font-size:18px;">अपूर्ण अहवाल यादी - कालावधी: ${periodDisplay}</h3></div>`;
    
    if(rawPendingData.length === 0) { 
        html = `<h3 style="text-align:center; color:green; padding:30px; font-weight:bold;">🎉 उत्कृष्ट! तुमचे सर्व अहवाल पूर्ण भरले आहेत.</h3>`; 
        downArea.innerHTML = ""; 
        container.innerHTML = html + `</div>`; 
        document.getElementById('reportContentArea').classList.remove('hidden');
        return;
    }

    let isFirstPending = true;

    if (pendingGroupType === 'employee') {
function generatePendingReport() {
    let periodType = document.getElementById('periodType').value;
    if (periodType === 'custom') {
        alert("अपूर्ण यादी (Pending Report) शोधण्यासाठी कृपया 'महिन्यानुसार' कालावधी निवडा. कस्टम तारखांसाठी हे उपलब्ध नाही.");
        return;
    }

    const selMonth = document.getElementById('reportMonth').value;
    const selMonthNum = monthNamesMarathi[selMonth];
    const selYear = document.getElementById('reportYear').value;

    let selFortnight = document.getElementById('reportFortnight') ? document.getElementById('reportFortnight').value : "1";
    let selWeek = document.getElementById('reportWeek') ? document.getElementById('reportWeek').value : "1";
    let selDaily = document.getElementById('reportDaily') ? document.getElementById('reportDaily').value : "1";

    let selectedIDs = getSelectedReportIDs();
    if (selectedIDs.length === 0) { alert("कृपया किमान एक अहवाल निवडा!"); return; }

    let filterSubCenter = document.getElementById('reportSubCenterFilter').value;
    let pendingGroupType = document.getElementById('pendingGroupFilter').value;

    let freqFilterEl = document.getElementById('frequencyFilter');
    let freqFilter = freqFilterEl ? freqFilterEl.value : 'all';

    let formsToCheck = masterData.forms.filter(f => {
        let freq = f.schema_json && f.schema_json.frequency ? f.schema_json.frequency : (f.form_type === 'fortnightly' ? 'fortnightly' : 'monthly');
        if (freqFilter === 'all') return true;
        return freq === freqFilter;
    });

    if(!selectedIDs.includes("ALL")) formsToCheck = formsToCheck.filter(f => selectedIDs.includes(f.id));

    let rawPendingData = [];

    formsToCheck.forEach(f => {
        let freq = f.schema_json && f.schema_json.frequency ? f.schema_json.frequency : (f.form_type === 'fortnightly' ? 'fortnightly' : 'monthly');

        masterData.employees.forEach(u => {
            let empRole = String(u.role).toUpperCase().trim();
            if (['ADMIN', 'TALUKA_ADMIN', 'PHC_ADMIN'].includes(empRole)) return;
            if (!u.sub_center_id || u.sub_center_id === '00000000-0000-0000-0000-000000000000') return;

            if (f.allowed_roles && f.allowed_roles.toUpperCase() !== 'ALL') {
                let allowedArray = f.allowed_roles.split(',').map(r => r.trim().toUpperCase());
                if (!allowedArray.includes(empRole)) return; 
            }

            let isAdminRole = ['admin', 'taluka_admin', 'phc_admin'].includes(user.role);

            if (user.role === 'phc_admin' && u.phc_id !== user.phc_id) return;
            if (!isAdminRole && String(u.mobile_number).trim() !== String(user.mobile).trim()) return;

            let scObj = masterData.subCenters.find(s => String(s.id) === String(u.sub_center_id));
            let scName = scObj ? scObj.name : "Unknown";
            if (isAdminRole && filterSubCenter !== "सर्व" && scName !== filterSubCenter) return;

            // 🟢 दुरुस्ती: 'उपकेंद्र' फॉर्मसाठी गावनिहाय लूप न चालवता, थेट एकदाच तपासा
            if (f.form_type === 'subcenter') {
                let isFilled = masterData.filledStats.some(h => {
                    if (String(h.form_id) !== String(f.id)) return false;

                    let mode = f.data_entry_mode || 'shared';
                    if (mode === 'individual' && String(h.employee_id) !== String(u.id)) return false;

                    if (freq === 'onetime') return true; 

                    let rYear = parseInt(h.report_year);
                    if (isNaN(rYear) || rYear === 0) {
                        if(h.created_at) rYear = new Date(h.created_at).getFullYear();
                        else rYear = parseInt(selYear);
                    }
                    let matchY = (rYear === parseInt(selYear));

                    let mStr = String(h.report_month).trim().toLowerCase();
                    let dbMonthNum = parseInt(mStr);

                    if (isNaN(dbMonthNum) || dbMonthNum === 0) {
                        for (const [mName, mNum] of Object.entries(monthNamesMarathi)) {
                            if (mStr.includes(mName.toLowerCase())) { dbMonthNum = mNum; break; }
                        }
                        if (isNaN(dbMonthNum) || dbMonthNum === 0) {
                            if(h.created_at) dbMonthNum = new Date(h.created_at).getMonth() + 1;
                            else dbMonthNum = parseInt(selMonthNum);
                        }
                    }
                    let matchM = (dbMonthNum === parseInt(selMonthNum));

                    let fnStr = String(h.report_fortnight).trim();
                    let dbFn = 1; 

                    if (fnStr.includes("2") || fnStr.includes("२") || fnStr.includes("16") || fnStr.includes("१६") || fnStr.includes("अखेर") || fnStr.includes("दुसरा")) {
                        dbFn = 2;
                    } else if (fnStr.includes("3") || fnStr.includes("३") || fnStr.includes("तिसरा")) {
                        dbFn = 3;
                    } else if (fnStr.includes("4") || fnStr.includes("४") || fnStr.includes("चौथा")) {
                        dbFn = 4;
                    } else if (fnStr.includes("5") || fnStr.includes("५") || fnStr.includes("पाचवा")) {
                        dbFn = 5;
                    } else if (freq === 'daily') {
                        let pFn = parseInt(fnStr);
                        if (!isNaN(pFn) && pFn > 0) dbFn = pFn;
                    } else {
                        dbFn = 1;
                    }

                    let matchFreq = true;
                    if (freq === 'fortnightly') matchFreq = (dbFn === parseInt(selFortnight));
                    else if (freq === 'weekly') matchFreq = (dbFn === parseInt(selWeek));
                    else if (freq === 'daily') matchFreq = (dbFn === parseInt(selDaily));

                    return matchM && matchY && matchFreq;
                });

                // जर अहवाल भरला नसेल, तर गावाची नावे न दाखवता फक्त "संपूर्ण उपकेंद्र" दाखवा.
                if (!isFilled) {
                    rawPendingData.push({
                        formName: f.form_name,
                        empName: u.full_name,
                        role: u.role,
                        sc: scName,
                        village: "🏢 संपूर्ण उपकेंद्र (Subcenter Level)" // 🟢 थेट नाव
                    });
                }
            } else {
                // इतर सर्व प्रकारच्या फॉर्म्ससाठी गावनिहाय तपासणी (जुने लॉजिक तसेच्या तसे)
                let userVillages = masterData.villages.filter(v => String(v.sub_center_id) === String(u.sub_center_id));
                userVillages.forEach(v => {
                    let isFilled = masterData.filledStats.some(h => {
                        if (String(h.form_id) !== String(f.id) || String(h.village_id) !== String(v.id)) return false;

                        let mode = f.data_entry_mode || 'shared';
                        if (mode === 'individual' && String(h.employee_id) !== String(u.id)) return false;

                        if (freq === 'onetime') return true; 

                        let rYear = parseInt(h.report_year);
                        if (isNaN(rYear) || rYear === 0) {
                            if(h.created_at) rYear = new Date(h.created_at).getFullYear();
                            else rYear = parseInt(selYear);
                        }
                        let matchY = (rYear === parseInt(selYear));

                        let mStr = String(h.report_month).trim().toLowerCase();
                        let dbMonthNum = parseInt(mStr);

                        if (isNaN(dbMonthNum) || dbMonthNum === 0) {
                            for (const [mName, mNum] of Object.entries(monthNamesMarathi)) {
                                if (mStr.includes(mName.toLowerCase())) { dbMonthNum = mNum; break; }
                            }
                            if (isNaN(dbMonthNum) || dbMonthNum === 0) {
                                if(h.created_at) dbMonthNum = new Date(h.created_at).getMonth() + 1;
                                else dbMonthNum = parseInt(selMonthNum);
                            }
                        }
                        let matchM = (dbMonthNum === parseInt(selMonthNum));

                        let fnStr = String(h.report_fortnight).trim();
                        let dbFn = 1; 

                        if (fnStr.includes("2") || fnStr.includes("२") || fnStr.includes("16") || fnStr.includes("१६") || fnStr.includes("अखेर") || fnStr.includes("दुसरा")) {
                            dbFn = 2;
                        } else if (fnStr.includes("3") || fnStr.includes("३") || fnStr.includes("तिसरा")) {
                            dbFn = 3;
                        } else if (fnStr.includes("4") || fnStr.includes("४") || fnStr.includes("चौथा")) {
                            dbFn = 4;
                        } else if (fnStr.includes("5") || fnStr.includes("५") || fnStr.includes("पाचवा")) {
                            dbFn = 5;
                        } else if (freq === 'daily') {
                            let pFn = parseInt(fnStr);
                            if (!isNaN(pFn) && pFn > 0) dbFn = pFn;
                        } else {
                            dbFn = 1;
                        }

                        let matchFreq = true;
                        if (freq === 'fortnightly') matchFreq = (dbFn === parseInt(selFortnight));
                        else if (freq === 'weekly') matchFreq = (dbFn === parseInt(selWeek));
                        else if (freq === 'daily') matchFreq = (dbFn === parseInt(selDaily));

                        return matchM && matchY && matchFreq;
                    });

                    if (!isFilled) {
                        rawPendingData.push({
                            formName: f.form_name,
                            empName: u.full_name,
                            role: u.role,
                            sc: scName,
                            village: v.name
                        });
                    }
                });
            }
        });
    });

    let container = document.getElementById('reportTableContainer'); let downArea = document.getElementById('downloadButtonsArea');
    downArea.innerHTML = `<div class="no-print flex justify-end gap-2 mb-3"><button onclick="copyPendingListText()" class="bg-gray-600 text-white px-4 py-2 rounded text-xs font-bold shadow">📋 यादी कॉपी करा</button><button onclick="window.print()" class="bg-red-600 text-white px-4 py-2 rounded text-xs font-bold shadow">🖨️ प्रिंट काढा</button></div>`;

    let phcHeader = "तालुका आरोग्य प्रणाली";
    if (user.role === 'phc_admin') phcHeader = "तुमची अपूर्ण यादी";
    if (filterSubCenter !== 'सर्व') phcHeader += ` (उपकेंद्र: ${filterSubCenter})`;

    let isFnVisible = document.getElementById('fortnightInputs') && !document.getElementById('fortnightInputs').classList.contains('hidden');
    let isWnVisible = document.getElementById('weekInputs') && !document.getElementById('weekInputs').classList.contains('hidden');
    let isDyVisible = document.getElementById('dailyInputs') && !document.getElementById('dailyInputs').classList.contains('hidden');
    let isOnetime = freqFilter === 'onetime';

    // 🟢 पेंडिंग रिपोर्टच्या हेडिंगमध्ये पूर्ण तारीख दाखवण्यासाठी बदल
    let periodDisplay = isOnetime ? "संपूर्ण अहवाल (All Time)" : `${selMonth} ${selYear}`;
    if(isFnVisible && !isOnetime) periodDisplay += ` (पंधरवाडा: ${selFortnight == "1" ? '१ ते १५ तारीख' : '१६ ते महिनाअखेर'})`;
    if(isWnVisible && !isOnetime) periodDisplay += ` (आठवडा: ${selWeek})`;
    
    if(isDyVisible && !isOnetime) {
        let dVal = parseInt(selDaily);
        let mVal = parseInt(selMonthNum);
        let yVal = parseInt(selYear);
        let fullDateStr = `${dVal < 10 ? '0'+dVal : dVal}-${mVal < 10 ? '0'+mVal : mVal}-${yVal}`;
        periodDisplay += ` (दिनांक: ${fullDateStr})`;
    }

    let html = `<div id="pdfExportArea" class="pdf-container"><div style="text-align:center; border-bottom: 2px solid var(--primary); padding-bottom:10px; margin-bottom:20px;"><h2 style="margin:0; color:var(--primary); font-size:24px;">${phcHeader}</h2><h3 style="margin:5px 0 0 0; color:#444; font-size:18px;">अपूर्ण अहवाल यादी - कालावधी: ${periodDisplay}</h3></div>`;

    if(rawPendingData.length === 0) { 
        html = `<h3 style="text-align:center; color:green; padding:30px; font-weight:bold;">🎉 उत्कृष्ट! तुमचे सर्व अहवाल पूर्ण भरले आहेत.</h3>`; 
        downArea.innerHTML = ""; 
        container.innerHTML = html + `</div>`; 
        document.getElementById('reportContentArea').classList.remove('hidden');
        return;
    }

    let isFirstPending = true;

    if (pendingGroupType === 'employee') {
        let groupedByEmp = {};
        rawPendingData.forEach(item => {
            let key = item.empName + "###" + item.sc + "###" + item.role;
            if(!groupedByEmp[key]) groupedByEmp[key] = [];
            groupedByEmp[key].push(item);
        });

        let sortedEmpKeys = Object.keys(groupedByEmp).sort();

        sortedEmpKeys.forEach(empKey => {
            let pbClass = isFirstPending ? "" : "page-break"; isFirstPending = false;
            let [empName, scName, empRole] = empKey.split("###");

            let formMap = {};
            groupedByEmp[empKey].forEach(p => {
                if(!formMap[p.formName]) formMap[p.formName] = [];
                formMap[p.formName].push(p.village);
            });

            let noticeDataArr = [];
            let rowsHtml = '';
            let idx = 1;

            Object.keys(formMap).sort().forEach(fName => {
                let villagesStr = formMap[fName].join(", ");
                noticeDataArr.push(`${fName} (${villagesStr})`);

                rowsHtml += `<tr>
                    <td style="border: 1px solid #ccc; padding: 8px; text-align:center; font-weight:bold;">${idx++}</td>
                    <td style="border: 1px solid #ccc; padding: 8px; text-align:left; font-size:15px; font-weight:bold; color:#0056b3;">${fName}</td>
                    <td style="border: 1px solid #ccc; padding: 8px; text-align:left; font-size:14px; font-weight:bold; color:#28a745;">${villagesStr}</td>
                </tr>`;
            });

            let noticeDataStr = noticeDataArr.join('|||');

            html += `<div class="${pbClass}">
                        <div class="pdf-group-header" style="background:#f8f9fa; color:#c0392b; padding:10px; font-weight:bold; font-size:16px; margin-top:10px; border:1px solid #ddd; display:flex; justify-content:space-between; align-items:center;">
                            <span>🧑‍⚕️ कर्मचारी: ${empName} (${scName})</span>
                            <button onclick="generateNotice('${empName}', '${empRole}', '${scName}', '${noticeDataStr}')" class="bg-red-100 text-red-700 px-3 py-1 rounded text-xs font-bold shadow-sm hover:bg-red-200 no-print border border-red-300">⚠️ सर्व प्रलंबित अहवालांची नोटीस काढा</button>
                        </div>
                        <table class="report-table pending-data-table" style="width:100%; border-collapse:collapse; margin-bottom:30px;">
                            <thead style="background:#f4f7f6;">
                                <tr>
                                    <th style="border: 1px solid #ccc; padding: 8px; width:10%; text-align:center;">अ.क्र.</th>
                                    <th style="border: 1px solid #ccc; padding: 8px; text-align:left; width:45%;">प्रलंबित अहवाल (फॉर्म)</th>
                                    <th style="border: 1px solid #ccc; padding: 8px; text-align:left; width:45%;">अपूर्ण गावे / कार्यक्षेत्र</th>
                                </tr>
                            </thead>
                            <tbody>${rowsHtml}</tbody>
                        </table>
                     </div>`;
        });

    } else {
        let groupedByForm = {};
        rawPendingData.forEach(item => {
            if(!groupedByForm[item.formName]) groupedByForm[item.formName] = [];
            groupedByForm[item.formName].push(item);
        });

        let sortedFormKeys = Object.keys(groupedByForm).sort();

        sortedFormKeys.forEach(fName => {
            let pbClass = isFirstPending ? "" : "page-break"; isFirstPending = false;
            html += `<div class="${pbClass}"><div class="pdf-group-header" style="background:#f8f9fa; color:#c0392b; padding:10px; font-weight:bold; font-size:16px; margin-top:10px; border:1px solid #ddd;">📄 फॉर्म: ${fName}</div><table class="report-table pending-data-table" style="width:100%; border-collapse:collapse; margin-bottom:30px;"><thead style="background:#f4f7f6;"><tr><th style="border: 1px solid #ccc; padding: 8px; width:10%; text-align:center;">अ.क्र.</th><th style="border: 1px solid #ccc; padding: 8px; text-align:left;">अहवाल प्रलंबित असणारे कर्मचारी (उपकेंद्र) - अपूर्ण गावे</th></tr></thead><tbody>`;

            let empMap = {}; 
            groupedByForm[fName].forEach(p => { 
                let key = p.empName + "###" + p.sc + "###" + p.role; 
                if(!empMap[key]) empMap[key] = []; 
                empMap[key].push(p.village); 
            });

            let sortedKeys = Object.keys(empMap).sort();
            sortedKeys.forEach((key, idx) => {
                let [empName, scName, empRole] = key.split("###"); 
                let villagesStr = empMap[key].join(", ");

                let noticeDataStr = `${fName} (${villagesStr})`;

                html += `<tr>
                            <td style="border: 1px solid #ccc; padding: 8px; text-align:center; font-weight:bold;">${idx+1}</td>
                            <td style="border: 1px solid #ccc; padding: 8px; text-align:left; font-size:15px; display:flex; justify-content:space-between; align-items:center;">
                                <div>
                                    <span style="color:#0056b3; font-weight:bold;">${empName}</span> - 
                                    <span style="color:#d35400; font-weight:bold;">${scName}</span> 
                                    <span style="color:#28a745; font-weight:bold;">(${villagesStr})</span>
                                </div>
                                <button onclick="generateNotice('${empName}', '${empRole}', '${scName}', '${noticeDataStr}')" class="bg-red-100 text-red-700 px-3 py-1 rounded text-xs font-bold shadow-sm hover:bg-red-200 no-print border border-red-300">⚠️ नोटीस</button>
                            </td>
                        </tr>`;
            });
            html += `</tbody></table></div>`;
        });
    }

    container.innerHTML = html + `</div>`; 
    document.getElementById('reportContentArea').classList.remove('hidden');
}


function copyPendingListText() {
    let textToCopy = `*अपूर्ण अहवाल यादी*\n\n`;
    let tables = document.querySelectorAll('.pending-data-table'); if(tables.length === 0) return;
    let formHeaders = document.querySelectorAll('.pdf-group-header');
    
    tables.forEach((table, tableIndex) => {
        let headerText = formHeaders[tableIndex] ? formHeaders[tableIndex].innerText : "अहवाल";
        headerText = headerText.replace('⚠️ नोटीस काढा', '').replace('⚠️ सर्व प्रलंबित अहवालांची नोटीस काढा', '').trim();
        textToCopy += `📌 *${headerText}*\n`;
        
        table.querySelectorAll('tbody tr').forEach((row, rowIndex) => { 
            let cells = row.querySelectorAll('td'); 
            if(cells.length >= 2) {
                let rowContent = "";
                for(let i=1; i<cells.length; i++) {
                    rowContent += cells[i].innerText.replace(/\n/g, " ").replace("⚠️ नोटीस", "").trim() + " ";
                }
                textToCopy += `${rowIndex + 1}. ${rowContent.trim()}\n`; 
            }
        });
        textToCopy += `\n`;
    });
    navigator.clipboard.writeText(textToCopy).then(() => { alert("✅ यादी व्हॉट्सॲप मेसेजसाठी कॉपी झाली आहे!"); });
}

function generateNotice(empName, empRole, scName, noticeDataStr) {
    const today = new Date().toLocaleDateString('mr-IN');
    const noticeWindow = window.open('', '_blank', 'width=900,height=800');
    
    let pendingItems = noticeDataStr.split('|||');
    
    let formsHtml = pendingItems.map((item, i) => {
        let parts = item.split(' (');
        let villages = parts[1] ? parts[1] : ''; 
        if(villages.endsWith(')')) villages = villages.slice(0, -1);

        return `<li style="margin-bottom: 5px; padding-left: 5px; line-height: 1.4;">
                    <strong style="font-size: 15px; color: #b71c1c;">${parts[0]}</strong> 
                    <span style="font-size: 13px; color: #444;">(${villages})</span>
                </li>`;
    }).join('');

    noticeWindow.document.write(`
        <html lang="mr">
        <head>
            <title>कारणे दाखवा नोटीस - ${empName}</title>
            <style>
                body { font-family: 'Arial', sans-serif; background: #e9ecef; margin: 0; padding: 20px; color: #222;} 
                .notice-wrapper { background: #fff; padding: 30px 40px; max-width: 210mm; min-height: 297mm; margin: auto; box-sizing: border-box; position: relative; box-shadow: 0px 5px 15px rgba(0,0,0,0.3); border: none; outline: none; }
                .title-block { text-align: center; border-bottom: 2px solid #222; padding-bottom: 15px; margin-bottom: 25px; }
                .title { font-weight: 900; font-size: 26px; color: #000; margin-bottom: 5px; }
                .subtitle { font-size: 18px; font-weight: bold; color: #333; }
                .header-info { display: flex; justify-content: space-between; margin-bottom: 20px; font-weight: bold; font-size: 15px;}
                .to-address { margin-bottom: 20px; font-weight: bold; font-size: 16px; line-height: 1.5; padding-left: 10px; border-left: 3px solid #b71c1c;}
                .subject-box { background: #f4f4f4; padding: 12px; border: 1px dashed #666; font-weight: bold; margin-bottom: 20px; text-align: center; font-size: 16px;}
                .content { text-align: justify; font-size: 16px; line-height: 1.6; margin-bottom: 15px;}
                .content p { text-indent: 50px; margin-bottom: 8px; }
                .forms-box { margin: 15px 0 15px 40px; padding: 15px 15px 15px 10px; border: 1px solid #ccc; background-color: #fafafa; border-radius: 5px; box-shadow: inset 0 0 5px rgba(0,0,0,0.05);}
                .forms-box ul { margin: 0; padding-left: 20px; list-style-type: decimal; }
                .sign-block { text-align: right; margin-top: 30px; font-weight: bold; font-size: 16px; line-height: 1.5; }
                .copy-to { margin-top: 40px; font-size: 15px; font-weight: bold; line-height: 1.6; }
                
                @media print { 
                    body { background: #fff; padding: 0; }
                    .notice-wrapper { border: none; outline: none; margin: 0; padding: 20px; min-height: auto; box-shadow: none;}
                    .no-print { display: none; } 
                }
            </style>
        </head>
        <body>
            <div id="noticeContent" class="notice-wrapper">
                <div class="title-block">
                    <div class="title">महाराष्ट्र शासन</div>
                    <div class="subtitle">कार्यालय: वैद्यकीय अधिकारी, प्राथमिक आरोग्य केंद्र, भादा</div>
                    <div style="font-size: 15px; margin-top: 5px; color: #555;">ता. औसा जि. लातूर</div>
                </div>
                
                <div class="header-info">
                    <div>जावक क्र. प्राआकें/भादा/नोटीस/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/२०२६</div>
                    <div>दिनांक: ${today}</div>
                </div>
                
                <div class="to-address">
                    प्रति,<br>
                    श्री./सौ. <span style="font-size: 18px; color: #b71c1c;">${empName}</span>,<br>
                    ${empRole}, उपकेंद्र: ${scName}.
                </div>
                
                <div class="subject-box">
                    <span style="text-decoration: underline;">विषय:</span> प्रलंबित अहवाल विहित वेळेत सादर न केल्याबाबत <strong>कारणे दाखवा नोटीस</strong>.
                </div>
                
                <div class="content">
                    <p>उपरोक्त विषयान्वये आपणास या नोटीसीद्वारे कळविण्यात येते की, आपल्या कार्यक्षेत्रातील खालील अत्यंत महत्त्वाच्या कार्यक्रमांचे अहवाल आपण अद्यापपर्यंत कार्यालयास सादर केलेले नाहीत.</p>
                </div>
                
                <div class="forms-box">
                    <ul>
                        ${formsHtml}
                    </ul>
                </div>

                <div class="content">
                    <p>शासकीय अहवाल विहित वेळेत सादर न करणे ही अत्यंत गंभीर व प्रशासकीय दृष्ट्या अक्षम्य बाब असून, हे आपल्या कामातील हलगर्जीपणाचे व वरिष्ठांच्या आदेशाचे जाणीवपूर्वक उल्लंघन केल्याचे स्पष्ट लक्षण आहे.</p>
                    
                    <p>तरी, ही नोटीस प्राप्त होताच <strong>पुढील २४ तासांच्या आत</strong> सदर सर्व प्रलंबित अहवाल प्रणालीवर अचूकपणे अद्ययावत करावेत आणि विहित वेळेत अहवाल न पाठवल्याबाबतचा आपला खुलासा लेखी स्वरूपात त्वरित या कार्यालयास सादर करावा.</p>
                    
                    <p>आपला खुलासा असमाधानकारक आढळल्यास किंवा मुदतीत प्राप्त न झाल्यास, आपल्यावर 'महाराष्ट्र नागरी सेवा (शिस्त व अपील) नियम' नुसार <strong>कठोर प्रशासकीय कारवाई</strong> का प्रस्तावित करू नये, याबाबत आपली भूमिका स्पष्ट करावी.</p>
                </div>
                
                <div class="sign-block">
                    <strong>वैद्यकीय अधिकारी</strong>,<br>
                    प्राथमिक आरोग्य केंद्र, भादा
                </div>
                
                <div class="copy-to">
                    प्रत माहितीस्तव सविनय सादर,<br>
                    १. मा. जिल्हा आरोग्य अधिकारी, जिल्हा परिषद, लातूर.<br>
                    २. मा. तालुका आरोग्य अधिकारी, तालुका कार्यालय, औसा.
                </div>
                
                <div class="sign-block" style="margin-top: 20px;">
                    <strong>वैद्यकीय अधिकारी</strong>,<br>
                    प्राथमिक आरोग्य केंद्र, भादा
                </div>
            </div>

            <div style="text-align: center; margin-top: 30px; display: flex; justify-content: center; gap: 15px;" class="no-print">
                <button onclick="window.print()" style="padding: 12px 25px; background-color: #007bff; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">🖨️ डायरेक्ट प्रिंट काढा</button>
            </div>
        </body>
        </html>
    `);
    noticeWindow.document.close();
}
