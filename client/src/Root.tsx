import {GoogleOAuthProvider} from '@react-oauth/google';
import {ConfigProvider} from 'antd';
import {useTranslation} from 'react-i18next';
import App from './App.tsx';
import {Provider, rootStore} from './store';
import ModalProvider from './core/context/ModalProvider';
import {LangUtil, type Lang} from './utils/lang.util';

const Root = () => {
    // doi ngon ngu -> remount cay UI (key) de moi i18n.t() duoc danh gia lai; store nam ngoai cay nen giu nguyen
    const {i18n} = useTranslation();
    return (
        <ConfigProvider locale={LangUtil.getAntLocale(i18n.language as Lang)}>
            <GoogleOAuthProvider key={i18n.language} clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                <Provider value={rootStore}>
                    <ModalProvider>
                        <App/>
                    </ModalProvider>
                </Provider>
            </GoogleOAuthProvider>
        </ConfigProvider>
    );
};

export default Root;
