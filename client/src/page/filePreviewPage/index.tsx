import {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {Spin, Card, Tag, Button, Space} from 'antd';
import {
    DownloadOutlined,
    FileOutlined,
    ClockCircleOutlined,
    UserOutlined,
    EyeOutlined,
    LockOutlined
} from '@ant-design/icons';
import type {MetadataEntity} from "../../api/fileApi/userFileApiResource.ts";
import {tokenManager} from "../../api/baseApi.ts";
import fileApiResource from "../../api/fileApi/fileApiResource.ts";
import authApiResource from "../../api/authApi/authApiResource.ts";
import {FileAppPermission, ObjectVisibility} from "../../api/enums.ts";
import {FileViewUtil} from "../../utils/FileViewUtil.ts";
import NotFoundPage from "../../components/NotFoundPage.tsx";

const FilePreviewPage = () => {
    const params = useParams();
    const shareToken = params['*'];
    const [loading, setLoading] = useState(true);
    const [fileMetadata, setFileMetadata] = useState<MetadataEntity | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFileData = async () => {
            console.log("shareToken", shareToken);
            if (!shareToken) {
                setError('Invalid share token');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                // Kiểm tra trạng thái đăng nhập
                const accessToken = tokenManager.getAccessToken();
                const isLoggedIn = !!accessToken;

                let data: MetadataEntity;

                if (isLoggedIn) {
                    console.log('User logged in - calling getFileByToken');
                    data = await fileApiResource.getFileByToken(shareToken);
                } else {
                    console.log('Guest user - calling checkLegit');
                    data = await authApiResource.checkLegit(shareToken);
                }

                setFileMetadata(data);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch file:', err);
                setError(err instanceof Error ? err.message : 'Failed to load file');
                setFileMetadata(null);
            } finally {
                setLoading(false);
            }
        };

        fetchFileData();
    }, [shareToken]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
                <div className="text-center">
                    <Spin size="large"/>
                    <p className="text-muted-foreground mt-4">Loading file...</p>
                </div>
            </div>
        );
    }

    if (error || !fileMetadata) {
        return <NotFoundPage/>;
    }

    const getMimeTypeIcon = () => {
        const fileType = FileViewUtil.getFileGroup(fileMetadata.mimeType!);
        return <img src={"../src/assets/mimeTypeIcon/" + fileType + ".png"} alt={fileMetadata.mimeType}
                    className="w-[2rem] h-[2rem] object-contain"/>
    }

    const getMimeTypeImage = () => {
        const fileType = FileViewUtil.getFileGroup(fileMetadata.mimeType!);
        return <img src={"../src/assets/mimeTypeImage/" + fileType + ".png"} alt={fileMetadata.mimeType}
                    className="w-60 h-60 object-contain"/>
    }


    const handleDownload = async () => {
        try {
            const response = await fileApiResource.getDownloadUrl({
                objectName: fileMetadata.objectName,
                downloadFileName: fileMetadata.fileName
            });

            window.open(response.url, '_blank');
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted py-12 px-4">
            <div className="container mx-auto max-w-4xl">
                {/* Header Card */}
                <Card className="mb-6 shadow-lg">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                            {getMimeTypeIcon()}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl font-bold text-foreground mb-2 break-words">
                                {fileMetadata.fileName}
                            </h1>

                            <div className="flex flex-wrap gap-2 mb-4">
                                <Tag icon={<FileOutlined/>} color="blue">
                                    {fileMetadata.mimeType}
                                </Tag>
                                <Tag color="green">
                                    {FileViewUtil.formatBytes(fileMetadata.fileSize)}
                                </Tag>
                                <Tag
                                    icon={fileMetadata.visibility === ObjectVisibility.PUBLIC ? <EyeOutlined/> :
                                        <LockOutlined/>}
                                    color={fileMetadata.visibility === ObjectVisibility.PUBLIC ? 'cyan' : 'orange'}
                                >
                                    {fileMetadata.visibility === ObjectVisibility.PUBLIC ? 'Public' : 'Private'}
                                </Tag>
                            </div>

                            <Space size="middle" wrap>
                                <Button
                                    type="primary"
                                    icon={<DownloadOutlined/>}
                                    size="large"
                                    onClick={handleDownload}
                                >
                                    Download File
                                </Button>
                            </Space>
                        </div>
                    </div>
                </Card>

                <Card
                    title={
                        <div className="flex items-center gap-2">
                            <FileOutlined/>
                            <span>File Preview</span>
                        </div>
                    }
                    className="shadow-lg"
                >
                    <div className="flex items-center justify-center py-12 bg-muted/30 rounded-lg">
                        {getMimeTypeImage()}
                    </div>
                </Card>

                <Card
                    title="File Details"
                    className="mt-6 shadow-lg"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                            <UserOutlined className="text-muted-foreground text-lg"/>
                            <div>
                                <p className="text-xs text-muted-foreground">Owner ID</p>
                                <p className="font-medium text-foreground">{fileMetadata.ownerId}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <ClockCircleOutlined className="text-muted-foreground text-lg"/>
                            <div>
                                <p className="text-xs text-muted-foreground">Created</p>
                                <p className="font-medium text-foreground">
                                    {new Date(fileMetadata.creationTimestamp).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        {fileMetadata.compressionAlgo && (
                            <div className="flex items-center gap-3">
                                <FileOutlined className="text-muted-foreground text-lg"/>
                                <div>
                                    <p className="text-xs text-muted-foreground">Compression</p>
                                    <p className="font-medium text-foreground">{fileMetadata.compressionAlgo}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <EyeOutlined className="text-muted-foreground text-lg"/>
                            <div>
                                <p className="text-xs text-muted-foreground">Your Permission</p>
                                <Tag color="blue">
                                    {fileMetadata.publishUserPermission || FileAppPermission.PUBLIC}
                                </Tag>
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="mt-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        This file is shared with you. Handle with care and respect privacy.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FilePreviewPage;
