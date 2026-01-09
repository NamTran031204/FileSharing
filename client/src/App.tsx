import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import LoginPage from './page/auth/LoginPage';
import RegisterPage from './page/auth/RegisterPage';
import UserFilePage from "./page/userFilePage";
import UploadPage from "./page/uploadPage";
import UserProfilePage from "./page/UserProfilePage/UserProfilePage.tsx";
import TrashPage from "./page/trashPage";
import ProtectedRoute from "./components/ProtectedRoute.tsx";

const App = () => {
    return (
        <>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Navigate to="/login" replace/>}/>
                    <Route path="/login" element={<LoginPage/>}/>
                    <Route path="/register" element={<RegisterPage/>}/>
                    <Route path="/my-files" element={
                        <ProtectedRoute>
                            <UserFilePage/>
                        </ProtectedRoute>
                    }/>
                    <Route path="/upload" element={
                        <ProtectedRoute>
                            <UploadPage/>
                        </ProtectedRoute>
                    }/>
                    <Route path={"/profile"} element={
                        <ProtectedRoute>
                            <UserProfilePage/>
                        </ProtectedRoute>
                    }/>
                    <Route path={"/trash"} element={
                        <ProtectedRoute>
                            <TrashPage/>
                        </ProtectedRoute>
                    }/>
                </Routes>
            </BrowserRouter>
        </>
    );
};

export default App;