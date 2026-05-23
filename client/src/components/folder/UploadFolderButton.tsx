import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Alert, Button, Progress, Tag} from 'antd';
import {
    CheckCircleOutlined,
    CloudUploadOutlined,
    CloseCircleOutlined,
    FolderOpenOutlined,
    LoadingOutlined,
} from '@ant-design/icons';
import {observer} from 'mobx-react-lite';
import {FileViewUtil} from '../../utils/FileViewUtil.ts';
import {
    buildFolderManifest,
    type FileWithPath,
    type FolderManifest,
} from '../../utils/folderUploadParser.ts';
import {useStore} from '../../store';
import type {UploadJobStatus} from '../../store/uploadManagerStore.ts';

const phaseLabelMap: Record<UploadJobStatus, string> = {
    DRAFT: 'Ready to create tree',
    READY: 'Folder tree created',
    QUEUED: 'Queued',
    RUNNING: 'Uploading files',
    COMPLETED: 'Completed',
    PARTIAL_FAILED: 'Partial failed',
    FAILED: 'Failed',
    CANCELLED: 'Cancelled',
};

const formatTime = (ms: number): string => {
    if (!ms || ms <= 0) return '--';
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
};

interface UploadFolderButtonProps {
    parentFolderId?: string;
    baseFolderPath?: string;
    onSuccess?: () => void;
}

const UploadFolderButton = observer(({ parentFolderId, baseFolderPath, onSuccess }: UploadFolderButtonProps) => {
    const {sessionStore, uploadManagerStore} = useStore();

    const projectId = sessionStore.currentProjectId;

    // Local UI state: only folder selection & browser API
    const [selectedFolderName, setSelectedFolderName] = useState<string | null>(null);
    const [folderManifest, setFolderManifest] = useState<FolderManifest | null>(null);
    const [parseError, setParseError] = useState<string | null>(null);
    const [jobId, setJobId] = useState<string | null>(null);
    const [reportedSuccessJobId, setReportedSuccessJobId] = useState<string | null>(null);

    const job = uploadManagerStore.getJob(jobId);
    const currentItem = jobId ? uploadManagerStore.jobCurrentItem(jobId) : undefined;
    const overallPercent = jobId ? uploadManagerStore.jobOverallPercent(jobId) : 0;
    const showProgress = jobId ? uploadManagerStore.jobShowProgress(jobId) : false;
    const canCreateTree = jobId ? uploadManagerStore.jobCanCreateTree(jobId) : false;
    const canStartUpload = jobId ? uploadManagerStore.jobCanStartUpload(jobId) : false;

    const isCreatingTree = job?.isCreatingTree ?? false;
    const isUploading = job?.status === 'RUNNING';
    const totalFiles = folderManifest?.totalFiles ?? 0;

    const jobStatus = job?.status;
    const reportedRef = useRef(reportedSuccessJobId);
    reportedRef.current = reportedSuccessJobId;

    useEffect(() => {
        if (!jobId || jobStatus !== 'COMPLETED') return;
        if (reportedRef.current === jobId) return;
        setReportedSuccessJobId(jobId);
        onSuccess?.();
    }, [jobId, jobStatus, onSuccess]);

    const directoryPicker =
        (window as Window & {showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>})
            .showDirectoryPicker;

    const resetState = () => {
        setSelectedFolderName(null);
        setFolderManifest(null);
        setParseError(null);
        setJobId(null);
    };

    const collectFilesFromDirectory = useCallback(
        async (directoryHandle: FileSystemDirectoryHandle): Promise<FileWithPath[]> => {
            const files: FileWithPath[] = [];
            const rootName = directoryHandle.name;
            const seen = new Set<string>();

            const walk = async (handle: FileSystemDirectoryHandle, currentPath: string) => {
                for await (const entry of handle.values()) {
                    if (entry.kind === 'file') {
                        const file = await entry.getFile();
                        const relativePath = `${currentPath}/${file.name}`;
                        if (!seen.has(relativePath)) {
                            seen.add(relativePath);
                            files.push({file, relativePath});
                        }
                    }
                    if (entry.kind === 'directory') {
                        await walk(entry, `${currentPath}/${entry.name}`);
                    }
                }
            };

            await walk(directoryHandle, rootName);
            return files;
        },
        []
    );

    const handleSelectFolder = useCallback(async () => {
        if (!directoryPicker) {
            setParseError('Folder picker is not supported in this browser.');
            return;
        }

        resetState();

        try {
            const handle = await directoryPicker();
            const rootName = handle.name;
            const files = await collectFilesFromDirectory(handle);
            const manifest = buildFolderManifest(rootName, files);

            setSelectedFolderName(rootName);
            setFolderManifest(manifest);

            // Create folder job immediately so the UI has a status to display
            const id = uploadManagerStore.createFolderJob(manifest, {
                projectId,
                parentFolderId: parentFolderId,
                baseFolderPath: baseFolderPath,
            });
            setJobId(id);
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') return;
            setParseError(error instanceof Error ? error.message : 'Failed to parse folder');
        }
    }, [collectFilesFromDirectory, baseFolderPath, parentFolderId, directoryPicker, projectId, uploadManagerStore]);

    const handleCreateTree = useCallback(() => {
        if (!jobId) return;
        uploadManagerStore.createTree(jobId);
    }, [jobId, uploadManagerStore]);

    const handleStartUpload = useCallback(() => {
        if (!jobId) return;
        uploadManagerStore.start(jobId);
    }, [jobId, uploadManagerStore]);

    const handleCancelUpload = useCallback(() => {
        if (!jobId) return;
        uploadManagerStore.cancel(jobId);
    }, [jobId, uploadManagerStore]);

    const statusTag = useMemo(() => {
        if (!job) return null;

        const label = job.isCreatingTree ? 'Creating folder tree' : phaseLabelMap[job.status];
        const colorClass =
            job.status === 'FAILED' || job.status === 'PARTIAL_FAILED'
                ? 'bg-destructive/10 text-destructive'
                : job.status === 'COMPLETED'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted/50 text-foreground';

        return <Tag className={`border border-border px-2 py-1 ${colorClass}`}>{label}</Tag>;
    }, [job]);

    return (
        <div className="w-full max-w-3xl rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">Upload Folder</h2>
                    <p className="text-sm text-muted-foreground">
                        Select a folder, create the tree, then upload files sequentially.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {statusTag}
                    <Button
                        icon={<FolderOpenOutlined/>}
                        onClick={handleSelectFolder}
                        className="bg-card text-foreground border border-border hover:border-secondary"
                    >
                        Select Folder
                    </Button>
                </div>
            </div>

            {parseError && (
                <Alert
                    message="Folder parse error"
                    description={parseError}
                    type="error"
                    showIcon
                    className="mt-4"
                />
            )}

            {folderManifest && job && (
                <div className="mt-5 rounded-lg border border-border bg-background p-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 text-sm text-foreground">
                            <CheckCircleOutlined className="text-primary"/>
                            <span>Selected folder:</span>
                            <span className="font-semibold">{selectedFolderName}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Folders: <span className="text-foreground font-semibold">{folderManifest.totalFolders}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Files: <span className="text-foreground font-semibold">{folderManifest.totalFiles}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Size: <span className="text-foreground font-semibold">{FileViewUtil.formatBytes(folderManifest.totalBytes)}</span>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                            onClick={handleCreateTree}
                            disabled={!canCreateTree}
                            loading={isCreatingTree}
                            icon={isCreatingTree ? <LoadingOutlined/> : <CloudUploadOutlined/>}
                            className="bg-primary text-primary-foreground hover:opacity-90"
                        >
                            Create Folder Tree
                        </Button>

                        <Button
                            onClick={handleStartUpload}
                            disabled={!canStartUpload}
                            icon={<CloudUploadOutlined/>}
                            className="bg-card text-foreground border border-border hover:border-secondary"
                        >
                            Start Upload
                        </Button>

                        {isUploading && (
                            <Button
                                onClick={handleCancelUpload}
                                icon={<CloseCircleOutlined/>}
                                className="bg-card text-destructive border border-border hover:border-destructive"
                            >
                                Cancel
                            </Button>
                        )}
                    </div>

                    {job.error.treeError && (
                        <Alert
                            message="Folder tree error"
                            description={job.error.treeError}
                            type="error"
                            showIcon
                            className="mt-4"
                        />
                    )}
                </div>
            )}

            {job?.error.uploadError && (
                <Alert
                    message="Upload warning"
                    description={job.error.uploadError}
                    type="warning"
                    showIcon
                    className="mt-4"
                />
            )}

            {showProgress && currentItem && (
                <div className="mt-5 rounded-lg border border-border bg-card p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-foreground">
                                Current file: {currentItem.relativePath}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                File {(job?.currentIndex ?? 0) + 1} / {totalFiles}
                            </p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Uploaded: {job?.stats.uploadedCount ?? 0} | Failed: {job?.stats.failedCount ?? 0}
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Overall</span>
                            <span>{overallPercent}%</span>
                        </div>
                        <Progress percent={overallPercent} showInfo={false}/>
                    </div>

                    <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Current file</span>
                            <span>{job?.currentProgress?.percentage ?? 0}%</span>
                        </div>
                        <Progress percent={job?.currentProgress?.percentage ?? 0} showInfo={false}/>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                        <div className="rounded-md bg-muted/40 p-3">
                            <p className="text-[10px] uppercase">Uploaded</p>
                            <p className="text-sm font-semibold text-foreground">
                                {FileViewUtil.formatBytes(job?.currentProgress?.uploadedBytes ?? 0)} / {FileViewUtil.formatBytes(job?.currentProgress?.totalBytes ?? 0)}
                            </p>
                        </div>
                        <div className="rounded-md bg-muted/40 p-3">
                            <p className="text-[10px] uppercase">Speed</p>
                            <p className="text-sm font-semibold text-foreground">
                                {job?.currentProgress?.throughputMbps?.toFixed(2) ?? '--'} Mbps
                            </p>
                        </div>
                        <div className="rounded-md bg-muted/40 p-3">
                            <p className="text-[10px] uppercase">Chunk size</p>
                            <p className="text-sm font-semibold text-foreground">
                                {FileViewUtil.formatBytes(job?.currentProgress?.currentChunkSize ?? 0)}
                            </p>
                        </div>
                        <div className="rounded-md bg-muted/40 p-3">
                            <p className="text-[10px] uppercase">ETA</p>
                            <p className="text-sm font-semibold text-foreground">
                                {formatTime(job?.currentProgress?.estimatedTimeRemainingMs ?? 0)}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default UploadFolderButton;
