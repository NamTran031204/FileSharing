import {
  HomeOutlined,
  FolderOutlined,
  TeamOutlined,
  BarChartOutlined,
  LogoutOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * AppSidebar - Sidebar chung cho toàn bộ ứng dụng
 * Lumina Pro Theme: Navy-Purple background, fixed width (không expand on hover theo mockup)
 */
const AppSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <HomeOutlined />,
      label: 'Overview',
    },
    {
      key: '/projects',
      icon: <FolderOutlined />,
      label: 'Projects',
      isActive: location.pathname.startsWith('/review'),
    },
    {
      key: '/team',
      icon: <TeamOutlined />,
      label: 'Team',
    },
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: 'Analytics',
    },
  ];

  const handleItemClick = (key: string) => {
    navigate(key);
  };

  const handleLogout = () => {
    console.log('Logout clicked');
  };

  return (
    <aside className="hidden md:flex flex-col h-full py-6 px-4 gap-4 bg-[#f4f2ff] w-64 border-none">
      {/* Branding */}
      <div className="flex flex-col gap-1 mb-4 px-2">
        <span className="text-lg font-black text-[#3b3a7e]">Creative Suite</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#474650]/60">
          Premium Tier
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1">
        {menuItems.map((item) => {
          const isActive = item.isActive !== undefined 
            ? item.isActive 
            : location.pathname === item.key;

          return (
            <button
              key={item.key}
              onClick={() => handleItemClick(item.key)}
              className={`
                flex items-center gap-3 py-3 px-4 rounded-lg 
                font-inter text-sm tracking-wide uppercase font-semibold
                transition-all translate-x-1 duration-200
                ${isActive
                  ? 'text-[#3b3a7e] font-bold border-r-4 border-[#535297] bg-[#e7e6ff]'
                  : 'text-[#474650] hover:text-[#3b3a7e] hover:bg-[#e7e6ff]'
                }
              `}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto px-2">
        {/* New Project Button */}
        <Button
          type="primary"
          icon={<PlusOutlined />}
          className="w-full py-3 bg-gradient-to-br from-[#3b3a7e] to-[#535297] text-white rounded-lg font-bold text-sm shadow-lg shadow-[#3b3a7e]/20 hover:opacity-90 transition-opacity border-none h-auto"
        >
          New Project
        </Button>

        {/* Logout */}
        <div className="mt-4 pt-4 border-t border-[#c8c5d2]/30">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 py-2 px-2 text-[#474650] hover:text-[#ba1a1a] transition-colors w-full"
          >
            <LogoutOutlined />
            <span className="text-xs font-bold uppercase tracking-wider">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;

