/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import {Badge, Form, Segmented, Space} from "antd";
import React, {useEffect, useState} from "react";
import {useDebounce} from "use-debounce";
import {useTranslation} from "react-i18next";
import {type CounterByIsActivedStatusDto} from "@plugin-core/shared/types/common.types";

export const IsActiveStatusCounter = (props: {
    getCountApi(
        params: {
            body?: Record<string, any>;
        }
    ): Promise<CounterByIsActivedStatusDto>
}) => {
    const {getCountApi} = props;
    const form = Form.useFormInstance();
    const [t] = useTranslation();
    const onSearchBeginning_w = Form.useWatch('onSearchBeginning', form);
    const [moveStatusChange, setMoveStatusChange] = useState(0);
    const [debouncedMoveStatus] = useDebounce(moveStatusChange, 500);
    const [statusOptions, setStatusOptions] = useState<any>();
    const getCount = async () => {
        try {
            const ret = await getCountApi({
                body: {
                    ...form.getFieldsValue()
                }
            });
            const options = [
                {
                    label: <Space wrap>
                        <span>{t('counter.isActive.all')}</span>
                        <Badge count={ret.total} showZero overflowCount={Number.MAX_VALUE}></Badge>
                    </Space>,
                    value: null
                }, {
                    label: <Space wrap >
                        <span>{t('counter.isActive.true')}</span>
                        <Badge count={ret.totalTrue} showZero overflowCount={Number.MAX_VALUE}></Badge>
                    </Space>,
                    value: true
                }, {
                    label: <Space wrap >
                        <span>{t('counter.isActive.false')}</span>
                        <Badge count={ret.totalFalse} showZero overflowCount={Number.MAX_VALUE}></Badge>
                    </Space>,
                    value: false
                }
            ]
            setStatusOptions(options as any);
        // eslint-disable-next-line no-empty -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
        } catch {

        // eslint-disable-next-line no-empty -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
        } finally {

        }
    }
    useEffect(() => {
        if (onSearchBeginning_w > 0) {
            getCount();
        }
    }, [onSearchBeginning_w]);
    const handlerChange = () => {

        setMoveStatusChange(Number(new Date()));
    }
    useEffect(() => {
        if (debouncedMoveStatus > 0) {
            form.submit();
        }
    }, [debouncedMoveStatus]);
    return (<div className="w-full mb-3 rounded-md mt-[-10px] ord-status-counter ">
        <Form.Item name='isActived' initialValue={null}>
            <Segmented
                style={{color: "var(--color-foreground)", backgroundColor: "var(--color-background)"}}
                options={statusOptions}
                onChange={handlerChange}
            />
        </Form.Item>
    </div>);
}
