import React, { useMemo, useState } from 'react';
import {
  Button,
  Checkbox,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Typography,
} from 'antd';
import { SearchOutlined, SettingOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import i18n from '../../i18n';

const { Text } = Typography;

export interface CreateProjectFormValues {
  projectName?: string;
  projectCode?: string;
  description?: string;
  startDate?: Dayjs;
  endDate?: Dayjs;
  category?: 'CAMPAIGN' | 'BRANDING' | 'PRODUCT' | 'OTHER';
  projectStatus?: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';
  clientName?: string;
  createDefaultFolders?: boolean;
}

interface CreateProjectModalProps {
  open: boolean;
  confirmLoading?: boolean;
  onCancel: () => void;
  onCreate: (values: CreateProjectFormValues) => void;
}

const getCategoryOptions = () =>
  (['CAMPAIGN', 'BRANDING', 'PRODUCT', 'OTHER'] as const).map((value) => ({ value, label: i18n.t(`project:category.${value}`) }));

const getStatusOptions = () =>
  (['ACTIVE', 'ARCHIVED', 'COMPLETED'] as const).map((value) => ({ value, label: i18n.t(`project:status.${value}`) }));

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  open,
  confirmLoading = false,
  onCancel,
  onCreate,
}) => {
  const [form] = Form.useForm<CreateProjectFormValues>();
  const [descriptionLength, setDescriptionLength] = useState(0);

  const initialValues = useMemo<CreateProjectFormValues>(
    () => ({
      category: 'CAMPAIGN',
      projectStatus: 'ACTIVE',
      createDefaultFolders: true,
    }),
    [],
  );

  const handleSubmit = async () => {
    const values = await form.validateFields();
    onCreate(values);
  };

  const disabledEndDate = (current: Dayjs) => {
    const startDate = form.getFieldValue('startDate');
    if (!startDate) return false;
    return current.isBefore(dayjs(startDate).startOf('day'));
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={<h2 className="text-2xl font-extrabold tracking-tighter text-on-surface">{i18n.t('project:createProjectModal.createProject')}</h2>}
      width={960}
      destroyOnHidden
      centered
      className="create-project-modal"
      styles={{
        root: {
          borderRadius: 12,
          padding: 0,
          overflow: 'hidden',
          maxHeight: '95vh',
        },
        header: {
          marginBottom: 0,
          padding: '24px 32px',
          borderBottom: '1px solid rgba(200, 197, 210, 0.3)',
        },
        body: {
          padding: '24px 32px',
          maxHeight: 'calc(95vh - 150px)',
          overflowY: 'auto',
        },
        footer: {
          marginTop: 0,
          padding: '16px 32px 24px',
          borderTop: '1px solid rgba(200, 197, 210, 0.3)',
        },
      }}
      footer={[
        <Button
          key="cancel"
          onClick={onCancel}
          className="font-bold! tracking-tight! text-primary!"
        >
          {i18n.t('project:createProjectModal.cancel')}
        </Button>,
        <Button
          key="create"
          type="primary"
          loading={confirmLoading}
          onClick={handleSubmit}
          className="font-bold! tracking-tight!"
        >
          {i18n.t('project:createProjectModal.createProject')}
        </Button>,
      ]}
    >
      <Form<CreateProjectFormValues>
        form={form}
        layout="vertical"
        initialValues={initialValues}
        requiredMark={false}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          <Form.Item
            name="projectName"
            label={<span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">{i18n.t('project:createProjectModal.projectName')} <span className="text-error">*</span></span>}
            rules={[
              { required: true, message: i18n.t('project:createProjectModal.projectNameIsRequired') },
              { min: 2, max: 100, message: i18n.t('project:createProjectModal.nameMustBeBetween2') },
            ]}
          >
            <Input
              placeholder={i18n.t('project:createProjectModal.eGWinterBrandRefresh')}
              maxLength={100}
              className="rounded-lg! py-3!"
            />
          </Form.Item>

          <Form.Item
            name="projectCode"
            label={<span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">{i18n.t('project:createProjectModal.projectCode')} <span className="text-error">*</span></span>}
            rules={[
              { required: true, message: i18n.t('project:createProjectModal.projectCodeIsRequired') },
              {
                pattern: /^[A-Za-z0-9_]+$/,
                message: i18n.t('project:createProjectModal.alphanumericAndUnderscoresOnly'),
              },
            ]}
            extra={<Text className="text-[10px]! italic! text-on-surface-variant!">{i18n.t('project:createProjectModal.alphanumericAndUnderscoresOnly')}</Text>}
          >
            <Input placeholder="WBR_2024" className="rounded-lg! py-3!" />
          </Form.Item>

          <Form.Item
            name="description"
            className="md:col-span-2"
            label={
              <div className="w-full flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">{i18n.t('project:createProjectModal.description')}</span>
                <span className="text-[10px] text-outline font-medium">{descriptionLength} / 500</span>
              </div>
            }
          >
            <Input.TextArea
              rows={3}
              maxLength={500}
              placeholder={i18n.t('project:createProjectModal.defineTheCreativeVisionFor')}
              className="rounded-lg!"
              onChange={(event) => setDescriptionLength(event.target.value.length)}
            />
          </Form.Item>
        </div>

        <div className="pt-2 mt-2 border-t border-outline-variant/20">
          <details className="group pt-6">
            <summary className="flex items-center justify-between cursor-pointer list-none select-none">
              <Space size={8} className="text-primary-container!">
                <SettingOutlined />
                <span className="font-bold text-[13px] tracking-tight">{i18n.t('project:createProjectModal.advancedOptions')}</span>
              </Space>
              <span className="text-primary-container transition-transform duration-300 group-open:rotate-180">⌄</span>
            </summary>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <Form.Item
                name="startDate"
                label={<span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">{i18n.t('project:createProjectModal.startDate')}</span>}
              >
                <DatePicker className="w-full rounded-lg! py-2!" format="YYYY-MM-DD" />
              </Form.Item>

              <Form.Item
                name="endDate"
                label={<span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">{i18n.t('project:createProjectModal.endDate')}</span>}
              >
                <DatePicker
                  className="w-full rounded-lg! py-2!"
                  format="YYYY-MM-DD"
                  disabledDate={disabledEndDate}
                />
              </Form.Item>

              <Form.Item
                name="category"
                label={<span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">{i18n.t('project:createProjectModal.category')}</span>}
              >
                <Select options={getCategoryOptions()} className="w-full" />
              </Form.Item>

              <Form.Item
                name="projectStatus"
                label={<span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">{i18n.t('project:createProjectModal.projectStatus')}</span>}
              >
                <Select options={getStatusOptions()} className="w-full" />
              </Form.Item>

              <Form.Item
                name="clientName"
                className="md:col-span-2"
                label={<span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">{i18n.t('project:createProjectModal.clientName')}</span>}
              >
                <Input prefix={<SearchOutlined className="text-outline" />} placeholder={i18n.t('project:createProjectModal.searchForClient')} className="rounded-lg! py-3!" />
              </Form.Item>

              <Form.Item
                name="createDefaultFolders"
                valuePropName="checked"
                className="md:col-span-2 mb-0!"
              >
                <Checkbox>
                  <span className="text-sm font-medium text-on-surface">
                    {i18n.t('project:createProjectModal.createDefaultFolderStructureAssets')}
                  </span>
                </Checkbox>
              </Form.Item>
            </div>
          </details>
        </div>
      </Form>
    </Modal>
  );
};

export default CreateProjectModal;
