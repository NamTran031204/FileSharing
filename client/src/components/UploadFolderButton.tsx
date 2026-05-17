import {useCallback, useMemo, useRef, useState} from 'react';
import {Alert, Button, Progress, Tag} from 'antd';
import {
    CheckCircleOutlined,
    CloudUploadOutlined,
    CloseCircleOutlined,
    FolderOpenOutlined,
    LoadingOutlined,
} from '@ant-design/icons';
import {FileViewUtil} from '../utils/FileViewUtil';
import {
    buildFolderManifest,
    type FileWithPath,
    type FolderManifest,
} from '../utils/folderUploadParser';
import {
    buildUploadQueue,
    createAssetUploadSession,
    createFolderTree,
    type UploadQueueItem,
} from '../service/folderUploadService';
import {uploadService, type UploadProgress} from '../service/uploadService';
import {useStore} from "../store";

type UploadPhase =
    | 'IDLE'
    | 'PARSING_FOLDER'
    | 'READY_TO_CREATE_TREE'
    | 'CREATING_FOLDER_TREE'
    | 'FOLDER_TREE_CREATED'
    | 'UPLOADING_FILES'
    | 'COMPLETED'
    | 'PARTIAL_FAILED'
    | 'FAILED'
    | 'CANCELLED';

const phaseLabelMap: Record<UploadPhase, string> = {
    IDLE: 'Idle',
    PARSING_FOLDER: 'Parsing folder',
    READY_TO_CREATE_TREE: 'Ready to create tree',
    CREATING_FOLDER_TREE: 'Creating folder tree',
    FOLDER_TREE_CREATED: 'Folder tree created',
    UPLOADING_FILES: 'Uploading files',
    COMPLETED: 'Completed',
    PARTIAL_FAILED: 'Partial failed',
    FAILED: 'Failed',
    CANCELLED: 'Cancelled',
};

const updateQueueItem = (
    queue: UploadQueueItem[],
    index: number,
    updates: Partial<UploadQueueItem>
): UploadQueueItem[] => {
    const next = [...queue];
    next[index] = {...next[index], ...updates};
    return next;
};

const formatTime = (ms: number): string => {
    if (!ms || ms <= 0) return '--';
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
};

const UploadFolderButton = () => {

    const {sessionStore} = useStore();

    const projectId = sessionStore.currentProjectId;
    // folderId của folder hiện tại mà user đang đứng — dùng làm parentFolderId cho root folder của tree
    const currentParentFolderId = sessionStore.currentFolderId || undefined;
    // folderPath đầy đủ của folder hiện tại — dùng làm baseFolderPath để server biết prefix đường dẫn
    const currentBaseFolderPath = sessionStore.currentFolderPath;

    const [selectedFolderName, setSelectedFolderName] = useState<string | null>(null);
    const [folderManifest, setFolderManifest] = useState<FolderManifest | null>(null);
    const [folderQueue, setFolderQueue] = useState<UploadQueueItem[]>([]);

    const [phase, setPhase] = useState<UploadPhase>('IDLE');
    const [parseError, setParseError] = useState<string | null>(null);
    const [treeError, setTreeError] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const [isCreatingTree, setIsCreatingTree] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const [folderPathToId, setFolderPathToId] = useState<Map<string, string>>(new Map());
    const [currentIndex, setCurrentIndex] = useState<number>(-1);
    const [currentProgress, setCurrentProgress] = useState<UploadProgress | null>(null);
    const [completedBytes, setCompletedBytes] = useState(0);
    const [uploadedCount, setUploadedCount] = useState(0);
    const [failedCount, setFailedCount] = useState(0);

    const cancelRef = useRef(false);

    const totalBytes = folderManifest?.totalBytes ?? 0;
    const totalFiles = folderManifest?.totalFiles ?? 0;

    const currentItem = currentIndex >= 0 ? folderQueue[currentIndex] : undefined;

    const overallUploadedBytes = completedBytes + (currentProgress?.uploadedBytes ?? 0);
    const overallPercent = totalBytes
        ? Math.min(100, Math.round((overallUploadedBytes / totalBytes) * 100))
        : 0;

    const directoryPicker =
        (window as Window & {showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>})
            .showDirectoryPicker;

    const resetState = () => {
        setSelectedFolderName(null);
        setFolderManifest(null);
        setFolderQueue([]);
        setFolderPathToId(new Map());
        setCurrentIndex(-1);
        setCurrentProgress(null);
        setCompletedBytes(0);
        setUploadedCount(0);
        setFailedCount(0);
        setIsCreatingTree(false);
        setIsUploading(false);
        setParseError(null);
        setTreeError(null);
        setUploadError(null);
        setPhase('IDLE');
        cancelRef.current = false;
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
                        const nextPath = `${currentPath}/${entry.name}`;
                        await walk(entry, nextPath);
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
        setPhase('PARSING_FOLDER');

        try {
            const handle = await directoryPicker();
            const rootName = handle.name;
            const files = await collectFilesFromDirectory(handle);
            const manifest = buildFolderManifest(rootName, files);

            setSelectedFolderName(rootName);
            setFolderManifest(manifest);
            setPhase('READY_TO_CREATE_TREE');
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                setPhase('IDLE');
                return;
            }
            setParseError(error instanceof Error ? error.message : 'Failed to parse folder');
            setPhase('FAILED');
        }
    }, [collectFilesFromDirectory, directoryPicker]);

    const handleCreateTree = useCallback(async () => {
        if (!folderManifest) return;

        setTreeError(null);
        setIsCreatingTree(true);
        setPhase('CREATING_FOLDER_TREE');

        try {
            const result = await createFolderTree({
                projectId,
                parentFolderId: currentParentFolderId,
                baseFolderPath: currentBaseFolderPath,
                rootFolderName: folderManifest.rootFolderName,
                folderNodes: folderManifest.folderNodes,
            });

            setFolderPathToId(result.folderPathToId);
            setPhase('FOLDER_TREE_CREATED');
        } catch (error) {
            setTreeError(error instanceof Error ? error.message : 'Create folder tree failed');
            setPhase('FAILED');
        } finally {
            setIsCreatingTree(false);
        }
    }, [
        currentBaseFolderPath,
        currentParentFolderId,
        folderManifest,
        projectId,
    ]);

    const handleCancelUpload = () => {
        cancelRef.current = true;
        uploadService.cancelUpload();
        setIsUploading(false);
        setCurrentProgress(null);
        setPhase('CANCELLED');
    };

    const handleStartUpload = useCallback(async () => {
        if (!folderManifest) return;
        if (!folderPathToId.size) {
            setUploadError('Folder tree is not created yet');
            return;
        }

        setUploadError(null);
        cancelRef.current = false;
        setIsUploading(true);
        setCurrentProgress(null);
        setCompletedBytes(0);
        setUploadedCount(0);
        setFailedCount(0);
        setPhase('UPLOADING_FILES');

        const {queue, errors} = buildUploadQueue(folderManifest.fileItems, folderPathToId);
        if (errors.length) {
            setUploadError(errors[0]);
        }

        let workingQueue = queue;
        setFolderQueue(workingQueue);

        if (!workingQueue.length) {
            setIsUploading(false);
            setPhase('FAILED');
            setUploadError('No files to upload after queue build');
            return;
        }

        let uploadedTotal = 0;
        let failedTotal = 0;

        for (let i = 0; i < workingQueue.length; i++) {
            if (cancelRef.current) {
                break;
            }

            setCurrentIndex(i);
            setCurrentProgress(null);
            workingQueue = updateQueueItem(workingQueue, i, {
                status: 'UPLOADING',
                errorMessage: undefined,
            });
            setFolderQueue(workingQueue);

            const item = workingQueue[i];
            try {
                const session = await createAssetUploadSession({
                    projectId,
                    folderId: item.folderId,
                    fileName: item.fileName,
                    mimeType: item.mimeType,
                    fileSize: item.size,
                    mediaType: item.mediaType,
                });

                workingQueue = updateQueueItem(workingQueue, i, {
                    assetId: session.assetId,
                    objectName: session.objectName,
                });
                setFolderQueue(workingQueue);

                await uploadService.uploadFileWithSession(
                    item.file,
                    {
                        uploadId: session.uploadId,
                        objectName: session.objectName,
                        partUrls: session.partUrls,
                    },
                    (progress) => {
                        setCurrentProgress(progress);
                    }
                );

                workingQueue = updateQueueItem(workingQueue, i, {
                    status: 'COMPLETED',
                });
                setFolderQueue(workingQueue);
                uploadedTotal += 1;
                setUploadedCount(uploadedTotal);
                setCompletedBytes((prev) => prev + item.size);
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Upload failed';
                workingQueue = updateQueueItem(workingQueue, i, {
                    status: cancelRef.current ? 'CANCELLED' : 'FAILED',
                    errorMessage: message,
                });
                setFolderQueue(workingQueue);
                failedTotal += 1;
                setFailedCount(failedTotal);
                setUploadError(message);
            }
        }

        setIsUploading(false);
        setCurrentProgress(null);

        if (cancelRef.current) {
            setPhase('CANCELLED');
            return;
        }

        if (failedTotal > 0) {
            setPhase('PARTIAL_FAILED');
        } else {
            setPhase('COMPLETED');
        }
    }, [
        folderManifest,
        folderPathToId,
        projectId,
    ]);

    const canCreateTree = folderManifest && !isCreatingTree && phase === 'READY_TO_CREATE_TREE';
    const canStartUpload =
        folderManifest &&
        folderPathToId.size > 0 &&
        !isUploading &&
        phase === 'FOLDER_TREE_CREATED';

    const showProgress = isUploading && currentItem;

    const statusTag = useMemo(() => {
        const label = phaseLabelMap[phase];
        const colorClass =
            phase === 'FAILED' || phase === 'PARTIAL_FAILED'
                ? 'bg-destructive/10 text-destructive'
                : phase === 'COMPLETED'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted/50 text-foreground';

        return (
            <Tag className={`border border-border px-2 py-1 ${colorClass}`}>{label}</Tag>
        );
    }, [phase]);

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
                        icon={<FolderOpenOutlined />}
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

            {folderManifest && (
                <div className="mt-5 rounded-lg border border-border bg-background p-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 text-sm text-foreground">
                            <CheckCircleOutlined className="text-primary" />
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
                            icon={isCreatingTree ? <LoadingOutlined /> : <CloudUploadOutlined />}
                            className="bg-primary text-primary-foreground hover:opacity-90"
                        >
                            Create Folder Tree
                        </Button>

                        <Button
                            onClick={handleStartUpload}
                            disabled={!canStartUpload}
                            icon={<CloudUploadOutlined />}
                            className="bg-card text-foreground border border-border hover:border-secondary"
                        >
                            Start Upload
                        </Button>

                        {isUploading && (
                            <Button
                                onClick={handleCancelUpload}
                                icon={<CloseCircleOutlined />}
                                className="bg-card text-destructive border border-border hover:border-destructive"
                            >
                                Cancel
                            </Button>
                        )}
                    </div>

                    {treeError && (
                        <Alert
                            message="Folder tree error"
                            description={treeError}
                            type="error"
                            showIcon
                            className="mt-4"
                        />
                    )}
                </div>
            )}

            {uploadError && (
                <Alert
                    message="Upload warning"
                    description={uploadError}
                    type="warning"
                    showIcon
                    className="mt-4"
                />
            )}

            {showProgress && (
                <div className="mt-5 rounded-lg border border-border bg-card p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-foreground">
                                Current file: {currentItem?.relativePath}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                File {currentIndex + 1} / {totalFiles}
                            </p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Uploaded: {uploadedCount} | Failed: {failedCount}
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Overall</span>
                            <span>{overallPercent}%</span>
                        </div>
                        <Progress percent={overallPercent} showInfo={false} />
                    </div>

                    <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Current file</span>
                            <span>{currentProgress?.percentage ?? 0}%</span>
                        </div>
                        <Progress percent={currentProgress?.percentage ?? 0} showInfo={false} />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                        <div className="rounded-md bg-muted/40 p-3">
                            <p className="text-[10px] uppercase">Uploaded</p>
                            <p className="text-sm font-semibold text-foreground">
                                {FileViewUtil.formatBytes(currentProgress?.uploadedBytes ?? 0)} / {FileViewUtil.formatBytes(currentProgress?.totalBytes ?? 0)}
                            </p>
                        </div>
                        <div className="rounded-md bg-muted/40 p-3">
                            <p className="text-[10px] uppercase">Speed</p>
                            <p className="text-sm font-semibold text-foreground">
                                {currentProgress?.throughputMbps?.toFixed(2) ?? '--'} Mbps
                            </p>
                        </div>
                        <div className="rounded-md bg-muted/40 p-3">
                            <p className="text-[10px] uppercase">Chunk size</p>
                            <p className="text-sm font-semibold text-foreground">
                                {FileViewUtil.formatBytes(currentProgress?.currentChunkSize ?? 0)}
                            </p>
                        </div>
                        <div className="rounded-md bg-muted/40 p-3">
                            <p className="text-[10px] uppercase">ETA</p>
                            <p className="text-sm font-semibold text-foreground">
                                {formatTime(currentProgress?.estimatedTimeRemainingMs ?? 0)}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UploadFolderButton;
