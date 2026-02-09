/**
 * Core Base Module
 * 
 * Export tất cả các thành phần của Generic CRUD Architecture
 */

// API Interface
export * from './CommonCrudApi';
export type {
    CommonCrudApi,
    TrashableCrudApi,
    BaseFilter,
    SortDirection,
    ExtractEntity,
    ExtractFilter,
} from './CommonCrudApi';

// Base Store
export { BaseListStore } from './BaseListStore';
export type { PaginationConfig, SortingInfo } from './BaseListStore';

// Generic Page Component
export { GenericCrudPage, DeleteConfirmModal } from './GenericCrudPage';
export type {
    GenericCrudPageProps,
    SearchFormRenderProps,
    ModalFormRenderProps,
    ActionColumnRenderProps,
} from './GenericCrudPage';
