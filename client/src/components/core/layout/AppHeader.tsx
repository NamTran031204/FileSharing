import { BellOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar } from 'antd';
import { Link } from 'react-router-dom';
import logo from '../../../assets/logo/logo2k.png';
import BreadCrumbNav from '../../BreadCrumbNav.tsx';
import {type AppRoute, ROUTER_CONFIG} from '../../../utils/RouterConfigUtil.tsx';

interface AppHeaderProps {
  showBreadcrumb?: boolean;
  routes?: AppRoute[];
}

const AppHeader = ({routes = ROUTER_CONFIG}: AppHeaderProps) => {

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
          {/* Notifications */}
          <button className="p-2 hover:bg-primary/10 rounded-lg transition-all text-primary active:opacity-80 scale-95">
            <BellOutlined className="text-lg" />
          </button>

          {/* User Avatar */}
          <Link to="/profile">
            <div className="h-8 w-8 rounded-full bg-primary overflow-hidden ring-2 ring-white/20 hover:ring-white/40 transition-all cursor-pointer">
              <Avatar
                size={32}
                icon={<UserOutlined />}
                className="bg-transparent"
              />
            </div>
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
};

export default AppHeader;
