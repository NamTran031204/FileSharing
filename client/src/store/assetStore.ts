import { action, computed, makeObservable, observable, reaction } from 'mobx';
import type {
    AssetSummaryDto,
    AssetDetailResponseDto,
} from '../api/api/index.defs';
import { AssetControllerService } from '../api/api/AssetControllerService';
import {CommonPagingStore} from "./CommonPagingStore.ts";

class AssetStore extends CommonPagingStore{
    // ── Data ──────────────────────────────────────────────────────────────
    assets: AssetSummaryDto[] = [];
    /** Asset đang được xem detail — load từ getById khi mở modal/preview */
    selectedAsset: AssetDetailResponseDto | null = null;


    sortDirection: string = 'asc';
    sortBy: string = 'updateAt';

    errorMessage: string | null = null;

    isUploadAsset: boolean = false;
    isUploadFolder: boolean = false;
    isUpdateDetail: boolean = false;
    isRemove: boolean = false;
    targetAssetId: string | null = null;

    previewAssetId: string | null = null;
    isPreviewOpen: boolean = false;

    nameSpaceLocale: string = 'asset';
    modalWidth: number = 900;

    private _projectId: string = '';
    private _folderId: string | undefined = undefined;

    constructor() {
        super();
        makeObservable(this, {
            assets: observable,
            selectedAsset: observable,
            sortBy: observable,
            sortDirection: observable,
            errorMessage: observable,
            isUploadAsset: observable,
            isUploadFolder: observable,
            isUpdateDetail: observable,
            isRemove: observable,
            targetAssetId: observable,
            previewAssetId: observable,
            isPreviewOpen: observable,
            nameSpaceLocale: observable,
            modalWidth: observable,

            sortTerm: computed,

            setSortTerm: action,
            fetchPage: action,
            fetchDetail: action,
            moveAsset: action,
            // setPage: action,
            openUploadAssetModal: action,
            openUploadFolderModal: action,
            openUpdateDetailModal: action,
            openRemoveModal: action,
            openPreview: action,
            closeAllModals: action,
            clearError: action,
            reset: action,
        });

        reaction(
            () => this.page,
            () => {
                if (this._projectId) {
                    void this.fetchPage(this._projectId, this._folderId);
                }
            }
        );
    }

    get sortTerm(): string {
        return this.sortBy + " " + this.sortDirection;
    }

    setSortTerm(sortBy: string, sortDirection: string) {
        this.sortBy = sortBy;
        this.sortDirection = sortDirection;
    }

    async fetchPage(projectId: string, folderId?: string): Promise<void> {
        this._projectId = projectId;
        this._folderId = folderId;
        try {
            this.isLoading = true;
            this.errorMessage = null;
            const res = await AssetControllerService.getPage({
                body: {
                    maxResultCount: this.pageSize,
                    skipCount: this.skipCount,
                    sorting: this.sorting,
                    filter: { projectId, folderId, isActive: true },
                },
            });
            if (!res?.isSuccessful) {
                throw new Error(res?.message ?? 'Không thể tải danh sách asset');
            }
            this.assets = res.data?.data ?? [];
            this.totalCount = Number(res.data?.totalCount ?? 0);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Không thể tải danh sách asset';
            this.errorMessage = msg;
            this.assets = [];
        } finally {
            this.isLoading = false;
        }
    }


    async fetchDetail(assetId: string): Promise<void> {
        try {
            const res = await AssetControllerService.getById({ assetId });
            if (res?.isSuccessful) {
                this.selectedAsset = res.data ?? null;
            }
        } catch {
            this.selectedAsset = null;
        }
    }


    async moveAsset(assetId: string, targetFolderId: string): Promise<void> {
        try {
            const res = await AssetControllerService.move({ body: { assetId, targetFolderId } });
            if (!res?.isSuccessful) {
                throw new Error(res?.message ?? 'Không thể di chuyển asset');
            }
            void this.fetchPage(this._projectId, this._folderId);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Không thể di chuyển asset';
            this.errorMessage = msg;
        }
    }

    openUploadAssetModal(): void {
        this.closeAllModals();
        this.isUploadAsset = true;
    }

    openUploadFolderModal(): void {
        this.closeAllModals();
        this.isUploadFolder = true;
    }

    openUpdateDetailModal(assetId: string): void {
        this.closeAllModals();
        this.targetAssetId = assetId;
        this.isUpdateDetail = true;
    }

    openRemoveModal(assetId: string): void {
        this.closeAllModals();
        this.targetAssetId = assetId;
        this.isRemove = true;
    }

    /** Mở trang review asset — dành cho ImageReview về sau */
    openPreview(assetId: string): void {
        this.previewAssetId = assetId;
        this.isPreviewOpen = true;
    }

    closeAllModals(): void {
        this.isUploadAsset = false;
        this.isUploadFolder = false;
        this.isUpdateDetail = false;
        this.isRemove = false;
        this.targetAssetId = null;
        this.isPreviewOpen = false;
        this.previewAssetId = null;
    }

    clearError(): void {
        this.errorMessage = null;
    }

    reset(): void {
        this.assets = [];
        this.selectedAsset = null;
        this.page = 1;
        this.totalCount = 0;
        this.isLoading = false;
        this.errorMessage = null;
        this.closeAllModals();
        this._projectId = '';
        this._folderId = undefined;
    }
}

export default AssetStore;
