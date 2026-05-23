import {action, computed, makeObservable, observable} from 'mobx';
import type {FolderEntity, FolderTreeItemDTO, ProjectEntity, UserGrantedRole} from '../api/api/index.defs';
import type {UserRole} from '../api/enums';
import {tokenManager} from '../api/baseApi';

export interface UserSessionDto {
    userId?: string;
    email?: string;
    publicUserName?: string;
    userGrantedRoles?: UserGrantedRole[];
    roles?: UserRole[];
    enabled?: boolean;
    emailVerified?: boolean;
    lastLoginAt?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface ProjectSessionInfo {
    projectId?: string;
    projectName?: string;
}

export interface FolderSessionInfo {
    folderId?: string;
    folderName?: string;
    folderPath?: string;
}

export class AppSessionDto {
    isLogined: boolean;
    user?: UserSessionDto;
    permissionGranted?: Record<string, boolean>;
    setting?: Record<string, unknown>;
    currentProject?: ProjectSessionInfo;
    currentFolder?: FolderSessionInfo;
    projectTree?: FolderTreeItemDTO[];

    constructor() {
        this.isLogined = tokenManager.isAuthenticated();
    }

    isGrantedRole(role: UserGrantedRole) {
        if (!this.user?.userGrantedRoles?.length) {
            return false;
        }
        return this.user.userGrantedRoles.includes(role);
    }
}

class SessionStore {
    appSession: AppSessionDto = new AppSessionDto();

    constructor() {
        makeObservable(this, {
            appSession: observable,
            isLogined: computed,
            user: computed,
            currentProject: computed,
            currentFolder: computed,
            currentProjectId: computed,
            currentFolderId: computed,
            currentProjectName: computed,
            currentFolderName: computed,
            currentFolderPath: computed,
            currentProjectTree: computed,
            setSession: action,
            setCurrentProject: action,
            setCurrentFolder: action,
            setProjectTree: action,
            clearSession: action,
        });
    }

    get isLogined() {
        return tokenManager.isAuthenticated();
    }

    get user() {
        return this.appSession.user;
    }

    get currentProject() {
        return this.appSession.currentProject;
    }

    get currentFolder() {
        return this.appSession.currentFolder;
    }

    get currentProjectId() {
        return this.appSession.currentProject?.projectId ?? '';
    }

    get currentFolderId() {
        return this.appSession.currentFolder?.folderId ?? '';
    }

    get currentProjectName() {
        return this.appSession.currentProject?.projectName ?? '';
    }

    get currentFolderName() {
        return this.appSession.currentFolder?.folderName ?? '';
    }

    /**
     * folderPath của folder hiện tại — dùng làm baseFolderPath khi gọi create-tree.
     * Trả về undefined nếu đang ở root (không có folder nào được chọn).
     */
    get currentFolderPath() {
        return this.appSession.currentFolder?.folderPath;
    }

    get currentProjectTree() {
        return this.appSession.projectTree ?? [];
    }

    setSession(session: AppSessionDto) {
        if (session?.user?.userGrantedRoles) {
            session.permissionGranted = {};
            session.user.userGrantedRoles.forEach((role) => {
                session.permissionGranted![role] = true;
            });
        }

        session.isLogined = tokenManager.isAuthenticated();

        this.appSession = session;
    }

    setCurrentProject(project?: Pick<ProjectEntity, 'projectId' | 'projectName'>) {
        if (!project) {
            this.appSession.currentProject = undefined;
            this.appSession.projectTree = [];
            return;
        }
        this.appSession.currentProject = {
            projectId: project.projectId,
            projectName: project.projectName,
        };
        this.appSession.projectTree = [];
    }

    setCurrentFolder(folder?: Pick<FolderEntity, 'folderId' | 'folderName' | 'folderPath'>) {
        if (!folder) {
            this.appSession.currentFolder = undefined;
            return;
        }
        this.appSession.currentFolder = {
            folderId: folder.folderId,
            folderName: folder.folderName,
            folderPath: folder.folderPath,
        };
    }

    setProjectTree(tree?: FolderTreeItemDTO[]) {
        this.appSession.projectTree = tree ?? [];
    }

    clearSession() {
        this.appSession = new AppSessionDto();
    }
}

export default SessionStore;
