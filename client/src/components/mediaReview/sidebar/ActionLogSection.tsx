import { IconChevronDown } from '../../imageReview/icons/ReviewIcons';
import { mockActionLog } from '../../imageReview/mockData';

interface ActionLogSectionProps {
  isExpanded: boolean;
  onToggleSection: () => void;
}

export function ActionLogSection({ isExpanded, onToggleSection }: ActionLogSectionProps) {
  return (
    <section className="flex max-h-[220px] flex-col overflow-hidden border-b border-[hsl(244,30%,80%)]/20 p-5">
      <div
        className="mb-2 flex cursor-pointer select-none items-center justify-between"
        onClick={onToggleSection}
      >
        <h3 className="text-xs font-black uppercase tracking-wider text-[hsl(237,45%,30%)]">Action Log</h3>
        <span className={`text-[hsl(244,30%,80%)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          <IconChevronDown />
        </span>
      </div>
      {isExpanded && (
        <div className="mt-2 flex-1 space-y-2 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
          {mockActionLog.map(log => (
            <div key={log.id} className="flex gap-2 rounded-lg border border-[hsl(244,30%,80%)]/20 bg-[hsl(240,10%,96%)] p-2 text-[11px]">
              <span className="text-xs">{log.icon}</span>
              <div className="flex-1">
                <p className="font-bold text-[hsl(237,45%,30%)]">{log.action}</p>
                {log.details && <p className="text-[10px] text-[hsl(244,10%,40%)]/85">{log.details}</p>}
              </div>
              <span className="whitespace-nowrap text-[9px] text-[hsl(244,10%,40%)]/60">{log.time}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
