import AdminLayout from './AdminLayout.tsx';
import i18n from '../../i18n';

// Trang chu admin toi thieu de /admin khong 404; cac trang quan tri khac se them vao menu AdminLayout
const AdminHomePage = () => (
    <AdminLayout>
        <h1 className="text-xl font-bold text-primary-dark">{i18n.t('admin:home.title')}</h1>
        <p className="mt-2 text-muted-foreground">{i18n.t('admin:home.description')}</p>
    </AdminLayout>
);

export default AdminHomePage;
