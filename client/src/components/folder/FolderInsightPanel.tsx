import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Divider, Progress } from 'antd';
import { ProcessingStatus } from '../../api/api/index.defs';
import { ApiPendingNote } from '../core/common/ApiPendingNote';

export interface InsightSummaryItem {
    label: string;
    value: string | number;
}

export interface InsightProcessingItem {
    key: string;
    name: string;
    status: ProcessingStatus;
}

interface FolderInsightPanelProps {
    /** 4 ô thống kê của folder đang mở */
    summaryItems: InsightSummaryItem[];
    /** Asset đang PENDING/PROCESSING của folder đang mở */
    processingItems: InsightProcessingItem[];
    collapsed: boolean;
    onToggle: () => void;
}

/**
 * Rail phải của màn folder/asset — hiển thị số liệu tóm tắt và hàng đợi xử lý.
 *
 * Chỉ hiện từ breakpoint xl trở lên (dưới đó ẩn hoàn toàn để nhường chỗ cho nội dung chính).
 * Gập lại thì thu về thanh dọc 48px còn đúng nút mở.
 *
 * Members + Recent activity: xem ApiPendingNote trong JSX — cần ProjectControllerService.members
 * va ProjectControllerService.auditLog khi API duoc noi.
 */
const FolderInsightPanel = ({ summaryItems, processingItems, collapsed, onToggle }: FolderInsightPanelProps) => {
    if (collapsed) {
        return (
            <div className="hidden w-12 shrink-0 flex-col items-center border-l border-border bg-card py-4 xl:flex">
                <button
                    type="button"
                    onClick={onToggle}
                    title="Expand folder summary"
                    aria-label="Expand folder summary"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-background hover:text-primary"
                >
                    <MenuUnfoldOutlined className="text-base" />
                </button>
                <span className="mt-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground [writing-mode:vertical-rl]">
                    Folder summary
                </span>
            </div>
        );
    }

    return (
        <aside className="hidden w-[320px] shrink-0 overflow-y-auto border-l border-border bg-card px-5 py-6 xl:block">
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Folder summary
                </span>
                <button
                    type="button"
                    onClick={onToggle}
                    title="Collapse folder summary"
                    aria-label="Collapse folder summary"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-background hover:text-primary"
                >
                    <MenuFoldOutlined className="text-base" />
                </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
                {summaryItems.map((item) => (
                    <div key={item.label} className="rounded-xl bg-background px-3 py-2">
                        <p className="text-[11px] text-muted-foreground">{item.label}</p>
                        <p className="text-base font-semibold text-foreground">{item.value}</p>
                    </div>
                ))}
            </div>

            <Divider className="my-5" />

            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Processing queue
            </span>
            <div className="mt-3 flex flex-col gap-3">
                {processingItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Everything in this folder is ready.</p>
                ) : (
                    processingItems.map((item) => (
                        <div key={item.key} className="rounded-xl bg-background px-3 py-2">
                            <p className="truncate text-xs font-semibold text-foreground">{item.name}</p>
                            {/* ponytail: backend chưa trả % tiến độ — PENDING hiện 0%, PROCESSING hiện thanh active 50%.
                                Thay bằng % thật khi response xử lý có trường progress. */}
                            <Progress
                                percent={item.status === ProcessingStatus.PENDING ? 0 : 50}
                                size="small"
                                status={item.status === ProcessingStatus.PENDING ? 'normal' : 'active'}
                                strokeColor="var(--color-primary)"
                            />
                        </div>
                    ))
                )}
            </div>

            <Divider className="my-5" />

            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Members
            </span>
            <div className="mt-3">
                <ApiPendingNote label="Members" hint="Danh sách thành viên có quyền trên project này" />
            </div>

            <Divider className="my-5" />

            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Recent activity
            </span>
            <div className="mt-3">
                <ApiPendingNote label="Recent activity" hint="Nhật ký hành động gần đây trên folder này" />
            </div>
        </aside>
    );
};

export default FolderInsightPanel;
