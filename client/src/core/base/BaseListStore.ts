/**
 * BaseListStore - Abstract Base Store
 * 
 * Template Method Pattern & Inheritance với MobX.
 * Class cha định nghĩa luồng xử lý (fetch, delete, modal control),
 * Class con implement chi tiết (API service, config).
 * 
 * @template TEntity - Kiểu dữ liệu của Entity
 * @template TFilter - Kiểu dữ liệu của Filter object
 */

import { makeObservable, observable, action, computed, runInAction } from 'mobx';
import type { CommonCrudApi } from './CommonCrudApi';
import type { PageRequest } from '../../api/baseApi';
import { message } from 'antd';

/**
 * Pagination configuration
 */
export interface PaginationConfig {
    current: number;
    pageSize: number;
    total: number;
}

/**
 * Table sorting info
 */
export interface SortingInfo {
    field: string;
    order: 'ascend' | 'descend' | null;
}

/**
 * Abstract Base Store cho CRUD List operations
 */
export abstract class BaseListStore<
    TEntity extends object,
    TFilter extends object = Record<string, unknown>
> {
    // ==================== Observable State ====================
    
    /** Danh sách items hiện tại */
    items: TEntity[] = [];
    
    /** Tổng số records (cho pagination) */
    total: number = 0;
    
    /** Filter object */
    filter: TFilter;
    
    /** Loading state */
    isLoading: boolean = false;
    
    /** Modal visible state */
    modalVisible: boolean = false;
    
    /** Item đang được select để view/edit */
    selectedItem: TEntity | null = null;
    
    /** Pagination config */
    pagination: PaginationConfig = {
        current: 1,
        pageSize: 10,
        total: 0,
    };
    
    /** Sorting info */
    sorting: SortingInfo = {
        field: '',
        order: null,
    };

    /** Delete loading state */
    isDeleting: boolean = false;

    /** Save loading state */
    isSaving: boolean = false;

    // ==================== Constructor ====================
    
    constructor(defaultFilter: TFilter) {
        this.filter = defaultFilter;
        
        makeObservable(this, {
            // Observables
            items: observable,
            total: observable,
            filter: observable,
            isLoading: observable,
            modalVisible: observable,
            selectedItem: observable,
            pagination: observable,
            sorting: observable,
            isDeleting: observable,
            isSaving: observable,
            
            // Computed
            isEmpty: computed,
            hasSelectedItem: computed,
            pageRequest: computed,
            
            // Actions
            setFilter: action,
            resetFilter: action,
            setPagination: action,
            setSorting: action,
            setItems: action,
            setTotal: action,
            setLoading: action,
            openModal: action,
            closeModal: action,
            setSelectedItem: action,
            fetchData: action,
            onDelete: action,
            onSave: action,
            reset: action,
        });
    }

    // ==================== Abstract Methods ====================
    
    /**
     * Return API service instance
     * Class con phải implement method này
     */
    abstract getApiService(): CommonCrudApi<TEntity, TFilter>;
    
    /**
     * Return default filter object
     * Class con có thể override
     */
    abstract getDefaultFilter(): TFilter;
    
    /**
     * Return ID field name của Entity
     * Default: 'id', class con có thể override
     */
    getIdField(): keyof TEntity {
        return 'id' as keyof TEntity;
    }

    // ==================== Computed Properties ====================
    
    get isEmpty(): boolean {
        return this.items.length === 0;
    }
    
    get hasSelectedItem(): boolean {
        return this.selectedItem !== null;
    }
    
    get pageRequest(): PageRequest<TFilter> {
        const sortingStr = this.sorting.field && this.sorting.order
            ? `${this.sorting.field} ${this.sorting.order === 'ascend' ? 'asc' : 'desc'}`
            : '';
            
        return {
            maxResultCount: this.pagination.pageSize,
            skipCount: (this.pagination.current - 1) * this.pagination.pageSize,
            sorting: sortingStr,
            filter: this.filter,
        };
    }

    // ==================== Basic Actions ====================
    
    setFilter<K extends keyof TFilter>(key: K, value: TFilter[K]): void {
        this.filter[key] = value;
    }
    
    updateFilter(partialFilter: Partial<TFilter>): void {
        this.filter = { ...this.filter, ...partialFilter };
    }
    
    resetFilter(): void {
        this.filter = this.getDefaultFilter();
        this.pagination.current = 1;
    }
    
    setPagination(pagination: Partial<PaginationConfig>): void {
        this.pagination = { ...this.pagination, ...pagination };
    }
    
    setSorting(sorting: Partial<SortingInfo>): void {
        this.sorting = { ...this.sorting, ...sorting };
    }
    
    setItems(items: TEntity[]): void {
        this.items = items;
    }
    
    setTotal(total: number): void {
        this.total = total;
        this.pagination.total = total;
    }
    
    setLoading(loading: boolean): void {
        this.isLoading = loading;
    }
    
    setSelectedItem(item: TEntity | null): void {
        this.selectedItem = item;
    }

    // ==================== Modal Control ====================
    
    /**
     * Mở modal
     * @param item - Item để edit (undefined = create new)
     */
    openModal(item?: TEntity): void {
        this.selectedItem = item ?? null;
        this.modalVisible = true;
    }
    
    /**
     * Đóng modal và reset selected item
     */
    closeModal(): void {
        this.modalVisible = false;
        this.selectedItem = null;
    }

    // ==================== Core Actions (Template Methods) ====================
    
    /**
     * Fetch data từ API với pagination
     * Template Method - định nghĩa luồng xử lý chuẩn
     */
    async fetchData(): Promise<void> {
        const api = this.getApiService();
        
        if (!api.getPaged) {
            console.warn('API service does not implement getPaged method');
            return;
        }
        
        try {
            this.setLoading(true);
            
            const result = await api.getPaged(this.pageRequest);
            
            runInAction(() => {
                this.items = result.data;
                this.setTotal(result.totalCount);
            });
        } catch (error) {
            console.error('Fetch data error:', error);
            message.error('Có lỗi xảy ra khi tải dữ liệu');
            
            runInAction(() => {
                this.items = [];
                this.setTotal(0);
            });
        } finally {
            runInAction(() => {
                this.setLoading(false);
            });
        }
    }
    
    /**
     * Xóa item theo ID
     * Template Method - class con có thể override để custom behavior
     */
    async onDelete(id: string): Promise<boolean> {
        const api = this.getApiService();
        
        if (!api.delete) {
            console.warn('API service does not implement delete method');
            return false;
        }
        
        try {
            runInAction(() => {
                this.isDeleting = true;
            });
            
            await api.delete(id);
            
            message.success('Xóa thành công');
            
            // Refresh data after delete
            await this.fetchData();
            
            return true;
        } catch (error) {
            console.error('Delete error:', error);
            message.error('Có lỗi xảy ra khi xóa');
            return false;
        } finally {
            runInAction(() => {
                this.isDeleting = false;
            });
        }
    }
    
    /**
     * Lưu (Create/Update) item
     * Template Method - class con có thể override để custom behavior
     */
    async onSave(data: Partial<TEntity>): Promise<boolean> {
        const api = this.getApiService();
        
        if (!api.createOrUpdate) {
            console.warn('API service does not implement createOrUpdate method');
            return false;
        }
        
        const id = this.selectedItem 
            ? String(this.selectedItem[this.getIdField()]) 
            : undefined;
        
        try {
            runInAction(() => {
                this.isSaving = true;
            });
            
            await api.createOrUpdate(id, data);
            
            message.success(id ? 'Cập nhật thành công' : 'Tạo mới thành công');
            
            this.closeModal();
            
            // Refresh data after save
            await this.fetchData();
            
            return true;
        } catch (error) {
            console.error('Save error:', error);
            message.error('Có lỗi xảy ra khi lưu');
            return false;
        } finally {
            runInAction(() => {
                this.isSaving = false;
            });
        }
    }
    
    /**
     * Reset store về trạng thái ban đầu
     */
    reset(): void {
        this.items = [];
        this.total = 0;
        this.filter = this.getDefaultFilter();
        this.isLoading = false;
        this.modalVisible = false;
        this.selectedItem = null;
        this.pagination = {
            current: 1,
            pageSize: 10,
            total: 0,
        };
        this.sorting = {
            field: '',
            order: null,
        };
    }

    // ==================== Table Event Handlers ====================
    
    /**
     * Handle table change (pagination, sorting)
     */
    handleTableChange = (
        pagination: { current?: number; pageSize?: number },
        _filters: Record<string, unknown>,
        sorter: { field?: string; order?: 'ascend' | 'descend' | null } | Array<{ field?: string; order?: 'ascend' | 'descend' | null }>
    ): void => {
        // Handle pagination
        if (pagination.current !== undefined) {
            this.pagination.current = pagination.current;
        }
        if (pagination.pageSize !== undefined) {
            this.pagination.pageSize = pagination.pageSize;
        }
        
        // Handle sorting (single sorter only)
        if (!Array.isArray(sorter) && sorter.field) {
            this.sorting.field = String(sorter.field);
            this.sorting.order = sorter.order ?? null;
        }
        
        // Fetch new data
        this.fetchData();
    };
    
    /**
     * Handle search form submit
     */
    handleSearch = (): void => {
        this.pagination.current = 1; // Reset to first page
        this.fetchData();
    };
    
    /**
     * Handle reset search form
     */
    handleReset = (): void => {
        this.resetFilter();
        this.fetchData();
    };
}

export default BaseListStore;
