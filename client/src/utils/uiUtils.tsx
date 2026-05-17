import { Bounce, toast, type ToastOptions } from 'react-toastify';
import { createConfirmation } from 'react-confirm';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  CloseOutlined,
  InfoCircleFilled,
  WarningFilled,
} from '@ant-design/icons';
import CusCommonConfirm from '../components/confirm/CusCommonConfirm.tsx';
import type { OrdConfirmProps } from '../components/confirm/CusCommonConfirm.types.ts';
import ToastCustomContent from '../components/common/ToastCustomContent';
import { rootStore } from '../store';

class UiUtils {
  private BASE_TOAST: ToastOptions = {
    position: 'top-center',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    className: 'toast-wrapper',
    theme: 'light',
    closeButton: <CloseOutlined />,
    transition: Bounce,
  };

  showSuccess = (content?: string) => {
    toast.success(<ToastCustomContent desc={content} type="success" />, {
      ...this.BASE_TOAST,
      className: 'toast-wrapper toast-success',
      icon: <CheckCircleFilled className="text-[#4CB944]" />,
    });
  };

  showError = (content?: string) => {
    toast.dismiss();
    toast.error(<ToastCustomContent desc={content} type="error" />, {
      ...this.BASE_TOAST,
      icon: <CloseCircleFilled className="text-destructive" />,
    });
  };

  showWarning = (content?: string) => {
    toast.dismiss();
    toast.warning(<ToastCustomContent desc={content} type="warning" />, {
      ...this.BASE_TOAST,
      icon: <WarningFilled className="text-[#FFAF37]" />,
    });
  };

  showInfor = (content?: string) => {
    toast.dismiss();
    toast.info(<ToastCustomContent desc={content} type="info" />, {
      ...this.BASE_TOAST,
      icon: <InfoCircleFilled className="text-primary" />,
    });
  };

  showCommonValidateForm = () => {
    toast.error(<ToastCustomContent desc="Form không hợp lệ" type="error" />, {
      ...this.BASE_TOAST,
      icon: <CloseCircleFilled className="text-destructive" />,
      toastId: 'formInvalidErr',
    });
  };

  setBusy = () => {
    rootStore.uiStore.setBusy();
  };

  clearBusy = () => {
    rootStore.uiStore.clearBusy();
  };

  showConfirm = (input: OrdConfirmProps): Promise<boolean> => {
    const confirm = createConfirmation(CusCommonConfirm);
    return confirm({ ...input });
  };
}

const uiUtils = new UiUtils();
export default uiUtils;
