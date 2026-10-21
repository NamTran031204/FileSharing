import { GlobalOutlined, LockOutlined } from '@ant-design/icons';
import { Button, Modal } from 'antd';
import { useState } from 'react';
import { FolderControllerService } from '../../api/api/FolderControllerService';
import { ProjectControllerService } from '../../api/api/ProjectControllerService';
import { FolderVisibility, GrantedVisibility, type FolderTreeItemDTO } from '../../api/api/index.defs';
import uiUtils from '../../utils/uiUtils.tsx';
import i18n from '../../i18n';

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
            uiUtils.showSuccess(i18n.t('project:projectVisibilityToggle.projectDaChuyenSang', {Private: target === GrantedVisibility.PUBLIC ? 'Public' : 'Private'}));
            onChanged(target);
        } catch (e) {
            uiUtils.showError((e as Error)?.message || i18n.t('project:projectVisibilityToggle.doiVisibilityThatBai'));
        } finally {
            setSaving(false);
        }
    };

    const handleClick = async (e: React.MouseEvent) => {
        // nut nam trong card clickable
        e.stopPropagation();
        if (target === GrantedVisibility.PUBLIC) {
            Modal.confirm({
                title: i18n.t('project:projectVisibilityToggle.chuyenProjectSangPublic'),
                content: i18n.t('project:projectVisibilityToggle.moiUserDaDangNhap'),
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
            title: i18n.t('project:projectVisibilityToggle.chuyenProjectSangPrivate'),
            content:
                publicCount > 0
                    ? i18n.t('project:projectVisibilityToggle.coFolderPublicCoThe', {publicCount})
                    : i18n.t('project:projectVisibilityToggle.chiThanhVienProjectXem'),
            onOk: apply,
        });
    };

    return (
        <Button
            size="small"
            loading={saving}
            icon={isPublic ? <GlobalOutlined /> : <LockOutlined />}
            onClick={handleClick}
            title={i18n.t('project:projectVisibilityToggle.doiPrivatePublic')}
        >
            {isPublic ? i18n.t('project:projectVisibilityToggle.public') : i18n.t('project:projectVisibilityToggle.private')}
        </Button>
    );
};

export default ProjectVisibilityToggle;
