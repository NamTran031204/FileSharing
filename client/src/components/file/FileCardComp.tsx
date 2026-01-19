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
        const fileType = FileViewUtil.getFileGroup(metadata.mimeType!);
        return <img src={"src/assets/mimeTypeIcon/" + fileType + ".png"} alt={metadata.mimeType}
                    className="w-[2rem] h-[2rem] object-contain"/>
    }

    const getMimeTypeImage = () => {
        const fileType = FileViewUtil.getFileGroup(metadata.mimeType!);
        return <img src={"src/assets/mimeTypeImage/" + fileType + ".png"} alt={metadata.mimeType}
                    className="w-60 h-60 object-contain"/>
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