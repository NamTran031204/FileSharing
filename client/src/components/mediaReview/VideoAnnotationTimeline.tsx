import { useRef, useState } from 'react';
import type { VideoAnnotation } from './videoAnnotationTypes';

export interface LoopRegion {
  inMs: number;
  outMs: number;
}

interface Props {
  durationMs: number;
  currentMs: number;
  annotations: VideoAnnotation[];
  selectedId: string | null;
  onSeek: (ms: number) => void;
  onMarkerClick: (id: string) => void;
  loopRegion: LoopRegion | null;
  onLoopRegionChange: (region: LoopRegion) => void;
}

function formatMs(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const VideoAnnotationTimeline = ({
  durationMs,
  currentMs,
  annotations,
  selectedId,
  onSeek,
  onMarkerClick,
  loopRegion,
  onLoopRegionChange,
}: Props) => {
  const safeDuration = durationMs > 0 ? durationMs : 1;
  const playheadPct = Math.min(100, (currentMs / safeDuration) * 100);
  const barRef = useRef<HTMLDivElement>(null);
  const [hoverPct, setHoverPct] = useState<number | null>(null);
  const dragHandleRef = useRef<'in' | 'out' | null>(null);

  const pctToMs = (clientX: number): number => {
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return ratio * safeDuration;
  };

  // TODO(api): Loop/Trim cần lưu lại theo quyết định B.3-4, nhưng backend CHƯA có entity/endpoint nào cho khái niệm này.
  // Hiện tại state chỉ sống trong phiên, mất khi reload.
  // Cần bổ sung: DTO {startMs, endMs} gắn với assetId + versionNumber (tham khảo pattern
  // server/filesharing-core/.../annotation/AnnotationTimeCode.java) + endpoint mới
  // (vd. PUT /api/versions/{assetId}/{versionNumber}/trim-mark).
  const startDrag = (handle: 'in' | 'out') => (e: React.MouseEvent) => {
    e.stopPropagation();
    dragHandleRef.current = handle;
    const handleMove = (ev: MouseEvent) => {
      if (!dragHandleRef.current || !loopRegion) return;
      const ms = pctToMs(ev.clientX);
      if (dragHandleRef.current === 'in') {
        onLoopRegionChange({ inMs: Math.min(ms, loopRegion.outMs - 200), outMs: loopRegion.outMs });
      } else {
        onLoopRegionChange({ inMs: loopRegion.inMs, outMs: Math.max(ms, loopRegion.inMs + 200) });
      }
    };
    const handleUp = () => {
      dragHandleRef.current = null;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  return (
    <div
      ref={barRef}
      className="group relative h-8 w-full cursor-pointer"
      onMouseMove={e => {
        const rect = barRef.current?.getBoundingClientRect();
        if (!rect) return;
        setHoverPct(Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100)));
      }}
      onMouseLeave={() => setHoverPct(null)}
    >
      {/* Thin scrub bar */}
      <div
        className="absolute inset-x-0 bottom-0 h-1.5 rounded-full transition-[height] duration-150 group-hover:h-2.5"
        style={{ background: 'rgba(255,255,255,0.18)' }}
      >
        {/* Loop/trim region */}
        {loopRegion && (
          <div
            className="pointer-events-none absolute inset-y-0 rounded-full"
            style={{
              left: `${(loopRegion.inMs / safeDuration) * 100}%`,
              width: `${((loopRegion.outMs - loopRegion.inMs) / safeDuration) * 100}%`,
              background: 'rgba(255,255,255,0.15)',
            }}
          />
        )}

        {/* Progress fill */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${playheadPct}%`, background: 'var(--color-primary)' }}
        />

        {/* Scrub handle on hover */}
        <div
          className="pointer-events-none absolute top-1/2 z-20 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
          style={{ left: `${playheadPct}%` }}
        />
      </div>

      {/* Loop IN/OUT handles */}
      {loopRegion && (
        <>
          <div
            onMouseDown={startDrag('in')}
            className="absolute top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize"
            style={{ left: `${(loopRegion.inMs / safeDuration) * 100}%` }}
            title={`IN ${formatMs(loopRegion.inMs)}`}
          >
            <div className="h-4 w-1.5 rounded-full bg-[var(--color-accent)] shadow" />
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/70 px-1 text-[9px] font-mono text-white">
              IN {formatMs(loopRegion.inMs)}
            </span>
          </div>
          <div
            onMouseDown={startDrag('out')}
            className="absolute top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize"
            style={{ left: `${(loopRegion.outMs / safeDuration) * 100}%` }}
            title={`OUT ${formatMs(loopRegion.outMs)}`}
          >
            <div className="h-4 w-1.5 rounded-full bg-[var(--color-accent)] shadow" />
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/70 px-1 text-[9px] font-mono text-white">
              OUT {formatMs(loopRegion.outMs)}
            </span>
          </div>
        </>
      )}

      {/* Marker dots on the bar */}
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
            className="absolute top-1/2 z-30 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-transform duration-100 hover:scale-125"
            style={{
              left: `${leftPct}%`,
              background: isSelected ? 'var(--color-primary)' : 'var(--color-accent)',
              borderColor: 'rgba(0,0,0,0.4)',
              boxShadow: isSelected ? '0 0 0 3px rgba(255,255,255,0.25)' : undefined,
            }}
            title={`${a.type} @ ${(a.startMs / 1000).toFixed(1)}s`}
          />
        );
      })}

      {/* Hover thumbnail preview — sprite pipeline chua sinh o backend, xem VideoAnnotationTimeline.tsx cu */}
      {hoverPct !== null && dragHandleRef.current === null && (
        <div
          className="pointer-events-none absolute bottom-6 z-40 flex -translate-x-1/2 flex-col items-center gap-1"
          style={{ left: `${hoverPct}%` }}
        >
          <div
            className="flex h-[54px] w-[96px] items-center justify-center rounded-md border border-white/15 bg-black/80"
            title="Sprite thumbnail chưa có API"
          >
            <span className="text-[9px] text-white/30">Chưa có API</span>
          </div>
          <span className="rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-mono text-white">
            {formatMs((hoverPct / 100) * safeDuration)}
          </span>
        </div>
      )}

      {/* Transparent range input for seeking */}
      <input
        type="range"
        min={0}
        max={Math.max(1, durationMs)}
        value={currentMs}
        onChange={(e) => onSeek(Number(e.target.value))}
        className="absolute inset-0 z-10 w-full cursor-pointer opacity-0"
      />
    </div>
  );
};

export default VideoAnnotationTimeline;
