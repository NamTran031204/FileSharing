import { CopyOutlined, DeleteOutlined, GlobalOutlined, LockOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Checkbox, Input, Modal, Select, Spin, Tooltip } from 'antd';
import { type ReactNode, useEffect, useState } from 'react';
import { AccessControllerService } from '../../api/api/AccessControllerService';
import { FolderControllerService } from '../../api/api/FolderControllerService';
import { ProjectControllerService } from '../../api/api/ProjectControllerService';
import {
    AccessRole,
    Action,
    ShareTokenTime,
    SourceType,
    type LinkRequestDTO,
    type MyAccessDTO,
    type PeopleResponseDTO,
    type Person,
} from '../../api/api/index.defs';
import UserAvatar from '../core/common/UserAvatar';
import uiUtils from '../../utils/uiUtils.tsx';
import { LangUtil } from '../../utils/lang.util';
import i18n from '../../i18n';

export type ShareTarget = 'project' | 'folder';

interface ShareModalProps {
    open: boolean;
    type: ShareTarget;
    id: string;
    onClose: () => void;
    /** goi sau moi thay doi thanh cong de trang cha tai lai badge/quyen */
    onChanged?: () => void;
}

const ROLE_ORDER = [AccessRole.VIEWER, AccessRole.COMMENTER, AccessRole.EDITOR, AccessRole.MANAGER, AccessRole.OWNER];
const rank = (role?: AccessRole | null) => (role ? ROLE_ORDER.indexOf(role) : -1);
// project cap toi MANAGER, folder cap toi EDITOR
const scopeRoles = (type: ShareTarget) => ROLE_ORDER.slice(0, type === 'project' ? 4 : 3);
const RANGES = [ShareTokenTime.UNLIMITED, ShareTokenTime.ONE_DAY, ShareTokenTime.ONE_WEEK, ShareTokenTime.ONE_MONTH, ShareTokenTime.ONE_YEAR];

const t = (key: string, options?: Record<string, unknown>) => i18n.t(`access:shareModal.${key}`, options);
const roleLabel = (role?: AccessRole | null) => (role ? i18n.t(`access:role.${role}`) : t('linkRoleNone'));
const displayName = (p: Person) => p.publicUserName || p.email || p.userId || '';

// thong bao loi tu envelope server (axios reject voi response.data)
const errorMessage = (e: unknown): string =>
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t('actionError');

const sourceLabel = (p: Person) => {
    if (p.source === SourceType.OWNER) return t('fromOwner');
    if (p.source === SourceType.FOLDER) return t('fromFolder', { folderName: p.folderName ?? '' });
    return t('fromProject');
};

const PersonRow = ({ person, muted, right }: { person: Person; muted?: boolean; right: ReactNode }) => (
    <li className={`flex items-center gap-3 ${muted ? 'opacity-60' : ''}`}>
        <UserAvatar name={person.publicUserName} email={person.email} size={28} />
        <div className="min-w-0 flex-1">
            <p className="m-0 truncate text-sm text-foreground">{displayName(person)}</p>
            {person.publicUserName && <p className="m-0 truncate text-xs text-muted-foreground">{person.email}</p>}
        </div>
        {right}
    </li>
);

const SectionTitle = ({ children }: { children: ReactNode }) => (
    <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</p>
);

/**
 * Modal chia se 3 lop: truy cap chung (link, chi folder), nguoi duoc them truc tiep, nguoi ke thua (ghi nguon)
 * va nhom vao qua link. Nut/lua chon bat tat theo myAccess.capabilities cua chinh tai nguyen.
 */
const ShareModal = ({ open, type, id, onClose, onChanged }: ShareModalProps) => {
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [myAccess, setMyAccess] = useState<MyAccessDTO>();
    // undefined = theo cha (chi folder)
    const [viewersCanDownload, setViewersCanDownload] = useState<boolean | undefined>();
    const [people, setPeople] = useState<PeopleResponseDTO>();
    const [email, setEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<AccessRole>(AccessRole.VIEWER);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        setLoading(true);
        const detail = type === 'project'
            ? ProjectControllerService.getById({ projectId: id }).then((res) => res.data)
            : FolderControllerService.getById({ folderId: id }).then((res) => res.data);
        Promise.all([detail, AccessControllerService.people({ type, id })])
            .then(([data, peopleRes]) => {
                if (cancelled) return;
                setMyAccess(data?.myAccess);
                setViewersCanDownload(data?.settings?.viewersCanDownload ?? undefined);
                setPeople(peopleRes.data);
            })
            .catch(() => { if (!cancelled) uiUtils.showError(t('loadError')); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [open, type, id, reloadKey]);

    const can = (action: Action) => !!myAccess?.capabilities?.includes(action);
    const myRank = rank(myAccess?.ownRole);
    const canManage = can(Action.MANAGE_ACCESS);

    const run = async (fn: () => Promise<unknown>, successMessage: string): Promise<boolean> => {
        setBusy(true);
        try {
            await fn();
            uiUtils.showSuccess(successMessage);
            setReloadKey((k) => k + 1);
            onChanged?.();
            return true;
        } catch (e) {
            uiUtils.showError(errorMessage(e));
            return false;
        } finally {
            setBusy(false);
        }
    };

    const handleInvite = async () => {
        const value = email.trim();
        if (!/^\S+@\S+\.\S+$/.test(value)) {
            uiUtils.showError(t('inviteEmailInvalid'));
            return;
        }
        const ok = await run(
            () => AccessControllerService.grants2({ type, id, body: { email: value, role: inviteRole } }),
            t('invited', { email: value }),
        );
        if (ok) setEmail('');
    };

    const handleChangeRole = (person: Person, role: AccessRole) =>
        void run(() => AccessControllerService.grants({ type, id, userId: person.userId ?? '', body: { role } }), t('roleChanged'));

    const handleRemove = (person: Person) =>
        Modal.confirm({
            title: t('removeConfirm', { name: displayName(person) }),
            okText: t('remove'),
            okButtonProps: { danger: true },
            onOk: () => run(() => AccessControllerService.grants1({ type, id, userId: person.userId ?? '' }), t('removed')),
        });

    const link = type === 'folder' ? people?.link : undefined;
    const linkOn = !!link && link.enabled !== false;

    const saveLink = (patch: LinkRequestDTO) =>
        void run(() => AccessControllerService.link({
            id,
            body: {
                enabled: true,
                role: link?.role,
                allowDownload: !!link?.allowDownload,
                allowProofSelection: !!link?.allowProofSelection,
                ...patch,
            },
        }), t('linkUpdated'));

    const handleRegenerate = () =>
        Modal.confirm({
            title: t('regenerate'),
            content: t('regenerateConfirm'),
            onOk: () => saveLink({ regenerate: true }),
        });

    const copy = async (url: string) => {
        try {
            await navigator.clipboard.writeText(url);
            uiUtils.showSuccess(t('copied'));
        } catch {
            uiUtils.showError(t('clipboardBlocked'));
        }
    };

    const saveSetting = (value: string) =>
        void run(() => AccessControllerService.settings({
            type,
            id,
            body: { viewersCanDownload: value === 'inherit' ? undefined : value === 'yes' },
        }), t('settingsSaved'));

    const roleOptions = (roles: AccessRole[]) =>
        roles.map((role) => ({
            value: role,
            label: roleLabel(role),
            // khong cap vuot vai tro cua minh; MANAGER can MANAGE_ACCESS
            disabled: rank(role) > myRank || (role === AccessRole.MANAGER && !canManage),
        }));

    const direct = people?.direct ?? [];
    const inherited = people?.inherited ?? [];
    const viaLink = people?.viaLink ?? [];
    const settingValue = viewersCanDownload === undefined ? 'inherit' : viewersCanDownload ? 'yes' : 'no';

    return (
        <Modal
            open={open}
            title={type === 'project' ? t('titleProject') : t('titleFolder')}
            onCancel={onClose}
            footer={null}
            width={600}
            destroyOnHidden
        >
            <Spin spinning={loading}>
                <div className="flex flex-col gap-5 pt-2">
                    {can(Action.INVITE) && (
                        <div className="flex gap-2">
                            <Input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onPressEnter={() => void handleInvite()}
                                placeholder={t('invitePlaceholder')}
                                aria-label={t('invitePlaceholder')}
                                disabled={busy}
                            />
                            <Select
                                value={inviteRole}
                                onChange={setInviteRole}
                                options={roleOptions(scopeRoles(type))}
                                className="min-w-40"
                                aria-label={t('inviteRole')}
                                disabled={busy}
                            />
                            <Button type="primary" onClick={() => void handleInvite()} loading={busy} disabled={!email.trim()}>
                                {t('invite')}
                            </Button>
                        </div>
                    )}

                    {type === 'folder' && (
                        <section className="flex flex-col gap-3 rounded-xl border border-border p-4">
                            <SectionTitle>{t('generalAccess')}</SectionTitle>
                            {!canManage ? (
                                <p className="m-0 flex items-center gap-2 text-sm text-foreground">
                                    {linkOn ? <GlobalOutlined className="text-primary" /> : <LockOutlined className="text-muted-foreground" />}
                                    {linkOn ? t('linkSummaryOn', { role: roleLabel(link?.role) }) : t('linkSummaryOff')}
                                </p>
                            ) : (
                                <>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {linkOn ? <GlobalOutlined className="text-primary" /> : <LockOutlined className="text-muted-foreground" />}
                                        <Select
                                            value={linkOn ? 'anyone' : 'restricted'}
                                            onChange={(v) => (v === 'anyone'
                                                ? saveLink({ role: AccessRole.VIEWER })
                                                : void run(() => AccessControllerService.link({ id, body: { enabled: false } }), t('linkUpdated')))}
                                            options={[
                                                { value: 'restricted', label: t('restricted') },
                                                { value: 'anyone', label: t('anyoneWithLink') },
                                            ]}
                                            className="min-w-48"
                                            aria-label={t('generalAccess')}
                                            disabled={busy}
                                        />
                                        {linkOn && (
                                            <Select
                                                value={link?.role ?? 'none'}
                                                onChange={(v) => saveLink({ role: v === 'none' ? '' : v })}
                                                options={[
                                                    { value: AccessRole.VIEWER, label: roleLabel(AccessRole.VIEWER) },
                                                    { value: AccessRole.COMMENTER, label: roleLabel(AccessRole.COMMENTER) },
                                                    { value: 'none', label: t('linkRoleNone') },
                                                ]}
                                                className="min-w-44"
                                                aria-label={t('linkRole')}
                                                disabled={busy}
                                            />
                                        )}
                                    </div>
                                    {linkOn && (
                                        <>
                                            <Checkbox
                                                checked={!!link?.allowDownload}
                                                onChange={(e) => saveLink({ allowDownload: e.target.checked })}
                                                disabled={busy}
                                            >
                                                {t('allowDownload')}
                                            </Checkbox>
                                            <Checkbox
                                                checked={!!link?.allowProofSelection}
                                                onChange={(e) => saveLink({ allowProofSelection: e.target.checked })}
                                                disabled={busy}
                                            >
                                                {t('allowProofSelection')}
                                            </Checkbox>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <Select
                                                    placeholder={t('expiry')}
                                                    value={null}
                                                    onChange={(v: ShareTokenTime) => saveLink({ expiry: v })}
                                                    options={RANGES.map((r) => ({ value: r, label: t(`range.${r}`) }))}
                                                    className="min-w-40"
                                                    aria-label={t('expiry')}
                                                    disabled={busy}
                                                />
                                                <span className="text-xs text-muted-foreground">
                                                    {link?.expiresAt
                                                        ? t('expiresAt', { date: new Date(link.expiresAt).toLocaleString(LangUtil.getDateLocale()) })
                                                        : t('noExpiry')}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Tooltip title={!link?.role ? t('linkRoleNone') : undefined}>
                                                    <Button
                                                        icon={<CopyOutlined />}
                                                        disabled={!link?.token || !link?.role}
                                                        onClick={() => void copy(`${window.location.origin}/s/${link?.token}`)}
                                                    >
                                                        {t('copyViewLink')}
                                                    </Button>
                                                </Tooltip>
                                                <Button
                                                    icon={<CopyOutlined />}
                                                    disabled={!link?.token || !link?.allowProofSelection}
                                                    onClick={() => void copy(`${window.location.origin}/proof/${link?.token}`)}
                                                >
                                                    {t('copyProofLink')}
                                                </Button>
                                                <Button icon={<ReloadOutlined />} danger disabled={busy} onClick={handleRegenerate}>
                                                    {t('regenerate')}
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </section>
                    )}

                    <section className="flex flex-col gap-3">
                        <SectionTitle>{t('peopleWithAccess')}</SectionTitle>
                        {direct.length === 0 && <p className="m-0 text-sm text-muted-foreground">{t('directEmpty')}</p>}
                        <ul className="m-0 flex list-none flex-col gap-3 p-0">
                            {direct.map((person) => {
                                const editable = canManage && person.role !== AccessRole.OWNER && rank(person.role) <= myRank;
                                return (
                                    <PersonRow
                                        key={`direct-${person.userId}`}
                                        person={person}
                                        right={editable ? (
                                            <div className="flex items-center gap-1">
                                                <Select
                                                    size="small"
                                                    value={person.role}
                                                    onChange={(role: AccessRole) => handleChangeRole(person, role)}
                                                    options={roleOptions(scopeRoles(type))}
                                                    className="min-w-36"
                                                    aria-label={t('changeRole', { name: displayName(person) })}
                                                    disabled={busy}
                                                />
                                                <Tooltip title={t('remove')}>
                                                    <Button
                                                        size="small"
                                                        type="text"
                                                        danger
                                                        icon={<DeleteOutlined />}
                                                        aria-label={t('remove')}
                                                        disabled={busy}
                                                        onClick={() => handleRemove(person)}
                                                    />
                                                </Tooltip>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">{roleLabel(person.role)}</span>
                                        )}
                                    />
                                );
                            })}
                        </ul>
                    </section>

                    {inherited.length > 0 && (
                        <section className="flex flex-col gap-3">
                            <SectionTitle>{t('inherited')}</SectionTitle>
                            <p className="m-0 text-xs text-muted-foreground">{t('inheritedHint')}</p>
                            <ul className="m-0 flex list-none flex-col gap-3 p-0">
                                {inherited.map((person) => (
                                    <PersonRow
                                        key={`inherited-${person.userId}-${person.folderId ?? person.source}`}
                                        person={person}
                                        muted
                                        right={
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs text-foreground">{roleLabel(person.role)}</span>
                                                <span className="text-[11px] text-muted-foreground">{sourceLabel(person)}</span>
                                            </div>
                                        }
                                    />
                                ))}
                            </ul>
                        </section>
                    )}

                    {viaLink.length > 0 && (
                        <section className="flex flex-col gap-3">
                            <SectionTitle>{t('viaLink')}</SectionTitle>
                            <ul className="m-0 flex list-none flex-col gap-3 p-0">
                                {viaLink.map((person) => (
                                    <PersonRow
                                        key={`link-${person.userId}`}
                                        person={person}
                                        right={<span className="text-xs text-muted-foreground">{roleLabel(person.role)}</span>}
                                    />
                                ))}
                            </ul>
                        </section>
                    )}

                    {can(Action.MANAGE_SETTINGS) && (
                        <section className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                            <span className="text-sm text-foreground">{t('viewersCanDownload')}</span>
                            <Select
                                value={settingValue}
                                onChange={saveSetting}
                                options={[
                                    ...(type === 'folder' ? [{ value: 'inherit', label: t('inheritParent') }] : []),
                                    { value: 'yes', label: t('yes') },
                                    { value: 'no', label: t('no') },
                                ]}
                                className="min-w-36"
                                aria-label={t('viewersCanDownload')}
                                disabled={busy}
                            />
                        </section>
                    )}
                </div>
            </Spin>
        </Modal>
    );
};

export default ShareModal;
