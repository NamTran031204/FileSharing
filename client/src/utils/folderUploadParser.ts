import {MediaType} from '../api/api/index.defs';
import {FileViewUtil} from './FileViewUtil';

export interface FileWithPath {
    file: File;
    relativePath: string;
}

export interface FolderFileItem {
    file: File;
    fileName: string;
    relativePath: string;
    folderRelativePath: string;
    depth: number;
    size: number;
    mimeType: string;
    mediaType: MediaType;
}

export interface FolderNode {
    clientFolderKey: string;
    folderName: string;
    relativeFolderPath: string;
    parentRelativeFolderPath?: string;
    level: number;
}

export interface FolderManifest {
    rootFolderName: string;
    folderNodes: FolderNode[];
    fileItems: FolderFileItem[];
    totalFiles: number;
    totalFolders: number;
    totalBytes: number;
}

const getMediaType = (mimeType: string): MediaType => {
    const group = FileViewUtil.getFileGroup(mimeType);
    if (group === 'image') return MediaType.IMAGE;
    if (group === 'video') return MediaType.VIDEO;
    return MediaType.DESIGN;
};

export const buildFolderManifest = (rootFolderName: string, files: FileWithPath[]): FolderManifest => {
    if (!rootFolderName) {
        throw new Error('Root folder name is required');
    }

    if (!files.length) {
        throw new Error('No files found in selected folder');
    }

    const fileItems: FolderFileItem[] = [];
    const folderMap = new Map<string, FolderNode>();
    const seenRelativePaths = new Set<string>();
    let totalBytes = 0;

    for (const entry of files) {
        if (seenRelativePaths.has(entry.relativePath)) {
            throw new Error(`Duplicate file path detected: ${entry.relativePath}`);
        }
        seenRelativePaths.add(entry.relativePath);

        const normalizedPath = entry.relativePath.replace(/\\/g, '/');
        const pathSegments = normalizedPath.split('/').filter(Boolean);
        if (pathSegments.length < 2) {
            throw new Error(`Invalid relative path: ${entry.relativePath}`);
        }

        const fileName = pathSegments[pathSegments.length - 1];
        const folderSegments = pathSegments.slice(0, -1);
        const folderRelativePath = folderSegments.join('/');
        const depth = folderSegments.length;
        const mimeType = entry.file.type || 'application/octet-stream';
        const mediaType = getMediaType(mimeType);

        fileItems.push({
            file: entry.file,
            fileName,
            relativePath: normalizedPath,
            folderRelativePath,
            depth,
            size: entry.file.size,
            mimeType,
            mediaType,
        });

        totalBytes += entry.file.size;

        for (let i = 0; i < folderSegments.length; i++) {
            const relativeFolderPath = folderSegments.slice(0, i + 1).join('/');
            if (!folderMap.has(relativeFolderPath)) {
                folderMap.set(relativeFolderPath, {
                    clientFolderKey: relativeFolderPath,
                    folderName: folderSegments[i],
                    relativeFolderPath,
                    parentRelativeFolderPath: i === 0 ? undefined : folderSegments.slice(0, i).join('/'),
                    level: i + 1,
                });
            }
        }
    }

    const folderNodes = Array.from(folderMap.values()).sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level;
        return a.relativeFolderPath.localeCompare(b.relativeFolderPath);
    });

    return {
        rootFolderName,
        folderNodes,
        fileItems,
        totalFiles: fileItems.length,
        totalFolders: folderNodes.length,
        totalBytes,
    };
};
