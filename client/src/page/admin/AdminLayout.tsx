import type {ReactNode} from 'react';
import CommonLayout from '../../layout/CommonLayout.tsx';
import {GlobalModalManager} from '@plugin-core/modal/GlobalModalManager';

/** Layout chung cac trang /admin: CommonLayout (sidebar quan tri nam o AppSidebar) + vung noi dung; mount GlobalModalManager 1 lan cho modal cua admin-core. */
const AdminLayout = ({children}: {children: ReactNode}) => (
    <CommonLayout>
        <div className="flex flex-1 min-h-0">
            <div className="flex-1 min-w-0 overflow-y-auto p-6">{children}</div>
        </div>
        <GlobalModalManager/>
    </CommonLayout>
);

export default AdminLayout;
