import type {DownloadProgress as DownloadProgressType} from '../../service/downloadService.ts';

interface DownloadProgressProps {
    fileName: string;
    progress: DownloadProgressType | null;
    error: string | null;
    onCancel: () => void;
    isVisible: boolean;
}

const DownloadProgress = ({fileName, progress, error, onCancel, isVisible}: DownloadProgressProps) => {
    if (!isVisible) return null;

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    };

    return (
        <div
            className="fixed bottom-5 right-5 z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 animate-fade-in-up">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h4 className="text-sm font-bold text-gray-800 truncate w-48" title={fileName}>
                        Downloading: {fileName}
                    </h4>
                    {!error && progress && (
                        <p className="text-xs text-gray-500">
                            {formatBytes(progress.downloadedBytes)} / {formatBytes(progress.totalBytes)}
                        </p>
                    )}
                </div>
                <button
                    onClick={onCancel}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Cancel"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"/>
                    </svg>
                </button>
            </div>

            {error ? (
                <div className="bg-red-50 text-red-700 p-2 rounded text-xs mb-2">
                    Error: {error}
                </div>
            ) : progress ? (
                <>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>{progress.percentage}%</span>
                        <span>{progress.throughputMbps?.toFixed(2) || '--'} Mbps</span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                            style={{width: `${progress.percentage}%`}}
                        />
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-gray-400">
                        <span>Threads: {progress.activeThreads}/{progress.maxThreads}</span>
                        <span>ETA: {(progress.estimatedTimeRemainingMs / 1000).toFixed(0)}s</span>
                    </div>
                </>
            ) : (
                <div className="flex items-center justify-center py-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-xs text-gray-500">Starting...</span>
                </div>
            )}
        </div>
    );
};

export default DownloadProgress;