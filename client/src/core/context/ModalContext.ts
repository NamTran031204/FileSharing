import { createContext, useContext, type ReactNode } from 'react';
import type { FormInstance } from 'antd';

export interface ModalConfig {
  key?: string;
  open?: boolean;
  title?: ReactNode;
  width?: number;
  closable?: boolean;
  maskClosable?: boolean;
  destroyOnHidden?: boolean;
  hiddenForm?: boolean;
  className?: string;
  wrapClassName?: string;

  okText?: ReactNode;
  cancelText?: ReactNode;

  showOk?: boolean;
  showCancel?: boolean;

  content: (
    form: FormInstance,
    onOk: () => void,
    close: () => void,
  ) => ReactNode;

  /**
   * Trả về `false` để giữ modal mở (vd: business validation lỗi).
   * Có thể trả về Promise — Modal sẽ chờ resolve.
   */
  onOk?: (values: unknown, close: () => void) => void | boolean | Promise<unknown>;
  onCancel?: (close: () => void) => void;
  onCallBackWhenClose?: (form: FormInstance) => void;
  onCallBackWhenOk?: (form: FormInstance, values: unknown) => void;
  hiddenFooter?: boolean;
  formLayout?: 'vertical' | 'horizontal';
}

export interface ModalContextType {
  showModal: (config: ModalConfig) => { key: string; promise: Promise<unknown> };
  closeModal: (key: string) => void;
}

export const ModalContext = createContext<ModalContextType>(null as unknown as ModalContextType);

export const useFormModal = () => useContext(ModalContext);
