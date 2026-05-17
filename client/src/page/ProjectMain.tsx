import {
    EditOutlined,
    FileSearchOutlined,
    FilterOutlined,
    InboxOutlined,
    PlusOutlined,
    PushpinOutlined,
    SearchOutlined,
    ShareAltOutlined,
    SortAscendingOutlined,
} from '@ant-design/icons';
import {Button, Empty, Input, Skeleton, Space, message} from 'antd';
import {useEffect, useMemo, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {ProjectControllerService} from '../api/api/ProjectControllerService';
import {type ProjectEntity, type ProjectStatus} from '../api/api/index.defs';
import CreateProjectModal, {type CreateProjectFormValues} from '../components/project/CreateProjectModal.tsx';
import ProjectOverviewCard, {type ProjectOverviewCardProps} from '../components/project/ProjectOverviewCard.tsx';
import CommonLayout from "../layout/CommonLayout.tsx";
import {useStore} from '../store';

const PAGE_SIZE = 24;

const formatProjectDate = (value?: Date) => {
    if (!value) {
        return '';
    }

    return new Date(value).toLocaleDateString();
};

const toCardStatus = (status?: ProjectStatus): 'ACTIVE' | 'COMPLETED' => {
    return status === 'ACTIVE' ? 'ACTIVE' : 'COMPLETED';
};

const toMemberInitials = (email?: string) => {
    if (!email) {
        return 'NA';
    }

    const [namePart = ''] = email.split('@');
    const cleaned = namePart.replace(/[^a-zA-Z]/g, ' ').trim();
    const pieces = cleaned.split(/\s+/).filter(Boolean);

    if (!pieces.length) {
        return namePart.slice(0, 2).toUpperCase() || 'NA';
    }

    if (pieces.length === 1) {
        return pieces[0].slice(0, 2).toUpperCase();
    }

    return `${pieces[0][0] ?? ''}${pieces[1][0] ?? ''}`.toUpperCase();
};

const mapProjectToCard = (project: ProjectEntity): ProjectOverviewCardProps => {
    const collaborators = project.collaborators ?? [];
    const members = collaborators.slice(0, 3).map((member, index) => ({
        id: member.userId || `${project.projectId || project.projectCode || 'project'}-${index}`,
        initials: toMemberInitials(member.email),
    }));

    const startDate = formatProjectDate(project.startDate);
    const endDate = formatProjectDate(project.endDate);
    const timeline = startDate && endDate ? `${startDate} - ${endDate}` : startDate || endDate || 'N/A';

    return {
        projectId: project.projectId,
        title: project.projectName || 'Untitled Project',
        code: project.projectCode || project.projectId || 'N/A',
        category: project.category,
        ownerEmail: project.ownerEmail || 'unknown@domain.local',
        description: project.description || 'No description',
        status: toCardStatus(project.status),
        folderCount: project.stats?.folderCount ?? 0,
        videoCount: project.stats?.assetCount ?? 0,
        revisionCount: project.stats?.totalVersions ?? 0,
        pendingCount: project.stats?.pendingReviews ?? 0,
        timeline,
        updatedAt: formatProjectDate(project.updatedAt) || 'N/A',
        members,
        extraMembers: Math.max(0, collaborators.length - members.length),
    };
};

const ProjectMain = () => {
    const navigate = useNavigate();
    const {sessionStore} = useStore();
    const [searchKeyword, setSearchKeyword] = useState('');
    const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
    const [isCreatingProject, setIsCreatingProject] = useState(false);
    const [projects, setProjects] = useState<ProjectOverviewCardProps[]>([]);
    const [isLoadingProjects, setIsLoadingProjects] = useState(false);

    const loadProjects = async () => {
        try {
            setIsLoadingProjects(true);

            const response = await ProjectControllerService.getPage({
                body: {
                    maxResultCount: PAGE_SIZE,
                    skipCount: 0,
                    sorting: 'updatedAt desc',
                    filter: {},
                },
            });

            if (!response?.isSuccessful) {
                throw new Error(response?.message || 'Cannot load projects');
            }

            const items = response.data?.data ?? [];
            setProjects(items.map(mapProjectToCard));
        } catch (error) {
            console.error('Failed to load projects:', error);
            message.error('Không thể tải danh sách project');
            setProjects([]);
        } finally {
            setIsLoadingProjects(false);
        }
    };

    useEffect(() => {
        void loadProjects();
    }, []);

    const filteredProjects = useMemo(() => {
        const normalizedKeyword = searchKeyword.trim().toLowerCase();

        if (!normalizedKeyword) {
            return projects;
        }

        return projects.filter((project) => {
            const searchableText = [project.title, project.code, project.description, project.ownerEmail]
                .join(' ')
                .toLowerCase();

            return searchableText.includes(normalizedKeyword);
        });
    }, [projects, searchKeyword]);

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

            message.success('Tạo project thành công');
            setIsCreateProjectOpen(false);
            await loadProjects();
        } catch (error) {
            console.error('Create project failed:', error);
            message.error('Tạo project thất bại');
        } finally {
            setIsCreatingProject(false);
        }
    };

    return (
        <>
            <CommonLayout>
                <main className="flex-1 overflow-y-auto bg-background">
                    <div className="mx-auto max-w-7xl px-6 py-8 md:px-8 md:py-10">
                        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                            <div>
                                <h1 className="text-4xl font-extrabold tracking-tighter text-foreground">Project List</h1>
                                <p className="mt-1 text-sm font-medium text-muted-foreground">
                                    You have <span className="font-semibold text-primary">{projects.length} active projects</span> in your workspace.
                                </p>
                            </div>

                            <Button
                                type="primary"
                                icon={<PlusOutlined/>}
                                onClick={() => setIsCreateProjectOpen(true)}
                                className="h-11 rounded-lg px-5 font-bold"
                            >
                                Add Project
                            </Button>
                        </div>

                        <section className="mb-8 rounded-2xl border border-border/40 bg-card p-5">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center">
                                <div className="flex-1">
                                    <Input
                                        size="large"
                                        value={searchKeyword}
                                        onChange={(event) => setSearchKeyword(event.target.value)}
                                        prefix={<SearchOutlined className="text-muted-foreground"/>}
                                        placeholder="Search by project name, code, or description..."
                                        className="rounded-xl"
                                    />
                                </div>

                                <Space>
                                    <Button icon={<FilterOutlined/>}>Filter</Button>
                                    <Button icon={<SortAscendingOutlined/>}>Sort</Button>
                                </Space>
                            </div>
                        </section>

                        <section className="space-y-5">
                            {!isLoadingProjects &&
                                filteredProjects.map((project) => (
                                    <ProjectOverviewCard
                                        key={project.code}
                                        {...project}
                                        onClick={() => {
                                            const projectId = project.projectId;
                                            if (!projectId) return;
                                            // Lưu project hiện tại vào session store
                                            sessionStore.setCurrentProject({
                                                projectId,
                                                projectName: project.title,
                                            });
                                            // Xóa folder session khi chuyển project
                                            sessionStore.setCurrentFolder(undefined);
                                            navigate(`/projects/${projectId}`);
                                        }}
                                    />
                                ))}

                            {isLoadingProjects && (
                                <div className="rounded-2xl border border-border/30 bg-card p-6">
                                    <Skeleton active paragraph={{rows: 3}}/>
                                </div>
                            )}

                            {!isLoadingProjects && filteredProjects.length === 0 && (
                                <div className="rounded-2xl border border-border/30 bg-card px-6 py-16">
                                    <Empty
                                        image={<FileSearchOutlined className="text-5xl text-muted-foreground"/>}
                                        description={
                                            <span className="text-sm text-muted-foreground">
                                                No projects found for current search.
                                            </span>
                                        }
                                    >
                                        <Button type="link" className="font-semibold" onClick={() => setSearchKeyword('')}>
                                            Clear all filters
                                        </Button>
                                    </Empty>
                                </div>
                            )}
                        </section>
                    </div>
                </main>

                <CreateProjectModal
                    open={isCreateProjectOpen}
                    confirmLoading={isCreatingProject}
                    onCancel={() => setIsCreateProjectOpen(false)}
                    onCreate={handleCreateProject}
                />

                <div className="hidden fixed z-100 w-48 overflow-hidden rounded-xl border border-border/30 bg-card py-2 shadow-lg">
                    <Button type="text" icon={<PushpinOutlined/>} className="w-full justify-start rounded-none px-4 text-left">
                        Pin Project
                    </Button>
                    <Button type="text" icon={<EditOutlined/>} className="w-full justify-start rounded-none px-4 text-left">
                        Rename
                    </Button>
                    <Button type="text" icon={<ShareAltOutlined/>} className="w-full justify-start rounded-none px-4 text-left">
                        Share
                    </Button>
                    <div className="my-1 h-px bg-border/40"/>
                    <Button type="text" icon={<InboxOutlined/>} className="w-full justify-start rounded-none px-4 text-left text-destructive hover:text-destructive">
                        Archive
                    </Button>
                </div>
            </CommonLayout>
        </>
    );
};

export default ProjectMain;
