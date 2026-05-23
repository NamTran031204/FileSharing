import { action, computed, makeObservable, observable, reaction } from 'mobx';
import {
    type AssetDetailResponseDto,
    type AssetSummaryDto,
    type FolderEntity,
    type FolderPermission,
    type FolderTreeItemDTO,
    GrantedProjectPermission,
} from '../api/api/index.defs';
import { FolderControllerService } from '../api/api/FolderControllerService';
import { AssetControllerService } from '../api/api/AssetControllerService';
import { CommonPagingStore } from './CommonPagingStore.ts';
import type SessionStore from './sessionStore';

type ActiveModal =
    | 'upload-asset'
    | 'upload-folder'
    | 'edit-folder'
    | 'delete-folder'
    | 'edit-asset'
    | 'delete-asset'
    | null;

// API response includes nested children not captured in the generated type
interface FolderTreeItemWithChildren extends FolderTreeItemDTO {
    children?: FolderTreeItemWithChildren[];
}

function flattenTree(items: FolderTreeItemWithChildren[]): FolderTreeItemDTO[] {
    const result: FolderTreeItemDTO[] = [];
    const traverse = (nodes: FolderTreeItemWithChildren[]) => {
        for (const node of nodes) {
            const { children, ...item } = node;
            result.push(item);
            if (children?.length) traverse(children);
        }
    };
    traverse(items);
    return result;
}

class FolderAssetStore extends CommonPagingStore {
    folders: FolderEntity[] = [];
    assets: AssetSummaryDto[] = [];
    selectedAsset: AssetDetailResponseDto | null = null;

    treeItems: FolderTreeItemDTO[] = [];
    keyword: string = '';

    sortDirection: string = 'asc';
    sortBy: string = 'folderName';

    isFolderLoading: boolean = false;
    isTreeLoading: boolean = false;

    folderErrorMessage: string | null = null;
    assetErrorMessage: string | null = null;
    actionErrorMessage: string | null = null;

    activeModal: ActiveModal = null;
    targetFolderId: string | null = null;
    targetAssetId: string | null = null;

    nameSpaceLocale: string = 'folder';
    modalWidth: number = 900;

    private readonly sessionStore: SessionStore;

    constructor(sessionStore: SessionStore) {
        super();
        this.sessionStore = sessionStore;

        makeObservable(this, {
            folders: observable,
            assets: observable,
            selectedAsset: observable,
            treeItems: observable,
            keyword: observable,
            sortBy: observable,
            sortDirection: observable,
            isFolderLoading: observable,
            isTreeLoading: observable,
            folderErrorMessage: observable,
            assetErrorMessage: observable,
            actionErrorMessage: observable,
            activeModal: observable,
            targetFolderId: observable,
            targetAssetId: observable,
            nameSpaceLocale: observable,
            modalWidth: observable,

            sorting: computed,
            currentProjectId: computed,
            currentFolderId: computed,
            currentUserId: computed,
            folderPermissionMap: computed,
            isUploadAssetOpen: computed,
            isUploadFolderOpen: computed,
            isEditFolderOpen: computed,
            isDeleteFolderOpen: computed,
            isEditAssetOpen: computed,
            isDeleteAssetOpen: computed,

            setSorting: action,
            setKeyword: action,
            fetchFolders: action,
            fetchAssetsPage: action,
            fetchAssetDetail: action,
            moveAsset: action,
            fetchTree: action,
            openUploadAssetModal: action,
            openUploadFolderModal: action,
            openEditFolderModal: action,
            openDeleteFolderModal: action,
            openEditAssetModal: action,
            openDeleteAssetModal: action,
            closeModal: action,
            clearFolderError: action,
            clearAssetError: action,
            clearActionError: action,
            clearAllErrors: action,
            reset: action,
        });

        reaction(
            () => this.page,
            () => {
                if (this.currentProjectId) {
                    void this.fetchAssetsPage(this.currentProjectId, this.currentFolderId);
                }
            }
        );
    }

    get sorting(): string {
        return `${this.sortBy} ${this.sortDirection}`;
    }

    get currentProjectId(): string {
        return this.sessionStore.currentProjectId;
    }

    get currentFolderId(): string | undefined {
        return this.sessionStore.currentFolderId || undefined;
    }

    get currentUserId(): string {
        return this.sessionStore.user?.userId ?? '';
    }

    get isUploadAssetOpen(): boolean {
        return this.activeModal === 'upload-asset';
    }

    get isUploadFolderOpen(): boolean {
        return this.activeModal === 'upload-folder';
    }

    get isEditFolderOpen(): boolean {
        return this.activeModal === 'edit-folder';
    }

    get isDeleteFolderOpen(): boolean {
        return this.activeModal === 'delete-folder';
    }

    get isEditAssetOpen(): boolean {
        return this.activeModal === 'edit-asset';
    }

    get isDeleteAssetOpen(): boolean {
        return this.activeModal === 'delete-asset';
    }

    setSorting(sortBy: string, sortDirection: string) {
        this.sortBy = sortBy;
        this.sortDirection = sortDirection;
    }

    setKeyword(keyword: string) {
        this.keyword = keyword;
    }

    get folderPermissionMap(): Map<string, GrantedProjectPermission[]> {
        const map = new Map<string, GrantedProjectPermission[]>();

        if (!this.currentUserId) {
            return map;
        }

        this.folders.forEach((folder) => {
            if (!folder.folderId) return;
            const perms: GrantedProjectPermission[] = (folder.userPermissions ?? [] as FolderPermission[])
                .filter((permission: FolderPermission) => permission.userId === this.currentUserId)
                .flatMap((permission: FolderPermission) => permission.permissions ?? []);
            map.set(folder.folderId, perms);
        });

        return map;
    }

    hasFolderPermission(folderId: string, permission: GrantedProjectPermission): boolean {
        return this.folderPermissionMap.get(folderId)?.includes(permission) ?? false;
    }

    async fetchFolders(projectId: string, parentFolderId?: string): Promise<void> {
        try {
            this.isFolderLoading = true;
            this.folderErrorMessage = null;
            const response = await FolderControllerService.getPage({
                body: {
                    maxResultCount: 999,
                    skipCount: 0,
                    sorting: this.sorting,
                    filter: {
                        projectId,
                        parentFolderId,
                        isActive: true,
                        folderName: this.keyword || undefined,
                    },
                },
            });

            if (!response?.isSuccessful) {
                throw new Error(response?.message ?? 'Khong the tai danh sach folder');
            }

            this.folders = response.data?.data ?? [];
        } catch (error) {
            this.folderErrorMessage = error instanceof Error ? error.message : 'Khong the tai danh sach folder';
            this.folders = [];
        } finally {
            this.isFolderLoading = false;
        }
    }

    async fetchAssetsPage(projectId: string, folderId?: string): Promise<void> {
        try {
            this.isLoading = true;
            this.assetErrorMessage = null;
            const response = await AssetControllerService.getPage({
                body: {
                    maxResultCount: this.pageSize,
                    skipCount: this.skipCount,
                    sorting: this.sorting,
                    filter: {
                        projectId,
                        folderId,
                        isActive: true,
                        keyword: this.keyword || undefined,
                    },
                },
            });

            if (!response?.isSuccessful) {
                throw new Error(response?.message ?? 'Khong the tai danh sach asset');
            }

            this.assets = response.data?.data ?? [];
            this.totalCount = Number(response.data?.totalCount ?? 0);
        } catch (error: unknown) {
            this.assetErrorMessage = error instanceof Error ? error.message : 'Khong the tai danh sach asset';
            this.assets = [];
            this.totalCount = 0;
        } finally {
            this.isLoading = false;
        }
    }

    async fetchAssetDetail(assetId: string): Promise<void> {
        try {
            const response = await AssetControllerService.getById({ assetId });
            if (response?.isSuccessful) {
                this.selectedAsset = response.data ?? null;
            }
        } catch {
            this.selectedAsset = null;
        }
    }

    async moveAsset(assetId: string, targetFolderId: string): Promise<void> {
        try {
            this.actionErrorMessage = null;
            const response = await AssetControllerService.move({ body: { assetId, targetFolderId } });
            if (!response?.isSuccessful) {
                throw new Error(response?.message ?? 'Khong the di chuyen asset');
            }

            if (this.currentProjectId) {
                await this.fetchAssetsPage(this.currentProjectId, this.currentFolderId);
            }
        } catch (error: unknown) {
            this.actionErrorMessage = error instanceof Error ? error.message : 'Khong the di chuyen asset';
        }
    }

    async fetchTree(projectId: string): Promise<void> {
        try {
            this.isTreeLoading = true;
            const response = await FolderControllerService.getTree({ projectId });
            if (response?.isSuccessful && response.data) {
                this.treeItems = flattenTree(
                    (response.data.tree ?? []) as FolderTreeItemWithChildren[]
                );
                return;
            }
            this.treeItems = [];
        } catch {
            this.treeItems = [];
        } finally {
            this.isTreeLoading = false;
        }
    }

    openUploadAssetModal(): void {
        this.closeModal();
        this.activeModal = 'upload-asset';
    }

    openUploadFolderModal(): void {
        this.closeModal();
        this.activeModal = 'upload-folder';
    }

    openEditFolderModal(folderId: string): void {
        this.closeModal();
        this.targetFolderId = folderId;
        this.activeModal = 'edit-folder';
    }

    openDeleteFolderModal(folderId: string): void {
        this.closeModal();
        this.targetFolderId = folderId;
        this.activeModal = 'delete-folder';
    }

    openEditAssetModal(assetId: string): void {
        this.closeModal();
        this.targetAssetId = assetId;
        this.activeModal = 'edit-asset';
    }

    openDeleteAssetModal(assetId: string): void {
        this.closeModal();
        this.targetAssetId = assetId;
        this.activeModal = 'delete-asset';
    }

    closeModal(): void {
        this.activeModal = null;
        this.targetFolderId = null;
        this.targetAssetId = null;
    }

    clearFolderError(): void {
        this.folderErrorMessage = null;
    }

    clearAssetError(): void {
        this.assetErrorMessage = null;
    }

    clearActionError(): void {
        this.actionErrorMessage = null;
    }

    clearAllErrors(): void {
        this.folderErrorMessage = null;
        this.assetErrorMessage = null;
        this.actionErrorMessage = null;
    }

    reset(): void {
        this.folders = [];
        this.assets = [];
        this.selectedAsset = null;
        this.treeItems = [];
        this.keyword = '';
        this.page = 1;
        this.totalCount = 0;
        this.isLoading = false;
        this.isFolderLoading = false;
        this.isTreeLoading = false;
        this.folderErrorMessage = null;
        this.assetErrorMessage = null;
        this.actionErrorMessage = null;
        this.sortBy = 'folderName';
        this.sortDirection = 'asc';
        this.closeModal();
    }
}

export default FolderAssetStore;
