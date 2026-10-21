import { IconEye, IconEyeOff, IconPan, IconZoomIn, IconZoomOut } from './icons/ReviewIcons';
import i18n from '../../i18n';

interface BottomCapsuleControlsProps {
  activeTool: string;
  zoomPercent: number;
  showAnnotations: boolean;
  onTogglePan: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  onZoom100: () => void;
  onToggleAnnotations: () => void;
}

export function BottomCapsuleControls({
  activeTool,
  zoomPercent,
  showAnnotations,
  onTogglePan,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onZoom100,
  onToggleAnnotations,
}: BottomCapsuleControlsProps) {
  return (
    <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-4 rounded-2xl border border-[var(--color-canvas-border)] bg-[var(--color-canvas-elevated)]/95 px-5 py-2.5 text-white shadow-2xl">
      <button
        onClick={onTogglePan}
        title={i18n.t('review:bottomCapsuleControls.panMode')}
        className={`rounded-lg p-1.5 transition-all hover:bg-white/10 ${activeTool === 'pan' ? 'bg-white/10 text-[var(--color-accent)]' : 'text-white/60'}`}
      >
        <IconPan />
      </button>

      <div className="h-5 w-px bg-white/10" />

      <div className="flex items-center gap-2">
        <button onClick={onZoomOut} title={i18n.t('review:bottomCapsuleControls.zoomOut')} className="rounded-lg p-1.5 text-white/60 transition-all hover:bg-white/10 hover:text-white">
          <IconZoomOut />
        </button>
        <span className="w-12 select-none text-center text-xs font-bold tracking-widest text-white/80">
          {zoomPercent}%
        </span>
        <button onClick={onZoomIn} title={i18n.t('review:bottomCapsuleControls.zoomIn')} className="rounded-lg p-1.5 text-white/60 transition-all hover:bg-white/10 hover:text-white">
          <IconZoomIn />
        </button>
      </div>

      <div className="h-5 w-px bg-white/10" />

      <button
        onClick={onZoomFit}
        title={i18n.t('review:bottomCapsuleControls.fitToScreen')}
        className="rounded-lg px-2.5 py-1 text-[10px] font-black tracking-wider text-white/60 transition-all hover:bg-white/10 hover:text-white"
      >
        {i18n.t('review:bottomCapsuleControls.fit')}
      </button>
      <button
        onClick={onZoom100}
        title={i18n.t('review:bottomCapsuleControls.resetTo100')}
        className="rounded-lg px-2.5 py-1 text-[10px] font-black tracking-wider text-white/60 transition-all hover:bg-white/10 hover:text-white"
      >
        100%
      </button>

      <div className="h-5 w-px bg-white/10" />

      <button
        onClick={onToggleAnnotations}
        title={showAnnotations ? i18n.t('review:bottomCapsuleControls.hideAnnotations') : i18n.t('review:bottomCapsuleControls.showAnnotations')}
        className={`rounded-lg p-1.5 transition-all hover:bg-white/10 ${showAnnotations ? 'text-[var(--color-accent)]' : 'text-white/40'}`}
      >
        {showAnnotations ? <IconEye /> : <IconEyeOff />}
      </button>
    </div>
  );
}
