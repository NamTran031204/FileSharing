import {useState} from 'react';
import {Form, Input, Modal} from 'antd';
import {useTranslation} from 'react-i18next';
import {UserControllerService} from '../../../api/api/UserControllerService';
import uiUtils from '../../../utils/uiUtils.tsx';

interface ChangePasswordModalProps {
  open: boolean;
  /** userId cua chinh minh; backend chi cho sua tai khoan cua minh */
  userId?: string;
  onClose: () => void;
}

/** Modal doi mat khau cho tai khoan phia quan tri (PUT /api/users/{userId} chi gui password). */
const ChangePasswordModal = ({open, userId, onClose}: ChangePasswordModalProps) => {
  const {t} = useTranslation('admin');
  const [form] = Form.useForm<{password: string; confirm: string}>();
  const [saving, setSaving] = useState(false);

  const handleOk = async () => {
    const values = await form.validateFields();
    if (!userId) return;
    setSaving(true);
    try {
      const res = await UserControllerService.users({userId, body: {password: values.password}});
      if (res?.isSuccessful === false) {
        uiUtils.showError(res.message || t('common.error'));
        return;
      }
      uiUtils.showSuccess(t('changePassword.ok'));
      form.resetFields();
      onClose();
    } catch (err) {
      uiUtils.showError((err as Error)?.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      open={open}
      title={t('changePassword.title')}
      okText={t('common.save')}
      cancelText={t('common.cancel')}
      confirmLoading={saving}
      onOk={handleOk}
      onCancel={handleCancel}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item name="password" label={t('changePassword.password')} rules={[{required: true}, {min: 8}]}>
          <Input.Password autoComplete="new-password"/>
        </Form.Item>
        <Form.Item
          name="confirm"
          label={t('changePassword.confirm')}
          dependencies={['password']}
          rules={[
            {required: true},
            ({getFieldValue}) => ({
              validator: (_, v) => (!v || getFieldValue('password') === v
                ? Promise.resolve()
                : Promise.reject(new Error(t('changePassword.mismatch')))),
            }),
          ]}
        >
          <Input.Password autoComplete="new-password"/>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ChangePasswordModal;
