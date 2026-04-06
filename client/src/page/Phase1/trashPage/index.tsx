import FileCardList from '../../../components/V1/file/FileCardList.tsx';
import NavBar from "../../../components/V1/layout/NavBar.tsx";

const TrashPage = () => {
    return (
        <>
            <NavBar/>
            <FileCardList viewMode="trash" />
        </>
    );
};

export default TrashPage;
