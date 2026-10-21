import { useEffect, useState } from 'react';
import { Button, Input, Modal, Select } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { ShareTokenTime } from '../../api/api/index.defs';
import { ProofControllerService } from '../../api/api/ProofControllerService';
import uiUtils from '../../utils/uiUtils.tsx';

interface Props {
    open: boolean;
    folderId: string;
    initialToken?: string;
    initialExpiry?: string | Date;
    onClose: () => void;
}

const RANGE_OPTIONS = [
    { value: ShareTokenTime.UNLIMITED, label: 'Không giới hạn' },
    { value: ShareTokenTime.ONE_DAY, label: '1 ngày' },
    { value: ShareTokenTime.ONE_WEEK, label: '1 tuần' },
    { value: ShareTokenTime.ONE_MONTH, label: '1 tháng' },
    { value: ShareTokenTime.ONE_YEAR, label: '1 năm' },
];

// Lay thong bao loi tu envelope server (axios reject voi response.data)
const errorMessage = (e: unknown): string => {
    const data = (e as { response?: { data?: { message?: string } } })?.response?.data;
    return data?.message ?? 'Có lỗi xảy ra, hãy thử lại';
};

const ProofLinkModal = ({ open, folderId, initialToken, initialExpiry, onClose }: Props) => {
    const [token, setToken] = useState<string | undefined>(initialToken);
    const [expiry, setExpiry] = useState<string | Date | undefined>(initialExpiry);
    const [range, setRange] = useState<ShareTokenTime>(ShareTokenTime.UNLIMITED);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (open) {
            setToken(initialToken);
            setExpiry(initialExpiry);
            setRange(ShareTokenTime.UNLIMITED);
        }
    }, [open, initialToken, initialExpiry]);

    const link = token ? `${window.location.origin}/proof/${token}` : '';

    const handleCreate = async () => {
        setBusy(true);
        try {
            const res = await ProofControllerService.proofLink({ folderId, body: { rangeTime: range } });
            setToken(res.data?.shareToken);
            setExpiry(res.data?.shareExpiry);
            uiUtils.showSuccess(token ? 'Đã làm mới link' : 'Đã tạo link');
        } catch (e) {
            uiUtils.showError(errorMessage(e));
        } finally {
            setBusy(false);
        }
    };

    const handleRevoke = async () => {
        const ok = await uiUtils.showConfirm({
            title: 'Thu hồi link',
            content: 'Link cũ sẽ ngừng hoạt động ngay. Lượt chọn khách đã gửi vẫn được giữ.',
            okLabel: 'Thu hồi',
            onOk: async () => {
                await ProofControllerService.proofLink1({ folderId });
            },
        });
        if (ok) {
            setToken(undefined);
            setExpiry(undefined);
            uiUtils.showSuccess('Đã thu hồi link');
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(link);
            uiUtils.showSuccess('Đã sao chép link');
        } catch {
            uiUtils.showError('Trình duyệt chặn clipboard, hãy sao chép thủ công');
        }
    };

    return (
        <Modal open={open} title="Gửi khách chọn ảnh" footer={null} onCancel={onClose} destroyOnHidden>
            <p className="mb-3 text-muted-foreground">
                Khách mở link, nhập tên và chọn ảnh yêu thích. Folder phải ở chế độ PUBLIC.
            </p>

            <div className="mb-3 flex items-center gap-2">
                <Select value={range} onChange={setRange} options={RANGE_OPTIONS} className="w-44" aria-label="Thời hạn link" />
                <Button type="primary" loading={busy} onClick={() => void handleCreate()}>
                    {token ? 'Làm mới link' : 'Tạo link'}
                </Button>
            </div>

            {token && (
                <>
                    <div className="flex items-center gap-2">
                        <Input readOnly value={link} aria-label="Link chọn ảnh" />
                        <Button icon={<CopyOutlined />} onClick={() => void handleCopy()}>Copy</Button>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {expiry ? `Hết hạn: ${new Date(expiry).toLocaleString('vi-VN')}` : 'Không giới hạn thời gian'}
                    </p>
                    <Button danger className="mt-3" onClick={() => void handleRevoke()}>Thu hồi link</Button>
                </>
            )}
        </Modal>
    );
};

export default ProofLinkModal;
