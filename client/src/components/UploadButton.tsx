import React, {useState} from 'react';
import type {UploadProgress} from '../service/uploadService';
import {uploadService} from '../service/uploadService';
import { Button, Progress, Alert } from 'antd';
import { CloudUploadOutlined, CloseCircleOutlined, CheckCircleOutlined, InboxOutlined } from '@ant-design/icons';

export default function UploadButton() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState<UploadProgress | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [uploadedObjectName, setUploadedObjectName] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
            setProgress(null);
            setUploadedObjectName(null);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            setFile(droppedFile);
            setError(null);
            setProgress(null);
            setUploadedObjectName(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file first');
            return;
        }

        setIsUploading(true);
        setError(null);
        setProgress(null);
        setUploadedObjectName(null);

        try {
            // TODO: chinh lai ownerId sau khi cau hinh xong Spring Security
            const objectName = await uploadService.uploadFile(
                file,
                {
                    ownerId: '1',
                    timeToLive: 3600,
                    compressionAlgo: 'none',
                },
                (uploadProgress) => {
                    setProgress(uploadProgress);
                }
            );

            setUploadedObjectName(objectName);
            console.log('upload thanh cong! ten object:', objectName);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Upload failed';
            if (!errorMessage.includes('cancelled')) {
                setError(errorMessage);
            }
            console.error('loi upload:', err);
        } finally {
            setIsUploading(false);
        }
    };

    const handleCancel = () => {
        uploadService.cancelUpload();
        setIsUploading(false);
        setProgress(null);
    };

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
    };

    const formatTime = (ms: number): string => {
        if (ms <= 0) return '--';
        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Upload File</h1>
                    <p className="text-muted-foreground">Drag and drop or select a file to upload</p>
                </div>

                {/* Upload Area */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
            relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 cursor-pointer
            ${isDragOver
                        ? 'border-primary bg-primary/5 scale-[1.02]'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }
            ${isUploading ? 'pointer-events-none opacity-60' : ''}
          `}
                >
                    <input
                        type="file"
                        id="file-input"
                        onChange={handleFileChange}
                        disabled={isUploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />

                    <div className="flex flex-col items-center gap-4">
                        <div className={`
              w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300
              ${isDragOver ? 'bg-primary text-primary-foreground scale-110' : 'bg-muted text-muted-foreground'}
            `}>
                            <InboxOutlined className="text-4xl" />
                        </div>
                        <div>
                            <p className="text-lg font-medium text-foreground">
                                {isDragOver ? 'Drop your file here' : 'Click to upload or drag and drop'}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Support all file types
                            </p>
                        </div>
                    </div>
                </div>

                {/* Selected File Info */}
                {file && (
                    <div className="mt-6 bg-card rounded-xl p-4 border border-border">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                <CloudUploadOutlined className="text-xl text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-card-foreground truncate">{file.name}</p>
                                <p className="text-sm text-muted-foreground">{formatBytes(file.size)}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Progress */}
                {progress && (
                    <div className="mt-6 bg-card rounded-xl p-6 border border-border">
                        <div className="flex justify-between text-sm text-muted-foreground mb-3">
                            <span>Chunk: {progress.currentChunk}/{progress.totalChunks}</span>
                            <span>{progress.percentage}%</span>
                        </div>

                        <Progress
                            percent={progress.percentage}
                            strokeColor={{
                                '0%': 'hsl(var(--primary))',
                                '100%': 'hsl(var(--success))',
                            }}
                            trailColor="hsl(var(--muted))"
                            showInfo={false}
                        />

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="bg-muted/50 rounded-lg p-3">
                                <p className="text-xs text-muted-foreground">Uploaded</p>
                                <p className="font-semibold text-foreground">
                                    {formatBytes(progress.uploadedBytes)} / {formatBytes(progress.totalBytes)}
                                </p>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-3">
                                <p className="text-xs text-muted-foreground">Speed</p>
                                <p className="font-semibold text-foreground">
                                    {progress.throughputMbps?.toFixed(2) || '--'} Mbps
                                </p>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-3">
                                <p className="text-xs text-muted-foreground">Chunk Size</p>
                                <p className="font-semibold text-foreground">
                                    {formatBytes(progress.currentChunkSize || 0)}
                                </p>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-3">
                                <p className="text-xs text-muted-foreground">ETA</p>
                                <p className="font-semibold text-foreground">
                                    {formatTime(progress.estimatedTimeRemainingMs || 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <Alert
                        message="Upload Error"
                        description={error}
                        type="error"
                        showIcon
                        className="mt-6"
                    />
                )}

                {/* Success */}
                {uploadedObjectName && (
                    <Alert
                        message="Upload Successful!"
                        description={`File uploaded as: ${uploadedObjectName}`}
                        type="success"
                        showIcon
                        icon={<CheckCircleOutlined />}
                        className="mt-6"
                    />
                )}

                {/* Actions */}
                <div className="flex gap-4 mt-6">
                    <Button
                        type="primary"
                        size="large"
                        onClick={handleUpload}
                        disabled={isUploading || !file}
                        loading={isUploading}
                        icon={<CloudUploadOutlined />}
                        className="flex-1 h-12 text-base font-semibold"
                    >
                        {isUploading ? 'Uploading...' : 'Upload File'}
                    </Button>

                    {isUploading && (
                        <Button
                            danger
                            size="large"
                            onClick={handleCancel}
                            icon={<CloseCircleOutlined />}
                            className="h-12 text-base font-semibold"
                        >
                            Cancel
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
