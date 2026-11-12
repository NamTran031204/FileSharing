import React from 'react';
import {Button} from 'antd';
import {type BaseButtonProps} from 'antd/es/button/Button';
import {l} from "@plugin-core/shared/language/lang.utils";

export interface SaveButtonProps extends BaseButtonProps {
    onSubmit: () => void;
    label?: React.ReactNode;
    icon?: React.ReactNode;
}

export const OrdModalSaveButton: React.FC<SaveButtonProps> = (props) => {
    const {
        onSubmit,
        label = (<span>{l.trans('action.modal.save')}</span>),
        icon,
        ...rest
    } = props;

    return (
        <Button
            type={'primary'}
            icon={icon}
            {...rest}
            onClick={onSubmit}
        >
            {label}
        </Button>
    );
};
