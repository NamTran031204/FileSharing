import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Drawer, Empty, Spin, Tag } from 'antd';
import { ArrowLeftOutlined, CopyOutlined } from '@ant-design/icons';
import type { ProofSelectionDetailDto, ProofSelectionSummaryDto } from '../../api/api/index.defs';
import { ProofControllerService } from '../../api/api/ProofControllerService';
import { toLightroomList } from '../../utils/lightroomCopy.util';
import uiUtils from '../../utils/uiUtils.tsx';

interface Props {
    open: boolean;
    folderId: string;
    onClose: () => void;
}

const formatTime = (value?: string | Date) => (value ? new Date(value).toLocaleString('vi-VN') : '—');

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
            uiUtils.showError('Không tải được danh sách lựa chọn');
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
            uiUtils.showError('Không tải được chi tiết lựa chọn');
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
            uiUtils.showError('Trình duyệt chặn clipboard');
        }
    };

    return (
        <Drawer open={open} onClose={onClose} width={480} title="Lựa chọn của khách" destroyOnHidden>
            <Spin spinning={loading}>
                {!detail && (
                    list.length === 0 && !loading ? (
                        <Empty description="Chưa có khách nào gửi lựa chọn" />
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
                                        <Tag>{s.count} ảnh</Tag>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )
                )}

                {detail && (
                    <div>
                        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => setDetail(null)}>Quay lại</Button>
                        <h3 className="mt-2 text-lg font-semibold text-foreground">{detail.guestName}</h3>
                        <p className="text-sm text-muted-foreground">{formatTime(detail.submittedAt)}</p>
                        {detail.note && (
                            <p className="my-3 whitespace-pre-wrap rounded-lg bg-background px-3 py-2 text-foreground">{detail.note}</p>
                        )}

                        <Button type="primary" icon={<CopyOutlined />} onClick={() => void handleCopy()} className="my-3">
                            Copy cho Lightroom
                        </Button>
                        {copiedCount !== null && <span className="ml-2 text-foreground">Đã copy {copiedCount} tên</span>}
                        {lightroom.hasSpaces && (
                            <Alert
                                type="warning"
                                showIcon
                                className="mb-3"
                                message="Có tên chứa dấu cách, hãy kiểm tra lại khi dán vào Lightroom."
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
                                    {!item.available && <Tag color="default">Không khả dụng</Tag>}
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
