import {
    ClockCircleOutlined,
    FolderOutlined,
    HistoryOutlined,
    HolderOutlined,
    VideoCameraOutlined,
} from '@ant-design/icons';
import {Avatar, Tag} from 'antd';
import ActionDropdown, {type ActionDropdownItem} from "../core/common/ActionDropdown.tsx";

export type ProjectStatus = 'ACTIVE' | 'COMPLETED';

export interface ProjectMember {
    id: string;
    initials: string;
}

export interface ProjectOverviewCardProps {
    projectId?: string;  // id thực tế từ DB, khác với code hiển thị
    title: string;
    code: string;
    category?: string;
    ownerEmail: string;
    description: string;
    status: ProjectStatus;
    folderCount: number;
    videoCount: number;
    revisionCount: number;
    pendingCount?: number;
    timeline: string;
    updatedAt: string;
    members: ProjectMember[];
    extraMembers?: number;
    onClick?: () => void;
}

const ProjectOverviewCard = ({
    title,
    code,
    category,
    ownerEmail,
    description,
    status,
    folderCount,
    videoCount,
    revisionCount,
    pendingCount,
    timeline,
    updatedAt,
    members,
    extraMembers = 0,
    onClick,
}: ProjectOverviewCardProps) => {
    const isActive = status === 'ACTIVE';


    return (
        <button
            type="button"
            onClick={onClick}
            className="group relative w-full rounded-2xl border border-border/40 bg-card p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
        >
            <div className="absolute left-2 top-1/2 hidden -translate-y-1/2 text-muted-foreground/50 transition-opacity group-hover:block">
                <HolderOutlined/>
            </div>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                            {title}
                        </h3>

                        <Tag
                            className={`m-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                isActive
                                    ? 'border-primary/20 bg-primary/10 text-primary'
                                    : 'border-secondary/20 bg-muted text-primary-dark'
                            }`}
                        >
                            {isActive ? 'Active' : 'Completed'}
                        </Tag>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
                        <span className="rounded bg-muted px-2 py-0.5 text-primary-dark">{code}</span>
                        <span>{category}</span>
                        <span>•</span>
                        <span>{ownerEmail}</span>
                    </div>

                    <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-8">
                    <div className="flex items-center gap-5">
                        <div className="text-center text-muted-foreground">
                            <FolderOutlined className="text-base"/>
                            <p className="mt-1 text-[10px] font-bold">{folderCount}</p>
                        </div>

                        <div className="text-center text-muted-foreground">
                            <VideoCameraOutlined className="text-base"/>
                            <p className="mt-1 text-[10px] font-bold">{videoCount}</p>
                        </div>

                        <div className="text-center text-muted-foreground">
                            <HistoryOutlined className="text-base"/>
                            <p className="mt-1 text-[10px] font-bold">{revisionCount}</p>
                        </div>

                        {typeof pendingCount === 'number' && pendingCount > 0 && (
                            <div className="text-center text-destructive">
                                <ClockCircleOutlined className="text-base"/>
                                <p className="mt-1 text-[10px] font-bold">{pendingCount}</p>
                            </div>
                        )}
                    </div>

                    <div className="hidden h-10 w-px bg-border/40 lg:block"/>

                    <div className="min-w-[120px]">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Timeline</p>
                        <p className="text-xs font-semibold text-foreground">{timeline}</p>
                    </div>

                    <div className="flex -space-x-2">
                        {members.slice(0, 3).map((member) => (
                            <Avatar
                                key={member.id}
                                size={30}
                                className="border border-card bg-muted text-[11px] font-bold text-primary-dark"
                            >
                                {member.initials}
                            </Avatar>
                        ))}

                        {extraMembers > 0 && (
                            <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-card bg-muted text-[11px] font-bold text-primary-dark">
                                +{extraMembers}
                            </div>
                        )}
                    </div>

                    <div className="text-right">
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Updated</p>
                        <p className="text-xs font-medium text-muted-foreground">{updatedAt}</p>
                    </div>

                    {/*{hasActions && (*/}
                    {/*    <div*/}
                    {/*        className="absolute right-3 top-3 z-10 opacity-0 transition group-hover:opacity-100"*/}
                    {/*        onClick={stopPropagation}*/}
                    {/*    >*/}
                    {/*        <ActionDropdown<TRecord>*/}
                    {/*            actions={cardActions}*/}
                    {/*            record={record}*/}
                    {/*        />*/}
                    {/*    </div>*/}
                    {/*)}*/}
                </div>
            </div>
        </button>
    );
};

export default ProjectOverviewCard;
