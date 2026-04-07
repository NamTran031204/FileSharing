import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import LoginPage from './page/Phase1/auth/LoginPage';
import RegisterPage from './page/Phase1/auth/RegisterPage';
import UserFilePage from "./page/Phase1/userFilePage";
import UploadPage from "./page/Phase1/uploadPage";
import UserProfilePage from "./page/Phase1/UserProfilePage/UserProfilePage.tsx";
import TrashPage from "./page/Phase1/trashPage";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import FilePreviewPage from "./page/Phase1/filePreviewPage";
import ImageReviewPage from "./page/ImageReviewPage";

const App = () => {
    return (
        <>
            <BrowserRouter>
                <Routes>
                    {/* ================ Phase 1 ================ */}
                    <Route path="/" element={<Navigate to="/login" replace/>}/>
                    <Route path="/login" element={<LoginPage/>}/>
                    <Route path="/register" element={<RegisterPage/>}/>
                    <Route path={`/preview/*`} element={<FilePreviewPage/>}/>
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
                    {/* ================ Phase 1 ================ */}

                    {/* ================ Phase 2 - Review System ================ */}
                    <Route path="/review/image" element={
                        <ProtectedRoute>
                            <ImageReviewPage/>
                        </ProtectedRoute>
                    }/>
                    {/* ================ Phase 2 ================ */}
                </Routes>
            </BrowserRouter>
        </>
    );
};

export default App;