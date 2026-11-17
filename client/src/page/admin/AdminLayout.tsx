import type {ReactNode} from 'react';
import {Menu} from 'antd';
import {useLocation, useNavigate} from 'react-router-dom';
import CommonLayout from '../../layout/CommonLayout.tsx';
import {GlobalModalManager} from '@plugin-core/modal/GlobalModalManager';
import i18n from '../../i18n';

// Khung menu quan tri. Moi page admin (users, settings, ...) them 1 muc cua minh vao day khi duoc tao.
const adminMenuItems = () => [
    {key: '/admin', label: i18n.t('admin:menu.home')},
    {key: '/admin/users', label: i18n.t('admin:menu.users')},
    {key: '/admin/settings', label: i18n.t('admin:menu.settings')},
    {key: '/admin/email-templates', label: i18n.t('admin:menu.emailTemplates')},
    {key: '/admin/nodes', label: i18n.t('admin:menu.nodes')},
];

/** Layout chung cac trang /admin: CommonLayout + menu doc ben trai; mount GlobalModalManager 1 lan cho modal cua admin-core. */
const AdminLayout = ({children}: {children: ReactNode}) => {
    const navigate = useNavigate();
    const {pathname} = useLocation();

    return (
        <CommonLayout>
            <div className="flex flex-1 min-h-0">
                {/* Boc div de dat do rong: antd .ant-menu-inline{width:100%} nam ngoai @layer nen ghi de w-56 truyen thang vao Menu */}
                <div className="w-56 shrink-0">
                    <Menu
                        mode="inline"
                        className="bg-background"
                        selectedKeys={[pathname]}
                        items={adminMenuItems()}
                        onClick={({key}) => navigate(key)}
                    />
                </div>
                <div className="flex-1 min-w-0 overflow-y-auto p-6">{children}</div>
            </div>
            <GlobalModalManager/>
        </CommonLayout>
    );
};

export default AdminLayout;
