export interface MetadataDto {
    fileId: string;
    fileName: string;
    objectName: string;
    mimeType: string;
    fileSize: number;
    compressionAlgo: string;
    ownerId: string;
    creationTimestamp: Date;
    timeToLive: number;
}