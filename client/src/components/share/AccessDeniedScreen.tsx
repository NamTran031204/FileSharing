import { LockOutlined } from '@ant-design/icons';
import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import CommonLayout from '../../layout/CommonLayout.tsx';
import i18n from '../../i18n';

/** Man "Ban can quyen truy cap", App hien khi API tra ACCESS_DENIED (5701) thay cho toast loi */
const AccessDeniedScreen = () => {
    const navigate = useNavigate();

    return (
        <CommonLayout>
            <main className="flex flex-1 items-center justify-center overflow-y-auto bg-background px-4">
                <Result
                    icon={<LockOutlined className="text-primary" />}
                    title={i18n.t('access:accessDenied.title')}
                    subTitle={i18n.t('access:accessDenied.description')}
                    extra={[
                        <Button key="shared" onClick={() => navigate('/shared-with-me')}>
                            {i18n.t('access:sharedWithMe.title')}
                        </Button>,
                        <Button key="home" type="primary" onClick={() => navigate('/home')}>
                            {i18n.t('access:accessDenied.goHome')}
                        </Button>,
                    ]}
                />
            </main>
        </CommonLayout>
    );
};

export default AccessDeniedScreen;
