import { Skeleton, Tooltip } from 'antd';
import type { ProjectMemberDTO } from '../../api/api/index.defs';
import UserAvatar from '../core/common/UserAvatar';
import i18n from '../../i18n';

interface ProjectMemberAvatarsProps {
    members: ProjectMemberDTO[];
    loading?: boolean;
    error?: boolean;
    /** stack: avatar xep chong (action bar); list: moi dong ten + vai tro (folder summary) */
    variant: 'stack' | 'list';
}

/** so avatar toi da hien o dang stack, phan con lai gom vao chip +N */
const MAX_VISIBLE = 4;

const roleLabel = (role?: string) =>
    role ? i18n.t(`folder:projectMembers.role.${role}`, { defaultValue: role }) : '';

const displayName = (member: ProjectMemberDTO) => member.name || member.username || member.userId || '';

const tooltipText = (member: ProjectMemberDTO) => {
    const role = roleLabel(member.role);
    return role ? `${displayName(member)} - ${role}` : displayName(member);
};

/**
 * Danh sach thanh vien project: avatar + ten, hover thay vai tro.
 * Chi hien thi, du lieu do trang cha tai (ProjectControllerService.members).
 */
const ProjectMemberAvatars = ({ members, loading, error, variant }: ProjectMemberAvatarsProps) => {
    if (loading) {
        return variant === 'stack'
            ? <Skeleton.Avatar active size={28} />
            : <Skeleton active paragraph={{ rows: 2 }} title={false} />;
    }

    if (error) {
        return <p className="text-xs text-muted-foreground">{i18n.t('folder:projectMembers.loadError')}</p>;
    }

    if (members.length === 0) {
        return <p className="text-xs text-muted-foreground">{i18n.t('folder:projectMembers.empty')}</p>;
    }

    if (variant === 'list') {
        return (
            <ul className="flex flex-col gap-2">
                {members.map((member) => (
                    <li key={member.userId} className="flex items-center gap-2">
                        <UserAvatar name={displayName(member)} avatarUrl={member.avatar} size={28} />
                        <span className="min-w-0 flex-1 truncate text-sm text-foreground">{displayName(member)}</span>
                        {member.role && (
                            <span className="shrink-0 rounded-md bg-background px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                                {roleLabel(member.role)}
                            </span>
                        )}
                    </li>
                ))}
            </ul>
        );
    }

    const visible = members.slice(0, MAX_VISIBLE);
    const hidden = members.slice(MAX_VISIBLE);

    return (
        <div className="flex items-center">
            {visible.map((member, index) => (
                <Tooltip key={member.userId} title={tooltipText(member)}>
                    <span className={`inline-flex rounded-full border-2 border-card ${index > 0 ? '-ml-2' : ''}`}>
                        <UserAvatar name={displayName(member)} avatarUrl={member.avatar} size={28} />
                    </span>
                </Tooltip>
            ))}
            {hidden.length > 0 && (
                <Tooltip
                    title={
                        <div className="flex flex-col">
                            {hidden.map((member) => (
                                <span key={member.userId}>{tooltipText(member)}</span>
                            ))}
                        </div>
                    }
                >
                    <span className="-ml-2 inline-flex h-7 min-w-7 items-center justify-center rounded-full border-2 border-card bg-muted px-1 text-[11px] font-bold text-muted-foreground">
                        {i18n.t('folder:projectMembers.moreCount', { count: hidden.length })}
                    </span>
                </Tooltip>
            )}
        </div>
    );
};

export default ProjectMemberAvatars;
