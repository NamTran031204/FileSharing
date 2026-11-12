/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
export interface OrdTransProps {
    i18nKey: string;
    values?: Record<string, any>;
    components?: Record<string, React.JSX.Element>;
    ns?: string | string[];
}