import BreadCrumbMenu from "../breadCrumb/BreadCrumbMenu.tsx";
import type {MetadataEntity} from "../../api/fileApi/userFileApiResource.ts";

const FileCardComp = (metadata: MetadataEntity) => {

    const getMimeTypeIcon = () => {
        const fileType = getFileGroup(metadata.mimeType);
        return <img src={"src/assets/mimeTypeIcon/" + fileType + ".png"} alt={metadata.mimeType}
                    className="w-[2rem] h-[2rem] object-contain"/>
    }

    const getMimeTypeImage = () => {
        const fileType = getFileGroup(metadata.mimeType);
        return <img src={"src/assets/mimeTypeImage/" + fileType + ".png"} alt={metadata.mimeType}
                    className="w-[15rem] h-[15rem] object-contain"/>
    }

    function getFileGroup(mimeType: string): string {
        const typePrefix = mimeType.split('/')[0];

        if (typePrefix === 'image') return 'image';
        if (typePrefix === 'video') return 'video';
        if (typePrefix === 'audio') return 'audio';

        if (typePrefix === 'text') {
            if (mimeType.includes('html') || mimeType.includes('css') || mimeType.includes('javascript') || mimeType.includes('xml')) {
                return 'code';
            }
            return 'text';
        }

        if (typePrefix === 'application') {
            if (
                mimeType.includes('pdf') ||
                mimeType.includes('word') ||
                mimeType.includes('excel') ||
                mimeType.includes('sheet') ||
                mimeType.includes('presentation') ||
                mimeType.includes('powerpoint')
            ) {
                return 'document';
            }

            if (
                mimeType.includes('zip') ||
                mimeType.includes('rar') ||
                mimeType.includes('tar') ||
                mimeType.includes('gzip') ||
                mimeType.includes('compressed') ||
                mimeType.includes('7z')
            ) {
                return 'archive';
            }

            if (mimeType.includes('json') || mimeType.includes('xml')) {
                return 'code';
            }
        }

        return 'other';
    }

    return (
        <>
            <div className={"flex-row items-center justify-center border border-gray-900 rounded-md shadow-sm"}>
                <div className={"flex gap-2 h-12 w-full bg-blue-200 p-3 items-center justify-center"}>
                    <div className="flex-none text-gray-500 w-auto h-auto rounded-md">
                        {getMimeTypeIcon()}
                    </div>

                    <div className={"flex-1 min-w-0"}>
                        <p className={"text-sm font-medium text-gray-900"}>
                            {metadata.fileName}
                        </p>
                    </div>

                    <div className={"flex-none w-10 h-10 hover:bg-blue-500 hover:shadow-2xl"}>
                        <BreadCrumbMenu objectName={metadata.objectName} fileName={metadata.fileName}
                                        fileSize={metadata.fileSize}/>
                    </div>
                </div>

                <div className={"flex-1 p-6"}>
                    {getMimeTypeImage()}
                </div>
            </div>
        </>
    );
};

export default FileCardComp;