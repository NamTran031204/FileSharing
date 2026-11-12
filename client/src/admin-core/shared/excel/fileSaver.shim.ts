export const saveAs = (data: Blob | string, filename?: string) => {
    const url = typeof data === 'string' ? data : URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename ?? 'download';
    a.click();
    if (typeof data !== 'string') URL.revokeObjectURL(url);
};
export default {saveAs};
