import type {DownloadProgress as DownloadProgressType} from '../../service/downloadService.ts';
import {CloseOutlined, LoadingOutlined} from '@ant-design/icons';
import {Progress} from 'antd';
import {FileViewUtil} from "../../utils/FileViewUtil.ts";

interface DownloadProgressProps {
    fileName: string;
    progress: DownloadProgressType | null;
    error: string | null;
    onCancel: () => void;
    isVisible: boolean;
}

const DownloadProgress = ({fileName, progress, error, onCancel, isVisible}: DownloadProgressProps) => {
    if (!isVisible) return null;

    return (
        <div
            className="fixed bottom-5 right-5 z-50 w-80 bg-card rounded-xl shadow-2xl border border-border p-4 animate-in slide-in-from-bottom-5 duration-300 bg-blue-100">
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-card-foreground truncate" title={fileName}>
                        Downloading: {fileName}
                    </h4>
                    {!error && progress && (
                        <p className="text-xs text-muted-foreground mt-1">
                            {FileViewUtil.formatBytes(progress.downloadedBytes)} / {FileViewUtil.formatBytes(progress.totalBytes)}
                        </p>
                    )}
                </div>
                <button
                    onClick={onCancel}
                    className="ml-2 w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Cancel"
                >
                    <CloseOutlined className="text-sm"/>
                </button>
            </div>

            {error ? (
                <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-lg text-xs font-medium">
                    Error: {error}
                </div>
            ) : progress ? (
                <div className="space-y-3">
                    <Progress
                        percent={progress.percentage}
                        strokeColor={{
                            '0%': 'hsl(var(--primary))',
                            '100%': 'hsl(var(--info))',
                        }}
                        trailColor="hsl(var(--muted))"
                        size="small"
                    />

                    <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>
              Threads: {progress.activeThreads}/{progress.maxThreads}
            </span>
                        <span>{progress.throughputMbps?.toFixed(2) || '--'} Mbps</span>
                        <span>ETA: {(progress.estimatedTimeRemainingMs / 1000).toFixed(0)}s</span>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center py-3 gap-2">
                    <LoadingOutlined className="text-primary"/>
                    <span className="text-xs text-muted-foreground">Starting...</span>
                </div>
            )}
        </div>
    );
};

export default DownloadProgress;
