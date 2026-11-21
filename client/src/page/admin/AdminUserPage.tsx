import {useEffect, useState} from 'react';
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
import {ADMIN_PER} from '../../components/core/layout/sidebarMenu';
import {useStore} from '../../store';
import uiUtils from '../../utils/uiUtils';
import AdminLayout from './AdminLayout.tsx';
import {formatBytes, formatDateTime} from './adminFormat';

// Multi-select nhom quyen, nap danh sach nhom tu API (toi da 200 nhom)
const RoleGroupSelect = ({value, onChange}: {value?: string[]; onChange?: (v: string[]) => void}) => {
    const [opts, setOpts] = useState<{value: string; label: string}[]>([]);
    useEffect(() => {
        adminApi.roles.getPaged({body: {skipCount: 0, maxResultCount: 200}}).then((r) =>
            setOpts((r.data?.items ?? []).map((x) => ({value: x.id!, label: x.name || x.code || x.id!}))));
    }, []);
    return <Select mode="multiple" allowClear value={value} onChange={onChange} options={opts} optionFilterProp="label"/>;
};

const AdminUserPage = observer(() => {
    const {t} = useTranslation('admin');
    const {sessionStore} = useStore();
    const myUserId = sessionStore.appSession.user?.userId;
    const tableStore = useTableStore(adminApi.users);
    const {onLoadData} = tableStore();
    const [detail, setDetail] = useState<AdminUserDetailDto | null>(null);

    const actorIsSA = !!sessionStore.appSession.user?.userGrantedRoles?.includes(UserGrantedRole.ROLE_SA);

    // Form tao tai khoan quan tri: checkbox SA chi hien voi actor la SA
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
                <Form.Item name="adminRoleIds" label={t('user.adminRoles')}>
                    <RoleGroupSelect/>
                </Form.Item>
                {actorIsSA && (
                    <Form.Item name="sa" valuePropName="checked">
                        <Checkbox>{t('user.saLabel')}</Checkbox>
                    </Form.Item>
                )}
            </>
        ),
    });

    // Form gan nhom quyen (chi tai khoan phia quan tri)
    const {openFormModal: openRoleForm} = useSimpleFormModal({
        title: t('user.assignRoleTitle'),
        formFields: (
            <>
                <Form.Item name="adminRoleIds" label={t('user.adminRoles')}>
                    <RoleGroupSelect/>
                </Form.Item>
                {actorIsSA && (
                    <Form.Item name="sa" valuePropName="checked">
                        <Checkbox>{t('user.saLabel')}</Checkbox>
                    </Form.Item>
                )}
            </>
        ),
    });

    const onCreateOperator = () =>
        openCreateForm({adminRoleIds: [], sa: false}, async (values) => {
            const r = await adminCall(
                () => adminApi.users.create({body: {...values, sa: actorIsSA ? !!values.sa : false}}),
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
        openRoleForm(
            {sa: !!row.roles?.includes(UserGrantedRole.ROLE_SA), adminRoleIds: (row.adminRoles ?? []).map((r) => r.id)},
            async (values) => {
                const r = await adminCall(
                    () => adminApi.users.adminRoles({
                        userId: row.userId!,
                        body: {sa: actorIsSA ? !!values.sa : false, adminRoleIds: values.adminRoleIds ?? []},
                    }),
                    'admin:user.rolesOk',
                );
                if (r.ok) onLoadData();
                return {mustCloseModal: r.ok};
            },
        );

    const onRevoke = (row: AdminUserRowDto) =>
        uiUtils.showConfirm({
            title: t('user.revokeConfirmTitle'),
            content: t('user.revokeConfirmContent', {email: row.email}),
            onOk: async () => {
                await adminCall(() => adminApi.users.revokeSessions({userId: row.userId!}), 'admin:user.revokedOk');
            },
        });

    // dong SA: nguoi khong phai SA khong duoc thao tac ghi (G2); gan nhom quyen chi cho tai khoan phia quan tri (G5)
    const isSaRow = (r: AdminUserRowDto) => !!r.roles?.includes(UserGrantedRole.ROLE_SA);
    const writeHidden = (r: AdminUserRowDto) => !actorIsSA && isSaRow(r);
    const actions: ITableAction<AdminUserRowDto>[] = [
        {title: 'view', permission: ADMIN_PER.User.GetDetail, onClick: onView},
        // khoa/mo khoa an voi chinh minh (backend cung chan ADMIN_SELF_ACTION_FORBIDDEN)
        {title: 'lock', permission: ADMIN_PER.User.Lock, hiddenIf: (r) => r.userId === myUserId || !r.enabled || writeHidden(r), onClick: onToggleLock},
        {title: 'unlock', permission: ADMIN_PER.User.Lock, hiddenIf: (r) => r.userId === myUserId || !!r.enabled || writeHidden(r), onClick: onToggleLock},
        {title: 'assignRole', permission: ADMIN_PER.User.AssignRole, hiddenIf: (r) => !r.adminSide || writeHidden(r), onClick: onAssignRole},
        {title: 'revokeSessions', permission: ADMIN_PER.User.RevokeSession, hiddenIf: writeHidden, onClick: onRevoke},
    ];

    const columns = TableUtil.getColumns<AdminUserRowDto>(
        [
            {title: <span>{t('user.email')}</span>, dataIndex: 'email', key: 'email'},
            {title: <span>{t('user.publicUserName')}</span>, dataIndex: 'publicUserName', key: 'publicUserName'},
            {
                title: <span>{t('user.side')}</span>, dataIndex: 'adminSide', key: 'adminSide',
                render: (v: boolean) => t(v ? 'user.sideAdmin' : 'user.sideUser'),
            },
            {
                title: <span>{t('user.adminRoles')}</span>, dataIndex: 'adminRoles', key: 'adminRoles',
                render: (rs: AdminUserRowDto['adminRoles'] = [], r: AdminUserRowDto) => (
                    <>
                        {isSaRow(r) && <Tag color="var(--color-primary)">SA</Tag>}
                        {(rs ?? []).map((x) => <Tag key={x.id}>{x.name}</Tag>)}
                    </>
                ),
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
                <Form.Item name="adminSide" label={t('user.side')}>
                    <Select allowClear options={[
                        {value: false, label: t('user.sideUser')},
                        {value: true, label: t('user.sideAdmin')},
                    ]}/>
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
                hiddenHeader
                titleHeader={<h2 className="m-0 text-lg font-semibold text-foreground">{t('user.title')}</h2>}
                topActions={[{
                    permission: ADMIN_PER.User.Create,
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
