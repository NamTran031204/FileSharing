type ToastType = 'success' | 'error' | 'info' | 'warning';

const TITLE_BY_TYPE: Record<ToastType, string> = {
  success: 'Thành công',
  error: 'Lỗi',
  warning: 'Cảnh báo',
  info: 'Thông báo',
};

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
    <div className={`text-sm font-medium ${COLOR_CLASS_BY_TYPE[type]}`}>{TITLE_BY_TYPE[type]}</div>
    {desc && <div className="text-sm font-medium" dangerouslySetInnerHTML={{ __html: desc }} />}
  </div>
);

export default ToastCustomContent;
