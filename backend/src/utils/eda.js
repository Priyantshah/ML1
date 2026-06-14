export async function performEDAJS(fileUrl, targetColumn) {
    const response = await fetch(fileUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch CSV from URL: ${response.statusText}`);
    }
    const text = await response.text();
    
    // Parse CSV
    const rows = [];
    let currentRow = [];
    let currentVal = '';
    let insideQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];
        
        if (insideQuotes) {
            if (char === '"') {
                if (nextChar === '"') {
                    currentVal += '"';
                    i++;
                } else {
                    insideQuotes = false;
                }
            } else {
                currentVal += char;
            }
        } else {
            if (char === '"') {
                insideQuotes = true;
            } else if (char === ',') {
                currentRow.push(currentVal.trim());
                currentVal = '';
            } else if (char === '\r' || char === '\n') {
                currentRow.push(currentVal.trim());
                currentVal = '';
                if (currentRow.length > 0 && (currentRow.length > 1 || currentRow[0] !== '')) {
                    rows.push(currentRow);
                }
                currentRow = [];
                if (char === '\r' && nextChar === '\n') {
                    i++;
                }
            } else {
                currentVal += char;
            }
        }
    }
    if (currentVal || currentRow.length > 0) {
        currentRow.push(currentVal.trim());
        if (currentRow.length > 0 && (currentRow.length > 1 || currentRow[0] !== '')) {
            rows.push(currentRow);
        }
    }
    
    if (rows.length === 0) {
        throw new Error("CSV file is empty");
    }
    
    // Limit to first 10,000 rows like eda.py
    const dfRows = rows.slice(1, 10001); 
    const headers = rows[0];
    const nRows = dfRows.length;
    
    // Classify columns
    const numCols = [];
    const catCols = [];
    const dtCols = [];
    
    headers.forEach((col, colIdx) => {
        const nonMissingValues = [];
        let validDates = 0;
        let validNums = 0;
        
        dfRows.forEach(row => {
            const val = row[colIdx];
            if (val !== undefined && val !== '' && val !== null) {
                nonMissingValues.push(val);
                if (!isNaN(val)) {
                    validNums++;
                }
                // Quick date check
                const dateVal = Date.parse(val);
                if (!isNaN(dateVal) && isNaN(val)) {
                    validDates++;
                }
            }
        });
        
        if (nonMissingValues.length === 0) {
            catCols.push(col);
        } else if (validNums / nonMissingValues.length > 0.9) {
            numCols.push(col);
        } else if (validDates / nonMissingValues.length > 0.5) {
            dtCols.push(col);
        } else {
            catCols.push(col);
        }
    });
    
    // Overview Shape
    const shape = { rows: nRows, columns: headers.length };
    
    // Dtypes
    const dtypeTable = headers.map(col => {
        let category = "Categorical";
        let dtypeType = "object";
        if (numCols.includes(col)) {
            category = "Numerical";
            dtypeType = "float64";
        } else if (dtCols.includes(col)) {
            category = "Datetime";
            dtypeType = "datetime64";
        }
        return { column: col, dtype: dtypeType, category };
    });
    
    // Stats Table for numeric columns
    const statsTable = [];
    numCols.forEach(col => {
        const colIdx = headers.indexOf(col);
        const vals = dfRows.map(row => Number(row[colIdx])).filter(v => !isNaN(v) && rowHasValue(v));
        if (vals.length === 0) return;
        
        vals.sort((a, b) => a - b);
        const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
        const mid = Math.floor(vals.length / 2);
        const median = vals.length % 2 !== 0 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
        
        const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (vals.length - 1 || 1);
        const std = Math.sqrt(variance);
        
        statsTable.push({
            column: col,
            mean: Number(mean.toFixed(4)),
            median: Number(median.toFixed(4)),
            std: Number(std.toFixed(4)),
            min: Number(vals[0].toFixed(4)),
            max: Number(vals[vals.length - 1].toFixed(4))
        });
    });
    
    function rowHasValue(v) {
        return v !== null && v !== undefined && v !== '';
    }
    
    // Missing values
    let missingTable = [];
    headers.forEach(col => {
        const colIdx = headers.indexOf(col);
        let cnt = 0;
        dfRows.forEach(row => {
            const val = row[colIdx];
            if (val === undefined || val === '' || val === null) {
                cnt++;
            }
        });
        
        if (cnt > 0) {
            const pct = Number((cnt / nRows * 100).toFixed(2));
            const severity = pct > 30 ? "High" : (pct > 10 ? "Medium" : "Low");
            missingTable.push({ column: col, count: cnt, percentage: pct, severity });
        }
    });
    missingTable.sort((a, b) => b.percentage - a.percentage);
    
    const dataOverview = { shape, dtype_table: dtypeTable, stats_table: statsTable, missing_table: missingTable };
    
    // Distributions & Outliers
    const distributions = [];
    const skewnessTable = [];
    const outlierTable = [];
    
    numCols.forEach(col => {
        const colIdx = headers.indexOf(col);
        const vals = dfRows.map(row => Number(row[colIdx])).filter(v => !isNaN(v) && rowHasValue(v)).sort((a, b) => a - b);
        if (vals.length === 0) return;
        
        const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
        const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (vals.length - 1 || 1);
        const std = Math.sqrt(variance) || 1;
        
        // Skewness and Kurtosis
        let skewVal = 0;
        let kurtVal = 0;
        const n = vals.length;
        if (n > 2 && std > 0) {
            let skewSum = 0;
            let kurtSum = 0;
            vals.forEach(v => {
                skewSum += Math.pow((v - mean) / std, 3);
                kurtSum += Math.pow((v - mean) / std, 4);
            });
            skewVal = (n / ((n - 1) * (n - 2))) * skewSum;
            kurtVal = (n * (n + 1) / ((n - 1) * (n - 2) * (n - 3))) * kurtSum - (3 * Math.pow(n - 1, 2) / ((n - 2) * (n - 3)));
        }
        
        // Histogram (10 bins)
        const minVal = vals[0];
        const maxVal = vals[vals.length - 1];
        const range = maxVal - minVal;
        const binWidth = range / 10 || 1;
        const histogram = [];
        
        for (let b = 0; b < 10; b++) {
            const lb = minVal + b * binWidth;
            const ub = minVal + (b + 1) * binWidth;
            let count = 0;
            vals.forEach(v => {
                if (b === 9) {
                    if (v >= lb && v <= ub) count++;
                } else {
                    if (v >= lb && v < ub) count++;
                }
            });
            histogram.push({ range: `${lb.toFixed(2)}–${ub.toFixed(2)}`, count });
        }
        
        // Boxplot Q1, Q3, median, whisker
        const getQuantile = (arr, q) => {
            const pos = (arr.length - 1) * q;
            const base = Math.floor(pos);
            const rest = pos - base;
            if (arr[base + 1] !== undefined) {
                return arr[base] + rest * (arr[base + 1] - arr[base]);
            }
            return arr[base];
        };
        
        const q1 = getQuantile(vals, 0.25);
        const q3 = getQuantile(vals, 0.75);
        const median = getQuantile(vals, 0.5);
        const iqr = q3 - q1;
        const lb = q1 - 1.5 * iqr;
        const ub = q3 + 1.5 * iqr;
        
        const boxplot = { min: minVal, q1, median, q3, max: maxVal, lower_whisker: lb, upper_whisker: ub };
        
        // Outliers
        let nOut = 0;
        vals.forEach(v => {
            if (v < lb || v > ub) nOut++;
        });
        if (nOut > 0) {
            outlierTable.push({ column: col, count: nOut, percentage: Number((nOut / n * 100).toFixed(2)) });
        }
        
        const interp = Math.abs(skewVal) < 0.5 ? "Normal" : (Math.abs(skewVal) < 1.0 ? "Moderately Skewed" : "Highly Skewed");
        skewnessTable.push({ column: col, skewness: Number(skewVal.toFixed(3)), kurtosis: Number(kurtVal.toFixed(3)), interpretation: interp });
        
        distributions.push({ column: col, skewness: Number(skewVal.toFixed(3)), kurtosis: Number(kurtVal.toFixed(3)), histogram, boxplot });
    });
    outlierTable.sort((a, b) => b.percentage - a.percentage);
    
    const featureDistributions = { distributions, skewness_table: skewnessTable, outlier_table: outlierTable };
    
    // Correlations
    const corrMatrix = {};
    const strongPairs = [];
    
    // Median-impute numeric values for correlation calculation
    const imputedNumericData = {};
    numCols.forEach(col => {
        const colIdx = headers.indexOf(col);
        const vals = dfRows.map(row => Number(row[colIdx])).filter(v => !isNaN(v) && rowHasValue(v)).sort((a, b) => a - b);
        const median = vals.length > 0 ? getQuantile(vals, 0.5) : 0;
        
        imputedNumericData[col] = dfRows.map(row => {
            const v = Number(row[colIdx]);
            return (isNaN(v) || !rowHasValue(v)) ? median : v;
        });
    });
    
    if (numCols.length > 1) {
        numCols.forEach(c1 => {
            corrMatrix[c1] = {};
        });
        
        for (let i = 0; i < numCols.length; i++) {
            const c1 = numCols[i];
            const arr1 = imputedNumericData[c1];
            const mean1 = arr1.reduce((a, b) => a + b, 0) / arr1.length;
            const variance1 = arr1.reduce((a, b) => a + Math.pow(b - mean1, 2), 0);
            
            for (let j = 0; j < numCols.length; j++) {
                const c2 = numCols[j];
                const arr2 = imputedNumericData[c2];
                const mean2 = arr2.reduce((a, b) => a + b, 0) / arr2.length;
                const variance2 = arr2.reduce((a, b) => a + Math.pow(b - mean2, 2), 0);
                
                let cov = 0;
                for (let r = 0; r < arr1.length; r++) {
                    cov += (arr1[r] - mean1) * (arr2[r] - mean2);
                }
                
                const denom = Math.sqrt(variance1 * variance2);
                const rVal = denom !== 0 ? cov / denom : 0;
                
                corrMatrix[c1][c2] = Number(rVal.toFixed(3));
                
                if (i < j && Math.abs(rVal) > 0.7) {
                    strongPairs.push({ feature_a: c1, feature_b: c2, correlation: Number(rVal.toFixed(3)) });
                }
            }
        }
        strongPairs.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
    }
    
    function getQuantile(arr, q) {
        const pos = (arr.length - 1) * q;
        const base = Math.floor(pos);
        const rest = pos - base;
        if (arr[base + 1] !== undefined) {
            return arr[base] + rest * (arr[base + 1] - arr[base]);
        }
        return arr[base];
    }
    
    // Target Relationships
    const targetRelationships = [];
    const targetRelationshipsCat = [];
    
    if (targetColumn && headers.includes(targetColumn)) {
        const targetIdx = headers.indexOf(targetColumn);
        const cleanRows = dfRows.filter(row => rowHasValue(row[targetIdx]));
        
        let isNumTarget = false;
        const targetVals = cleanRows.map(row => Number(row[targetIdx]));
        const validNumTargets = targetVals.filter(v => !isNaN(v));
        if (validNumTargets.length / cleanRows.length > 0.9) {
            const uniqueValCount = new Set(validNumTargets).size;
            if (uniqueValCount > 20) {
                isNumTarget = true;
            }
        }
        
        // 1. Numeric vs Target (Scatter)
        numCols.slice(0, 5).forEach(col => {
            if (col === targetColumn) return;
            const colIdx = headers.indexOf(col);
            
            // Collect valid rows
            const points = [];
            cleanRows.forEach(row => {
                const xVal = Number(row[colIdx]);
                const yVal = Number(row[targetIdx]);
                if (!isNaN(xVal) && !isNaN(yVal) && rowHasValue(row[colIdx])) {
                    points.push({ x: xVal, y: yVal });
                }
            });
            
            // Downsample scatter plot to 200 points
            const sampleSize = Math.min(200, points.length);
            const sampledPoints = [];
            const step = points.length / sampleSize || 1;
            for (let s = 0; s < sampleSize; s++) {
                const idx = Math.floor(s * step);
                if (points[idx]) sampledPoints.push(points[idx]);
            }
            
            targetRelationships.push({ feature: col, points: sampledPoints });
        });
        
        // 2. Categorical vs Target
        catCols.slice(0, 5).forEach(col => {
            if (col === targetColumn) return;
            const colIdx = headers.indexOf(col);
            
            if (isNumTarget) {
                // Category vs Numeric target -> Boxplot stats per category
                const groups = {};
                cleanRows.forEach(row => {
                    const catVal = String(row[colIdx]);
                    const tgtVal = Number(row[targetIdx]);
                    if (rowHasValue(row[colIdx]) && !isNaN(tgtVal)) {
                        if (!groups[catVal]) groups[catVal] = [];
                        groups[catVal].push(tgtVal);
                    }
                });
                
                const groupedBoxplots = [];
                Object.keys(groups).forEach(catVal => {
                    const vals = groups[catVal].sort((a, b) => a - b);
                    if (vals.length < 5) return;
                    
                    const q1 = getQuantile(vals, 0.25);
                    const q3 = getQuantile(vals, 0.75);
                    const median = getQuantile(vals, 0.5);
                    const iqr = q3 - q1;
                    
                    groupedBoxplots.push({
                        category: catVal,
                        min: vals[0],
                        q1,
                        median,
                        q3,
                        max: vals[vals.length - 1],
                        lower_whisker: q1 - 1.5 * iqr,
                        upper_whisker: q3 + 1.5 * iqr
                    });
                });
                targetRelationshipsCat.push({ feature: col, type: "regression", data: groupedBoxplots });
            } else {
                // Category vs Category target -> Stacked Bar / Crosstab count
                const uniqueTargets = Array.from(new Set(cleanRows.map(row => String(row[targetIdx])))).slice(0, 10);
                const uniqueCats = Array.from(new Set(cleanRows.map(row => String(row[colIdx])))).slice(0, 10);
                
                const data = [];
                uniqueCats.forEach(catVal => {
                    const entry = { category: catVal };
                    uniqueTargets.forEach(tgtVal => {
                        entry[tgtVal] = 0;
                    });
                    
                    cleanRows.forEach(row => {
                        if (String(row[colIdx]) === catVal) {
                            const tgtVal = String(row[targetIdx]);
                            if (entry[tgtVal] !== undefined) {
                                entry[tgtVal]++;
                            }
                        }
                    });
                    data.push(entry);
                });
                
                targetRelationshipsCat.push({
                    feature: col,
                    type: "classification",
                    classes: uniqueTargets,
                    data
                });
            }
        });
    }
    
    const correlations = { matrix: corrMatrix, strong_pairs: strongPairs, target_relationships: targetRelationships, target_relationships_cat: targetRelationshipsCat };
    
    // Insights & Recommendations
    const insights = [];
    const recommendations = [];
    let modelRecommendation = {};
    
    // Missing values
    missingTable.forEach(m => {
        insights.push({ type: "missing", severity: m.severity, text: `Column '${m.column}' has ${m.percentage}% missing values (${m.severity} severity).` });
        if (m.percentage > 30) {
            recommendations.push({ action: "Drop or impute column", detail: `'${m.column}' exceeds 30% missing — consider dropping or advanced imputation.` });
        } else {
            recommendations.push({ action: "Impute missing values", detail: `Fill '${m.column}' using median (numeric) or mode (categorical).` });
        }
    });
    
    // Skewness
    skewnessTable.forEach(sk => {
        if (sk.interpretation === "Highly Skewed") {
            insights.push({ type: "skew", severity: "Medium", text: `Feature '${sk.column}' is highly skewed (skew=${sk.skewness}).` });
            recommendations.push({ action: "Apply log or power transformation", detail: `Use np.log1p or PowerTransformer on '${sk.column}'.` });
        }
    });
    
    // Outliers
    outlierTable.forEach(o => {
        const sev = o.percentage > 10 ? "High" : "Low";
        insights.push({ type: "outlier", severity: sev, text: `Feature '${o.column}' has ${o.percentage}% outliers (${o.count} rows) by IQR.` });
        if (o.percentage > 5) {
            recommendations.push({ action: "Investigate or cap outliers", detail: `Either winsorise '${o.column}' or verify data source.` });
        }
    });
    
    // Correlations
    strongPairs.slice(0, 5).forEach(sp => {
        const direction = sp.correlation > 0 ? "positive" : "negative";
        insights.push({ type: "correlation", severity: "Low", text: `Strong ${direction} correlation (${sp.correlation}) between '${sp.feature_a}' and '${sp.feature_b}'.` });
    });
    if (strongPairs.length > 0) {
        recommendations.push({ action: "Remove redundant features", detail: "Highly correlated features (|r|>0.7) add multicollinearity. Consider dropping one from each pair." });
    }
    
    // Model Recommendation
    if (targetColumn && headers.includes(targetColumn)) {
        const targetIdx = headers.indexOf(targetColumn);
        const ts = dfRows.map(row => row[targetIdx]).filter(rowHasValue);
        
        let isNum = false;
        const validNums = ts.map(Number).filter(v => !isNaN(v));
        if (validNums.length / ts.length > 0.9) {
            const uniqueValCount = new Set(validNums).size;
            if (uniqueValCount > 20) {
                isNum = true;
            }
        }
        
        if (isNum) {
            modelRecommendation = { model: "XGBoost Regressor", task: "Regression", reason: "Robust gradient-boosted trees work well for continuous targets on structured data." };
        } else {
            // Imbalance check
            const counts = {};
            ts.forEach(val => {
                counts[val] = (counts[val] || 0) + 1;
            });
            const values = Object.values(counts);
            if (values.length === 2) {
                const maxVal = Math.max(...values);
                const minVal = Math.min(...values);
                const ratio = Number((maxVal / minVal).toFixed(2));
                if (ratio > 3) {
                    insights.push({ type: "imbalance", severity: "High", text: `Target variable is imbalanced (ratio ≈ ${ratio}:1). Minority class may be underrepresented.` });
                    recommendations.push({ action: "Balance the dataset", detail: "Use SMOTE, class_weight='balanced', or under-sampling strategies." });
                }
            }
            modelRecommendation = { model: "XGBoost / Random Forest", task: "Classification", reason: "Tree-based ensembles handle class imbalance and nonlinear boundaries effectively." };
        }
    }
    
    const insightsRecommendations = { insights, recommendations, model_recommendation: modelRecommendation };
    
    return {
        status: "success",
        data_overview: dataOverview,
        feature_distributions: featureDistributions,
        correlations,
        insights_recommendations: insightsRecommendations
    };
}
