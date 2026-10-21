import { BellOutlined } from '@ant-design/icons';
import { observer } from 'mobx-react-lite';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher.tsx';
import { useStore } from '../../../store';
import UserAvatar from '../common/UserAvatar.tsx';
import logo from '../../../assets/logo/logo2k.png';
import BreadCrumbNav from '../../BreadCrumbNav.tsx';
import {type AppRoute, ROUTER_CONFIG} from '../../../utils/RouterConfigUtil.tsx';

interface AppHeaderProps {
  showBreadcrumb?: boolean;
  routes?: AppRoute[];
}

const AppHeader = observer(({routes = ROUTER_CONFIG}: AppHeaderProps) => {
  const { sessionStore } = useStore();
  const { t } = useTranslation();
  const user = sessionStore.appSession?.user;

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl flex justify-between items-center px-8 h-16 shadow-xl shadow-primary-dark/10">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center hover:opacity-90 transition-opacity">
            <img src={logo} alt="Lumina Pro Logo" className="h-10 w-auto object-contain" />
          </Link>
            <BreadCrumbNav routes={routes} className="shadow-sm shadow-primary-dark/5"/>
        </div>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          {/* Notifications */}
          <button className="p-2 hover:bg-primary/10 rounded-lg transition-all text-primary active:opacity-80 scale-95">
            <BellOutlined className="text-lg" />
          </button>

          {/* User Avatar */}
          <Link to="/profile" aria-label={user?.publicUserName || user?.email || t('profile')}>
            <UserAvatar
              size={32}
              name={user?.publicUserName}
              email={user?.email}
              className="ring-2 ring-primary/20 hover:ring-primary/40 transition-all cursor-pointer"
            />
          </Link>
        </div>
      </nav>

      {/*{showBreadcrumb && (*/}
      {/*  <div className="fixed top-16 w-full z-40">*/}
      {/*    <BreadCrumbNav routes={routes} className="shadow-sm shadow-primary-dark/5"/>*/}
      {/*  </div>*/}
      {/*)}*/}
    </>
  );
});

export default AppHeader;
