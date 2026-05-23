import type { ReactNode } from 'react';

export interface OrdConfirmProps {
  title?: ReactNode;
  content?: ReactNode;
  contentCustom?: ReactNode;
  okLabel?: ReactNode;
  cancelLabel?: ReactNode;
  icon?: ReactNode;
  closable?: boolean;
  wrapClassName?: string;
  onOk?: (data?: unknown) => void | Promise<unknown>;
  onCancel?: () => void;
}
