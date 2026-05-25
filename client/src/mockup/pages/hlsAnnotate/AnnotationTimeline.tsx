import type { VideoAnnotation } from './types';

interface Props {
  durationMs: number;
  currentMs: number;
  annotations: VideoAnnotation[];
  selectedId: string | null;
  onSeek: (ms: number) => void;
  onMarkerClick: (id: string) => void;
}

const AnnotationTimeline = ({
  durationMs,
  currentMs,
  annotations,
  selectedId,
  onSeek,
  onMarkerClick,
}: Props) => {
  const safeDuration = durationMs > 0 ? durationMs : 1;
  const playheadPct = Math.min(100, (currentMs / safeDuration) * 100);

  return (
    <div className="relative h-10 w-full overflow-hidden rounded bg-muted">
      <div
        className="absolute inset-y-0 left-0 bg-primary/30"
        style={{ width: `${playheadPct}%` }}
      />

      {annotations.map((a) => {
        const leftPct = (a.startMs / safeDuration) * 100;
        const widthPct = Math.max(0.4, ((a.endMs - a.startMs) / safeDuration) * 100);
        const isActive = currentMs >= a.startMs && currentMs <= a.endMs;
        const isSelected = selectedId === a.id;
        return (
          <button
            key={a.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMarkerClick(a.id);
            }}
            className={`absolute top-1/2 z-10 h-6 -translate-y-1/2 rounded border border-primary bg-primary/60 hover:bg-primary ${
              isActive || isSelected ? 'ring-2 ring-primary' : ''
            }`}
            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
            title={`${a.type} ${a.startMs}-${a.endMs}ms`}
          />
        );
      })}

      <input
        type="range"
        min={0}
        max={Math.max(0, durationMs)}
        value={currentMs}
        onChange={(e) => onSeek(Number(e.target.value))}
        className="absolute inset-0 z-20 w-full cursor-pointer opacity-0"
      />

      <div
        className="pointer-events-none absolute inset-y-0 z-0 w-px bg-foreground"
        style={{ left: `${playheadPct}%` }}
      />
    </div>
  );
};

export default AnnotationTimeline;
