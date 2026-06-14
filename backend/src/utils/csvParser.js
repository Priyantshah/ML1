export async function parseCSVJS(fileUrl) {
    const response = await fetch(fileUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch CSV from URL: ${response.statusText}`);
    }
    const text = await response.text();
    
    const lines = [];
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
                    i++; // skip next quote
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
                    lines.push(currentRow);
                }
                currentRow = [];
                if (char === '\r' && nextChar === '\n') {
                    i++; // skip \n
                }
            } else {
                currentVal += char;
            }
        }
    }
    if (currentVal || currentRow.length > 0) {
        currentRow.push(currentVal.trim());
        if (currentRow.length > 0 && (currentRow.length > 1 || currentRow[0] !== '')) {
            lines.push(currentRow);
        }
    }
    
    if (lines.length === 0) {
        throw new Error("CSV file is empty");
    }
    
    const headers = lines[0];
    const columns = headers;
    const rowCount = lines.length - 1;
    const columnCount = headers.length;
    
    // Initialize stats
    const missingCounts = {};
    const dtypes = {};
    columns.forEach(col => {
        missingCounts[col] = 0;
        dtypes[col] = 'int64'; // default type
    });
    
    const previewRows = lines.slice(1, 101); // up to 100 rows
    const preview = [];
    
    // Helper to determine type
    const checkType = (val) => {
        if (val === '' || val === null || val === undefined) return 'null';
        if (!isNaN(val) && val.trim() !== '') {
            if (val.includes('.')) return 'float64';
            return 'int64';
        }
        return 'object';
    };
    
    // Process all rows to compute rowCount and missingCounts
    for (let r = 1; r < lines.length; r++) {
        const row = lines[r];
        columns.forEach((col, cIdx) => {
            const val = row[cIdx];
            if (val === undefined || val === '' || val === null) {
                missingCounts[col]++;
            } else {
                const type = checkType(val);
                if (type === 'object') {
                    dtypes[col] = 'object';
                } else if (type === 'float64' && dtypes[col] === 'int64') {
                    dtypes[col] = 'float64';
                }
            }
        });
    }
    
    // Build preview list of objects
    previewRows.forEach(row => {
        const obj = {};
        columns.forEach((col, cIdx) => {
            let val = row[cIdx];
            if (val === undefined || val === '') {
                val = null;
            } else {
                if (!isNaN(val)) {
                    val = Number(val);
                }
            }
            obj[col] = val;
        });
        preview.push(obj);
    });
    
    return {
        columns,
        rowCount,
        columnCount,
        dtypes,
        preview,
        missingCounts
    };
}
