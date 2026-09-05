// TODO(api): Tab Activity đang dùng mockActionLog (components/imageReview/mockData.ts) — DỮ LIỆU GIẢ,
// chưa nối API. Cần endpoint lấy lịch sử hành động theo assetId + versionNumber.
// Tab này là phần mở rộng ngoài mockup (quyết định A.3-4).
import { mockActionLog } from '../../imageReview/mockData';

export function ActionLogSection() {
  return (
    <div className="flex h-full flex-col overflow-y-auto p-4" style={{ scrollbarWidth: 'thin' }}>
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
