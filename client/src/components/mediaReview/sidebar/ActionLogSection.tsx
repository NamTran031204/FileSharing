// Tab Activity dung mockActionLog (components/imageReview/mockData.ts) — DU LIEU MAU,
// chua noi API. Can endpoint lay lich su hanh dong theo assetId + versionNumber.
import { mockActionLog } from '../../imageReview/mockData';
import { ApiPendingNote } from '../../core/common/ApiPendingNote';

export function ActionLogSection() {
  return (
    <div className="flex h-full flex-col overflow-y-auto p-4" style={{ scrollbarWidth: 'thin' }}>
      <ApiPendingNote label="Activity log" hint="Đang hiển thị dữ liệu mẫu, chưa phải lịch sử thật" className="mb-3" />
      <div className="space-y-2">
        {mockActionLog.map(log => (
          <div key={log.id} className="flex gap-2 rounded-lg border border-[var(--color-border)]/20 bg-[var(--color-background)] p-2 text-[11px]">
            <span className="text-xs">{log.icon}</span>
            <div className="flex-1">
              <p className="font-bold text-[var(--color-foreground)]">{log.action}</p>
              {log.details && <p className="text-[10px] text-[var(--color-muted-foreground)]/85">{log.details}</p>}
            </div>
            <span className="whitespace-nowrap text-[9px] text-[var(--color-muted-foreground)]/60">{log.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
