import type { AssetDetailResponseDto, ImageViewDataDto, MetadataEntity } from '../../../api/api/index.defs';
import { IconChevronDown } from '../../imageReview/icons/ReviewIcons';

function formatBytes(bytes?: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

interface AssetInfoSectionProps {
  isExpanded: boolean;
  onToggleSection: () => void;
  isVersionMetadataLoading: boolean;
  currentVersionMetadata: MetadataEntity | null;
  assetDetail: AssetDetailResponseDto | null;
  imageData: ImageViewDataDto | null;
}

export function AssetInfoSection({
  isExpanded,
  onToggleSection,
  isVersionMetadataLoading,
  currentVersionMetadata,
  assetDetail,
  imageData,
}: AssetInfoSectionProps) {
  const loading = isVersionMetadataLoading;

  const fields = [
    {
      label: 'FILE NAME',
      value: loading
        ? '...'
        : (currentVersionMetadata?.fileName ?? (assetDetail?.asset as { name?: string } | undefined)?.name ?? '—'),
    },
    {
      label: 'SIZE',
      value: loading ? '...' : formatBytes(currentVersionMetadata?.fileSize),
    },
    {
      label: 'DIMENSIONS',
      value: loading
        ? '...'
        : (currentVersionMetadata?.mediaInfo?.width && currentVersionMetadata?.mediaInfo?.height
          ? `${currentVersionMetadata.mediaInfo.width} × ${currentVersionMetadata.mediaInfo.height} px`
          : (imageData?.dimensions?.width && imageData?.dimensions?.height
            ? `${imageData.dimensions.width} × ${imageData.dimensions.height} px`
            : '—')),
    },
    {
      label: 'UPLOADED',
      value: loading
        ? '...'
        : (currentVersionMetadata?.creationTimestamp
          ? new Date(currentVersionMetadata.creationTimestamp).toLocaleDateString()
          : '—'),
    },
    {
      label: 'UPLOADER',
      value: loading ? '...' : (currentVersionMetadata?.ownerEmail ?? '—'),
    },
  ];

  return (
    <section className="p-5">
      <div
        className="mb-3 flex cursor-pointer select-none items-center justify-between"
        onClick={onToggleSection}
      >
        <h3 className="text-xs font-black uppercase tracking-wider text-[hsl(237,45%,30%)]">Image Metadata</h3>
        <span className={`text-[hsl(244,30%,80%)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          <IconChevronDown />
        </span>
      </div>
      {isExpanded && (
        <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-3 text-xs">
          {fields.map(({ label, value }) => (
            <div key={label} className="min-w-0">
              <span className="block text-[9px] font-bold uppercase tracking-wider text-[hsl(244,10%,40%)]/70">{label}</span>
              <span className="block truncate font-black text-[hsl(237,45%,30%)]" title={value}>{value}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
