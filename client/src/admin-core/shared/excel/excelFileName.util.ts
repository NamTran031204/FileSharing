export type ExcelFileNameKind = 'export' | 'template' | 'importResult';

const PREFIX_BY_KIND: Record<ExcelFileNameKind, string> = {
    export: 'danh_sach',
    template: 'mau_import',
    importResult: 'ket_qua_import',
};

const formatDatePart = (date: Date): string => {
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yy}_${mm}_${dd}`;
};

export const buildExcelFileName = (
    kind: ExcelFileNameKind,
    screenName: string,
    date: Date = new Date(),
): string => {
    const prefix = PREFIX_BY_KIND[kind];
    const datePart = formatDatePart(date);
    return `${prefix}_${screenName}_${datePart}.xlsx`;
};
