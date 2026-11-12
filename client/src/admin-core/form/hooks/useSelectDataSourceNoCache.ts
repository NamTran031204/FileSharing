import {useEffect, useState} from "react";
import {type IOrdSelectOption} from '../select/OrdSelect';
import {type SelectDataSource} from '@plugin-core/form/select/data-source/selectDataSource';

export const useSelectDataSourceNoCache = (
    fetchOptions: () => Promise<IOrdSelectOption[]>
): SelectDataSource => {
    const [data, setData] = useState<IOrdSelectOption[]>([]);
    const [isPending, setIsPending] = useState(false);

    const fetchData = async () => {
        setIsPending(true);
        try {
            const result = await fetchOptions();
            setData(result);
        } catch (error) {
            console.error("Failed to fetch options:", error);
        } finally {
            setIsPending(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []); // Chỉ chạy 1 lần khi mount

    return {data, isPending};
};
