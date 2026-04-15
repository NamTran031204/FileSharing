import {
    CloseOutlined,
    DownOutlined,
    FileSearchOutlined,
    FilterOutlined,
    PlusOutlined,
    RightOutlined,
    SearchOutlined,
    ShareAltOutlined,
    SortAscendingOutlined,
    PushpinOutlined,
    EditOutlined,
    InboxOutlined,
} from '@ant-design/icons';
import {Breadcrumb, Button, Empty, Input, Skeleton, Space, Tag} from 'antd';
import {useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import AppSidebar from '../components/AppSidebar';
import CreateProjectModal, {type CreateProjectFormValues} from '../components/CreateProjectModal';
import ProjectOverviewCard, {type ProjectOverviewCardProps} from '../components/ProjectOverviewCard';

const MOCK_PROJECTS: ProjectOverviewCardProps[] = [
    {
        title: 'Project title',
        code: 'Nam001',
        ownerEmail: 'namtest1@gmail.com',
        description:
            'Project của Nam',
        status: 'ACTIVE',
        folderCount: 12,
        videoCount: 84,
        revisionCount: 4,
        pendingCount: 3,
        timeline: 'Jan 12 - Mar 20',
        updatedAt: '2h ago',
        members: [],
        extraMembers: 5,
    }
];

const ProjectMain = () => {
    const [searchKeyword, setSearchKeyword] = useState('');
    const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
    const [isCreatingProject, setIsCreatingProject] = useState(false);
    const [isLoadingMock] = useState(false);

    const filteredProjects = useMemo(() => {
        const normalizedKeyword = searchKeyword.trim().toLowerCase();

        if (!normalizedKeyword) {
            return MOCK_PROJECTS;
        }

        return MOCK_PROJECTS.filter((project) => {
            const searchableText = [project.title, project.code, project.description, project.ownerEmail]
                .join(' ')
                .toLowerCase();

            return searchableText.includes(normalizedKeyword);
        });
    }, [searchKeyword]);

    const breadcrumbItems = [
        {
            title: <Link className="text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-primary" to="/home">Home</Link>,
        },
        {
            title: <Link className="text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-primary" to="/my-files">My Projects</Link>,
        },
        {
            title: <span className="text-xs font-semibold uppercase tracking-widest text-foreground">Project List</span>,
        },
    ];

    const handleCreateProject = async (values: CreateProjectFormValues) => {
        setIsCreatingProject(true);

        try {
            // TODO: Integrate create project API and refresh project list from backend.
            console.info('Create project payload:', values);
            setIsCreateProjectOpen(false);
        } finally {
            setIsCreatingProject(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <AppHeader/>

            <div className="flex min-h-screen pt-16">
                <AppSidebar/>

                <main className="flex-1 overflow-y-auto bg-background">
                    <div className="mx-auto max-w-7xl px-6 py-8 md:px-8 md:py-10">
                        <div className="mb-8">
                            <Breadcrumb
                                separator={<RightOutlined className="text-[10px] text-muted-foreground"/>}
                                items={breadcrumbItems}
                            />
                        </div>

                        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                            <div>
                                <h1 className="text-4xl font-extrabold tracking-tighter text-foreground">Project List</h1>
                                <p className="mt-1 text-sm font-medium text-muted-foreground">
                                    You have <span className="font-semibold text-primary">24 active projects</span> in your workspace.
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
                            {!isLoadingMock &&
                                filteredProjects.map((project) => (
                                    <ProjectOverviewCard
                                        key={project.code}
                                        {...project}
                                        onClick={() => {
                                            // TODO: Open project detail route.
                                            console.info('Open project detail:', project.code);
                                        }}
                                    />
                                ))}

                            {isLoadingMock && (
                                <div className="rounded-2xl border border-border/30 bg-card p-6">
                                    <Skeleton active paragraph={{rows: 3}}/>
                                </div>
                            )}

                            {!isLoadingMock && filteredProjects.length === 0 && (
                                <div className="rounded-2xl border border-border/30 bg-card px-6 py-16">
                                    <Empty
                                        image={<FileSearchOutlined className="text-5xl text-muted-foreground"/>}
                                        description={
                                            <span className="text-sm text-muted-foreground">
                                                No projects found for current search.
                                            </span>
                                        }
                                    >
                                        <Button type="link" className="font-semibold">
                                            Clear all filters
                                        </Button>
                                    </Empty>
                                </div>
                            )}
                        </section>
                    </div>
                </main>
            </div>

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
        </div>
    );
};

export default ProjectMain;
