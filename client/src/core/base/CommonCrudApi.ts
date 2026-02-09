/**
 * CommonCrudApi Interface
 * 
 * Định nghĩa interface chuẩn cho các API CRUD operations.
 * Đảm bảo Interface Segregation Principle - mọi service đều tuân theo chuẩn này.
 * 
 * @template TEntity - Kiểu dữ liệu của Entity
 * @template TFilter - Kiểu dữ liệu của Filter object
 * @template TCreateUpdate - Kiểu dữ liệu cho Create/Update request
 */

import type { PageRequest, PageResult } from '../../api/baseApi';

/**
 * Interface chính cho CRUD API
 */
export interface CommonCrudApi<
    TEntity,
    TFilter = Record<string, unknown>,
    TCreateUpdate = Partial<TEntity>
> {
    /**
     * Lấy danh sách phân trang
     * @param data - PageRequest chứa filter, pagination và sorting
     * @returns Promise với PageResult chứa data và totalCount
     */
    getPaged: (data: PageRequest<TFilter>) => Promise<PageResult<TEntity>>;

    /**
     * Tạo mới hoặc cập nhật entity
     * @param id - ID entity (undefined nếu tạo mới)
     * @param data - Dữ liệu create/update
     * @returns Promise với entity đã được tạo/cập nhật
     */
    createOrUpdate?: (id: string | undefined, data: TCreateUpdate) => Promise<TEntity>;

    /**
     * Xóa entity theo ID
     * @param id - ID của entity cần xóa
     * @returns Promise<void> hoặc Promise<string>
     */
    delete?: (id: string) => Promise<void | string>;

    /**
     * Lấy chi tiết một entity
     * @param id - ID của entity
     * @returns Promise với entity
     */
    getById?: (id: string) => Promise<TEntity>;
}

/**
 * Interface mở rộng cho các entity có soft delete (Trash functionality)
 */
export interface TrashableCrudApi<
    TEntity,
    TFilter = Record<string, unknown>,
    TCreateUpdate = Partial<TEntity>
> extends CommonCrudApi<TEntity, TFilter, TCreateUpdate> {
    /**
     * Chuyển entity vào thùng rác
     * @param id - ID của entity
     */
    moveToTrash: (id: string) => Promise<void | string>;

    /**
     * Khôi phục entity từ thùng rác
     * @param id - ID của entity
     */
    restoreFromTrash?: (id: string) => Promise<void | string>;

    /**
     * Xóa vĩnh viễn
     * @param id - ID của entity
     */
    permanentDelete?: (id: string) => Promise<void | string>;
}

/**
 * Base Filter interface với các trường phổ biến
 */
export interface BaseFilter {
    keyword?: string | null;
    creationTimestampStartDate?: string | null;
    creationTimestampEndDate?: string | null;
}

/**
 * Sorting direction
 */
export type SortDirection = 'asc' | 'desc' | '';

/**
 * Helper type để extract entity type từ API
 */
export type ExtractEntity<T> = T extends CommonCrudApi<infer E, unknown, unknown> ? E : never;

/**
 * Helper type để extract filter type từ API
 */
export type ExtractFilter<T> = T extends CommonCrudApi<unknown, infer F, unknown> ? F : never;
