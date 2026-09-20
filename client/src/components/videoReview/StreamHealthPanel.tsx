import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import type { HlsVideoPlayerHandle } from '../mediaReview/HlsVideoPlayer';

interface StreamHealthPanelProps {
  playerRef: RefObject<HlsVideoPlayerHandle | null>;
}

export function StreamHealthPanel({ playerRef }: StreamHealthPanelProps) {
  const [mbps, setMbps] = useState(0);
  const [bufferMs, setBufferMs] = useState(0);
  const [dropped, setDropped] = useState({ dropped: 0, total: 0 });
  const [quality, setQuality] = useState<{ height: number; auto: boolean }>({ height: 0, auto: true });

  useEffect(() => {
    const id = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      setMbps((p.getBandwidthEstimate() ?? 0) / 1_000_000);
      setBufferMs(p.getBufferedAheadMs() ?? 0);
      setDropped(p.getPlaybackQuality());
      const levels = p.getLevels();
      const currentLevel = p.getCurrentLevel();
      const active = currentLevel === -1 ? levels[levels.length - 1] : levels[currentLevel];
      setQuality({ height: active?.height ?? 0, auto: currentLevel === -1 });
    }, 1000);
    return () => clearInterval(id);
  }, [playerRef]);

  return (
    <div className="absolute right-4 top-4 z-30 flex w-44 flex-col gap-2 rounded-xl border border-[var(--color-canvas-border)] bg-[var(--color-canvas-elevated)]/95 p-3 text-white shadow-2xl">
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
        <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Stream Health</span>
      </div>

      <div className="flex items-center justify-between text-[10px]">
        <span className="text-white/50">Mbps down</span>
        <span className="font-mono font-bold">{mbps.toFixed(1)}</span>
      </div>
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-white/50">Jitter</span>
        {/* chua co cong thuc tinh jitter chuan tu hls.js/native video — khong phai thieu API */}
        <span className="font-mono font-bold text-white/40" title="Chưa hỗ trợ — chưa có công thức đo">—</span>
      </div>
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-white/50">Buffer health</span>
        <span className="font-mono font-bold">{(bufferMs / 1000).toFixed(1)}s</span>
      </div>
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-white/50">Dropped frames</span>
        <span className="font-mono font-bold">{dropped.dropped}/{dropped.total}</span>
      </div>

      <div className="mt-1 rounded-full bg-white/10 px-2 py-1 text-center text-[9px] font-black tracking-wider text-[var(--color-accent)]">
        {quality.height > 0 ? `${quality.height}p` : '—'} · {quality.auto ? 'Auto' : 'Manual'}
      </div>
    </div>
  );
}
