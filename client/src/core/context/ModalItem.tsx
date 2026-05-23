import { Button, Form, Modal, Space } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { ModalConfig } from './ModalContext';

interface ModalInternal extends ModalConfig {
  key: string;
  resolve?: (v: unknown) => void;
  reject?: (e?: unknown) => void;
}

interface ModalItemProps {
  modal: ModalInternal;
  index: number;
  closeModal: (key: string) => void;
}

const ModalItem = ({ modal, index, closeModal }: ModalItemProps) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const close = () => closeModal(modal.key);

  const handleOk = async () => {
    let values: unknown;
    try {
      if (!modal.hiddenForm) {
        values = await form.validateFields();
      }
      setLoading(true);
      modal.resolve?.(values);

      const response = modal.onOk?.(values, close);
      if (response instanceof Promise) {
        const result = await response;
        if (result !== false) close();
      } else if (response !== false) {
        close();
      }
    } catch (ex) {
      console.error(ex);
    } finally {
      setLoading(false);
      modal.onCallBackWhenOk?.(form, values);
    }
  };

  const handleCancel = () => {
    modal.reject?.();
    modal.onCancel?.(close);
    close();
    modal.onCallBackWhenClose?.(form);
  };

  return (
    <Modal
      open={modal.open}
      title={modal.title}
      className={modal.className}
      wrapClassName={
        modal.hiddenFooter === true
          ? `modal-hidden-footer ${modal.wrapClassName ?? ''}`
          : modal.wrapClassName
      }
      width={modal.width ?? 576}
      zIndex={1000 + index * 10}
      onCancel={handleCancel}
      closable={modal.closable ?? false}
      keyboard={false}
      maskClosable={modal.maskClosable ?? false}
      afterOpenChange={(open) => {
        if (!open) closeModal(modal.key);
      }}
      footer={
        modal.hiddenFooter === true ? false : (
          <div className="flex items-center justify-between w-full">
            <div
              className="me-4 cursor-pointer text-muted-foreground transition-colors hover:text-primary"
              onClick={handleCancel}
            >
              {modal.showCancel !== false && (
                <Space.Compact>
                  <Space>
                    <CloseOutlined className="me-2" />
                  </Space>
                  {modal.cancelText ?? 'Huỷ'}
                </Space.Compact>
              )}
            </div>
            {modal.showOk !== false && (
              <Button type="primary" loading={loading} onClick={handleOk}>
                <Space.Compact className="flex items-center text-base">
                  {modal.okText ?? 'Lưu'}
                </Space.Compact>
              </Button>
            )}
          </div>
        )
      }
    >
      {!modal.hiddenForm ? (
        <Form colon={false} form={form} layout={modal.formLayout ?? 'vertical'}>
          {modal.content(form, handleOk, handleCancel)}
        </Form>
      ) : (
        modal.content(form, handleOk, handleCancel)
      )}
    </Modal>
  );
};

export default ModalItem;
