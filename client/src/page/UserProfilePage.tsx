import {useState} from "react";
import CommonLayout from "../layout/CommonLayout.tsx";
import UserProfile from "../components/userProfile/UserProfile.tsx";

const UserProfilePage = () => {
    const [mode, setMode] = useState<'view' | 'edit'>('view');

    return (
        <CommonLayout>
            <div className="flex-1 overflow-y-auto bg-background p-8 lg:p-12">
                <UserProfile mode={mode} onModeChange={setMode}/>
            </div>
        </CommonLayout>
    );
};

export default UserProfilePage;
