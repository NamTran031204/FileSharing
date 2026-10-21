import {AssetControllerService} from '../api/api/AssetControllerService';
import {FolderControllerService} from '../api/api/FolderControllerService';
import {UploadMode, UploadSessionStatus} from '../api/api/index.defs';
import type {
    FolderTreeCreateResponseDTO,
    FolderTreeMappingDTO,
    FolderTreeNodeDTO,
    MediaType,
} from '../api/api/index.defs';
import type {FolderFileItem} from '../utils/folderUploadParser';
import fileApiResource from '../api/fileApi/fileApiResource';
import i18n from '../i18n';

// Cac field kieu "long" o backend (fileSize/partSize/declaredSize) duoc swagger-axios-codegen
// khai la string de tranh mat chinh xac int64, nhung server thuc te tra ve JSON number - chap nhan ca hai.
const toNumber = (value: unknown): number => {
    if (typeof value === 'number') return value;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

export interface CreateFolderTreeInput {
    projectId: string;
    parentFolderId?: string;
    baseFolderPath?: string;
    rootFolderName: string;
    folderNodes: FolderTreeNodeDTO[];
}

export interface CreateFolderTreeResult {
    folderPathToId: Map<string, string>;
    folderMappings: FolderTreeMappingDTO[];
    sessionId?: string;
    rootFolderId?: string;
}

export type UploadItemStatus = 'PENDING' | 'UPLOADING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'SKIPPED';

export interface UploadQueueItem extends FolderFileItem {
    folderId: string;
    status: UploadItemStatus;
    errorMessage?: string;
    assetId?: string;
    objectName?: string;
}

export interface BuildUploadQueueResult {
    queue: UploadQueueItem[];
    errors: string[];
}

export interface AssetUploadSession {
    assetId: string;
    objectName: string;
    sessionId: string;
    uploadMode: UploadMode;
    partSize: number;
    partCount: number;
    declaredSize: number;
    urls: Map<number, string>;
    urlExpiresAt: Date;
    expiresAt: Date;
    hardExpiresAt: Date;
}

// Persist {assetId, objectName, sessionId} theo dinh danh file (ten:size:lastModified) de lan sau
// (vi du reload tab) nhan dung file cu -> resume dung session/asset da tao, khong goi lai E1 tao
// asset moi (tranh sinh asset mo coi khi resume - quyet dinh kien truc da duoc nguoi dung duyet).
const SESSION_SNAPSHOT_PREFIX = 'uploadV2Session:';

interface SessionSnapshot {
    assetId: string;
    objectName: string;
    sessionId: string;
}

const snapshotKeyFor = (file: File): string =>
    `${SESSION_SNAPSHOT_PREFIX}${file.name}:${file.size}:${file.lastModified}`;

const persistSessionSnapshot = (file: File, snapshot: SessionSnapshot): void => {
    try {
        localStorage.setItem(snapshotKeyFor(file), JSON.stringify(snapshot));
    } catch {
        // localStorage khong kha dung (private mode, quota) - khong chan upload
    }
};

const readSessionSnapshot = (file: File): SessionSnapshot | null => {
    try {
        const raw = localStorage.getItem(snapshotKeyFor(file));
        return raw ? (JSON.parse(raw) as SessionSnapshot) : null;
    } catch {
        return null;
    }
};

export const clearSessionSnapshot = (file: File): void => {
    try {
        localStorage.removeItem(snapshotKeyFor(file));
    } catch {
        // ignore
    }
};

// Kiem tra file nay co session dang do (INITIATED/UPLOADING) tu lan truoc khong. Goi TRUOC
// createAssetUploadSession - neu tra ve khac null thi dung thang session nay, khong goi E1 nua.
export const findResumableSession = async (file: File): Promise<AssetUploadSession | null> => {
    const snapshot = readSessionSnapshot(file);
    if (!snapshot) return null;

    try {
        const status = await fileApiResource.getUploadSessionStatus(snapshot.sessionId);

        if (status.status !== UploadSessionStatus.INITIATED && status.status !== UploadSessionStatus.UPLOADING) {
            clearSessionSnapshot(file);
            return null;
        }

        return {
            assetId: snapshot.assetId,
            objectName: snapshot.objectName,
            sessionId: snapshot.sessionId,
            uploadMode: status.uploadMode ?? UploadMode.MULTIPART,
            partSize: toNumber(status.partSize),
            partCount: status.partCount ?? 0,
            declaredSize: toNumber(status.declaredSize),
            // E3 khong tra presigned URL - PartUrlManager se tu xin qua E2 khi can
            urls: new Map(),
            urlExpiresAt: new Date(),
            expiresAt: status.expiresAt ? new Date(status.expiresAt) : new Date(),
            hardExpiresAt: status.hardExpiresAt ? new Date(status.hardExpiresAt) : new Date(),
        };
    } catch {
        // session cu khong con dung duoc (het han/khong ton tai) - don snapshot, dung session moi
        clearSessionSnapshot(file);
        return null;
    }
};

const normalizeFolderMappings = (response?: FolderTreeCreateResponseDTO): FolderTreeMappingDTO[] => {
    if (!response) return [];
    if (response.folderMappings?.length) return response.folderMappings;

    const created = response.createdFolders ?? [];
    const existing = response.existingFolders ?? [];
    return [...created, ...existing];
};

export const createFolderTree = async (input: CreateFolderTreeInput): Promise<CreateFolderTreeResult> => {
    const response = await FolderControllerService.createTree({
        body: {
            projectId: input.projectId,
            parentFolderId: input.parentFolderId,
            rootFolderName: input.rootFolderName,
            folders: input.folderNodes,
        },
    });

    if (!response?.isSuccessful) {
        throw new Error(response?.message || i18n.t('message:folderUploadService.createFolderTreeFailed'));
    }

    const data = response.data;
    const folderMappings = normalizeFolderMappings(data);
    const folderPathToId = new Map<string, string>();

    for (const mapping of folderMappings) {
        if (mapping.relativeFolderPath && mapping.folderId) {
            folderPathToId.set(mapping.relativeFolderPath, mapping.folderId);
        }
    }

    return {
        folderPathToId,
        folderMappings,
        sessionId: data?.folderUploadSessionId,
        rootFolderId: data?.rootFolderId,
    };
};

export const buildUploadQueue = (
    fileItems: FolderFileItem[],
    folderPathToId: Map<string, string>
): BuildUploadQueueResult => {
    const errors: string[] = [];
    const queue: UploadQueueItem[] = [];

    for (const item of fileItems) {
        const folderId = folderPathToId.get(item.folderRelativePath);
        if (!folderId) {
            errors.push(`Missing folderId for ${item.relativePath}`);
            continue;
        }

        queue.push({
            ...item,
            folderId,
            status: 'PENDING',
        });
    }

    queue.sort((a, b) => {
        if (a.depth !== b.depth) return a.depth - b.depth;
        const folderCompare = a.folderRelativePath.localeCompare(b.folderRelativePath);
        if (folderCompare !== 0) return folderCompare;
        return a.fileName.localeCompare(b.fileName);
    });

    return {queue, errors};
};

const normalizeUrlMap = (urls?: object): Map<number, string> => {
    const map = new Map<number, string>();
    if (!urls) return map;

    Object.entries(urls as Record<string, string>).forEach(([key, value]) => {
        if (value) {
            map.set(Number(key), String(value));
        }
    });

    return map;
};

export interface CreateAssetUploadSessionInput {
    projectId: string;
    folderId: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    mediaType: MediaType;
}

// file duoc truyen kem chi de tinh khoa localStorage (dinh danh resume) - khong gui len server.
export const createAssetUploadSession = async (
    input: CreateAssetUploadSessionInput,
    file: File
): Promise<AssetUploadSession> => {
    const response = await AssetControllerService.createNew({
        body: {
            projectId: input.projectId,
            folderId: input.folderId,
            fileName: input.fileName,
            mimeType: input.mimeType,
            // fileSize khai la string trong DTO generated (int64) nhung wire format thuc te la number
            fileSize: input.fileSize as unknown as string,
            mediaType: input.mediaType,
        },
    });

    if (!response?.isSuccessful) {
        throw new Error(response?.message || i18n.t('message:folderUploadService.createAssetFailed'));
    }

    const assetId = response.data?.asset?.assetId;
    const objectName = response.data?.version?.objectName;
    const upload = response.data?.upload;
    const urls = normalizeUrlMap(upload?.urls);
    const partSize = toNumber(upload?.partSize);
    const partCount = upload?.partCount;

    if (!assetId || !objectName || !upload?.sessionId || !partSize || !partCount || urls.size === 0) {
        throw new Error('Upload session is missing from create asset response');
    }

    const session: AssetUploadSession = {
        assetId,
        objectName,
        sessionId: upload.sessionId,
        uploadMode: upload.uploadMode ?? UploadMode.MULTIPART,
        partSize,
        partCount,
        declaredSize: toNumber(upload.declaredSize),
        urls,
        urlExpiresAt: upload.urlExpiresAt ? new Date(upload.urlExpiresAt) : new Date(),
        expiresAt: upload.expiresAt ? new Date(upload.expiresAt) : new Date(),
        hardExpiresAt: upload.hardExpiresAt ? new Date(upload.hardExpiresAt) : new Date(),
    };

    persistSessionSnapshot(file, {assetId, objectName, sessionId: session.sessionId});

    return session;
};
