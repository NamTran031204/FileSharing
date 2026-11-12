/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import {Badge, Segmented, Space, Spin} from "antd";
import {useCallback, useState} from "react";
import {type CounterByStatusItemDto, type StaticCounterByStatusApiFetcher} from "@plugin-core/table/paged/types";
import {useDebounce} from "@plugin-core/shared/hooks/useDebounce";
import {type TableStoredState} from "@plugin-core/table/paged";
import {type StoreApi, type UseBoundStore} from "zustand";

export interface OrdCounterByStatusSegmentedProps {
    statusFieldName: string,
    fetcher: StaticCounterByStatusApiFetcher,
    tableStore: UseBoundStore<StoreApi<TableStoredState>>,
    initialValueStatus?: string | number | null | boolean
}

export const OrdCounterByStatusSegmented = (props: OrdCounterByStatusSegmentedProps) => {
    const {fetcher, tableStore, statusFieldName} = props;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
    const {searchParams, setSearchStatusParams, reloadStatusCounter, onLoadData} = tableStore();
    const {initialValueStatus} = props;
    const [statusOptions, setStatusOptions] = useState<any[]>([{
        label: <>
            <Spin spinning={true}/>
        </>,
        value: '__loading__'
    }]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<string | number | null | boolean>(initialValueStatus || null);

    const fetchCounterData = useCallback(async () => {
        try {
            setLoading(true);
            const result = await fetcher({
                body: {
                    ...searchParams
                }
            });

            const items: CounterByStatusItemDto[] = result.data || [];
            const options = items.map(item => ({
                label: (
                    <Space wrap>
                        <span>{item.statusDescription}</span>
                        <Badge
                            count={item.totalCount}
                            showZero
                            overflowCount={Number.MAX_VALUE}
                        />
                    </Space>
                ),
                value: item.statusValue
            }));
            setStatusOptions(options);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
        } catch (error) {
            setStatusOptions([]);
        } finally {
            setLoading(false);
        }
    }, [fetcher, searchParams]);

    const handleStatusChange = useCallback((value: string | number) => {
        setStatus(value);
    }, []);

    // Debounce fetch counter data when searchParams change
    useDebounce(fetchCounterData, 300, [reloadStatusCounter]);

    // Debounce update searchParams when status changes
    useDebounce(() => {
        setSearchStatusParams({
            [statusFieldName]: status
        });
    }, 300, [status, statusFieldName]);

    return (
        <div className="w-full mb-3 rounded-md mt-[-10px] ord-status-counter">
            <Spin spinning={loading}>
                <Segmented<any>
                    value={status}
                    style={{color: "var(--color-foreground)", backgroundColor: "var(--color-background)"}}
                    options={statusOptions}
                    disabled={loading}
                    onChange={handleStatusChange}
                />
            </Spin>
        </div>
    );
}
