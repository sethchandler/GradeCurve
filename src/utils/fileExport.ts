/**
 * Robust file saving across browsers. 
 * Uses the modern File System Access API (showSaveFilePicker) where available
 * for a standard "Save As" experience, with a robust anchor-tag fallback.
 */
export async function saveFile(blob: Blob, suggestedName: string) {
    console.log(`[GradeCurve] Attempting to save: ${suggestedName}`);

    // 1. Try modern File System Access API (Standard Save As Dialog)
    if ('showSaveFilePicker' in window) {
        try {
            // @ts-ignore - Some TS environments don't have the File System Access types yet
            const handle = await window.showSaveFilePicker({
                suggestedName,
                types: getFileTypes(suggestedName),
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            console.log(`[GradeCurve] File saved successfully via system picker.`);
            return;
        } catch (err) {
            if ((err as Error).name === 'AbortError') {
                console.log(`[GradeCurve] Save cancelled by user.`);
                return;
            }
            // If picker fails for security/ gesture reasons, we MUST fall back immediately
            console.warn("[GradeCurve] Save picker failed, using standard download fallback:", err);
        }
    }

    // 2. Fallback: Standard and robust anchor-tag download
    // This is where UUIDs happen if not handled perfectly.
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    // Make the link visible but zero-sized to satisfy strict browser gesture checks
    link.setAttribute('style', 'position:fixed; top:-99px; left:-99px; visibility:hidden;');
    link.href = url;
    link.download = suggestedName;

    document.body.appendChild(link);

    // Some browsers need the thread to breathe to recognize the filename attribute
    requestAnimationFrame(() => {
        link.click();
        console.log(`[GradeCurve] Fallback download triggered for: ${suggestedName}`);

        // Clean up with a generous delay to allow the browser to pick up the blob
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 2000);
    });
}

function getFileTypes(filename: string) {
    const ext = filename.split('.').pop()?.toLowerCase();

    if (ext === 'xlsx') {
        return [{
            description: 'Excel Spreadsheet',
            accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }
        }];
    }
    if (ext === 'csv') {
        return [{
            description: 'CSV File',
            accept: { 'text/csv': ['.csv'] }
        }];
    }
    if (ext === 'pdf') {
        return [{
            description: 'PDF Document',
            accept: { 'application/pdf': ['.pdf'] }
        }];
    }
    if (ext === 'md') {
        return [{
            description: 'Markdown File',
            accept: { 'text/markdown': ['.md'] }
        }];
    }
    return [];
}
