import { useState } from 'react';
import { Input, Modal } from 'antd';

interface Props {
    open: boolean;
    count: number;
    submitting: boolean;
    error: string | null;
    onSubmit: (note: string) => void;
    onCancel: () => void;
}

const ProofSubmitModal = ({ open, count, submitting, error, onSubmit, onCancel }: Props) => {
    const [note, setNote] = useState('');

    return (
        <Modal
            open={open}
            title="Gửi lựa chọn"
            okText="Gửi"
            cancelText="Quay lại"
            confirmLoading={submitting}
            onOk={() => onSubmit(note)}
            onCancel={onCancel}
            destroyOnHidden
        >
            <p className="mb-2">Bạn đã chọn <b>{count}</b> ảnh.</p>
            <p className="mb-3 text-muted-foreground">Sau khi gửi bạn sẽ không thể chỉnh sửa lựa chọn.</p>
            <Input.TextArea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={1000}
                showCount
                rows={3}
                placeholder="Lời nhắn cho nhiếp ảnh gia (không bắt buộc)"
            />
            {error && <p className="mt-3 text-destructive">{error}</p>}
        </Modal>
    );
};

export default ProofSubmitModal;
