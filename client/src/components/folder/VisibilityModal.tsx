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

interface VisibilityModalProps {
    open: boolean;
    folderId: string;
    projectId: string;
    ownerId?: string;
    treeItems: FolderTreeItemDTO[];
    onClose: () => void;
    onChanged: () => void;
}

const PUBLIC_NOTE =
    'Cho phép tạo link gửi khách duyệt (proof link) và mọi thành viên project xem được. Folder con INHERIT sẽ theo.';

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
            .catch(() => uiUtils.showError('Không tải được quyền truy cập của folder'))
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
            list.unshift({ value: ownerId, label: 'Owner', disabled: true });
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
            uiUtils.showSuccess('Đã cập nhật quyền truy cập');
            onChanged();
            onClose();
        } catch (e) {
            uiUtils.showError((e as Error)?.message || 'Cập nhật quyền truy cập thất bại');
        } finally {
            setSaving(false);
        }
    };

    const handleOk = () => {
        if (value === FolderVisibility.PUBLIC && current !== FolderVisibility.PUBLIC) {
            Modal.confirm({ title: 'Chuyển sang Public?', content: PUBLIC_NOTE, onOk: doSave });
            return;
        }
        if (value === FolderVisibility.RESTRICTED && current !== FolderVisibility.RESTRICTED && nonInheritChildren.length > 0) {
            Modal.confirm({
                title: 'Folder con có quyền riêng',
                content: `Các folder con sau giữ quyền riêng, không đổi theo: ${nonInheritChildren
                    .map((c) => c.folderName)
                    .join(', ')}`,
                onOk: doSave,
            });
            return;
        }
        void doSave();
    };

    return (
        <Modal
            open={open}
            title="Quyền truy cập"
            onCancel={onClose}
            onOk={handleOk}
            okText="Lưu"
            cancelText="Hủy"
            okButtonProps={{ disabled: loading || unchanged, loading: saving }}
            destroyOnHidden
        >
            <Spin spinning={loading}>
                <Radio.Group
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="flex flex-col gap-3"
                >
                    <Radio value={FolderVisibility.INHERIT}>Inherit — theo folder cha / project</Radio>
                    <Radio value={FolderVisibility.RESTRICTED}>Restricted — chỉ người được chọn</Radio>
                    <Radio value={FolderVisibility.PUBLIC} disabled={!!restrictedAncestor}>
                        Public — {PUBLIC_NOTE}
                    </Radio>
                </Radio.Group>

                {restrictedAncestor && (
                    <Alert
                        className="mt-3"
                        type="info"
                        showIcon
                        message={`Không thể Public vì folder cha "${restrictedAncestor.folderName}" đang Restricted`}
                    />
                )}

                {value === FolderVisibility.RESTRICTED && (
                    <div className="mt-4">
                        <p className="mb-1 text-xs font-semibold text-muted-foreground">Thành viên được truy cập</p>
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
