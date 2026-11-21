import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {observer} from 'mobx-react-lite';
import {Button, Col, Form, Input, Modal, Table, Tabs} from 'antd';
import {useTableStore} from '@plugin-core/table/paged/hooks/useTableStore';
import {PagedTable} from '@plugin-core/table/paged';
import {PageLayoutWithTable} from '@plugin-core/table/paged/components/PageLayoutWithTable';
import TableUtil from '@plugin-core/table/utils/table.util';
import type {ITableAction} from '@plugin-core/table/cells/TableActionCell';
import {checkPermissionUser} from '@plugin-core/auth/utils/auth.utils';
import {useSessionStore} from '@plugin-core/shared/store/useSessionStore';
import ListPermissionInput from '@plugin-core/form/inputs/ListPermissionInput';
import type {AdminRoleRowDto, AdminUserRowDto} from '../../api/api/index.defs';
import {adminApi, adminCall} from '../../api/adminApiResource';
import {ADMIN_PER} from '../../components/core/layout/sidebarMenu';
import uiUtils from '../../utils/uiUtils';
import AdminLayout from './AdminLayout.tsx';

type Mode = 'create' | 'edit' | 'view';

const AdminRolePage = observer(() => {
    const {t} = useTranslation('admin');
    const appSession = useSessionStore((s) => s.appSession);
    const tableStore = useTableStore(adminApi.roles);
    const {onLoadData} = tableStore();
    const [form] = Form.useForm();
    const [modal, setModal] = useState<{mode: Mode; id?: string} | null>(null);
    const [users, setUsers] = useState<{role: AdminRoleRowDto; rows: AdminUserRowDto[]} | null>(null);
    const readOnly = modal?.mode === 'view';

    const openModal = async (mode: Mode, row?: AdminRoleRowDto) => {
        form.resetFields();
        if (row) {
            const r = await adminCall(() => adminApi.roles.detail({id: row.id!}));
            if (!r.ok || !r.data) return;
            form.setFieldsValue({...r.data, permissions: r.data.permissions ?? []});
        }
        setModal({mode, id: row?.id});
    };

    const onSave = async () => {
        const v = await form.validateFields().catch(() => null);
        if (!v || !modal) return;
        const body = {code: v.code, name: v.name, description: v.description, permissions: v.permissions ?? []};
        const r = modal.mode === 'create'
            ? await adminCall(() => adminApi.roles.create({body}), 'admin:role.createdOk')
            : await adminCall(() => adminApi.roles.update({id: modal.id!, body}), 'admin:role.updatedOk');
        if (r.ok) {
            setModal(null);
            onLoadData();
        }
    };

    // 409 ADMIN_ROLE_IN_USE: adminCall hien toast loi theo message backend
    const onRemove = (row: AdminRoleRowDto) =>
        uiUtils.showConfirm({
            title: t('role.deleteConfirmTitle'),
            content: row.name,
            onOk: async () => {
                const r = await adminCall(() => adminApi.roles.remove({id: row.id!}), 'admin:role.deletedOk');
                if (r.ok) onLoadData();
            },
        });

    // Danh sach user chi doc: can GetDetail cua nhom va Admin.User.GetPaged
    const canListUsers = checkPermissionUser(appSession, ADMIN_PER.Role.GetDetail)
        && checkPermissionUser(appSession, ADMIN_PER.User.GetPaged);
    const openUsers = async (role: AdminRoleRowDto) => {
        const r = await adminApi.users.getPaged({body: {adminRoleId: role.id, skipCount: 0, maxResultCount: 200}})
            .catch((e: Error) => {
                uiUtils.showError(e.message);
                return null;
            });
        if (r) setUsers({role, rows: (r.data?.items ?? []) as AdminUserRowDto[]});
    };

    const actions: ITableAction<AdminRoleRowDto>[] = [
        {title: 'view', permission: ADMIN_PER.Role.GetDetail, onClick: (r) => openModal('view', r)},
        {title: 'edit', permission: ADMIN_PER.Role.Update, onClick: (r) => openModal('edit', r)},
        {title: 'remove', permission: ADMIN_PER.Role.Delete, onClick: onRemove},
    ];

    const columns = TableUtil.getColumns<AdminRoleRowDto>(
        [
            {title: <span>{t('role.code')}</span>, dataIndex: 'code', key: 'code'},
            {title: <span>{t('role.name')}</span>, dataIndex: 'name', key: 'name'},
            {
                // userCount sinh tu dong kieu string (long) nen ep Number
                title: <span>{t('role.userCount')}</span>, dataIndex: 'userCount', key: 'userCount',
                render: (v: string | undefined, r: AdminRoleRowDto) => canListUsers
                    ? <Button type="link" className="p-0" onClick={() => openUsers(r)}>{Number(v ?? 0)}</Button>
                    : Number(v ?? 0),
            },
            {title: <span>{t('role.description')}</span>, dataIndex: 'description', key: 'description'},
        ],
        {actions},
    );

    const searchFields = (
        <>
            <Col xs={24} md={8}>
                <Form.Item name="searchText" label={t('role.searchText')}>
                    <Input allowClear placeholder={t('role.searchPlaceholder')}/>
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
                titleHeader={<h2 className="m-0 text-lg font-semibold text-foreground">{t('role.title')}</h2>}
                topActions={[{title: 'addNew', permission: ADMIN_PER.Role.Create, onClick: () => openModal('create')}]}
                searchFields={searchFields}
                tableStore={tableStore}>
                <PagedTable isHiddenListTitle columns={columns} tableStore={tableStore}/>
            </PageLayoutWithTable>

            <Modal open={!!modal} onCancel={() => setModal(null)} width={760} destroyOnHidden
                   title={t(`role.modalTitle.${modal?.mode ?? 'view'}`)}
                   okText={t('common.save')} cancelText={t('common.cancel')} onOk={onSave}
                   okButtonProps={{hidden: readOnly}}>
                <Form form={form} layout="vertical" autoComplete="off" disabled={readOnly}>
                    <Tabs items={[
                        {
                            key: 'info', label: t('role.tabInfo'), forceRender: true,
                            children: (
                                <>
                                    <Form.Item name="code" label={t('role.code')}
                                               rules={[{required: true}, {pattern: /^[A-Za-z0-9_.-]{1,100}$/, message: t('role.codeInvalid')}]}>
                                        <Input disabled={modal?.mode !== 'create'}/>
                                    </Form.Item>
                                    <Form.Item name="name" label={t('role.name')} rules={[{required: true}, {max: 200}]}>
                                        <Input/>
                                    </Form.Item>
                                    <Form.Item name="description" label={t('role.description')} rules={[{max: 500}]}>
                                        <Input.TextArea rows={3}/>
                                    </Form.Item>
                                </>
                            ),
                        },
                        {
                            key: 'perm', label: t('role.tabPermission'), forceRender: true,
                            children: (
                                <Form.Item name="permissions" noStyle>
                                    <ListPermissionInput readOnly={readOnly}/>
                                </Form.Item>
                            ),
                        },
                    ]}/>
                </Form>
            </Modal>

            <Modal open={!!users} onCancel={() => setUsers(null)} footer={null} width={640} destroyOnHidden
                   title={t('role.usersTitle', {name: users?.role.name})}>
                <Table<AdminUserRowDto> size="small" rowKey="userId" pagination={false} dataSource={users?.rows}
                       columns={[
                           {title: t('user.email'), dataIndex: 'email'},
                           {title: t('user.publicUserName'), dataIndex: 'publicUserName'},
                       ]}/>
            </Modal>
        </AdminLayout>
    );
});

export default AdminRolePage;
