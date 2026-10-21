import i18n from '../../../i18n';

type ToastType = 'success' | 'error' | 'info' | 'warning';

const titleByType = (type: ToastType) => i18n.t(`core:toast.${type}`);

const COLOR_CLASS_BY_TYPE: Record<ToastType, string> = {
  success: 'text-[#4CB944]',
  error: 'text-destructive',
  warning: 'text-[#FFAF37]',
  info: 'text-primary',
};

interface ToastCustomContentProps {
  desc?: string;
  type: ToastType;
}

const ToastCustomContent = ({ desc, type }: ToastCustomContentProps) => (
  <div>
    <div className={`text-sm font-medium ${COLOR_CLASS_BY_TYPE[type]}`}>{titleByType(type)}</div>
    {desc && <div className="text-sm font-medium" dangerouslySetInnerHTML={{ __html: desc }} />}
  </div>
);

export default ToastCustomContent;
