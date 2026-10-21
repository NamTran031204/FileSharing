import { Alert, Modal, Radio, Select, Spin } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { FolderControllerService } from '../../api/api/FolderControllerService';
import { ProjectControllerService } from '../../api/api/ProjectControllerService';
import {
    FolderVisibility,
    type FolderTreeItemDTO,
    type ProjectMemberDTO,
} from '../../api/api/index.defs';
import uiUtils from '../../utils/uiUtils.tsx';
import { findRestrictedAncestor, listNonInheritDescendants } from '../../utils/visibilityUtils';
import i18n from '../../i18n';

interface VisibilityModalProps {
    open: boolean;
    folderId: string;
    projectId: string;
    ownerId?: string;
    treeItems: FolderTreeItemDTO[];
    onClose: () => void;
    onChanged: () => void;
}

const getPublicNote = () => i18n.t('folder:visibilityModal.choPhepTaoLinkGui');

const VisibilityModal = ({ open, folderId, projectId, ownerId, treeItems, onClose, onChanged }: VisibilityModalProps) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [current, setCurrent] = useState<FolderVisibility>(FolderVisibility.INHERIT);
    const [value, setValue] = useState<FolderVisibility>(FolderVisibility.INHERIT);
    const [members, setMembers] = useState<ProjectMemberDTO[]>([]);
    const [restrictedIds, setRestrictedIds] = useState<string[]>([]);
    const [initialIds, setInitialIds] = useState<string[]>([]);

    const restrictedAncestor = useMemo(() => findRestrictedAncestor(folderId, treeItems), [folderId, treeItems]);
    const nonInheritChildren = useMemo(() => listNonInheritDescendants(folderId, treeItems), [folderId, treeItems]);

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        setLoading(true);
        Promise.all([
            FolderControllerService.getById({ folderId }),
            ProjectControllerService.members({ projectId }),
        ])
            .then(([folderRes, memberRes]) => {
                if (cancelled) return;
                const folder = folderRes.data;
                const vis = folder?.visibility ?? FolderVisibility.INHERIT;
                const ids = (folder?.userPermissions ?? [])
                    .filter((p) => p.isPrivateCollaborator && p.userId)
                    .map((p) => p.userId as string);
                const withOwner = ownerId && !ids.includes(ownerId) ? [ownerId, ...ids] : ids;
                setCurrent(vis);
                setValue(vis);
                setRestrictedIds(withOwner);
                setInitialIds(withOwner);
                setMembers(memberRes.data ?? []);
            })
            .catch(() => uiUtils.showError(i18n.t('folder:visibilityModal.khongTaiDuocQuyenTruy')))
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [open, folderId, projectId, ownerId]);

    const options = useMemo(() => {
        const list = members.map((m) => ({
            value: m.userId as string,
            label: m.name || m.username || m.userId,
            disabled: m.userId === ownerId,
        }));
        if (ownerId && !list.some((o) => o.value === ownerId)) {
            list.unshift({ value: ownerId, label: i18n.t('folder:visibilityModal.owner'), disabled: true });
        }
        return list;
    }, [members, ownerId]);

    const listChanged =
        restrictedIds.length !== initialIds.length || restrictedIds.some((id) => !initialIds.includes(id));
    const unchanged = value === current && (value !== FolderVisibility.RESTRICTED || !listChanged);

    const doSave = async () => {
        setSaving(true);
        try {
            const res =
                value === current && value === FolderVisibility.RESTRICTED
                    // change-visibility no-op khi khong doi kieu, doi danh sach qua update-detail
                    ? await FolderControllerService.updateDetail({ body: { folderId, restrictedUserIds: restrictedIds } })
                    : await FolderControllerService.changeVisibility({
                          body: {
                              folderId,
                              visibility: value,
                              restrictedUserIds: value === FolderVisibility.RESTRICTED ? restrictedIds : undefined,
                          },
                      });
            if (!res.isSuccessful) throw new Error(res.message);
            uiUtils.showSuccess(i18n.t('folder:visibilityModal.daCapNhatQuyenTruy'));
            onChanged();
            onClose();
        } catch (e) {
            uiUtils.showError((e as Error)?.message || i18n.t('folder:visibilityModal.capNhatQuyenTruyCap'));
        } finally {
            setSaving(false);
        }
    };

    const handleOk = () => {
        if (value === FolderVisibility.PUBLIC && current !== FolderVisibility.PUBLIC) {
            Modal.confirm({ title: i18n.t('folder:visibilityModal.chuyenSangPublic'), content: getPublicNote(), onOk: doSave });
            return;
        }
        if (value === FolderVisibility.RESTRICTED && current !== FolderVisibility.RESTRICTED && nonInheritChildren.length > 0) {
            Modal.confirm({
                title: i18n.t('folder:visibilityModal.folderConCoQuyenRieng'),
                content: i18n.t('folder:visibilityModal.cacFolderConSauGiu', {join: nonInheritChildren
                    .map((c) => c.folderName)
                    .join(', ')}),
                onOk: doSave,
            });
            return;
        }
        void doSave();
    };

    return (
        <Modal
            open={open}
            title={i18n.t('folder:visibilityModal.quyenTruyCap')}
            onCancel={onClose}
            onOk={handleOk}
            okText={i18n.t('folder:visibilityModal.luu')}
            cancelText={i18n.t('folder:visibilityModal.huy')}
            okButtonProps={{ disabled: loading || unchanged, loading: saving }}
            destroyOnHidden
        >
            <Spin spinning={loading}>
                <Radio.Group
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="flex flex-col gap-3"
                >
                    <Radio value={FolderVisibility.INHERIT}>{i18n.t('folder:visibilityModal.inheritFollowsParent')}</Radio>
                    <Radio value={FolderVisibility.RESTRICTED}>{i18n.t('folder:visibilityModal.restrictedChiNguoiDuocChon')}</Radio>
                    <Radio value={FolderVisibility.PUBLIC} disabled={!!restrictedAncestor}>
                        {i18n.t('folder:visibilityModal.publicPrefix', {note: getPublicNote()})}
                    </Radio>
                </Radio.Group>

                {restrictedAncestor && (
                    <Alert
                        className="mt-3"
                        type="info"
                        showIcon
                        message={i18n.t('folder:visibilityModal.khongThePublicViFolder', {folderName: restrictedAncestor.folderName})}
                    />
                )}

                {value === FolderVisibility.RESTRICTED && (
                    <div className="mt-4">
                        <p className="mb-1 text-xs font-semibold text-muted-foreground">{i18n.t('folder:visibilityModal.thanhVienDuocTruyCap')}</p>
                        <Select
                            mode="multiple"
                            className="w-full"
                            value={restrictedIds}
                            options={options}
                            optionFilterProp="label"
                            onChange={(ids) => setRestrictedIds(ownerId && !ids.includes(ownerId) ? [ownerId, ...ids] : ids)}
                        />
                    </div>
                )}
            </Spin>
        </Modal>
    );
};

export default VisibilityModal;
