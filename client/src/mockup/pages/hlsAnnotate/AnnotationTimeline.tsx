import { MarkerIcon } from '../../../assets/icon/MarkerIcon';
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
    // Container is tall enough to show pin icons above the thin bar
    <div className="group relative h-8 w-full cursor-pointer">
      {/* Thin scrub bar — sits at the bottom of the container */}
      <div
        className="absolute inset-x-0 bottom-0 h-1.5 rounded-full transition-[height] duration-150 group-hover:h-2.5"
        style={{ background: 'rgba(255,255,255,0.18)' }}
      >
        {/* Progress fill */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${playheadPct}%`, background: 'var(--color-primary)' }}
        />

        {/* Scrub handle — appears on hover */}
        <div
          className="pointer-events-none absolute top-1/2 z-20 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
          style={{ left: `${playheadPct}%` }}
        />
      </div>

      {/* Marker pin icons — float above the bar */}
      {annotations.map((a) => {
        const leftPct = (a.startMs / safeDuration) * 100;
        const isSelected = selectedId === a.id;
        return (
          <button
            key={a.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMarkerClick(a.id);
            }}
            className="absolute z-40 -translate-x-1/2 transition-transform duration-100 hover:scale-125"
            style={{
              left: `${leftPct}%`,
              bottom: 8,
              color: isSelected ? 'var(--color-primary)' : 'rgba(255,255,255,0.75)',
              filter: isSelected
                ? 'drop-shadow(0 0 4px var(--color-primary))'
                : undefined,
            }}
            title={`${a.type} @ ${(a.startMs / 1000).toFixed(1)}s`}
          >
            <MarkerIcon style={{ fontSize: 14 }} />
          </button>
        );
      })}

      {/* Transparent range input for seeking — below marker buttons */}
      <input
        type="range"
        min={0}
        max={Math.max(1, durationMs)}
        value={currentMs}
        onChange={(e) => onSeek(Number(e.target.value))}
        className="absolute inset-0 z-30 w-full cursor-pointer opacity-0"
      />
    </div>
  );
};

export default AnnotationTimeline;
