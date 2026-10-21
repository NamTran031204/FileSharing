import { useEffect, useImperativeHandle, useRef, useState, forwardRef, useCallback } from 'react';
import type { ReactNode, Ref } from 'react';
import Hls from 'hls.js';
import { useMeasure } from 'react-use';
import { ProcessingStatus } from '../../api/api/index.defs';
import { buildHlsManifestUrl, createHlsXhrSetup } from '../../api/hlsApiResource';
import { IconPlay } from '../imageReview/icons/ReviewIcons';
import i18n from '../../i18n';

/** Kích thước lớn nhất giữ đúng aspectRatio, nằm gọn trong outerWidth × outerHeight (letterbox-free). */
function contentBoxSize(outerWidth: number, outerHeight: number, aspectRatio: number): { width: number; height: number } {
  let height = outerHeight;
  let width = height * aspectRatio;
  if (width > outerWidth) {
    width = outerWidth;
    height = width / aspectRatio;
  }
  return { width, height };
}

export interface HlsVideoLevel {
  index: number;
  height: number;
  bitrate: number;
}

export interface HlsVideoPlayerHandle {
  seek: (timeMs: number) => void;
  getCurrentMs: () => number;
  getIsPaused: () => boolean;
  getDurationMs: () => number;
  // Điều khiển
  play: () => void;
  pause: () => void;
  setVolume: (v: number) => void;
  getVolume: () => number;
  setMuted: (m: boolean) => void;
  setPlaybackRate: (r: number) => void;
  requestFullscreen: () => void;
  // Chất lượng (hls.js, client-side, không cần API mới)
  getLevels: () => HlsVideoLevel[];
  getCurrentLevel: () => number;
  setQualityLevel: (index: number) => void;
  // Số liệu cho StreamHealthPanel (WP10)
  getBandwidthEstimate: () => number;
  getBufferedAheadMs: () => number;
  getPlaybackQuality: () => { dropped: number; total: number };
}

interface Props {
  assetId: string;
  versionNumber: number;
  processingStatus: ProcessingStatus | null | undefined;
  /** Ref của khung nội dung video (letterbox-free) — Konva Stage của caller phải bám đúng ref này. */
  contentRef?: Ref<HTMLDivElement>;
  /** Rendered bên trong khung nội dung (letterbox-free), phủ absolute — dùng cho Konva Stage của caller. */
  children?: ReactNode;
  onTimeUpdate?: (ms: number) => void;
  onPauseChange?: (paused: boolean) => void;
  onDurationChange?: (ms: number) => void;
}

const HlsVideoPlayer = forwardRef<HlsVideoPlayerHandle, Props>(
  ({ assetId, versionNumber, processingStatus, contentRef, children, onTimeUpdate, onPauseChange, onDurationChange }, ref) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const hlsRef = useRef<Hls | null>(null);

    const [videoMounted, setVideoMounted] = useState(false);
    const videoCallbackRef = useCallback((el: HTMLVideoElement | null) => {
      videoRef.current = el;
      setVideoMounted(el !== null);
    }, []);

    const [outerRef, { width: outerWidth, height: outerHeight }] = useMeasure<HTMLDivElement>();
    const [videoAspect, setVideoAspect] = useState<number | null>(null);

    const [isReady, setIsReady] = useState(false);
    const [isPaused, setIsPaused] = useState(true);

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

      play: () => { void videoRef.current?.play().catch(() => {}); },
      pause: () => { videoRef.current?.pause(); },
      setVolume: (v: number) => { if (videoRef.current) videoRef.current.volume = Math.min(1, Math.max(0, v)); },
      getVolume: () => videoRef.current?.volume ?? 1,
      setMuted: (m: boolean) => { if (videoRef.current) videoRef.current.muted = m; },
      setPlaybackRate: (r: number) => { if (videoRef.current) videoRef.current.playbackRate = r; },
      requestFullscreen: () => { void videoRef.current?.requestFullscreen?.().catch(() => {}); },

      getLevels: () => (hlsRef.current?.levels ?? []).map((l, index) => ({
        index, height: l.height ?? 0, bitrate: l.bitrate ?? 0,
      })),
      getCurrentLevel: () => hlsRef.current?.currentLevel ?? -1,
      setQualityLevel: (index: number) => { if (hlsRef.current) hlsRef.current.currentLevel = index; },

      getBandwidthEstimate: () => hlsRef.current?.bandwidthEstimate ?? 0,
      getBufferedAheadMs: () => {
        const v = videoRef.current;
        if (!v) return 0;
        const { buffered, currentTime } = v;
        for (let i = 0; i < buffered.length; i++) {
          if (currentTime >= buffered.start(i) && currentTime <= buffered.end(i)) {
            return (buffered.end(i) - currentTime) * 1000;
          }
        }
        return 0;
      },
      getPlaybackQuality: () => {
        const v = videoRef.current;
        if (!v?.getVideoPlaybackQuality) return { dropped: 0, total: 0 };
        const q = v.getVideoPlaybackQuality();
        return { dropped: q.droppedVideoFrames, total: q.totalVideoFrames };
      },
    }));

    useEffect(() => {
      if (processingStatus !== ProcessingStatus.READY) return;

      const videoEl = videoRef.current;
      if (!videoEl) return;

      hlsRef.current?.destroy();
      hlsRef.current = null;
      setIsReady(false);
      setVideoAspect(null);

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
        onTimeUpdateRef.current?.(ms);
      };
      const handleDuration = () => {
        const d = v.duration;
        if (v.videoWidth > 0 && v.videoHeight > 0) {
          setVideoAspect(v.videoWidth / v.videoHeight);
        }
        if (!isFinite(d) || d <= 0) return;
        const ms = d * 1000;
        durationMsRef.current = ms;
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

    const handleBigPlayClick = () => {
      void videoRef.current?.play().catch(() => {});
    };

    if (!processingStatus || processingStatus === ProcessingStatus.PENDING) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-[var(--color-canvas)] text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          <p className="text-sm font-medium text-white/60">{i18n.t('review:hlsVideoPlayer.waitingForEncodingToStart')}</p>
        </div>
      );
    }

    if (processingStatus === ProcessingStatus.PROCESSING) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-[var(--color-canvas)] text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[var(--color-accent)]" />
          <p className="text-sm font-medium text-white/60">{i18n.t('review:hlsVideoPlayer.encodingInProgress')}</p>
          <p className="text-xs text-white/30">{i18n.t('review:hlsVideoPlayer.thisMayTakeAFew')}</p>
        </div>
      );
    }

    if (processingStatus === ProcessingStatus.FAILED) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-[var(--color-canvas)] text-center">
          <svg className="h-10 w-10 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <p className="text-sm font-medium text-red-400">{i18n.t('review:hlsVideoPlayer.encodingFailed')}</p>
          <p className="text-xs text-white/30">{i18n.t('review:hlsVideoPlayer.pleaseReUploadTheFile')}</p>
        </div>
      );
    }

    return (
      <div
        ref={outerRef}
        className="relative flex flex-1 items-center justify-center overflow-hidden bg-black"
      >
        <div
          ref={contentRef}
          className="relative"
          style={
            videoAspect && outerWidth > 0 && outerHeight > 0
              ? contentBoxSize(outerWidth, outerHeight, videoAspect)
              : { width: '100%', height: '100%' }
          }
        >
          <video
            ref={videoCallbackRef}
            playsInline
            className="h-full w-full"
            style={{ objectFit: 'contain' }}
          />

          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            </div>
          )}

          {isReady && isPaused && (
            <button
              type="button"
              onClick={handleBigPlayClick}
              title={i18n.t('review:hlsVideoPlayer.play')}
              className="absolute left-1/2 top-1/2 flex h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-transform hover:scale-105"
            >
              <span className="ml-1 scale-[2]"><IconPlay /></span>
            </button>
          )}

          {children}
        </div>
      </div>
    );
  },
);

HlsVideoPlayer.displayName = 'HlsVideoPlayer';

export default HlsVideoPlayer;
