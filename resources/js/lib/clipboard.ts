/** Prefer the permission-aware API; fall back for Firefox restrictions and non-HTTPS development. */
export async function copyText(text: string): Promise<void> {
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return;
        }
    } catch { /* permission denied: try copying within the current user interaction */ }
    const focused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const selection = window.getSelection();
    const ranges = selection ? Array.from({ length: selection.rangeCount }, (_, i) => selection.getRangeAt(i).cloneRange()) : [];
    const field = document.createElement('textarea');
    field.value = text;
    field.readOnly = true;
    field.style.cssText = 'position:fixed;left:0;top:0;opacity:0;pointer-events:none';
    document.body.append(field);
    try {
        field.select();
        if (!document.execCommand('copy')) throw new Error('Copy was blocked by your browser. Select the text and copy it manually.');
    } finally {
        field.remove();
        focused?.focus({ preventScroll: true });
        if (selection) {
            selection.removeAllRanges();
            ranges.forEach((range) => selection.addRange(range));
        }
    }
}
