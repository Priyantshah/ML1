export async function imputeCSVJS(fileUrl, column, strategy) {
    const response = await fetch(fileUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch CSV from URL: ${response.statusText}`);
    }
    const text = await response.text();
    
    const rows = [];
    let currentRow = [];
    let currentVal = '';
    let insideQuotes = false;
    
    // Parse CSV line by line, handling quotes and commas
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
    
    const headers = rows[0];
    const columnsToProcess = (column && column !== "ALL") ? [column] : headers;
    
    const results = [];
    const imputedIndicesMap = {};
    let totalImputed = 0;
    
    // Process columns
    columnsToProcess.forEach(col => {
        const colIdx = headers.indexOf(col);
        if (colIdx === -1) return;
        
        const missingIndices = [];
        const nonMissingValues = [];
        
        for (let r = 1; r < rows.length; r++) {
            const val = rows[r][colIdx];
            if (val === undefined || val === '' || val === null) {
                missingIndices.push(r - 1); // 0-indexed relative to data rows
            } else {
                nonMissingValues.push(val);
            }
        }
        
        if (missingIndices.length === 0) {
            return;
        }
        
        // Auto-detect strategy
        let colStrategy = strategy;
        if (!colStrategy || colStrategy === "auto") {
            const isNumeric = nonMissingValues.every(val => !isNaN(val) && val !== '');
            colStrategy = isNumeric ? "median" : "mode";
        }
        
        let fillValue = null;
        if (colStrategy === "mean") {
            const numbers = nonMissingValues.map(Number).filter(n => !isNaN(n));
            if (numbers.length === 0) {
                throw new Error(`Cannot calculate mean for non-numeric column '${col}'.`);
            }
            fillValue = numbers.reduce((a, b) => a + b, 0) / numbers.length;
        } else if (colStrategy === "median") {
            const numbers = nonMissingValues.map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b);
            if (numbers.length === 0) {
                throw new Error(`Cannot calculate median for non-numeric column '${col}'.`);
            }
            const mid = Math.floor(numbers.length / 2);
            fillValue = numbers.length % 2 !== 0 ? numbers[mid] : (numbers[mid - 1] + numbers[mid]) / 2;
        } else if (colStrategy === "mode") {
            const counts = {};
            let maxCount = 0;
            nonMissingValues.forEach(val => {
                counts[val] = (counts[val] || 0) + 1;
                if (counts[val] > maxCount) {
                    maxCount = counts[val];
                    fillValue = val;
                }
            });
            if (fillValue !== null && !isNaN(fillValue) && fillValue !== '') {
                fillValue = Number(fillValue);
            }
        } else {
            throw new Error(`Unknown strategy: ${colStrategy}`);
        }
        
        missingIndices.forEach(idx => {
            rows[idx + 1][colIdx] = String(fillValue);
        });
        
        totalImputed += missingIndices.length;
        imputedIndicesMap[col] = missingIndices;
        
        results.push({
            column: col,
            missing_count: missingIndices.length,
            strategy: colStrategy,
            fill_value: fillValue,
            imputed_indices: missingIndices
        });
    });
    
    // Format rows back to CSV string
    const csvContent = rows.map(row => 
        row.map(val => {
            if (val === null || val === undefined) return '';
            const valStr = String(val);
            if (valStr.includes(',') || valStr.includes('"') || valStr.includes('\n') || valStr.includes('\r')) {
                return `"${valStr.replace(/"/g, '""')}"`;
            }
            return valStr;
        }).join(',')
    ).join('\n');
    
    return {
        status: "success",
        message: `Successfully imputed ${totalImputed} missing values across ${results.length} columns.`,
        imputed_count: totalImputed,
        imputed_indices: columnsToProcess.length > 1 ? imputedIndicesMap : (results[0] ? results[0].imputed_indices : []),
        strategy_used: columnsToProcess.length > 1 ? "mixed" : (results[0] ? results[0].strategy : "auto"),
        details: results,
        csvContent
    };
}
