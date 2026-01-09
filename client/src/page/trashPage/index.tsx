import FileCardList from '../../components/file/FileCardList';
import NavBar from "../../components/layout/NavBar.tsx";

const TrashPage = () => {
    return (
        <>
            <NavBar/>
            <FileCardList viewMode="trash" />
        </>
    );
};

export default TrashPage;
