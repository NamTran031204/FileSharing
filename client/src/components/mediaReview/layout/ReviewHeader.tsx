import type { MetadataEntity } from '../../../api/api/index.defs';
import { VersionNavigator } from './VersionNavigator';
import { ReviewStatusBar } from './ReviewStatusBar';

interface ReviewHeaderProps {
  versions: MetadataEntity[];
  currentVersionNumber: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSelectVersion: (versionNumber: number) => void;
  onCompare: () => void;
  reviewStatus: 'PENDING' | 'APPROVED' | 'REQUEST_CHANGES';
  isReviewLoading: boolean;
  onApprove: () => void;
  onRequestChanges: () => void;
}

export function ReviewHeader({
  versions,
  currentVersionNumber,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  onSelectVersion,
  onCompare,
  reviewStatus,
  isReviewLoading,
  onApprove,
  onRequestChanges,
}: ReviewHeaderProps) {
  return (
    <div className="z-10 flex h-14 shrink-0 items-center justify-between border-b border-[hsl(244,30%,80%)]/20 bg-white px-6">
      <VersionNavigator
        versions={versions}
        currentVersionNumber={currentVersionNumber}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        onPrev={onPrev}
        onNext={onNext}
        onSelectVersion={onSelectVersion}
        onCompare={onCompare}
      />
      <ReviewStatusBar
        reviewStatus={reviewStatus}
        isReviewLoading={isReviewLoading}
        onApprove={onApprove}
        onRequestChanges={onRequestChanges}
      />
    </div>
  );
}
