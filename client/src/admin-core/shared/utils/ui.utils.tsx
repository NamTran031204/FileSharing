import {DeleteOutlined} from '@ant-design/icons';
import uiUtils from '../../../utils/uiUtils';
import type {OrdConfirmProps} from '../../../components/core/confirm/CusCommonConfirm.types';
import {l} from '../language/lang.utils';

// Cau noi sang client/src/utils/uiUtils.tsx (spec D13): toast, busy overlay, confirm dung ban san co.
type ConfirmInput = Omit<OrdConfirmProps, 'icon'> & {icon?: OrdConfirmProps['icon'] | 'remove'};

const UiUtils = {
    showSuccess: (content?: string) => uiUtils.showSuccess(content),
    showError: (content?: string) => uiUtils.showError(content),
    showErrorNs: (ns: string, content?: string, prm?: unknown) => uiUtils.showError(l.trans(ns + '.' + content, prm)),
    showInfo: (content?: string) => uiUtils.showInfor(content),
    showWarning: (content?: string) => uiUtils.showWarning(content),
    showCommonValidateForm: () => uiUtils.showCommonValidateForm(),
    setBusy: () => uiUtils.setBusy(),
    clearBusy: () => uiUtils.clearBusy(),
    showConfirm: (input: ConfirmInput) =>
        uiUtils.showConfirm({...input, icon: input.icon === 'remove' ? <DeleteOutlined/> : input.icon} as OrdConfirmProps),
};

export default UiUtils;
