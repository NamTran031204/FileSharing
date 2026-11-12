/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import {type TableStoredState} from "../hooks/useTableStoreFactory";
import {cloneElement, isValidElement, type ReactElement, useMemo} from "react";
import {useTranslation} from "react-i18next";
import {type StoreApi, type UseBoundStore} from "zustand";
import {ConfigProvider, Empty, type EmptyProps, Pagination, type PaginationProps, type TablePaginationConfig, Typography} from "antd";
import {useOrdDataList} from "../hooks/useOrdDataList";
import {IconsaxArrowLeft, IconsaxArrowRight} from "@plugin-core/shared/icon/IconsaxIcons";
import {vttDesignTokens} from "@plugin-core/shared/theme/vtt-design-tokens";

// Figma "Phân trang": mũi tên Iconsax 20px; giữ nút gốc của antd (disabled, focus), chỉ thay icon bên trong.
const renderPaginationArrow: PaginationProps['itemRender'] = (_, type, element) => {
    if ((type === 'prev' || type === 'next') && isValidElement(element)) {
        const Arrow = type === 'prev' ? IconsaxArrowLeft : IconsaxArrowRight;
        return cloneElement(element as ReactElement, undefined, <Arrow className="ord-pagination-arrow"/>);
    }
    return element;
};

// Ô chọn số dòng cao 32, viền var(--color-border) như Figma; theme Select chung vẫn 40.
const PAGINATION_THEME = {
    components: {Select: {controlHeight: 32, colorBorder: vttDesignTokens.color.borderStrong}},
};

type EmptyBox = boolean | EmptyProps | (() => React.ReactNode);

interface Props<TData> {
    tableStore: UseBoundStore<StoreApi<TableStoredState>>;
    renderListContent: (data: TData[], loading: boolean) => React.ReactNode;
    initialSearchParams?: Record<string, any>;
    pagination?: false | TablePaginationConfig;
    className?: string;
    emptyDataBox?: EmptyBox;
}

export function OrdDataListView<TData = any>(props: Props<TData>) {
    const {
        tableStore,
        initialSearchParams,
        renderListContent,
        pagination,
        className,
        emptyDataBox = false
    } = props;
    const {data, loading} = useOrdDataList<TData>(tableStore, initialSearchParams);
    const isEmptyData = useMemo(() => {
        return !data || data.length == 0;
    }, [data]);
    if (isEmptyData && emptyDataBox) {
        let content: React.ReactNode;
        if (typeof emptyDataBox === "function") {
            content = emptyDataBox();
        } else if (typeof emptyDataBox === "object") {
            content = <Empty {...emptyDataBox} />;
        } else {
            // true hoặc boolean
            content = (
                <Empty
                    style={{marginTop: 40}}
                    description={
                        <Typography.Text>
                            Không có dữ liệu
                        </Typography.Text>
                    }
                />
            );
        }
        return <>{content}</>;
    }
    return <>
        <div className={className}>
            {renderListContent(data,loading)}
            {
                pagination != false &&
                <OrdPagination tableStore={tableStore}
                               pagination={pagination}/>
            }
        </div>

    </>
}

export const OrdPagination = (props: {
    tableStore: UseBoundStore<StoreApi<TableStoredState>>;
    pagination?: TablePaginationConfig;
}) => {
    const {t} = useTranslation();
    const {tableStore, pagination = {}} = props;
    const {
        total,
        page,
        pageSize,
        setPagination
    } = tableStore();

    const paginationProps = useMemo(
        () => ({
            ...pagination,
            current: page,
            pageSize,
            total,
            onChange: setPagination,
        }),
        [pagination, page, pageSize, total, setPagination]
    );
    return <>
        <div className="custom-pagination mt-3 flex flex-wrap items-center justify-between">
            <div/>
            <div className="flex items-center">
                <ConfigProvider theme={PAGINATION_THEME}>
                    <Pagination
                        pageSizeOptions={['5', '10', '20', '50', '100']}
                        itemRender={renderPaginationArrow}
                        {...paginationProps}
                        showSizeChanger
                        showTotal={(total, range) =>
                            `${t('Show')} ${range[0]}-${range[1]} / ${total} ${t('record')}`
                        }
                    />
                </ConfigProvider>
            </div>
        </div>
    </>

}
