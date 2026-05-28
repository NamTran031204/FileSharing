import {
  FileImageOutlined,
  FilePdfOutlined,
  PlayCircleFilled,
  VideoCameraOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { MouseEvent } from 'react';
import ActionDropdown, { type ActionDropdownItem } from '../core/common/ActionDropdown.tsx';

export type AssetType = 'image' | 'video' | 'doc' | 'svg';

interface AssetCardProps<TRecord = unknown> {
  name: string;
  sizeLabel: string;
  versionLabel: string;
  type: AssetType;
  thumbnailUrl?: string;
  durationLabel?: string;
  processingStatus?: string;
  onClick?: () => void;
  actions?: ActionDropdownItem<TRecord>[];
  record?: TRecord;
  canAccess?: (permission?: string) => boolean;
}

const AssetCard = <TRecord,>({
  name,
  sizeLabel,
  versionLabel,
  type,
  thumbnailUrl,
  durationLabel,
  processingStatus,
  onClick,
  actions,
  record,
  canAccess,
}: AssetCardProps<TRecord>) => {
  const isVideo = type === 'video';
  const isDocument = type === 'doc';
  const isImage = type === 'image' || type === 'svg';
  const showThumbnail = Boolean(thumbnailUrl) && isImage;
  const isProcessing = processingStatus === 'PROCESSING';
  const isFailed = processingStatus === 'FAILED';
  const cardActions: ActionDropdownItem<TRecord>[] = actions ?? [];
  const hasActions = cardActions.length > 0;

  const typeLabel = (() => {
    if (isVideo) return durationLabel || 'VID';
    if (type === 'svg') return 'SVG';
    return isDocument ? 'DOC' : 'IMG';
  })();

  const PreviewIcon = isDocument ? FilePdfOutlined : isVideo ? VideoCameraOutlined : FileImageOutlined;

  const stopPropagation = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const renderPreview = () => {
    if (showThumbnail) {
      return (
        <img
          src={thumbnailUrl}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      );
    }
    if (isProcessing) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2">
          <div className="h-16 w-16 animate-pulse rounded-2xl bg-muted" />
          <span className="text-[11px] font-medium text-muted-foreground">Đang xử lý...</span>
        </div>
      );
    }
    if (isFailed) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-destructive/10 shadow-lg">
            <WarningOutlined className="text-3xl text-destructive" />
          </div>
          <span className="text-[11px] font-medium text-destructive">Xử lý thất bại</span>
        </div>
      );
    }
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-background shadow-lg shadow-primary-dark/10">
          <PreviewIcon className="text-3xl text-secondary" />
        </div>
      </div>
    );
  };

  return (
    <div
      className="group relative flex h-[280px] flex-col overflow-hidden rounded-2xl border border-border/40 bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
      onClick={onClick}
    >
      {hasActions && (
        <div
          className="absolute right-3 top-3 z-10 opacity-0 transition group-hover:opacity-100"
          onClick={stopPropagation}
        >
          <ActionDropdown<TRecord>
            actions={cardActions}
            record={record}
            canAccess={canAccess}
          />
        </div>
      )}

      <div className="relative h-48 w-full overflow-hidden bg-muted/40">
        {renderPreview()}

        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition duration-300 group-hover:opacity-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background/80 text-primary shadow-lg">
              <PlayCircleFilled className="text-2xl" />
            </div>
          </div>
        )}

        <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-foreground/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          {isVideo && <VideoCameraOutlined className="text-[11px]" />}
          <span>{typeLabel}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-4">
        <h3 className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
          {name}
        </h3>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{sizeLabel}</span>
          <span className="rounded-full bg-accent/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
            {versionLabel}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AssetCard;
