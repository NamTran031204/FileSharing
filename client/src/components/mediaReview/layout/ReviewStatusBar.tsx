import { IconCheck, IconDownload, IconMore } from '../../imageReview/icons/ReviewIcons';

interface ReviewStatusBarProps {
  reviewStatus: 'PENDING' | 'APPROVED' | 'REQUEST_CHANGES';
  isReviewLoading: boolean;
  onApprove: () => void;
  onRequestChanges: () => void;
}

export function ReviewStatusBar({
  reviewStatus,
  isReviewLoading,
  onApprove,
  onRequestChanges,
}: ReviewStatusBarProps) {
  const statusClass =
    reviewStatus === 'APPROVED'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
      : reviewStatus === 'REQUEST_CHANGES'
      ? 'bg-rose-100 text-rose-800 border-rose-200'
      : 'bg-amber-100 text-amber-800 border-amber-200';

  return (
    <div className="flex items-center gap-3">
      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest shadow-xs ${statusClass}`}>
        {reviewStatus.replace('_', ' ')}
      </span>

      <button
        onClick={onApprove}
        disabled={isReviewLoading}
        className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-60"
      >
        <span className="rounded-full bg-emerald-500 p-0.5"><IconCheck /></span>
        <span>Approve</span>
      </button>

      <button
        onClick={onRequestChanges}
        disabled={isReviewLoading}
        className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-rose-700 disabled:opacity-60"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        <span>Request Changes</span>
      </button>

      <div className="h-6 w-px bg-[hsl(244,30%,80%)]/20" />

      <button
        className="cursor-pointer rounded-lg p-2 text-[hsl(237,45%,30%)] transition-all hover:bg-[hsl(240,30%,46%)]/10"
        title="Download Source Asset"
      >
        <IconDownload />
      </button>
      <button className="cursor-pointer rounded-lg p-2 text-[hsl(237,45%,30%)] transition-all hover:bg-[hsl(240,30%,46%)]/10" title="More Actions">
        <IconMore />
      </button>
    </div>
  );
}
