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
import CreateProjectModal, {type CreateProjectFormValues} from "../../project/CreateProjectModal.tsx";
import {useState} from "react";
import uiUtils from "../../../utils/uiUtils.tsx";
import {ProjectControllerService} from "../../../api/api/ProjectControllerService";
import type {ProjectStatus} from "../../../api/api/index.defs";
import {useStore} from "../../../store";

interface AppSidebarProps {
  /** true = sidebar chi hien icon (72px), hover de mo rong de len content. Mac dinh false giu nguyen UI hien tai. */
  collapsed?: boolean;
}

/**
 * AppSidebar - Sidebar chung cho toan bo ung dung
 * Lumina Pro Theme: Navy-Purple background, fixed width
 */
const AppSidebar = ({ collapsed = false }: AppSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {sessionStore} = useStore();
  const [isHovering, setIsHovering] = useState(false);

  // isExpanded: dang hien day du label (mo rong that su, hoac dang thu gon nhung hover)
  const isExpanded = !collapsed || isHovering;
  const isOverlay = collapsed && isHovering;

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
            const response = await ProjectControllerService.createNew({
                body: {
                    projectName: values.projectName,
                    projectCode: values.projectCode,
                    description: values.description,
                    startDate: values.startDate?.toDate(),
                    endDate: values.endDate?.toDate(),
                    status: values.projectStatus as ProjectStatus | undefined,
                },
            });

            if (!response?.isSuccessful) {
                throw new Error(response?.message || 'Create project failed');
            }

            const createdProject = response.data;

            uiUtils.showSuccess('Tạo project thành công');
            setIsCreateProjectOpen(false);

            if (createdProject?.projectId) {
                sessionStore.setCurrentProject({
                    projectId: createdProject.projectId,
                    projectName: createdProject.projectName,
                });
                sessionStore.setCurrentFolder(undefined);
                navigate(`/projects/${createdProject.projectId}`);
            }
        } catch (error) {
            console.error('Create project failed:', error);
            uiUtils.showError('Tạo project thất bại');
        } finally {
            setIsCreatingProject(false);
        }
    };

  return (
      <>
          {/* Div giu cho trong flex layout: width co dinh theo trang thai nghi, KHONG doi khi hover */}
          <div
              className={`hidden md:block relative h-full transition-all duration-200 ${collapsed ? 'w-[72px]' : 'w-64'}`}
              onMouseEnter={() => collapsed && setIsHovering(true)}
              onMouseLeave={() => collapsed && setIsHovering(false)}
          >
              <aside
                  className={`
                    flex flex-col absolute inset-y-0 left-0 py-6 gap-4 bg-background border-none
                    transition-all duration-200
                    ${isExpanded ? 'w-64 px-4' : 'w-[72px] px-2'}
                    ${isOverlay ? 'z-30 canvas-shadow' : 'z-0'}
                  `}
              >
                  {/* Branding */}
                  <div className={`flex flex-col gap-1 mb-4 ${isExpanded ? 'px-2' : 'items-center'}`}>
                      <span className="text-lg font-black text-primary-dark">{isExpanded ? 'ASSET' : 'A'}</span>
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
                                  title={isExpanded ? undefined : item.label}
                                  className={`
                    flex items-center gap-3 py-3 rounded-lg
                    font-inter text-sm tracking-wide uppercase font-semibold
                    transition-all duration-200
                    ${isExpanded ? 'px-4 translate-x-1' : 'px-0 justify-center'}
                    ${isActive
                                      ? 'text-primary-dark font-bold border-r-4 border-primary bg-accent/20'
                                      : 'text-muted-foreground hover:text-primary-dark hover:bg-accent/10'
                                  }
                  `}
                              >
                                  <span className="text-xl">{item.icon}</span>
                                  {isExpanded && item.label}
                              </button>
                          );
                      })}
                  </nav>

                  {/* Bottom Actions */}
                  <div className="mt-auto">
                      {/* New Project Button */}
                      <div className={isExpanded ? undefined : 'flex justify-center'}>
                          <Button
                              type="primary"
                              icon={<PlusOutlined />}
                              onClick={handleOpenCreateProject}
                              title={isExpanded ? undefined : 'New Project'}
                              className="w-full py-3 bg-gradient-to-br from-primary-dark to-primary text-white rounded-lg font-bold text-sm shadow-lg shadow-primary-dark/20 hover:opacity-90 transition-opacity border-none h-auto"
                          >
                              {isExpanded ? 'New Project' : null}
                          </Button>
                      </div>

                      {/* Logout */}
                      <div className="mt-4 pt-4 border-t border-border/30">
                          <button
                              onClick={handleLogout}
                              title={isExpanded ? undefined : 'Logout'}
                              className={`flex items-center gap-3 py-2 text-muted-foreground hover:text-destructive transition-colors w-full ${isExpanded ? 'px-2' : 'justify-center'}`}
                          >
                              <LogoutOutlined />
                              {isExpanded && <span className="text-xs font-bold uppercase tracking-wider">Logout</span>}
                          </button>
                      </div>
                  </div>
              </aside>
          </div>

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
