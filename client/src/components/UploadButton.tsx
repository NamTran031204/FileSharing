import React, {useState} from 'react';
import type {UploadProgress} from '../service/uploadService';
import {uploadService} from '../service/uploadService';

export default function UploadButton() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState<UploadProgress | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [uploadedObjectName, setUploadedObjectName] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
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
        <>
            <div className="font-sans m-5 bg-gray-100 p-5 rounded-lg max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">
                    UPLOAD FILE
                </h1>

                <input
                    type="file"
                    id="file-input"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none
                    file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 my-4
                    disabled:opacity-50 disabled:cursor-not-allowed"
                />

                {file && (
                    <div className="bg-white p-3 rounded-lg mb-4 text-sm text-gray-700">
                        <p><strong>file:</strong> {file.name}</p>
                        <p><strong>size:</strong> {formatBytes(file.size)}</p>
                    </div>
                )}

                {progress && (
                    <div className="mb-4 bg-white p-4 rounded-lg">
                        <div className="flex justify-between text-sm text-gray-700 mb-2">
                            <span>chunk: {progress.currentChunk}/{progress.totalChunks}</span>
                            <span>{progress.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden mb-3">
                            <div
                                className="bg-blue-600 h-full transition-all duration-300 ease-in-out flex items-center justify-center text-xs text-white font-semibold"
                                style={{width: `${progress.percentage}%`}}
                            >
                                {progress.percentage > 10 && `${progress.percentage}%`}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="bg-gray-50 p-2 rounded">
                                <span className="text-gray-500">uploaded:</span>
                                <p className="font-semibold">{formatBytes(progress.uploadedBytes)} / {formatBytes(progress.totalBytes)}</p>
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                                <span className="text-gray-500">speed:</span>
                                <p className="font-semibold">{progress.throughputMbps?.toFixed(2) || '--'} Mbps</p>
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                                <span className="text-gray-500">chunk size:</span>
                                <p className="font-semibold">{formatBytes(progress.currentChunkSize || 0)}</p>
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                                <span className="text-gray-500">eta:</span>
                                <p className="font-semibold">{formatTime(progress.estimatedTimeRemainingMs || 0)}</p>
                            </div>
                        </div>

                        {/*<div className="mt-3 flex items-center gap-2 text-sm">*/}
                        {/*    <span className="text-gray-500">network:</span>*/}
                        {/*    <span className={`font-semibold ${getStabilityColor(progress.networkStability || 'unknown')}`}>*/}
                        {/*        {getStabilityIcon(progress.networkStability || 'unknown')} {progress.networkStability || 'detecting...'}*/}
                        {/*    </span>*/}
                        {/*</div>*/}
                    </div>
                )}

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        <strong>error:</strong> {error}
                    </div>
                )}

                {uploadedObjectName && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                        <strong>✅ Success!</strong> File uploaded as: {uploadedObjectName}
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        id="upload-button"
                        onClick={handleUpload}
                        disabled={isUploading || !file}
                        className="py-2.5 px-5 text-base font-medium text-white bg-blue-600 rounded-lg
                        hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300
                        disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isUploading ? 'uploading...' : 'upload file'}
                    </button>

                    {isUploading && (
                        <button
                            onClick={handleCancel}
                            className="py-2.5 px-5 text-base font-medium text-white bg-red-600 rounded-lg
                            hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300
                            transition-colors"
                        >
                            cancel
                        </button>
                    )}
                </div>
            </div>
        </>

    );
}