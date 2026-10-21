import { GlobalOutlined, LockOutlined } from '@ant-design/icons';
import { Button, Modal } from 'antd';
import { useState } from 'react';
import { FolderControllerService } from '../../api/api/FolderControllerService';
import { ProjectControllerService } from '../../api/api/ProjectControllerService';
import { FolderVisibility, GrantedVisibility, type FolderTreeItemDTO } from '../../api/api/index.defs';
import uiUtils from '../../utils/uiUtils.tsx';

interface ProjectVisibilityToggleProps {
    projectId: string;
    visibility?: GrantedVisibility;
    onChanged: (visibility: GrantedVisibility) => void;
}

// duyet cay con de dem folder PUBLIC (co the dang co proof link)
const countPublicFolders = (nodes: FolderTreeItemDTO[] | undefined): number =>
    (nodes ?? []).reduce(
        (sum, n) =>
            sum +
            (n.visibility === FolderVisibility.PUBLIC ? 1 : 0) +
            countPublicFolders((n as { children?: FolderTreeItemDTO[] }).children),
        0,
    );

const ProjectVisibilityToggle = ({ projectId, visibility, onChanged }: ProjectVisibilityToggleProps) => {
    const [saving, setSaving] = useState(false);
    const isPublic = visibility === GrantedVisibility.PUBLIC;
    const target = isPublic ? GrantedVisibility.PRIVATE : GrantedVisibility.PUBLIC;

    const apply = async () => {
        setSaving(true);
        try {
            const res = await ProjectControllerService.visibility({ projectId, body: { visibility: target } });
            if (!res.isSuccessful) throw new Error(res.message);
            uiUtils.showSuccess(`Project đã chuyển sang ${target === GrantedVisibility.PUBLIC ? 'Public' : 'Private'}`);
            onChanged(target);
        } catch (e) {
            uiUtils.showError((e as Error)?.message || 'Đổi visibility thất bại');
        } finally {
            setSaving(false);
        }
    };

    const handleClick = async (e: React.MouseEvent) => {
        // nut nam trong card clickable
        e.stopPropagation();
        if (target === GrantedVisibility.PUBLIC) {
            Modal.confirm({
                title: 'Chuyển project sang Public?',
                content: 'Mọi user đã đăng nhập xem được project, cây thư mục và asset ở gốc.',
                onOk: apply,
            });
            return;
        }
        let publicCount = 0;
        try {
            const tree = await FolderControllerService.getTree({ projectId });
            publicCount = countPublicFolders(tree.data?.tree as FolderTreeItemDTO[] | undefined);
        } catch {
            // dem khong duoc thi van cho chuyen
        }
        Modal.confirm({
            title: 'Chuyển project sang Private?',
            content:
                publicCount > 0
                    ? `Có ${publicCount} folder Public (có thể đã có proof link). Link vẫn kiểm tra quyền mỗi lần truy cập.`
                    : 'Chỉ thành viên project xem được.',
            onOk: apply,
        });
    };

    return (
        <Button
            size="small"
            loading={saving}
            icon={isPublic ? <GlobalOutlined /> : <LockOutlined />}
            onClick={handleClick}
            title="Đổi Private / Public"
        >
            {isPublic ? 'Public' : 'Private'}
        </Button>
    );
};

export default ProjectVisibilityToggle;
