import NavBar from "../../../components/layout/NavBar.tsx";
import FileCardList from "../../../components/file/FileCardList.tsx";

const UserFilePage = () => {
    return (
        <>
            <NavBar/>
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <div className="flex-1 w-full">
                    <FileCardList/>
                </div>
            </div>
        </>

    );
};

export default UserFilePage;