import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Drawer, Empty, Spin, Tag } from 'antd';
import { ArrowLeftOutlined, CopyOutlined } from '@ant-design/icons';
import type { ProofSelectionDetailDto, ProofSelectionSummaryDto } from '../../api/api/index.defs';
import { ProofControllerService } from '../../api/api/ProofControllerService';
import { toLightroomList } from '../../utils/lightroomCopy.util';
import uiUtils from '../../utils/uiUtils.tsx';
import i18n from '../../i18n';
import {LangUtil} from '../../utils/lang.util';

interface Props {
    open: boolean;
    folderId: string;
    onClose: () => void;
}

const formatTime = (value?: string | Date) => (value ? new Date(value).toLocaleString(LangUtil.getDateLocale()) : '—');

const ProofSelectionsDrawer = ({ open, folderId, onClose }: Props) => {
    const [list, setList] = useState<ProofSelectionSummaryDto[]>([]);
    const [detail, setDetail] = useState<ProofSelectionDetailDto | null>(null);
    const [loading, setLoading] = useState(false);
    const [copiedCount, setCopiedCount] = useState<number | null>(null);

    const loadList = useCallback(async () => {
        setLoading(true);
        try {
            const res = await ProofControllerService.proofSelections({ folderId });
            setList(res.data ?? []);
        } catch {
            uiUtils.showError(i18n.t('proof:proofSelectionsDrawer.khongTaiDuocDanhSach'));
        } finally {
            setLoading(false);
        }
    }, [folderId]);

    useEffect(() => {
        if (open) {
            setDetail(null);
            setCopiedCount(null);
            void loadList();
        }
    }, [open, loadList]);

    const openDetail = async (selectionId?: string) => {
        if (!selectionId) return;
        setLoading(true);
        setCopiedCount(null);
        try {
            const res = await ProofControllerService.proofSelection({ selectionId });
            setDetail(res.data ?? null);
        } catch {
            uiUtils.showError(i18n.t('proof:proofSelectionsDrawer.khongTaiDuocChiTiet'));
        } finally {
            setLoading(false);
        }
    };

    const lightroom = useMemo(
        () => toLightroomList((detail?.items ?? []).map((i) => i.assetName ?? '')),
        [detail],
    );

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(lightroom.text);
            setCopiedCount(lightroom.count);
        } catch {
            uiUtils.showError(i18n.t('proof:proofSelectionsDrawer.trinhDuyetChanClipboard'));
        }
    };

    return (
        <Drawer open={open} onClose={onClose} width={480} title={i18n.t('proof:proofSelectionsDrawer.luaChonCuaKhach')} destroyOnHidden>
            <Spin spinning={loading}>
                {!detail && (
                    list.length === 0 && !loading ? (
                        <Empty description={i18n.t('proof:proofSelectionsDrawer.chuaCoKhachNaoGui')} />
                    ) : (
                        <ul className="m-0 list-none p-0">
                            {list.map((s) => (
                                <li key={s.selectionId}>
                                    <button
                                        type="button"
                                        className="mb-2 flex w-full items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-left"
                                        onClick={() => void openDetail(s.selectionId)}
                                    >
                                        <span>
                                            <span className="block font-semibold text-foreground">{s.guestName}</span>
                                            <span className="text-sm text-muted-foreground">{formatTime(s.submittedAt)}</span>
                                        </span>
                                        <Tag>{s.count} {i18n.t('proof:proofSelectionsDrawer.anh')}</Tag>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )
                )}

                {detail && (
                    <div>
                        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => setDetail(null)}>{i18n.t('proof:proofSelectionsDrawer.quayLai')}</Button>
                        <h3 className="mt-2 text-lg font-semibold text-foreground">{detail.guestName}</h3>
                        <p className="text-sm text-muted-foreground">{formatTime(detail.submittedAt)}</p>
                        {detail.note && (
                            <p className="my-3 whitespace-pre-wrap rounded-lg bg-background px-3 py-2 text-foreground">{detail.note}</p>
                        )}

                        <Button type="primary" icon={<CopyOutlined />} onClick={() => void handleCopy()} className="my-3">
                            {i18n.t('proof:proofSelectionsDrawer.copyChoLightroom')}
                        </Button>
                        {copiedCount !== null && <span className="ml-2 text-foreground">{i18n.t('proof:proofSelectionsDrawer.daCopyTen', {copiedCount})}</span>}
                        {lightroom.hasSpaces && (
                            <Alert
                                type="warning"
                                showIcon
                                className="mb-3"
                                message={i18n.t('proof:proofSelectionsDrawer.coTenChuaDauCach')}
                            />
                        )}

                        <ul className="m-0 list-none p-0">
                            {(detail.items ?? []).map((item) => (
                                <li key={item.assetId} className="mb-2 flex items-center gap-3">
                                    {item.thumbnailUrl ? (
                                        <img src={item.thumbnailUrl} alt={item.assetName} className="h-12 w-12 rounded object-cover" />
                                    ) : (
                                        <div className="h-12 w-12 rounded bg-muted" />
                                    )}
                                    <span className="min-w-0 flex-1 truncate text-foreground">{item.assetName ?? item.assetId}</span>
                                    {!item.available && <Tag color="default">{i18n.t('proof:proofSelectionsDrawer.khongKhaDung')}</Tag>}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </Spin>
        </Drawer>
    );
};

export default ProofSelectionsDrawer;
