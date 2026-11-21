import type {ComponentType} from 'react';
import {
  HomeOutlined,
  AppstoreOutlined,
  FolderOutlined,
  SettingOutlined,
  ShareAltOutlined,
  QuestionCircleOutlined,
  DashboardOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  MailOutlined,
  ClusterOutlined,
} from '@ant-design/icons';

/**
 * Ten permission quan tri, khop enum AdminPermission o backend (TK 4.2).
 * Lech giua hai ben chi lam an/hien nut sai, backend van chan dung.
 */
export const ADMIN_PER = {
  User: {
    GetPaged: 'Admin.User.GetPaged',
    GetDetail: 'Admin.User.GetDetail',
    Create: 'Admin.User.Create',
    Lock: 'Admin.User.Lock',
    RevokeSession: 'Admin.User.RevokeSession',
    AssignRole: 'Admin.User.AssignRole',
  },
  Role: {
    GetPaged: 'Admin.Role.GetPaged',
    GetDetail: 'Admin.Role.GetDetail',
    Create: 'Admin.Role.Create',
    Update: 'Admin.Role.Update',
    Delete: 'Admin.Role.Delete',
  },
  Setting: {
    GetPaged: 'Admin.Setting.GetPaged',
    Update: 'Admin.Setting.Update',
    TestMail: 'Admin.Setting.TestMail',
  },
  EmailTemplate: {
    GetPaged: 'Admin.EmailTemplate.GetPaged',
    Update: 'Admin.EmailTemplate.Update',
    Preview: 'Admin.EmailTemplate.Preview',
    SendTest: 'Admin.EmailTemplate.SendTest',
  },
  Node: {
    GetPaged: 'Admin.Node.GetPaged',
    Drain: 'Admin.Node.Drain',
  },
} as const;

export interface SidebarMenuItem {
  key: string;
  icon: ComponentType;
  /** key i18n (namespace:key), dich luc render */
  labelKey: string;
  /** path bat dau bang prefix nay thi coi la dang active; mac dinh so khop chinh xac key */
  activePrefixes?: string[];
  /** permission can co de hien muc (chi phia quan tri) */
  permission?: string;
}

export const USER_MENU: SidebarMenuItem[] = [
  {key: '/home', icon: HomeOutlined, labelKey: 'core:appSidebar.home'},
  {key: '/dashboard', icon: AppstoreOutlined, labelKey: 'core:appSidebar.dashboard'},
  {key: '/projects', icon: FolderOutlined, labelKey: 'core:appSidebar.projects', activePrefixes: ['/review', '/projects']},
  {key: '/shared-with-me', icon: ShareAltOutlined, labelKey: 'access:sharedWithMe.title'},
  {key: '/settings', icon: SettingOutlined, labelKey: 'core:appSidebar.settings'},
  {key: '/help', icon: QuestionCircleOutlined, labelKey: 'core:appSidebar.help'},
];

export const ADMIN_MENU: SidebarMenuItem[] = [
  {key: '/admin', icon: DashboardOutlined, labelKey: 'admin:menu.home'},
  {key: '/admin/users', icon: TeamOutlined, labelKey: 'admin:menu.users', activePrefixes: ['/admin/users'], permission: ADMIN_PER.User.GetPaged},
  {key: '/admin/roles', icon: SafetyCertificateOutlined, labelKey: 'admin:menu.roles', activePrefixes: ['/admin/roles'], permission: ADMIN_PER.Role.GetPaged},
  {key: '/admin/settings', icon: SettingOutlined, labelKey: 'admin:menu.settings', activePrefixes: ['/admin/settings'], permission: ADMIN_PER.Setting.GetPaged},
  {key: '/admin/email-templates', icon: MailOutlined, labelKey: 'admin:menu.emailTemplates', activePrefixes: ['/admin/email-templates'], permission: ADMIN_PER.EmailTemplate.GetPaged},
  {key: '/admin/nodes', icon: ClusterOutlined, labelKey: 'admin:menu.nodes', activePrefixes: ['/admin/nodes'], permission: ADMIN_PER.Node.GetPaged},
];
