/**
 * Utility functions for exporting data
 */

export function exportToCSV(data: any[], filename: string) {
    if (!data || data.length === 0) {
        console.warn('No data to export');
        return;
    }

    // specific flattening logic could go here if needed
    // for now, generic flattening
    const flatData = data.map(row => flattenObject(row));

    const headers = Object.keys(flatData[0]);
    const csvContent = [
        headers.join(','), // Header row
        ...flatData.map(row => headers.map(header => {
            const val = row[header];
            // Handle strings with commas, quotes, etc.
            const stringVal = val === null || val === undefined ? '' : String(val);
            const escaped = stringVal.replace(/"/g, '""'); // Escape double quotes
            return `"${escaped}"`;
        }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Helper to flatten nested objects for CSV
function flattenObject(obj: any, prefix = '', res: any = {}) {
    for (const key in obj) {
        if (!obj.hasOwnProperty(key)) continue;
        const propName = prefix ? `${prefix}_${key}` : key;
        const val = obj[key];

        if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
            if (Array.isArray(val)) {
                // Join arrays with semicolon
                res[propName] = val.map(v => (typeof v === 'object' ? JSON.stringify(v) : v)).join('; ');
            } else {
                flattenObject(val, propName, res);
            }
        } else {
            res[propName] = val;
        }
    }
    return res;
}
