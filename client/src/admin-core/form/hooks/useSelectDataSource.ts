import {useEffect, useMemo, useState} from 'react';
import {type IOrdSelectOption} from '../select/OrdSelect';
import {type SelectDataSource} from '@plugin-core/form/select/data-source/selectDataSource';
import {useSelectDataSourceStore} from '@plugin-core/form/select/data-source/useSelectDataSourceStore';

export const useSelectDataSource = (
    key: string,
    fetchOptions: () => Promise<IOrdSelectOption[]>,
    isForce = false
): SelectDataSource => {
    const [isPending, setIsPending] = useState(false);
    const {dataOptions, getOptions, clearByName} = useSelectDataSourceStore();
    const data = useMemo(() => {
        return dataOptions[key];
    }, [dataOptions, key])

    useEffect(() => {
        if (isForce) {
            clearByName(key);
        }
        let isMounted = true;
        const fetchData = async () => {
            setIsPending(true);
            try {
                await getOptions(key, fetchOptions);
            } catch (error) {
                console.error('Failed to fetch select data source:', error);
            } finally {
                if (isMounted) setIsPending(false);
            }
        };
        fetchData();
        return () => {
            isMounted = false;
        };
    }, [key, isForce]);

    return {
        data: data,
        isPending,
    };
};
