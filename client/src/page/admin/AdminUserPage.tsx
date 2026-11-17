import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {observer} from 'mobx-react-lite';
import {Button, Checkbox, Col, Drawer, Descriptions, Form, Input, Select, Tag} from 'antd';
import {PlusOutlined} from '@ant-design/icons';
import {useTableStore} from '@plugin-core/table/paged/hooks/useTableStore';
import {PagedTable} from '@plugin-core/table/paged';
import {PageLayoutWithTable} from '@plugin-core/table/paged/components/PageLayoutWithTable';
import TableUtil from '@plugin-core/table/utils/table.util';
import type {ITableAction} from '@plugin-core/table/cells/TableActionCell';
import {useSimpleFormModal} from '@plugin-core/modal/GlobalModalManager/hook/useSimpleFormModal';
import type {AdminUserDetailDto, AdminUserRowDto} from '../../api/api/index.defs';
import {AuthProvider, UserGrantedRole} from '../../api/api/index.defs';
import {adminApi, adminCall} from '../../api/adminApiResource';
import {useStore} from '../../store';
import uiUtils from '../../utils/uiUtils';
import AdminLayout from './AdminLayout.tsx';
import {formatBytes, formatDateTime} from './adminFormat';

const ROLES = Object.values(UserGrantedRole);

const AdminUserPage = observer(() => {
    const {t} = useTranslation('admin');
    const {sessionStore} = useStore();
    const myUserId = sessionStore.appSession.user?.userId;
    const tableStore = useTableStore(adminApi.users);
    const {onLoadData} = tableStore();
    const [detail, setDetail] = useState<AdminUserDetailDto | null>(null);

    // Form tao tai khoan van hanh: email, ten hien thi, mat khau (toi thieu 8 ky tu)
    const {openFormModal: openCreateForm} = useSimpleFormModal({
        title: t('user.createTitle'),
        formFields: (
            <>
                <Form.Item name="email" label={t('user.email')} rules={[{required: true}, {type: 'email'}]}>
                    <Input autoComplete="off"/>
                </Form.Item>
                <Form.Item name="publicUserName" label={t('user.publicUserName')} rules={[{required: true}]}>
                    <Input autoComplete="off"/>
                </Form.Item>
                <Form.Item name="password" label={t('user.password')} rules={[{required: true}, {min: 8}]}>
                    <Input.Password autoComplete="new-password"/>
                </Form.Item>
            </>
        ),
    });

    // Form gan role: ROLE_USER luon chon va khoa, khong go duoc
    const {openFormModal: openRoleForm} = useSimpleFormModal({
        title: t('user.assignRoleTitle'),
        formFields: (
            <Form.Item name="roles" label={t('user.roles')}>
                <Checkbox.Group
                    className="flex flex-col gap-2"
                    options={ROLES.map((r) => ({value: r, label: r, disabled: r === UserGrantedRole.ROLE_USER}))}
                />
            </Form.Item>
        ),
    });

    // Nut Tao tai khoan van hanh. Hien tai: tao tai khoan co ROLE_USER + ROLE_SA (backend gan role, FE chi gui
    // email/ten/mat khau qua adminApi.users.create). Sau nay mo rong tao tai khoan tenant va tai khoan theo doi
    // benchmark/worker; khi do role tach khoi ROLE_SA (vd ROLE_ADMIN chi xem worker/benchmark).
    const onCreateOperator = () =>
        openCreateForm({}, async (values) => {
            const r = await adminCall(
                () => adminApi.users.create({body: values}),
                'admin:user.createdOk',
            );
            if (r.ok) onLoadData();
            return {mustCloseModal: r.ok};
        });

    const onView = async (row: AdminUserRowDto) => {
        const r = await adminCall(() => adminApi.users.detail({userId: row.userId!}));
        if (r.ok && r.data) setDetail(r.data);
    };

    const onToggleLock = (row: AdminUserRowDto) => {
        const lock = !!row.enabled;
        uiUtils.showConfirm({
            title: t(lock ? 'user.lockConfirmTitle' : 'user.unlockConfirmTitle'),
            content: row.email,
            onOk: async () => {
                const r = await adminCall(
                    () => (lock ? adminApi.users.lock : adminApi.users.unlock)({userId: row.userId!}),
                    lock ? 'admin:user.lockedOk' : 'admin:user.unlockedOk',
                );
                if (r.ok) onLoadData();
            },
        });
    };

    const onAssignRole = (row: AdminUserRowDto) =>
        openRoleForm({roles: row.roles ?? [UserGrantedRole.ROLE_USER]}, async (values) => {
            const roles = Array.from(new Set([UserGrantedRole.ROLE_USER, ...((values.roles as UserGrantedRole[]) ?? [])]));
            const r = await adminCall(
                () => adminApi.users.roles({userId: row.userId!, body: {roles}}),
                'admin:user.rolesOk',
            );
            if (r.ok) onLoadData();
            return {mustCloseModal: r.ok};
        });

    const onRevoke = (row: AdminUserRowDto) =>
        uiUtils.showConfirm({
            title: t('user.revokeConfirmTitle'),
            content: t('user.revokeConfirmContent', {email: row.email}),
            onOk: async () => {
                await adminCall(() => adminApi.users.revokeSessions({userId: row.userId!}), 'admin:user.revokedOk');
            },
        });

    const actions: ITableAction<AdminUserRowDto>[] = [
        {title: 'view', onClick: onView},
        // khoa/mo khoa an voi chinh minh (backend cung chan ADMIN_SELF_ACTION_FORBIDDEN)
        {title: 'lock', hiddenIf: (r) => r.userId === myUserId || !r.enabled, onClick: onToggleLock},
        {title: 'unlock', hiddenIf: (r) => r.userId === myUserId || !!r.enabled, onClick: onToggleLock},
        {title: 'assignRole', onClick: onAssignRole},
        {title: 'revokeSessions', onClick: onRevoke},
    ];

    const columns = TableUtil.getColumns<AdminUserRowDto>(
        [
            {title: <span>{t('user.email')}</span>, dataIndex: 'email', key: 'email'},
            {title: <span>{t('user.publicUserName')}</span>, dataIndex: 'publicUserName', key: 'publicUserName'},
            {
                title: <span>{t('user.roles')}</span>, dataIndex: 'roles', key: 'roles',
                render: (roles: string[] = []) => roles.map((r) => <Tag key={r}>{r}</Tag>),
            },
            {
                title: <span>{t('user.status')}</span>, dataIndex: 'enabled', key: 'enabled',
                render: (v: boolean) => (
                    <Tag color={v ? 'var(--color-success)' : 'var(--color-destructive)'}>
                        {t(v ? 'user.enabled' : 'user.locked')}
                    </Tag>
                ),
            },
            {
                title: <span>{t('user.provider')}</span>, dataIndex: 'providers', key: 'providers',
                render: (p: string[] = []) => p.join(', ') || '—',
            },
            {title: <span>{t('user.createdAt')}</span>, dataIndex: 'createdAt', key: 'createdAt', render: formatDateTime},
            {title: <span>{t('user.lastLoginAt')}</span>, dataIndex: 'lastLoginAt', key: 'lastLoginAt', render: formatDateTime},
        ],
        {actions},
    );

    const searchFields = (
        <>
            <Col xs={24} md={8}>
                <Form.Item name="searchText" label={t('user.searchText')}>
                    <Input allowClear placeholder={t('user.searchPlaceholder')}/>
                </Form.Item>
            </Col>
            <Col xs={12} md={4}>
                <Form.Item name="role" label={t('user.roles')}>
                    <Select allowClear options={ROLES.map((r) => ({value: r, label: r}))}/>
                </Form.Item>
            </Col>
            <Col xs={12} md={4}>
                <Form.Item name="enabled" label={t('user.status')}>
                    <Select allowClear options={[
                        {value: true, label: t('user.enabled')},
                        {value: false, label: t('user.locked')},
                    ]}/>
                </Form.Item>
            </Col>
            <Col xs={12} md={4}>
                <Form.Item name="provider" label={t('user.provider')}>
                    <Select allowClear options={Object.values(AuthProvider).map((p) => ({value: p, label: p}))}/>
                </Form.Item>
            </Col>
            <Col xs={12} md={4} className="flex items-end">
                <Form.Item>
                    <Button type="primary" htmlType="submit">{t('common.search')}</Button>
                </Form.Item>
            </Col>
        </>
    );

    return (
        <AdminLayout>
            <PageLayoutWithTable
                titleHeader={<h2 className="m-0 text-lg font-semibold text-foreground">{t('user.title')}</h2>}
                topActions={[{
                    content: (
                        <Button type="primary" icon={<PlusOutlined/>} onClick={onCreateOperator}>
                            {t('user.create')}
                        </Button>
                    ),
                }]}
                searchFields={searchFields}
                tableStore={tableStore}>
                <PagedTable isHiddenListTitle columns={columns} tableStore={tableStore}/>
            </PageLayoutWithTable>

            <Drawer open={!!detail} onClose={() => setDetail(null)} title={t('user.detailTitle')} size={480}>
                {detail && (
                    <Descriptions column={1} bordered size="small">
                        <Descriptions.Item label={t('user.email')}>{detail.email}</Descriptions.Item>
                        <Descriptions.Item label={t('user.publicUserName')}>{detail.publicUserName}</Descriptions.Item>
                        <Descriptions.Item label={t('user.roles')}>{detail.roles?.join(', ')}</Descriptions.Item>
                        <Descriptions.Item label={t('user.ownedProjectCount')}>{detail.ownedProjectCount}</Descriptions.Item>
                        <Descriptions.Item label={t('user.fileCount')}>{detail.fileCount}</Descriptions.Item>
                        <Descriptions.Item label={t('user.storageBytes')}>{formatBytes(detail.storageBytes)}</Descriptions.Item>
                        <Descriptions.Item label={t('user.sessionsValidAfter')}>{formatDateTime(detail.sessionsValidAfter)}</Descriptions.Item>
                        <Descriptions.Item label={t('user.lastLoginAt')}>{formatDateTime(detail.lastLoginAt)}</Descriptions.Item>
                    </Descriptions>
                )}
            </Drawer>
        </AdminLayout>
    );
});

export default AdminUserPage;
