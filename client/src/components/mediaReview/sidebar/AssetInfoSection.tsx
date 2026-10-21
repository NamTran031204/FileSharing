import type { AssetDetailResponseDto, ImageViewDataDto, MetadataEntity } from '../../../api/api/index.defs';
import {
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconDiff,
  IconDownload,
} from '../../imageReview/icons/ReviewIcons';
import i18n from '../../../i18n';

function formatBytes(bytes?: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export interface AssetInfoSectionProps {
  isVersionMetadataLoading: boolean;
  currentVersionMetadata: MetadataEntity | null;
  assetDetail: AssetDetailResponseDto | null;
  imageData: ImageViewDataDto | null;

  versions: MetadataEntity[];
  currentVersionNumber: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSelectVersion: (versionNumber: number) => void;

  reviewStatus: 'PENDING' | 'APPROVED' | 'REQUEST_CHANGES';
  isReviewLoading: boolean;
  onApprove: () => void;
  onRequestChanges: () => void;
  onCompare?: () => void;
  onDownload?: () => void;
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)]/30 py-2.5">
      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-foreground)]">
        {label}
      </span>
      <span className="min-w-0 truncate text-right text-xs font-black text-[var(--color-foreground)]">
        {children}
      </span>
    </div>
  );
}

export function AssetInfoSection({
  isVersionMetadataLoading,
  currentVersionMetadata,
  assetDetail,
  imageData,
  versions,
  currentVersionNumber,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  onSelectVersion,
  reviewStatus,
  isReviewLoading,
  onApprove,
  onRequestChanges,
  onCompare,
  onDownload,
}: AssetInfoSectionProps) {
  const loading = isVersionMetadataLoading;
  const sortedVersions = [...versions].sort((a, b) => (a.versionNumber ?? 0) - (b.versionNumber ?? 0));

  const fileName = currentVersionMetadata?.fileName ?? (assetDetail?.asset as { name?: string } | undefined)?.name ?? '—';
  const fileSize = formatBytes(currentVersionMetadata?.fileSize);
  const dimensions =
    currentVersionMetadata?.mediaInfo?.width && currentVersionMetadata?.mediaInfo?.height
      ? `${currentVersionMetadata.mediaInfo.width} × ${currentVersionMetadata.mediaInfo.height} px`
      : imageData?.dimensions?.width && imageData?.dimensions?.height
      ? `${imageData.dimensions.width} × ${imageData.dimensions.height} px`
      : '—';
  const uploaded = currentVersionMetadata?.creationTimestamp
    ? new Date(currentVersionMetadata.creationTimestamp).toLocaleDateString()
    : '—';
  const uploader = currentVersionMetadata?.ownerEmail ?? '—';

  const statusClass =
    reviewStatus === 'APPROVED'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
      : reviewStatus === 'REQUEST_CHANGES'
      ? 'bg-rose-100 text-rose-800 border-rose-200'
      : 'bg-amber-100 text-amber-800 border-amber-200';

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4" style={{ scrollbarWidth: 'thin' }}>
      <h2 className="mb-1 truncate text-sm font-black text-[var(--color-foreground)]" title={fileName}>
        {loading ? '...' : fileName}
      </h2>

      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)]/30 py-2.5">
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-foreground)]">
          {i18n.t('review:assetInfoSection.version')}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onPrev}
            disabled={!canGoPrev}
            className="rounded p-1 text-[var(--color-foreground)] transition-all hover:bg-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-40"
            title={i18n.t('review:assetInfoSection.previousVersion')}
          >
            <IconChevronLeft />
          </button>
          <div className="group relative">
            <button className="flex cursor-pointer items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1 text-xs font-bold text-[var(--color-foreground)]">
              <IconClock />
              <span>v{currentVersionNumber}</span>
              <IconChevronDown />
            </button>
            <div className="absolute right-0 top-full z-30 mt-1 hidden w-40 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] py-1 shadow-xl group-hover:block">
              {sortedVersions.slice().reverse().map(v => (
                <button
                  key={v.versionNumber}
                  onClick={() => onSelectVersion(v.versionNumber!)}
                  className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-xs font-bold hover:bg-[var(--color-background)] ${
                    v.versionNumber === currentVersionNumber ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted-foreground)]'
                  }`}
                >
                  <span>v{v.versionNumber}{v.versionNumber === currentVersionNumber ? ' (Current)' : ''}</span>
                  {v.versionNumber === currentVersionNumber && <IconCheck />}
                </button>
              ))}
              {sortedVersions.length === 0 && (
                <div className="px-3 py-1.5 text-xs text-[var(--color-muted-foreground)]">{i18n.t('review:assetInfoSection.loading')}</div>
              )}
            </div>
          </div>
          <button
            onClick={onNext}
            disabled={!canGoNext}
            className="rounded p-1 text-[var(--color-foreground)] transition-all hover:bg-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-40"
            title={i18n.t('review:assetInfoSection.nextVersion')}
          >
            <IconChevronRight />
          </button>
        </div>
      </div>

      <InfoRow label={i18n.t('review:assetInfoSection.fileSize')}>{loading ? '...' : fileSize}</InfoRow>
      <InfoRow label={i18n.t('review:assetInfoSection.dimensions')}>{loading ? '...' : dimensions}</InfoRow>
      <InfoRow label={i18n.t('review:assetInfoSection.uploaded')}>{loading ? '...' : uploaded}</InfoRow>
      <InfoRow label={i18n.t('review:assetInfoSection.uploader')}>{loading ? '...' : uploader}</InfoRow>
      <InfoRow label={i18n.t('review:assetInfoSection.status')}>
        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${statusClass}`}>
          {reviewStatus.replace('_', ' ')}
        </span>
      </InfoRow>

      <div className="mt-4 flex flex-col gap-2">
        <button
          onClick={onApprove}
          disabled={isReviewLoading}
          className="cursor-pointer rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-60"
        >
          {i18n.t('review:assetInfoSection.approve')}
        </button>
        <button
          onClick={onRequestChanges}
          disabled={isReviewLoading}
          className="cursor-pointer rounded-lg border border-rose-300 py-2 text-xs font-bold text-rose-700 transition-all hover:bg-rose-50 disabled:opacity-60"
        >
          {i18n.t('review:assetInfoSection.requestChanges')}
        </button>
        <div className="mt-1 flex gap-2">
          <button
            onClick={onCompare}
            disabled={!onCompare}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] py-1.5 text-xs font-bold text-[var(--color-foreground)] transition-all hover:bg-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <IconDiff />
            <span>{i18n.t('review:assetInfoSection.compare')}</span>
          </button>
          <button
            onClick={onDownload}
            disabled={!onDownload}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] py-1.5 text-xs font-bold text-[var(--color-foreground)] transition-all hover:bg-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <IconDownload />
            <span>{i18n.t('review:assetInfoSection.download')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
