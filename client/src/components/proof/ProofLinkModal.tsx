import { useEffect, useState } from 'react';
import { Button, Input, Modal, Select } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { ShareTokenTime } from '../../api/api/index.defs';
import { ProofControllerService } from '../../api/api/ProofControllerService';
import uiUtils from '../../utils/uiUtils.tsx';
import i18n from '../../i18n';
import {LangUtil} from '../../utils/lang.util';

interface Props {
    open: boolean;
    folderId: string;
    initialToken?: string;
    initialExpiry?: string | Date;
    onClose: () => void;
}

const getRangeOptions = () => [
    { value: ShareTokenTime.UNLIMITED, label: i18n.t('proof:proofLinkModal.khongGioiHan') },
    { value: ShareTokenTime.ONE_DAY, label: i18n.t('proof:proofLinkModal.1Ngay') },
    { value: ShareTokenTime.ONE_WEEK, label: i18n.t('proof:proofLinkModal.1Tuan') },
    { value: ShareTokenTime.ONE_MONTH, label: i18n.t('proof:proofLinkModal.1Thang') },
    { value: ShareTokenTime.ONE_YEAR, label: i18n.t('proof:proofLinkModal.1Nam') },
];

// Lay thong bao loi tu envelope server (axios reject voi response.data)
const errorMessage = (e: unknown): string => {
    const data = (e as { response?: { data?: { message?: string } } })?.response?.data;
    return data?.message ?? i18n.t('proof:proofLinkModal.coLoiXayRaHay');
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
            uiUtils.showSuccess(token ? i18n.t('proof:proofLinkModal.daLamMoiLink') : i18n.t('proof:proofLinkModal.daTaoLink'));
        } catch (e) {
            uiUtils.showError(errorMessage(e));
        } finally {
            setBusy(false);
        }
    };

    const handleRevoke = async () => {
        const ok = await uiUtils.showConfirm({
            title: i18n.t('proof:proofLinkModal.thuHoiLink'),
            content: i18n.t('proof:proofLinkModal.linkCuSeNgungHoat'),
            okLabel: i18n.t('proof:proofLinkModal.thuHoi'),
            onOk: async () => {
                await ProofControllerService.proofLink1({ folderId });
            },
        });
        if (ok) {
            setToken(undefined);
            setExpiry(undefined);
            uiUtils.showSuccess(i18n.t('proof:proofLinkModal.daThuHoiLink'));
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(link);
            uiUtils.showSuccess(i18n.t('proof:proofLinkModal.daSaoChepLink'));
        } catch {
            uiUtils.showError(i18n.t('proof:proofLinkModal.trinhDuyetChanClipboardHay'));
        }
    };

    return (
        <Modal open={open} title={i18n.t('proof:proofLinkModal.guiKhachChonAnh')} footer={null} onCancel={onClose} destroyOnHidden>
            <p className="mb-3 text-muted-foreground">
                {i18n.t('proof:proofLinkModal.khachMoLinkNhapTen')}
            </p>

            <div className="mb-3 flex items-center gap-2">
                <Select value={range} onChange={setRange} options={getRangeOptions()} className="w-44" aria-label={i18n.t('proof:proofLinkModal.thoiHanLink')} />
                <Button type="primary" loading={busy} onClick={() => void handleCreate()}>
                    {token ? i18n.t('proof:proofLinkModal.lamMoiLink') : i18n.t('proof:proofLinkModal.taoLink')}
                </Button>
            </div>

            {token && (
                <>
                    <div className="flex items-center gap-2">
                        <Input readOnly value={link} aria-label={i18n.t('proof:proofLinkModal.linkChonAnh')} />
                        <Button icon={<CopyOutlined />} onClick={() => void handleCopy()}>{i18n.t('proof:proofLinkModal.copy')}</Button>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {expiry ? i18n.t('proof:proofLinkModal.hetHan', {VN: new Date(expiry).toLocaleString(LangUtil.getDateLocale())}) : i18n.t('proof:proofLinkModal.khongGioiHanThoiGian')}
                    </p>
                    <Button danger className="mt-3" onClick={() => void handleRevoke()}>{i18n.t('proof:proofLinkModal.thuHoiLink')}</Button>
                </>
            )}
        </Modal>
    );
};

export default ProofLinkModal;
