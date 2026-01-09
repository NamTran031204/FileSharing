import {useEffect, useState} from 'react';
import userFileApiResource, {type MetadataEntity} from '../../api/fileApi/userFileApiResource';
import FileCardComp from './FileCardComp';
import {Button, Empty, Spin} from 'antd';
import {LeftOutlined, ReloadOutlined, RightOutlined} from '@ant-design/icons';

interface FileCardListProps {
    viewMode?: 'active' | 'trash';
}

const FileCardList = ({ viewMode = 'active' }: FileCardListProps) => {
    const [files, setFiles] = useState<MetadataEntity[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const requestBody = {
                maxResultCount: 12,
                skipCount: (page - 1) * 10,
                sorting: '',
                filter: {
                    mimeType: null,
                    status: null,
                    isActive: null,
                    isTrash: viewMode === 'trash',
                    isIncludeSharedFile: null,
                    creationTimestampStartDate: null,
                    creationTimestampEndDate: null
                }
            }
            const response = await userFileApiResource.getFileByData(requestBody);
            const fileList = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);

            setFiles(fileList);
        } catch (error) {
            console.error("Failed to fetch files:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, [page]); // Gọi lại khi chuyển trang

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">
                        {viewMode === 'trash' ? 'Trash Bin' : 'My Files'}
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        {viewMode === 'trash' 
                            ? 'Files moved to trash - you can restore them'
                            : 'Manage and organize your uploaded files'
                        }
                    </p>
                </div>
                <Button
                    type="default"
                    icon={<ReloadOutlined/>}
                    onClick={fetchFiles}
                    loading={loading}
                    className="flex items-center gap-2"
                >
                    Refresh
                </Button>
            </div>

            {loading ? (
                <div className="flex flex-col justify-center items-center h-64 gap-4">
                    <Spin size="large"/>
                    <p className="text-muted-foreground">Loading files...</p>
                </div>
            ) : (
                <>
                    {/* Grid Layout */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                        {files.length > 0 ? (
                            files.map((file, index) => (
                                <div
                                    key={index}
                                    className="transform hover:scale-[1.02] transition-transform duration-200"
                                >
                                    <FileCardComp 
                                        {...file} 
                                        isTrashItem={viewMode === 'trash'}
                                        onRefresh={fetchFiles}
                                    />
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full">
                                <Empty
                                    description={
                                        <span className="text-muted-foreground">
                      No files found. Start uploading!
                    </span>
                                    }
                                    className="py-16"
                                />
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {files.length > 0 && (
                        <div className="flex justify-center items-center gap-4 pt-6 border-t border-border">
                            <Button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                icon={<LeftOutlined/>}
                                className="flex items-center gap-2"
                            >
                                Previous
                            </Button>

                            <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                                <span className="text-sm text-muted-foreground">Page</span>
                                <span className="text-sm font-semibold text-foreground">{page}</span>
                            </div>

                            <Button
                                onClick={() => setPage((p) => p + 1)}
                                icon={<RightOutlined/>}
                                iconPlacement="end"
                                className="flex items-center gap-2"
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default FileCardList;
