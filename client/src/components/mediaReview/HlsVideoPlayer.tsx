import { useEffect, useImperativeHandle, useRef, useState, forwardRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import Hls from 'hls.js';
import { ProcessingStatus } from '../../api/api/index.defs';
import { buildHlsManifestUrl, createHlsXhrSetup } from '../../api/hlsApiResource';
import {PlayIcon} from "../../assets/icon/PlayIcon.tsx";
import {PauseIcon} from "../../assets/icon/PauseIcon.tsx";

export interface HlsVideoPlayerHandle {
  seek: (timeMs: number) => void;
  getCurrentMs: () => number;
  getIsPaused: () => boolean;
  getDurationMs: () => number;
}

interface Props {
  assetId: string;
  versionNumber: number;
  processingStatus: ProcessingStatus | null | undefined;
  timelineContent?: ReactNode;
  onTimeUpdate?: (ms: number) => void;
  onPauseChange?: (paused: boolean) => void;
  onDurationChange?: (ms: number) => void;
}

const formatMs = (ms: number): string => {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
};

const HlsVideoPlayer = forwardRef<HlsVideoPlayerHandle, Props>(
  ({ assetId, versionNumber, processingStatus, timelineContent, onTimeUpdate, onPauseChange, onDurationChange }, ref) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const hlsRef = useRef<Hls | null>(null);

    const [videoMounted, setVideoMounted] = useState(false);
    const videoCallbackRef = useCallback((el: HTMLVideoElement | null) => {
      videoRef.current = el;
      setVideoMounted(el !== null);
    }, []);

    const [isReady, setIsReady] = useState(false);
    const [isPaused, setIsPaused] = useState(true);
    const [currentMs, setCurrentMs] = useState(0);
    const [durationMs, setDurationMs] = useState(0);
    const [controlsVisible, setControlsVisible] = useState(true);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const currentMsRef = useRef(0);
    const isPausedRef = useRef(true);
    const durationMsRef = useRef(0);

    const onTimeUpdateRef = useRef(onTimeUpdate);
    const onPauseChangeRef = useRef(onPauseChange);
    const onDurationChangeRef = useRef(onDurationChange);
    onTimeUpdateRef.current = onTimeUpdate;
    onPauseChangeRef.current = onPauseChange;
    onDurationChangeRef.current = onDurationChange;

    useImperativeHandle(ref, () => ({
      seek: (timeMs: number) => {
        const v = videoRef.current;
        if (!v) return;
        v.currentTime = timeMs / 1000;
      },
      getCurrentMs: () => currentMsRef.current,
      getIsPaused: () => isPausedRef.current,
      getDurationMs: () => durationMsRef.current,
    }));

    useEffect(() => {
      if (processingStatus !== ProcessingStatus.READY) return;

      const videoEl = videoRef.current;
      if (!videoEl) return;

      hlsRef.current?.destroy();
      hlsRef.current = null;
      setIsReady(false);
      setCurrentMs(0);
      setDurationMs(0);

      const manifestUrl = buildHlsManifestUrl(assetId, versionNumber);

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          xhrSetup: createHlsXhrSetup(),
        });
        hlsRef.current = hls;
        hls.loadSource(manifestUrl);
        hls.attachMedia(videoEl);
        hls.on(Hls.Events.MANIFEST_PARSED, () => setIsReady(true));
        hls.on(Hls.Events.LEVEL_LOADED, (_e, data) => {
          const ms = data.details.totalduration * 1000;
          if (ms > 0) {
            durationMsRef.current = ms;
            setDurationMs(ms);
            onDurationChangeRef.current?.(ms);
          }
        });
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) {
            console.error('[HLS] Fatal error:', data.type, data.details);
          }
        });
      }

      return () => {
        hlsRef.current?.destroy();
        hlsRef.current = null;
        videoEl.pause();
        videoEl.removeAttribute('src');
        videoEl.load();
      };
    }, [assetId, versionNumber, processingStatus]);

    useEffect(() => {
      const v = videoRef.current;
      if (!v) return;
      const handleTimeUpdate = () => {
        const ms = v.currentTime * 1000;
        currentMsRef.current = ms;
        setCurrentMs(ms);
        onTimeUpdateRef.current?.(ms);
      };
      const handleDuration = () => {
        const d = v.duration;
        if (!isFinite(d) || d <= 0) return;
        const ms = d * 1000;
        durationMsRef.current = ms;
        setDurationMs(ms);
        onDurationChangeRef.current?.(ms);
      };
      const handlePlay = () => { isPausedRef.current = false; setIsPaused(false); onPauseChangeRef.current?.(false); };
      const handlePause = () => { isPausedRef.current = true; setIsPaused(true); onPauseChangeRef.current?.(true); };
      v.addEventListener('timeupdate', handleTimeUpdate);
      v.addEventListener('loadedmetadata', handleDuration);
      v.addEventListener('durationchange', handleDuration);
      v.addEventListener('play', handlePlay);
      v.addEventListener('pause', handlePause);
      return () => {
        v.removeEventListener('timeupdate', handleTimeUpdate);
        v.removeEventListener('loadedmetadata', handleDuration);
        v.removeEventListener('durationchange', handleDuration);
        v.removeEventListener('play', handlePlay);
        v.removeEventListener('pause', handlePause);
      };
    }, [videoMounted]);

    useEffect(() => {
      if (isPaused) {
        setControlsVisible(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      }
    }, [isPaused]);

    const handleMouseActivity = () => {
      setControlsVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (!isPaused) {
        hideTimerRef.current = setTimeout(() => setControlsVisible(false), 3000);
      }
    };

    const handleMouseLeave = () => {
      if (!isPaused) {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => setControlsVisible(false), 800);
      }
    };

    const handlePlayPause = () => {
      const v = videoRef.current;
      if (!v) return;
      if (v.paused) void v.play().catch(() => {});
      else v.pause();
    };

    const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const v = videoRef.current;
      if (!v || durationMs === 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      v.currentTime = Math.max(0, ratio) * (durationMs / 1000);
    };

    if (!processingStatus || processingStatus === ProcessingStatus.PENDING) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-zinc-950 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
          <p className="text-sm font-medium text-zinc-400">Waiting for encoding to start…</p>
        </div>
      );
    }

    if (processingStatus === ProcessingStatus.PROCESSING) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-zinc-950 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-violet-400" />
          <p className="text-sm font-medium text-zinc-400">Encoding in progress…</p>
          <p className="text-xs text-zinc-600">This may take a few minutes.</p>
        </div>
      );
    }

    if (processingStatus === ProcessingStatus.FAILED) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-zinc-950 text-center">
          <svg className="h-10 w-10 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <p className="text-sm font-medium text-red-400">Encoding failed</p>
          <p className="text-xs text-zinc-600">Please re-upload the file and try again.</p>
        </div>
      );
    }

    const progressPct = durationMs > 0 ? (currentMs / durationMs) * 100 : 0;

    return (
      <div
        className="relative flex flex-1 overflow-hidden bg-black"
        onMouseMove={handleMouseActivity}
        onMouseEnter={handleMouseActivity}
        onMouseLeave={handleMouseLeave}
      >
        <video
          ref={videoCallbackRef}
          playsInline
          className="h-full w-full"
          style={{ objectFit: 'contain' }}
        />

        {/* spin khi hls.js loading manifest */}
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
          </div>
        )}

        <div
          className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 px-4 pb-4 pt-10 transition-all duration-200"
          style={{
            background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 60%, transparent 100%)',
            opacity: controlsVisible ? 1 : 0,
            transform: controlsVisible ? 'translateY(0)' : 'translateY(6px)',
            pointerEvents: controlsVisible ? 'auto' : 'none',
          }}
        >
          {timelineContent ?? (
            <div
              className="h-1 w-full cursor-pointer rounded-full bg-white/20"
              onClick={handleSeekClick}
            >
              <div
                className="h-full rounded-full bg-violet-400 transition-none"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handlePlayPause}
              disabled={!isReady}
              className="text-lg text-white transition-transform hover:scale-110 disabled:opacity-30"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {isPaused ? <PlayIcon/> : <PauseIcon/>}
            </button>
            <span
              className="text-xs text-white/60"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {formatMs(currentMs)} / {formatMs(durationMs)}
            </span>
          </div>
        </div>
      </div>
    );
  },
);

HlsVideoPlayer.displayName = 'HlsVideoPlayer';

export default HlsVideoPlayer;
