import { useState } from 'react';
import { downloadService } from '../service/downloadService';
import type { DownloadProgress } from '../service/downloadService';

// object test
const TEST_OBJECT_NAME = 'e8081fea-290b-46d2-9cc9-53a58ffb030d_CP210x_Windows_Drivers.zip';

export default function DownloadButton() {
    const [isDownloading, setIsDownloading] = useState(false);
    const [progress, setProgress] = useState<DownloadProgress | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleDownload = async () => {
        setIsDownloading(true);
        setError(null);
        setProgress(null);

        try {
            await downloadService.downloadAndSave(
                TEST_OBJECT_NAME,
                undefined,
                (downloadProgress) => {
                    setProgress(downloadProgress);
                }
            );
            console.log('download thanh cong!');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Download failed';
            if (!errorMessage.includes('cancelled')) {
                setError(errorMessage);
            }
            console.error('loi download:', err);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleCancel = () => {
        downloadService.cancelDownload();
        setIsDownloading(false);
        setProgress(null);
    };

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    };

    return (
        <div className="p-4 max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4">test download</h2>
            
            <p className="text-sm text-gray-600 mb-4">
                file: <code className="bg-gray-100 px-1 rounded">{TEST_OBJECT_NAME}</code>
            </p>

            {progress && (
                <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                        <span>{progress.percentage}%</span>
                        <span>{formatBytes(progress.downloadedBytes)} / {formatBytes(progress.totalBytes)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                            className="bg-green-600 h-3 rounded-full transition-all"
                            style={{ width: `${progress.percentage}%` }}
                        />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {progress.throughputMbps?.toFixed(2) || '--'} Mbps | 
                        luong: {progress.activeThreads}/{progress.maxThreads}
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">
                    error: {error}
                </div>
            )}

            <div className="flex gap-2">
                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                    {isDownloading ? 'downloading...' : 'download'}
                </button>

                {isDownloading && (
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        cancel
                    </button>
                )}
            </div>
        </div>
    );
}