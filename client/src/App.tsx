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
import ImageReviewV2 from "./page/ImageReviewV2";
import LoginPageV2 from "./page/LoginPageV2.tsx";
import LocalImageCanvas from "./mockup/pages/KonvaDemo.tsx";

const App = () => {
    return (
        <>
            <BrowserRouter>
                <Routes>
                    {/* ================ Phase 1 ================ */}
                    <Route path="/" element={<Navigate to="/login" replace/>}/>
                    <Route path="/login" element={<LoginPage/>}/>
                    <Route path={"/loginv2"} element={<LoginPageV2/>}/>
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

                    {/* ================ Mockup - Màn hình được tạo ra từ folder mockup, không cần bọc bởi ProtectedRoute, mục đích để người dùng test trước khi đưa lên Phase 2 ================ */}
                    <Route path="/mockup/image-review" element={<LocalImageCanvas/>}/>
                    <Route path="/review/image-v2" element={<ImageReviewV2/>}/>
                    {/* ================ Mockup ================ */}

                </Routes>
            </BrowserRouter>
        </>
    );
};

export default App;