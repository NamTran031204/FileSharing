import {AssetControllerService} from '../api/api/AssetControllerService';
import {FolderControllerService} from '../api/api/FolderControllerService';
import type {
    FolderTreeCreateResponseDTO,
    FolderTreeMappingDTO,
    FolderTreeNodeDTO,
    MediaType,
} from '../api/api/index.defs';
import type {FolderFileItem} from '../utils/folderUploadParser';

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
    uploadId: string;
    partUrls: Map<number, string>;
}

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
        throw new Error(response?.message || 'Create folder tree failed');
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

const normalizePartUrls = (partUrl?: object): Map<number, string> => {
    const map = new Map<number, string>();
    if (!partUrl) return map;

    Object.entries(partUrl as Record<string, string>).forEach(([key, value]) => {
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

export const createAssetUploadSession = async (
    input: CreateAssetUploadSessionInput
): Promise<AssetUploadSession> => {
    const response = await AssetControllerService.createNew({
        body: {
            projectId: input.projectId,
            folderId: input.folderId,
            fileName: input.fileName,
            mimeType: input.mimeType,
            fileSize: input.fileSize,
            mediaType: input.mediaType,
        },
    });

    if (!response?.isSuccessful) {
        throw new Error(response?.message || 'Create asset failed');
    }

    const assetId = response.data?.asset?.assetId;
    const objectName = response.data?.version?.objectName;
    const uploadId = response.data?.upload?.uploadId;
    const partUrls = normalizePartUrls(response.data?.upload?.partUrl);

    if (!assetId || !objectName || !uploadId || partUrls.size === 0) {
        throw new Error('Upload session is missing from create asset response');
    }

    return {
        assetId,
        objectName,
        uploadId,
        partUrls,
    };
};
