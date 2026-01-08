import {useState} from "react";
import MainLayout from "../../layout/MainLayout.tsx";
import UserProfile from "../../components/userProfile/UserProfile.tsx";

const UserProfilePage = () => {
    const [mode, setMode] = useState<'view' | 'edit'>('view');

    return (
        <MainLayout>
            <UserProfile mode={mode} onModeChange={setMode} />
        </MainLayout>
    );
};

export default UserProfilePage;