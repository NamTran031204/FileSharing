// ============================================================
// PUBLIC API — Consumer code nên import từ đây
// ============================================================

// Root component — mount 1 lần tại App.tsx
export {GlobalModalManager} from './GlobalModalManager';

// Modal hooks — dùng trong page/feature components
export * from './GlobalModalManager/hook/useSimpleFormModal';
export * from './GlobalModalManager/hook/useCrudModal';
export * from './table-search/useTableSearchModal';

// Types
export * from './GlobalModalManager/types';

// Footer components
export * from './footer/OrdModalFooter';
export * from './footer/buttons/OrdModalCloseButton';
export * from './footer/buttons/OrdModalSaveButton';
export * from './footer/FooterCrudModal';

// Confirm dialog
export {default as OrdConfirm} from './confirm/OrdConfirm';

// Bulk action button (dùng trong table-search modal)
export * from './table-search/BulkActionButtonModal';

// ============================================================
// ADVANCED API — Dùng khi cần custom modal hoàn toàn
// ============================================================

// Store — dùng để mở modal custom (không qua useCrudModal/useSimpleFormModal)
export * from './GlobalModalManager/hook/useGlobalModalStore';

// API actions riêng lẻ (nếu muốn tự build UI xung quanh)
export * from './GlobalModalManager/hook/useCrudApiActions';
