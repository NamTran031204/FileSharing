export class FileViewUtil {
    static formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    }

    static getFileGroup(mimeType: string): string {
        const typePrefix = mimeType.split('/')[0];

        if (typePrefix === 'image') return 'image';
        if (typePrefix === 'video') return 'video';
        if (typePrefix === 'audio') return 'audio';

        if (typePrefix === 'text') {
            if (mimeType.includes('html') || mimeType.includes('css') ||
                mimeType.includes('javascript') || mimeType.includes('xml')) {
                return 'code';
            }
            return 'text';
        }

        if (typePrefix === 'application') {
            if (mimeType.includes('pdf') || mimeType.includes('word') ||
                mimeType.includes('excel') || mimeType.includes('sheet') ||
                mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
                return 'document';
            }

            if (mimeType.includes('zip') || mimeType.includes('rar') ||
                mimeType.includes('tar') || mimeType.includes('gzip') ||
                mimeType.includes('compressed') || mimeType.includes('7z')) {
                return 'archive';
            }

            if (mimeType.includes('json') || mimeType.includes('xml')) {
                return 'code';
            }
        }

        return 'other';
    }
}