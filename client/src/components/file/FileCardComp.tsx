import type {MetadataDto} from "../../dto/MetadataDto.ts";
import BreadCrumbMenu from "../BreadCrumbMenu.tsx";

const FileCardComp = (metadata: MetadataDto) => {

    const getMimeTypeIcon = () => {
        return <img src={"src/assets/mimeTypeIcon/react.svg"} alt={metadata.mimeType}/>
    }

    const getMimeTypeImage = () => {
        return <img src={"src/assets/mimeTypeImage/react.svg"} alt={metadata.mimeType}/>
    }

    return (
        <>
            <div className={"flex-col items-center justify-center border border-gray-900 rounded-md shadow-sm"}>
                <div className={"flex-row h-12 w-full bg-blue-200 p-3 items-center justify-center"}>
                    <div className="flex-none text-gray-500 w-6 h-6 rounded-md">
                        {getMimeTypeIcon()}
                    </div>

                    <div className={"flex-1 min-w-0"}>
                        <p className={"text-sm font-medium text-gray-900"}>
                            {metadata.fileName}
                        </p>
                    </div>

                    <div className={"flex-none w-6 h-6 hover:bg-blue-500 hover:shadow-2xl"}>
                        <BreadCrumbMenu />
                    </div>
                </div>

                <div className={"flex-1 min-w-0"}>
                    {getMimeTypeImage()}
                </div>
            </div>
        </>
    );
};

export default FileCardComp;