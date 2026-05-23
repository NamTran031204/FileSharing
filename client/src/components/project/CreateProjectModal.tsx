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

const categoryOptions = [
  { value: 'CAMPAIGN', label: 'CAMPAIGN' },
  { value: 'BRANDING', label: 'BRANDING' },
  { value: 'PRODUCT', label: 'PRODUCT' },
  { value: 'OTHER', label: 'OTHER' },
] as const;

const statusOptions = [
  { value: 'ACTIVE', label: 'ACTIVE' },
  { value: 'ARCHIVED', label: 'ARCHIVED' },
  { value: 'COMPLETED', label: 'COMPLETED' },
] as const;

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
      title={<h2 className="text-2xl font-extrabold tracking-tighter text-on-surface">Create Project</h2>}
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
          Cancel
        </Button>,
        <Button
          key="create"
          type="primary"
          loading={confirmLoading}
          onClick={handleSubmit}
          className="font-bold! tracking-tight!"
        >
          Create Project
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
            label={<span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Project Name <span className="text-error">*</span></span>}
            rules={[
              { required: true, message: 'Project name is required' },
              { min: 2, max: 100, message: 'Name must be between 2 and 100 characters.' },
            ]}
          >
            <Input
              placeholder="e.g. Winter Brand Refresh"
              maxLength={100}
              className="rounded-lg! py-3!"
            />
          </Form.Item>

          <Form.Item
            name="projectCode"
            label={<span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Project Code <span className="text-error">*</span></span>}
            rules={[
              { required: true, message: 'Project code is required' },
              {
                pattern: /^[A-Za-z0-9_]+$/,
                message: 'Alphanumeric and underscores only.',
              },
            ]}
            extra={<Text className="text-[10px]! italic! text-on-surface-variant!">Alphanumeric and underscores only.</Text>}
          >
            <Input placeholder="WBR_2024" className="rounded-lg! py-3!" />
          </Form.Item>

          <Form.Item
            name="description"
            className="md:col-span-2"
            label={
              <div className="w-full flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Description</span>
                <span className="text-[10px] text-outline font-medium">{descriptionLength} / 500</span>
              </div>
            }
          >
            <Input.TextArea
              rows={3}
              maxLength={500}
              placeholder="Define the creative vision for this project..."
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
                <span className="font-bold text-[13px] tracking-tight">Advanced Options</span>
              </Space>
              <span className="text-primary-container transition-transform duration-300 group-open:rotate-180">⌄</span>
            </summary>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <Form.Item
                name="startDate"
                label={<span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Start Date</span>}
              >
                <DatePicker className="w-full rounded-lg! py-2!" format="YYYY-MM-DD" />
              </Form.Item>

              <Form.Item
                name="endDate"
                label={<span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">End Date</span>}
              >
                <DatePicker
                  className="w-full rounded-lg! py-2!"
                  format="YYYY-MM-DD"
                  disabledDate={disabledEndDate}
                />
              </Form.Item>

              <Form.Item
                name="category"
                label={<span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Category</span>}
              >
                <Select options={categoryOptions as unknown as { value: string; label: string }[]} className="w-full" />
              </Form.Item>

              <Form.Item
                name="projectStatus"
                label={<span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Project Status</span>}
              >
                <Select options={statusOptions as unknown as { value: string; label: string }[]} className="w-full" />
              </Form.Item>

              <Form.Item
                name="clientName"
                className="md:col-span-2"
                label={<span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Client Name</span>}
              >
                <Input prefix={<SearchOutlined className="text-outline" />} placeholder="Search for client..." className="rounded-lg! py-3!" />
              </Form.Item>

              <Form.Item
                name="createDefaultFolders"
                valuePropName="checked"
                className="md:col-span-2 mb-0!"
              >
                <Checkbox>
                  <span className="text-sm font-medium text-on-surface">
                    Create default folder structure (Assets, Rough Cuts, Approved)
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
