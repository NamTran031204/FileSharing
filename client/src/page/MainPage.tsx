import {
    BellOutlined,
    SearchOutlined,
    UploadOutlined,
    DownOutlined,
} from '@ant-design/icons';
import {Badge, Button, Input, Tag} from 'antd';
import {useMemo, useState} from 'react';
import AppHeader from '../components/core/layout/AppHeader.tsx';
import AppSidebar from '../components/core/layout/AppSidebar.tsx';
import MainPageActionCard, {type MainPageActionTone} from '../components/MainPageActionCard';
import CreateProjectModal, {type CreateProjectFormValues} from '../components/project/CreateProjectModal.tsx';
import CommonLayout from "../layout/CommonLayout.tsx";
import uiUtils from '../utils/uiUtils.tsx';
import {useNavigate} from 'react-router-dom';
import {ProjectControllerService} from '../api/api/ProjectControllerService';
import type {ProjectStatus} from '../api/api/index.defs';
import {useStore} from '../store';

interface MainPageProps {
    userName?: string;
    pendingReviews?: number;
}

interface MainQuickAction {
    key: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    tone: MainPageActionTone;
}

const MainPage = ({
    userName = 'NAM',
    pendingReviews = 12,
}: MainPageProps) => {
    const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
    const [isCreatingProject, setIsCreatingProject] = useState(false);
    const navigate = useNavigate();
    const {sessionStore} = useStore();

    const quickActions = useMemo<MainQuickAction[]>(() => [
        {
            key: 'upload-assets',
            title: 'Upload Assets',
            description: 'Drag and drop your latest media exports to start a review.',
            icon: <UploadOutlined/>,
            tone: 'primary',
        },
    ], []);

    const handleOpenCreateProject = () => {
        setIsCreateProjectOpen(true);
    };

    const handleCloseCreateProject = () => {
        setIsCreateProjectOpen(false);
    };

    const handleCreateProject = async (values: CreateProjectFormValues) => {
        setIsCreatingProject(true);

        try {
            const response = await ProjectControllerService.createNew({
                body: {
                    projectName: values.projectName,
                    projectCode: values.projectCode,
                    description: values.description,
                    startDate: values.startDate?.toDate(),
                    endDate: values.endDate?.toDate(),
                    status: values.projectStatus as ProjectStatus | undefined,
                },
            });

            if (!response?.isSuccessful) {
                throw new Error(response?.message || 'Create project failed');
            }

            const createdProject = response.data;

            uiUtils.showSuccess('Tạo project thành công');
            setIsCreateProjectOpen(false);

            if (createdProject?.projectId) {
                sessionStore.setCurrentProject({
                    projectId: createdProject.projectId,
                    projectName: createdProject.projectName,
                });
                sessionStore.setCurrentFolder(undefined);
                navigate(`/projects/${createdProject.projectId}`);
            }
        } catch (error) {
            console.error('Create project failed:', error);
            uiUtils.showError('Tạo project thất bại');
        } finally {
            setIsCreatingProject(false);
        }
    };

    return (
        <>
            <CommonLayout>
                <main className="relative flex-1 overflow-y-auto p-8 md:p-14 lg:p-20">
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl"/>
                        <div className="absolute -left-24 top-1/2 h-64 w-64 rounded-full bg-primary/10 blur-3xl"/>
                    </div>

                    <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center text-center">

                        <h1 className="mb-6 text-5xl font-black leading-tight tracking-tighter text-foreground md:text-7xl xl:text-8xl">
                            WELCOME BACK,
                            <br/>
                            <span className="bg-linear-to-br from-primary-dark to-primary bg-clip-text text-transparent">
                                {userName}!
                            </span>
                        </h1>

                        <div className="grid w-full max-w-md grid-cols-1 gap-6">
                            {quickActions.map((action) => (
                                <MainPageActionCard
                                    key={action.key}
                                    title={action.title}
                                    description={action.description}
                                    icon={action.icon}
                                    tone={action.tone}
                                    onClick={handleOpenCreateProject}
                                />
                            ))}
                        </div>

                    </div>
                </main>
            </CommonLayout>
            <CreateProjectModal
                open={isCreateProjectOpen}
                confirmLoading={isCreatingProject}
                onCancel={handleCloseCreateProject}
                onCreate={handleCreateProject}
            />
        </>

    );
};

export default MainPage;
