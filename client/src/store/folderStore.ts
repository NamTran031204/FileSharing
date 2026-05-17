import {action, computed, makeObservable, observable, reaction} from 'mobx';
import {
    type FolderBreadcrumbItemDTO,
    type FolderEntity,
    type FolderPermission,
    type FolderTreeItemDTO,
    GrantedProjectPermission,
} from '../api/api/index.defs';
import {FolderControllerService} from '../api/api/FolderControllerService';

class FolderStore {
    folders: FolderEntity[] = [];

    breadcrumb: FolderBreadcrumbItemDTO[] = [];

    treeItems: FolderTreeItemDTO[] = [];


    sorting: string = 'folderName asc';

    sortDirection: string = 'asc';
    sortBy: string = 'folderName';

    isLoading: boolean = false;
    isTreeLoading: boolean = false;
    errorMessage: string | null = null;

    isUploadAsset: boolean = false;
    isUploadFolder: boolean = false;
    isUpdateDetail: boolean = false;

    isRemove: boolean = false;
    targetFolderId: string | null = null;

    nameSpaceLocale: string = 'folder';
    modalWidth: number = 900;

    private _projectId: string = '';
    private _parentFolderId: string | undefined = undefined;

    private _currentUserId: string = '';

    constructor() {
        makeObservable(this, {
            folders: observable,
            breadcrumb: observable,
            treeItems: observable,
            page: observable,
            pageSize: observable,
            totalCount: observable,
            sorting: observable,
            isLoading: observable,
            isTreeLoading: observable,
            errorMessage: observable,
            isUploadAsset: observable,
            isUploadFolder: observable,
            isUpdateDetail: observable,
            isRemove: observable,
            targetFolderId: observable,
            nameSpaceLocale: observable,
            modalWidth: observable,
            _currentUserId: observable, // observable để folderPermissionMap computed tự cập nhật
            // computed — tự tính từ observable, không cần lưu thủ công
            skipCount: computed,
            totalPages: computed,
            folderPermissionMap: computed, // derive từ folders + _currentUserId
            // actions
            fetchPage: action,
            fetchTree: action,
            setPage: action,
            setCurrentUser: action,
            openUploadAssetModal: action,
            openUploadFolderModal: action,
            openUpdateDetailModal: action,
            openRemoveModal: action,
            closeAllModals: action,
            clearError: action,
            reset: action,
        });

        reaction(
            () => this.page,
            () => {
                if (this._projectId) {
                    void this.fetchPage(this._projectId, this._parentFolderId);
                }
            }
        );
    }

    get skipCount(): number {
        return (this.page - 1) * this.pageSize;
    }

    get totalPages(): number {
        return Math.ceil(this.totalCount / this.pageSize);
    }

    get folderPermissionMap(): Map<string, GrantedProjectPermission[]> {
        const map = new Map<string, GrantedProjectPermission[]>();
        this.folders.forEach((folder) => {
            if (!folder.folderId) return;
            const perms: GrantedProjectPermission[] = (folder.userPermissions ?? [] as FolderPermission[])
                .filter((p: FolderPermission) => !this._currentUserId || p.userId === this._currentUserId)
                .flatMap((p: FolderPermission) => p.permissions ?? []);
            map.set(folder.folderId, perms);
        });
        return map;
    }

    async fetchPage(projectId: string, parentFolderId?: string): Promise<void> {
        this._projectId = projectId;
        this._parentFolderId = parentFolderId;
        try {
            this.isLoading = true;
            this.errorMessage = null;
            const res = await FolderControllerService.getPage({
                body: {
                    maxResultCount: this.pageSize,
                    skipCount: this.skipCount,
                    sorting: this.sorting,
                    filter: { projectId, parentFolderId, isActive: true },
                },
            });
            if (!res?.isSuccessful) {
                throw new Error(res?.message ?? 'Không thể tải danh sách folder');
            }
            this.folders = res.data?.data ?? [];
            this.totalCount = Number(res.data?.totalCount ?? 0);
        } catch (e) {
            this.errorMessage = e instanceof Error ? e.message : 'Không thể tải danh sách folder';
            this.folders = [];
        } finally {
            this.isLoading = false;
        }
    }

    async fetchTree(projectId: string, currentFolderId?: string): Promise<void> {
        try {
            this.isTreeLoading = true;
            const res = await FolderControllerService.getTree({ projectId, currentFolderId });
            if (res?.isSuccessful && res.data) {
                this.breadcrumb = res.data.breadcrumb ?? [];
                this.treeItems = res.data.tree ?? [];
            } else {
                this.breadcrumb = [];
                this.treeItems = [];
            }
        } catch {
            this.breadcrumb = [];
            this.treeItems = [];
        } finally {
            this.isTreeLoading = false;
        }
    }

    setPage(page: number): void {
        this.page = page;
    }

    setCurrentUser(userId: string): void {
        this._currentUserId = userId;
    }

    hasPermission(folderId: string, perm: GrantedProjectPermission): boolean {
        return this.folderPermissionMap.get(folderId)?.includes(perm) ?? false;
    }

    openUploadAssetModal(): void {
        this.closeAllModals();
        this.isUploadAsset = true;
    }

    openUploadFolderModal(): void {
        this.closeAllModals();
        this.isUploadFolder = true;
    }

    openUpdateDetailModal(folderId: string): void {
        this.closeAllModals();
        this.targetFolderId = folderId;
        this.isUpdateDetail = true;
    }

    openRemoveModal(folderId: string): void {
        this.closeAllModals();
        this.targetFolderId = folderId;
        this.isRemove = true;
    }

    closeAllModals(): void {
        this.isUploadAsset = false;
        this.isUploadFolder = false;
        this.isUpdateDetail = false;
        this.isRemove = false;
        this.targetFolderId = null;
    }

    clearError(): void {
        this.errorMessage = null;
    }

    reset(): void {
        this.folders = [];
        this.breadcrumb = [];
        this.treeItems = [];
        this.page = 1;
        this.totalCount = 0;
        this.isLoading = false;
        this.isTreeLoading = false;
        this.errorMessage = null;
        this.closeAllModals();
        this._projectId = '';
        this._parentFolderId = undefined;
    }
}

export default FolderStore;
