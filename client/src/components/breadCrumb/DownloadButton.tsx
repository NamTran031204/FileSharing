import {useEffect, useRef, useState} from 'react';
import type {DownloadProgress as DownloadProgressType} from '../../service/downloadService.ts';
import {downloadService} from '../../service/downloadService.ts';
import {VerticalAlignBottomOutlined} from '@ant-design/icons';
import DownloadProgress from "../uploadDownloadProgress/DownloadProgress.tsx";

interface DownloadButtonProps {
    objectName: string;
    fileName: string;
    fileSize: number;
    autoStart?: boolean;
    onComplete?: () => void;
}

export default function DownloadButton(props: DownloadButtonProps) {
    const {fileName, autoStart = false} = props;

    const [isDownloading, setIsDownloading] = useState(false);
    const [progress, setProgress] = useState<DownloadProgressType | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showProgress, setShowProgress] = useState(false);

    const hasStartedRef = useRef(false);

    useEffect(() => {
        if (autoStart && !hasStartedRef.current) {
            hasStartedRef.current = true;
            startDownload();
        }
        return () => {
            // Không reset hasStartedRef ở đây để tránh chạy lại khi Strict Mode remount
        };
    }, [autoStart]);

    const startDownload = async () => {
        if (isDownloading) return;

        setIsDownloading(true);
        setShowProgress(true);
        setError(null);
        setProgress(null);

        try {
            console.log("file name: " + props.fileName);
            await downloadService.downloadAndSave(
                props.objectName,
                props.fileName,
                (downloadProgress) => {
                    setProgress(downloadProgress);
                }
            );
            console.log('Download thành công!');
            setTimeout(() => setShowProgress(false), 3000);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Download failed';
            if (!errorMessage.includes('cancelled')) {
                setError(errorMessage);
            }
            console.error('Lỗi download:', err);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDownload = async () => {
        await startDownload();
    };

    const handleCancel = () => {
        downloadService.cancelDownload();
        setIsDownloading(false);
        setError('Cancelled by user');
        setTimeout(() => setShowProgress(false), 2000);
    };

    if (autoStart) {
        return (
            <DownloadProgress
                isVisible={showProgress}
                fileName={fileName}
                progress={progress}
                error={error}
                onCancel={handleCancel}
            />
        );
    }

    return (
        <>
            <button
                onClick={handleDownload}
                disabled={isDownloading}
                className={`
                    w-full h-full
                    ${isDownloading
                    ? 'bg-blue-100 text-blue-600 cursor-wait'
                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md'
                }
                `}
                title="Download File"
            >
                <VerticalAlignBottomOutlined className={isDownloading ? "animate-bounce" : ""}/>
            </button>

            <DownloadProgress
                isVisible={showProgress}
                fileName={props.fileName}
                progress={progress}
                error={error}
                onCancel={handleCancel}
            />
        </>
    );
}