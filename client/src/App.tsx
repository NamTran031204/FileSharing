import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import LoginPage from './page/auth/LoginPage';
import RegisterPage from './page/auth/RegisterPage';
import UserFilePage from "./page/userFilePage";
import UploadPage from "./page/uploadPage";
import UserProfilePage from "./page/UserProfilePage/UserProfilePage.tsx";

const App = () => {
    return (
        <>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Navigate to="/login" replace/>}/>
                    <Route path="/login" element={<LoginPage/>}/>
                    <Route path="/register" element={<RegisterPage/>}/>
                    <Route path="/my-files" element={<UserFilePage/>}/>
                    <Route path="/upload" element={<UploadPage/>}/>
                    <Route path={"/profile"} element={<UserProfilePage/>} />
                </Routes>
            </BrowserRouter>
        </>
    );
};

export default App;