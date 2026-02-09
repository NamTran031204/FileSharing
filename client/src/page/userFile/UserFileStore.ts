/**
 * UserFileStore
 * 
 * Kế thừa BaseListStore để quản lý User Files.
 * Implement custom logic như moveToTrash (soft delete).
 */

import { makeObservable, action, runInAction } from 'mobx';
import { message } from 'antd';
import { BaseListStore } from '../../core/base/BaseListStore';
import type { CommonCrudApi, TrashableCrudApi } from '../../core/base/CommonCrudApi';
import userFileApiResource, { 
    type MetadataEntity, 
    type UserFileFilterPageRequestDto 
} from '../../api/fileApi/userFileApiResource';
import fileApiResource from '../../api/fileApi/fileApiResource';
import type { PageRequest, PageResult } from '../../api/baseApi';
import type { UploadStatus } from '../../api/enums';

// ==================== Filter Interface ====================

export interface UserFileFilter extends UserFileFilterPageRequestDto {
    keyword?: string | null;
}

// ==================== API Adapter ====================

/**
 * Adapter để wrap userFileApiResource theo chuẩn CommonCrudApi
 * Đồng thời implement TrashableCrudApi cho soft delete functionality
 */
class UserFileApiAdapter implements TrashableCrudApi<MetadataEntity, UserFileFilter> {
    
    async getPaged(data: PageRequest<UserFileFilter>): Promise<PageResult<MetadataEntity>> {
        // Convert UserFileFilter to UserFileFilterPageRequestDto
        const apiFilter: UserFileFilterPageRequestDto = {
            mimeType: data.filter.mimeType ?? null,
            status: data.filter.status ?? null,
            isActive: data.filter.isActive ?? null,
            isTrash: data.filter.isTrash ?? false, // Default: không lấy file trong trash
            isIncludeSharedFile: data.filter.isIncludeSharedFile ?? null,
            creationTimestampStartDate: data.filter.creationTimestampStartDate ?? null,
            creationTimestampEndDate: data.filter.creationTimestampEndDate ?? null,
        };
        
        const request: PageRequest<UserFileFilterPageRequestDto> = {
            ...data,
            filter: apiFilter,
        };
        
        return userFileApiResource.getFileByData(request);
    }
    
    async createOrUpdate(id: string | undefined, data: Partial<MetadataEntity>): Promise<MetadataEntity> {
        if (!id) {
            throw new Error('Creating new file via this method is not supported. Use upload functionality.');
        }
        
        // Update existing file
        return userFileApiResource.updateFileDetail(id, {
            fileName: data.fileName ?? '',
            timeToLive: data.timeToLive ?? 0,
            publicPermission: data.publicPermission!,
            visibility: data.visibility!,
            userFilePermissions: data.userFilePermissions ?? [],
        });
    }
    
    async delete(id: string): Promise<string> {
        // Permanent delete
        return fileApiResource.deleteFile(id);
    }
    
    async moveToTrash(id: string): Promise<string> {
        return fileApiResource.moveToTrash(id);
    }
    
    async restoreFromTrash(id: string): Promise<string> {
        return fileApiResource.restoreFileFromTrash(id);
    }
    
    async permanentDelete(id: string): Promise<string> {
        return fileApiResource.deleteFile(id);
    }
}

// Singleton instance
const userFileApiAdapter = new UserFileApiAdapter();

// ==================== Store Class ====================

export class UserFileStore extends BaseListStore<MetadataEntity, UserFileFilter> {
    
    // ==================== Additional State ====================
    
    /** Loading state cho moveToTrash */
    isMovingToTrash: boolean = false;
    
    /** Loading state cho download */
    isDownloading: boolean = false;
    
    /** Ref cho FileDetailModal */
    modalRef: { open: (file: MetadataEntity) => void } | null = null;

    // ==================== Constructor ====================
    
    constructor() {
        super(UserFileStore.createDefaultFilter());
        
        makeObservable(this, {
            // Additional observables
            isMovingToTrash: true,
            isDownloading: true,
            modalRef: true,
            
            // Additional actions
            moveToTrash: action,
            setModalRef: action,
            openDetailModal: action,
        });
    }
    
    // ==================== Static Methods ====================
    
    static createDefaultFilter(): UserFileFilter {
        return {
            keyword: null,
            mimeType: null,
            status: null,
            isActive: true,
            isTrash: false,
            isIncludeSharedFile: false,
            creationTimestampStartDate: null,
            creationTimestampEndDate: null,
        };
    }

    // ==================== Abstract Implementation ====================
    
    getApiService(): CommonCrudApi<MetadataEntity, UserFileFilter> {
        return userFileApiAdapter;
    }
    
    getDefaultFilter(): UserFileFilter {
        return UserFileStore.createDefaultFilter();
    }
    
    getIdField(): keyof MetadataEntity {
        return 'fileId';
    }

    // ==================== Custom Actions ====================
    
    /**
     * Set modal ref từ component
     */
    setModalRef(ref: { open: (file: MetadataEntity) => void } | null): void {
        this.modalRef = ref;
    }
    
    /**
     * Mở FileDetailModal với file cụ thể
     * Sử dụng ref pattern để tương tác với FileDetailModal hiện có
     */
    openDetailModal(file: MetadataEntity): void {
        if (this.modalRef) {
            this.modalRef.open(file);
        } else {
            // Fallback: sử dụng modal state của base class
            this.openModal(file);
        }
    }
    
    /**
     * Chuyển file vào thùng rác (Soft Delete)
     * Override behavior vì nghiệp vụ file là soft delete
     */
    async moveToTrash(fileId: string): Promise<boolean> {
        try {
            runInAction(() => {
                this.isMovingToTrash = true;
            });
            
            await fileApiResource.moveToTrash(fileId);
            
            message.success('Đã chuyển file vào thùng rác');
            
            // Refresh data
            await this.fetchData();
            
            return true;
        } catch (error) {
            console.error('Move to trash error:', error);
            message.error('Có lỗi xảy ra khi chuyển file vào thùng rác');
            return false;
        } finally {
            runInAction(() => {
                this.isMovingToTrash = false;
            });
        }
    }
    
    /**
     * Override onDelete để gọi moveToTrash thay vì permanent delete
     */
    override async onDelete(id: string): Promise<boolean> {
        return this.moveToTrash(id);
    }
    
    /**
     * Set filter theo mimeType
     */
    setMimeTypeFilter(mimeType: string | null): void {
        this.setFilter('mimeType', mimeType);
    }
    
    /**
     * Set filter theo status
     */
    setStatusFilter(status: UploadStatus | null): void {
        this.setFilter('status', status);
    }
    
    /**
     * Set filter bao gồm shared files
     */
    setIncludeSharedFile(include: boolean): void {
        this.setFilter('isIncludeSharedFile', include);
    }
}

// ==================== Singleton Instance ====================

let userFileStoreInstance: UserFileStore | null = null;

export function getUserFileStore(): UserFileStore {
    if (!userFileStoreInstance) {
        userFileStoreInstance = new UserFileStore();
    }
    return userFileStoreInstance;
}

export default UserFileStore;
