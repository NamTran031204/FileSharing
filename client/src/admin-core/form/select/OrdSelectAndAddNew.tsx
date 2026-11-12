/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import OrdSelect, {type IOrdSelectOption, type IOrdSelectProp,} from "./OrdSelect";
import {Button, Divider, Row} from "antd";
import {PlusOutlined} from "@ant-design/icons";
import React, {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {useSelectDataSourceStore} from "@plugin-core/form/select/data-source/useSelectDataSourceStore";
import {type CommonResultDto} from "@plugin-core/http/dto";
import {useSimpleFormModal} from "@plugin-core/modal";

interface ModalSetting {
    width?: string | number;
    style?: React.CSSProperties;
    wrapClassName?: string;
    title?: React.ReactNode;
}

export interface IOrdSelectAndAddNewActions {
    openAddNewModal: (initValue?: unknown) => void;
    //có thể thêm nhiều hàm khác nếu muốn expose
}

export interface IOrdSelectAndAddNewProps extends IOrdSelectProp {
    formContent: React.ReactNode,
    apiAddNew: (formValue: any) => Promise<CommonResultDto<any>>,
    nameDataSource: string,
    renderSelectOptions: (newItem: any) => IOrdSelectOption,
    onAddDone?: (newItem: any) => void,
    modalSetting?: ModalSetting,
    hiddenAddNewBtn?: boolean,
    autoFocus?: boolean
    onReady?: (actions: IOrdSelectAndAddNewActions) => void;
}

export const OrdSelectAndAddNew = (props: IOrdSelectAndAddNewProps) => {
    const {clearByName} = useSelectDataSourceStore();
    const [allowClear, setAllowClear] = useState(true);
    const [t] = useTranslation();
    const {
        formContent, nameDataSource, onAddDone, renderSelectOptions,
        modalSetting,
        apiAddNew,
        hiddenAddNewBtn,
        ...rest
    } = props;
    const [newOption, setNewOption] = useState<any>(null);

    const {openFormModal} = useSimpleFormModal({
        title: t('addNewSelectTitle.' + nameDataSource),
        formFields: <Row gutter={16}>{formContent}</Row>,
        modalProps: {width: modalSetting?.width || 900},
    });

    useEffect(() => {
        if (!props.allowClear) {
            setAllowClear(false);
        }
    }, [props.allowClear]);

    useEffect(() => {
        if (props.onReady) {
            props.onReady({openAddNewModal});  // khi mount để "giao lại" hàm cho cha.
        }
    }, []);

    const setNewData = (dto: any) => {
        if (dto && dto.id) {
            clearByName(nameDataSource);
            setNewOption({
                ...renderSelectOptions(dto)
            });
            if (onAddDone) {
                onAddDone(dto);
            }
        }
    }

    const openAddNewModal = (initValue?: unknown) => {
        openFormModal(
            initValue ?? {},
            async (formValue) => {
                try {
                    const result = await apiAddNew({...formValue});
                    if (result.isSuccessful) {
                        setNewData({...result.data});
                        return {mustCloseModal: true};
                    }
                    return {mustCloseModal: false};
                } catch {
                    return {mustCloseModal: false};
                }
            }
        );
    }

    return (
        <OrdSelect {...rest}
                   allowClear={allowClear}
                   newOption={newOption}
                   dropdownRender={(menu) => (
                       <>
                           {menu}
                           {hiddenAddNewBtn != true && <>
                               <Divider style={{margin: '8px 0'}}/>
                               <Button size={'small'}
                                       onClick={() => openAddNewModal()}
                                       type={'primary'} htmlType={'button'}
                                       icon={<PlusOutlined/>}>
                                   {t('addNewItemSelect')}
                               </Button>
                           </>}
                       </>
                   )}/>
    );
};