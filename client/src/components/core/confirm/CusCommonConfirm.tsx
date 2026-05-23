import { Button, Modal, Space } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { confirmable, type ConfirmDialog, type ConfirmDialogProps } from 'react-confirm';
import type { OrdConfirmProps } from './CusCommonConfirm.types.ts';

type Props = ConfirmDialogProps<OrdConfirmProps, boolean>;

const CusCommonConfirmDialog: ConfirmDialog<OrdConfirmProps, boolean> = ({
  show,
  proceed,
  title = 'Xác nhận',
  content,
  contentCustom,
  okLabel = 'Xác nhận',
  cancelLabel = 'Huỷ',
  icon = <ExclamationCircleOutlined className="text-2xl text-destructive" />,
  closable = false,
  wrapClassName,
  onOk,
  onCancel,
}: Props) => {
  const handleOk = async () => {
    try {
      await onOk?.();
    } finally {
      proceed(true);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    proceed(false);
  };

  return (
    <Modal
      open={show}
      title={
        <Space>
          {icon}
          <span className="text-foreground">{title}</span>
        </Space>
      }
      closable={closable}
      maskClosable={false}
      wrapClassName={wrapClassName}
      onCancel={handleCancel}
      footer={
        <Space>
          <Button onClick={handleCancel}>{cancelLabel}</Button>
          <Button type="primary" onClick={handleOk}>
            {okLabel}
          </Button>
        </Space>
      }
    >
      {contentCustom ?? <div className="text-foreground">{content}</div>}
    </Modal>
  );
};

const CusCommonConfirm = confirmable<OrdConfirmProps, boolean>(CusCommonConfirmDialog);

export default CusCommonConfirm;
