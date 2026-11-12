export const CRUD_ACTIONS = [
    'GetPaged',
    'GetDetail',
    'Create',
    'Update',
    'Delete',
    'Import',
    'Export'
] as const;
export const CRUD_NOT_EXCEL_ACTIONS = [
    'GetPaged',
    'GetDetail',
    'Create',
    'Update',
    'Delete'
] as const;
export const SURVEY_DEVICE_ACTIONS = [
    'GetPaged',
    'GetDetail',
    'Delete',
    'Export',
    'Approve',
    'Revoke',
] as const;
export const WORK_ORDER_ACTIONS = [
    'GetPaged',
    'GetDetail',
    'Create',
    'Update',
    'Delete',
    'Import',
    'Export',
    'Assign',
    'Cancel',
] as const;

export const DASHBOARD_ACTIONS = [
    'View',
    'Heatmap',
    'IspCompare',
    'MovementMap',
] as const;
export const SCAN_SESSION_ACTIONS = [
    'GetPaged',
    'GetDetail',
    'Cancel',
    'Export',
] as const;
