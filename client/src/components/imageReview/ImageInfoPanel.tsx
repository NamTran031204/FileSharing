import type { ImageReviewItem } from './types';

interface ImageInfoPanelProps {
  image: ImageReviewItem;
}

interface InfoItemProps {
  label: string;
  value: React.ReactNode;
}

const InfoItem = ({ label, value }: InfoItemProps) => (
  <div className="flex flex-col gap-1">
    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="text-[13px] font-medium text-foreground">{value}</div>
  </div>
);

const ImageInfoPanel = ({ image }: ImageInfoPanelProps) => {
  return (
    <div className="flex flex-col gap-3">
      <InfoItem label="File Name" value={image.name} />
      <InfoItem label="Size" value={image.size} />
      <InfoItem label="Dimensions" value={image.dimensions} />
      <InfoItem label="Uploaded" value={image.uploadDate} />
      <InfoItem label="Uploader" value={image.uploader} />

      <div className="flex flex-col gap-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Version History
        </div>
        <div className="mt-1 flex flex-col gap-2">
          {image.versions.map((version, idx) => {
            const isCurrent = idx === 0;
            return (
              <div
                key={version.id}
                className={`rounded-md px-3 py-2 text-xs text-foreground ${
                  isCurrent ? 'border border-accent bg-background' : 'bg-background'
                }`}
              >
                {version.name} • {version.date}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ImageInfoPanel;
