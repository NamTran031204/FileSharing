import { IconEye, IconEyeOff, IconPan, IconZoomIn, IconZoomOut } from './icons/ReviewIcons';

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
    <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/95 px-5 py-2.5 text-white shadow-2xl">
      <button
        onClick={onTogglePan}
        title="Pan Mode"
        className={`rounded-lg p-1.5 transition-all hover:bg-zinc-800 ${activeTool === 'pan' ? 'bg-zinc-800 text-[hsl(246,72%,78%)]' : 'text-zinc-400'}`}
      >
        <IconPan />
      </button>

      <div className="h-5 w-px bg-zinc-800" />

      <div className="flex items-center gap-2">
        <button onClick={onZoomOut} title="Zoom Out" className="rounded-lg p-1.5 text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white">
          <IconZoomOut />
        </button>
        <span className="w-12 select-none text-center text-xs font-bold tracking-widest text-zinc-300">
          {zoomPercent}%
        </span>
        <button onClick={onZoomIn} title="Zoom In" className="rounded-lg p-1.5 text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white">
          <IconZoomIn />
        </button>
      </div>

      <div className="h-5 w-px bg-zinc-800" />

      <button
        onClick={onZoomFit}
        title="Fit to screen"
        className="rounded-lg px-2.5 py-1 text-[10px] font-black tracking-wider text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white"
      >
        FIT
      </button>
      <button
        onClick={onZoom100}
        title="Reset to 100%"
        className="rounded-lg px-2.5 py-1 text-[10px] font-black tracking-wider text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white"
      >
        100%
      </button>

      <div className="h-5 w-px bg-zinc-800" />

      <button
        onClick={onToggleAnnotations}
        title={showAnnotations ? 'Hide Annotations' : 'Show Annotations'}
        className={`rounded-lg p-1.5 transition-all hover:bg-zinc-800 ${showAnnotations ? 'text-[hsl(246,72%,78%)]' : 'text-zinc-500'}`}
      >
        {showAnnotations ? <IconEye /> : <IconEyeOff />}
      </button>
    </div>
  );
}
