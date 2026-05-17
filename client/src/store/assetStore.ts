import { action, computed, makeObservable, observable, reaction } from 'mobx';
import type {
    AssetSummaryDto,
    AssetDetailResponseDto,
} from '../api/api/index.defs';
import { AssetControllerService } from '../api/api/AssetControllerService';

class AssetStore {
    // ── Data ──────────────────────────────────────────────────────────────
    assets: AssetSummaryDto[] = [];
    /** Asset đang được xem detail — load từ getById khi mở modal/preview */
    selectedAsset: AssetDetailResponseDto | null = null;

    // ── Pagination ────────────────────────────────────────────────────────
    page: number = 1;
    pageSize: number = 50;
    totalCount: number = 0;
    sorting: string = 'updatedAt desc';

    // ── Loading / Error ───────────────────────────────────────────────────
    isLoading: boolean = false;
    errorMessage: string | null = null;

    // ── Modal trigger flags ───────────────────────────────────────────────
    /** true → mở modal upload file mới */
    isUploadAsset: boolean = false;
    /** true → mở modal upload folder (tạo asset hàng loạt) */
    isUploadFolder: boolean = false;
    /** true → mở modal chỉnh sửa thông tin asset */
    isUpdateDetail: boolean = false;
    /**
     * true → mở modal xác nhận chuyển asset vào thùng rác.
     * Hành động thực tế: archive (isTrash=true, isActive=true vẫn giữ nguyên).
     * Xóa hẳn (isActive=false) chỉ thực hiện từ trang Trash riêng.
     */
    isRemove: boolean = false;
    /** assetId đang được thao tác (dùng cho modal edit/remove) */
    targetAssetId: string | null = null;

    // ── Image/Asset Preview (mở rộng cho ImageReview về sau) ─────────────
    previewAssetId: string | null = null;
    isPreviewOpen: boolean = false;

    // ── i18n & UI config ──────────────────────────────────────────────────
    nameSpaceLocale: string = 'asset';
    modalWidth: number = 900;

    // ── Private context (dùng cho reaction auto-fetch) ────────────────────
    private _projectId: string = '';
    private _folderId: string | undefined = undefined;

    constructor() {
        makeObservable(this, {
            assets: observable,
            selectedAsset: observable,
            page: observable,
            pageSize: observable,
            totalCount: observable,
            sorting: observable,
            isLoading: observable,
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
            // computed
            skipCount: computed,
            totalPages: computed,
            // actions
            fetchPage: action,
            fetchDetail: action,
            moveAsset: action,
            setPage: action,
            openUploadAssetModal: action,
            openUploadFolderModal: action,
            openUpdateDetailModal: action,
            openRemoveModal: action,
            openPreview: action,
            closeAllModals: action,
            clearError: action,
            reset: action,
        });

        // Khi page thay đổi → tự gọi lại fetchPage với context đã lưu
        reaction(
            () => this.page,
            () => {
                if (this._projectId) {
                    void this.fetchPage(this._projectId, this._folderId);
                }
            }
        );
    }

    // ── Computed ──────────────────────────────────────────────────────────

    get skipCount(): number {
        return (this.page - 1) * this.pageSize;
    }

    get totalPages(): number {
        return Math.ceil(this.totalCount / this.pageSize);
    }

    // ── Actions ───────────────────────────────────────────────────────────

    /**
     * Load danh sách asset — gọi khi projectId hoặc folderId thay đổi.
     * Lưu context để reaction có thể tự gọi lại khi page thay đổi.
     * Lưu ý: AssetControllerService dùng getPage1 trong FolderAsset.tsx cũ,
     * store này gọi trực tiếp getPage từ service đã cập nhật.
     */
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

    /**
     * Load chi tiết một asset — dùng khi mở modal detail hoặc preview.
     * Trả về AssetDetailResponseDto: { asset, latestVersion }
     */
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

    /**
     * Di chuyển asset sang folder khác.
     * AssetMoveRequestDto: { assetId, targetFolderId }
     * Sau khi thành công tự refresh lại trang hiện tại.
     */
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

    /**
     * Đổi trang — reaction sẽ tự gọi fetchPage.
     * Chú ý: gọi fetchPage trực tiếp khi lần đầu load (page = 1 không trigger reaction).
     */
    setPage(page: number): void {
        this.page = page;
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

    /** Mở preview asset — dành cho ImageReview về sau */
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

    /** Reset toàn bộ state — gọi khi chuyển folder/project hoặc unmount */
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
