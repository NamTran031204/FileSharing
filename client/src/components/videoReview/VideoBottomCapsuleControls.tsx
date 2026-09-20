import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import type { HlsVideoPlayerHandle, HlsVideoLevel } from '../mediaReview/HlsVideoPlayer';
import VideoAnnotationTimeline from '../mediaReview/VideoAnnotationTimeline';
import type { LoopRegion } from '../mediaReview/VideoAnnotationTimeline';
import type { VideoAnnotation } from '../mediaReview/videoAnnotationTypes';
import {
  IconCC, IconEye, IconEyeOff, IconFullscreen, IconPause, IconPlay,
  IconSkipNext, IconSkipPrev, IconVolume, IconVolumeMute,
} from '../imageReview/icons/ReviewIcons';
import uiUtils from '../../utils/uiUtils.tsx';

const SPEED_OPTIONS = [0.5, 1, 1.5, 2] as const;

function formatMs(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

interface VideoBottomCapsuleControlsProps {
  playerRef: RefObject<HlsVideoPlayerHandle | null>;
  isPaused: boolean;
  currentMs: number;
  durationMs: number;
  annotations: VideoAnnotation[];
  selectedAnnotationId: string | null;
  onMarkerClick: (id: string) => void;
  onSeek: (ms: number) => void;
  showAnnotations: boolean;
  onToggleAnnotations: () => void;
  loopRegion: LoopRegion | null;
  onLoopRegionChange: (region: LoopRegion) => void;
}

export function VideoBottomCapsuleControls({
  playerRef,
  isPaused,
  currentMs,
  durationMs,
  annotations,
  selectedAnnotationId,
  onMarkerClick,
  onSeek,
  showAnnotations,
  onToggleAnnotations,
  loopRegion,
  onLoopRegionChange,
}: VideoBottomCapsuleControlsProps) {
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [levels, setLevels] = useState<HlsVideoLevel[]>([]);
  const [currentLevel, setCurrentLevel] = useState(-1);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    setVolume(playerRef.current?.getVolume() ?? 1);
    const id = setInterval(() => {
      setLevels(playerRef.current?.getLevels() ?? []);
      setCurrentLevel(playerRef.current?.getCurrentLevel() ?? -1);
    }, 1000);
    return () => clearInterval(id);
  }, [playerRef]);

  const handlePlayPause = () => {
    if (isPaused) playerRef.current?.play();
    else playerRef.current?.pause();
  };

  const handlePrevMarker = () => {
    const before = annotations.filter(a => a.startMs < currentMs - 200).sort((a, b) => b.startMs - a.startMs);
    if (before[0]) playerRef.current?.seek(before[0].startMs);
  };

  const handleNextMarker = () => {
    const after = annotations.filter(a => a.startMs > currentMs + 200).sort((a, b) => a.startMs - b.startMs);
    if (after[0]) playerRef.current?.seek(after[0].startMs);
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    playerRef.current?.setVolume(v);
    if (v > 0 && muted) { setMuted(false); playerRef.current?.setMuted(false); }
  };

  const handleToggleMute = () => {
    const next = !muted;
    setMuted(next);
    playerRef.current?.setMuted(next);
  };

  const handleSelectQuality = (index: number) => {
    playerRef.current?.setQualityLevel(index);
    setCurrentLevel(index);
  };

  const handleSelectSpeed = (r: number) => {
    setSpeed(r);
    playerRef.current?.setPlaybackRate(r);
  };

  const handleLoopRegionChange = (region: LoopRegion) => {
    onLoopRegionChange(region);
  };

  const qualityLabel = currentLevel === -1 ? 'Auto' : `${levels[currentLevel]?.height ?? '—'}p`;

  return (
    <div className="pointer-events-none absolute inset-x-6 bottom-4 z-30 flex flex-col gap-2">
      <div className="pointer-events-auto">
        <VideoAnnotationTimeline
          durationMs={durationMs}
          currentMs={currentMs}
          annotations={annotations}
          selectedId={selectedAnnotationId}
          onSeek={onSeek}
          onMarkerClick={onMarkerClick}
          loopRegion={loopRegion}
          onLoopRegionChange={handleLoopRegionChange}
        />
      </div>

      <div className="pointer-events-auto mx-auto flex items-center gap-1.5 rounded-full border border-[var(--color-canvas-border)] bg-[var(--color-canvas-elevated)]/95 px-3 py-1.5 text-white shadow-2xl">
        <button onClick={handlePlayPause} title={isPaused ? 'Play' : 'Pause'} className="flex h-8 w-8 items-center justify-center rounded-full text-white/85 hover:bg-white/10">
          {isPaused ? <IconPlay /> : <IconPause />}
        </button>
        <button onClick={handlePrevMarker} title="Previous marker" className="flex h-7 w-7 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white">
          <IconSkipPrev />
        </button>
        <span className="w-24 select-none text-center text-[11px] font-mono text-white/75">
          {formatMs(currentMs)} / {formatMs(durationMs)}
        </span>
        <button onClick={handleNextMarker} title="Next marker" className="flex h-7 w-7 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white">
          <IconSkipNext />
        </button>

        <div className="mx-1 h-5 w-px bg-white/15" />

        <div className="group/vol relative flex h-8 w-8 items-center justify-center">
          <button onClick={handleToggleMute} title={muted ? 'Unmute' : 'Mute'} className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white">
            {muted || volume === 0 ? <IconVolumeMute /> : <IconVolume />}
          </button>
          <div className="absolute bottom-full left-1/2 z-30 mb-2 hidden -translate-x-1/2 flex-col items-center rounded-lg border border-[var(--color-canvas-border)] bg-[var(--color-canvas-elevated)] p-2 shadow-2xl group-hover/vol:flex">
            <input
              type="range" min={0} max={1} step={0.05}
              value={muted ? 0 : volume}
              onChange={e => handleVolumeChange(Number(e.target.value))}
              className="h-20 cursor-pointer"
              style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
            />
          </div>
        </div>

        <button
          onClick={() => uiUtils.showInfor('Phụ đề (CC) — chưa có API')}
          title="Captions"
          className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-all hover:bg-white/10 hover:text-white"
        >
          <IconCC />
        </button>

        <div className="mx-1 h-5 w-px bg-white/15" />

        <div className="group/quality relative">
          <button className="rounded-full px-2 py-1 text-[10px] font-bold text-white/70 hover:bg-white/10 hover:text-white">
            {qualityLabel}
          </button>
          <div className="absolute bottom-full left-1/2 z-30 mb-2 hidden w-24 -translate-x-1/2 flex-col rounded-lg border border-[var(--color-canvas-border)] bg-[var(--color-canvas-elevated)] py-1 shadow-2xl group-hover/quality:flex">
            <button
              onClick={() => handleSelectQuality(-1)}
              className={`px-3 py-1 text-left text-[10px] font-bold hover:bg-white/10 ${currentLevel === -1 ? 'text-[var(--color-accent)]' : 'text-white/70'}`}
            >
              Auto
            </button>
            {levels.map(l => (
              <button
                key={l.index}
                onClick={() => handleSelectQuality(l.index)}
                className={`px-3 py-1 text-left text-[10px] font-bold hover:bg-white/10 ${currentLevel === l.index ? 'text-[var(--color-accent)]' : 'text-white/70'}`}
              >
                {l.height}p
              </button>
            ))}
          </div>
        </div>

        <div className="group/speed relative">
          <button className="rounded-full px-2 py-1 text-[10px] font-bold text-white/70 hover:bg-white/10 hover:text-white">
            {speed}x
          </button>
          <div className="absolute bottom-full left-1/2 z-30 mb-2 hidden w-16 -translate-x-1/2 flex-col rounded-lg border border-[var(--color-canvas-border)] bg-[var(--color-canvas-elevated)] py-1 shadow-2xl group-hover/speed:flex">
            {SPEED_OPTIONS.map(r => (
              <button
                key={r}
                onClick={() => handleSelectSpeed(r)}
                className={`px-3 py-1 text-left text-[10px] font-bold hover:bg-white/10 ${speed === r ? 'text-[var(--color-accent)]' : 'text-white/70'}`}
              >
                {r}x
              </button>
            ))}
          </div>
        </div>

        <div className="mx-1 h-5 w-px bg-white/15" />

        <button onClick={() => playerRef.current?.requestFullscreen()} title="Fullscreen" className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white">
          <IconFullscreen />
        </button>

        <div className="mx-1 h-5 w-px bg-white/15" />

        <button
          onClick={onToggleAnnotations}
          title={showAnnotations ? 'Hide Annotations' : 'Show Annotations'}
          className={`flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 ${showAnnotations ? 'text-[var(--color-accent)]' : 'text-white/40'}`}
        >
          {showAnnotations ? <IconEye /> : <IconEyeOff />}
        </button>
      </div>
    </div>
  );
}
