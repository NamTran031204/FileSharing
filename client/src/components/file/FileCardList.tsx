import {useEffect, useState} from 'react';
import userFileApiResource, {type MetadataEntity} from '../../api/fileApi/userFileApiResource';
import FileCardComp from './FileCardComp';

const FileCardList = () => {
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
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <>
                    {/* Grid Layout */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                        {files.length > 0 ? (
                            files.map((file, index) => (
                                <div key={index}
                                     className="transform hover:scale-105 transition-transform duration-200">
                                    {/* FileCardComp nhận props là MetadataDto */}
                                    <FileCardComp {...file} />
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center text-gray-500 py-10">
                                No files found.
                            </div>
                        )}
                    </div>

                    {/* Pagination UI */}
                    <div className="flex justify-center items-center gap-4 mt-8 border-t pt-4">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <span className="text-gray-700 font-medium">Page {page}</span>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            // disabled={files.length < PAGE_SIZE} // Logic disable nút Next
                            className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50"
                        >
                            Next
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default FileCardList;