import {
  HomeOutlined,
  AppstoreOutlined,
  FolderOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
  LogoutOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import CreateProjectModal, {type CreateProjectFormValues} from "./CreateProjectModal.tsx";
import {useState} from "react";

/**
 * AppSidebar - Sidebar chung cho toàn bộ ứng dụng
 * Lumina Pro Theme: Navy-Purple background, fixed width
 */
const AppSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/home',
      icon: <HomeOutlined />,
      label: 'Home',
    },
    {
      key: '/dashboard',
      icon: <AppstoreOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/projects',
      icon: <FolderOutlined />,
      label: 'Projects',
      isActive: location.pathname.startsWith('/review') || location.pathname.startsWith('/projects'),
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      key: '/help',
      icon: <QuestionCircleOutlined />,
      label: 'Help',
    },
  ];

  const handleItemClick = (key: string) => {
    navigate(key);
  };

  const handleLogout = () => {
    console.log('Logout clicked');
  };

    const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
    const [isCreatingProject, setIsCreatingProject] = useState(false);

    const handleOpenCreateProject = () => {
        setIsCreateProjectOpen(true);
    };

    const handleCloseCreateProject = () => {
        setIsCreateProjectOpen(false);
    };

    const handleCreateProject = async (values: CreateProjectFormValues) => {
        setIsCreatingProject(true);

        try {
            // TODO: Implement API integration for creating project from modal payload.
            console.info('Create project payload:', values);
            setIsCreateProjectOpen(false);
        } finally {
            setIsCreatingProject(false);
        }
    };

  return (
      <>
          <aside className="hidden md:flex flex-col h-full py-6 px-4 gap-4 bg-background w-64 border-none">
              {/* Branding */}
              <div className="flex flex-col gap-1 mb-4 px-2">
                  <span className="text-lg font-black text-primary-dark">ASSET</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
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
                                  ? 'text-primary-dark font-bold border-r-4 border-primary bg-accent/20'
                                  : 'text-muted-foreground hover:text-primary-dark hover:bg-accent/10'
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
                      onClick={handleOpenCreateProject}
                      className="w-full py-3 bg-gradient-to-br from-primary-dark to-primary text-white rounded-lg font-bold text-sm shadow-lg shadow-primary-dark/20 hover:opacity-90 transition-opacity border-none h-auto"
                  >
                      New Project
                  </Button>

                  {/* Logout */}
                  <div className="mt-4 pt-4 border-t border-border/30">
                      <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 py-2 px-2 text-muted-foreground hover:text-destructive transition-colors w-full"
                      >
                          <LogoutOutlined />
                          <span className="text-xs font-bold uppercase tracking-wider">Logout</span>
                      </button>
                  </div>
              </div>
          </aside>

          <CreateProjectModal
              open={isCreateProjectOpen}
              confirmLoading={isCreatingProject}
              onCancel={handleCloseCreateProject}
              onCreate={handleCreateProject}
          />
      </>


  );
};

export default AppSidebar;

