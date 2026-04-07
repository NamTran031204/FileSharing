import { BellOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar } from 'antd';
import { Link, useLocation } from 'react-router-dom';


const AppHeader = () => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/review', label: 'Review Queue' },
    { path: '/assets', label: 'Assets' },
    { path: '/archive', label: 'Archive' },
  ];

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#3b3a7e]/80 backdrop-blur-xl flex justify-between items-center px-8 h-16 shadow-xl shadow-[#3b3a7e]/10">
      {/* Left: Logo + Navigation */}
      <div className="flex items-center gap-8">
        {/* Logo */}
        <Link to="/" className="text-xl font-bold tracking-tighter text-white hover:opacity-90 transition-opacity">
          Ethereal Media
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex gap-6 items-center">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`
                font-inter text-sm font-medium tracking-tight transition-colors
                ${isActive(item.path) 
                  ? 'text-white border-b-2 border-white pb-1' 
                  : 'text-white/70 hover:text-white'
                }
              `}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Right: Actions + Profile */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="p-2 hover:bg-white/10 rounded-lg transition-all text-white active:opacity-80 transition-transform scale-95">
          <BellOutlined className="text-lg" />
        </button>

        {/* Settings */}
        <button className="p-2 hover:bg-white/10 rounded-lg transition-all text-white active:opacity-80 transition-transform scale-95">
          <SettingOutlined className="text-lg" />
        </button>

        {/* User Avatar */}
        <Link to="/profile">
          <div className="h-8 w-8 rounded-full bg-[hsl(var(--primary))] overflow-hidden ring-2 ring-white/20 hover:ring-white/40 transition-all cursor-pointer">
            <Avatar
              size={32}
              icon={<UserOutlined />}
              className="bg-transparent"
            />
          </div>
        </Link>
      </div>
    </nav>
  );
};

export default AppHeader;
