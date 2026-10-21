import { useState } from 'react';
import { Input, Modal } from 'antd';
import i18n from '../../i18n';

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
            title={i18n.t('proof:proofSubmitModal.guiLuaChon')}
            okText={i18n.t('proof:proofSubmitModal.gui')}
            cancelText={i18n.t('proof:proofSubmitModal.quayLai')}
            confirmLoading={submitting}
            onOk={() => onSubmit(note)}
            onCancel={onCancel}
            destroyOnHidden
        >
            <p className="mb-2">{i18n.t('proof:proofSubmitModal.banDaChon')} <b>{count}</b> {i18n.t('proof:proofSubmitModal.anh')}</p>
            <p className="mb-3 text-muted-foreground">{i18n.t('proof:proofSubmitModal.sauKhiGuiBanSe')}</p>
            <Input.TextArea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={1000}
                showCount
                rows={3}
                placeholder={i18n.t('proof:proofSubmitModal.loiNhanChoNhiepAnh')}
            />
            {error && <p className="mt-3 text-destructive">{error}</p>}
        </Modal>
    );
};

export default ProofSubmitModal;
