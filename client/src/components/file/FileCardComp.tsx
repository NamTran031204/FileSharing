import BreadCrumbMenu from "../breadCrumb/BreadCrumbMenu.tsx";
import {FileViewUtil} from "../../utils/FileViewUtil.ts";
import type {MetadataEntity} from "../../api/fileApi/userFileApiResource.ts";

interface FileCardCompProps extends MetadataEntity {
    isTrashItem?: boolean;
    onRefresh?: () => void;
}

const FileCardComp = (props: FileCardCompProps) => {
    const { isTrashItem, onRefresh, ...metadata } = props;

    const getMimeTypeIcon = () => {
        const fileType = getFileGroup(metadata.mimeType!);
        return <img src={"src/assets/mimeTypeIcon/" + fileType + ".png"} alt={metadata.mimeType}
                    className="w-[2rem] h-[2rem] object-contain"/>
    }

    const getMimeTypeImage = () => {
        const fileType = getFileGroup(metadata.mimeType!);
        return <img src={"src/assets/mimeTypeImage/" + fileType + ".png"} alt={metadata.mimeType}
                    className="w-60 h-60 object-contain"/>
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
            <div
                className="group bg-card rounded-xl border border-border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                <div
                    className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-primary/10 to-[hsl(var(--info))]/10 border-b border-border">
                    <div
                        className="flex-shrink-0 w-10 h-10 bg-card rounded-lg flex items-center justify-center shadow-sm">
                        {getMimeTypeIcon()}
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-card-foreground truncate" title={metadata.fileName}>
                            {metadata.fileName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {FileViewUtil.formatBytes(metadata.fileSize!)}
                        </p>
                    </div>

                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <BreadCrumbMenu
                            file={metadata as MetadataEntity}
                            isTrashItem={isTrashItem}
                            onRefresh={onRefresh}
                        />
                    </div>
                </div>

                <div
                    className="flex items-center justify-center py-10 px-6 bg-gradient-to-br from-muted/30 to-muted/50">
                    <div className="p-6 bg-card/60 rounded-2xl backdrop-blur-sm">
                        {getMimeTypeImage()}
                    </div>
                </div>
            </div>
        </>
    );
};

export default FileCardComp;