import {
  IconSelect, IconRect, IconCircle, IconArrow, IconPan,
  IconTrash, IconUndo, IconRedo,
} from './icons/ReviewIcons';
import { STROKE_COLORS } from './constants';
import type { StrokeColor } from './constants';

type ToolId = 'select' | 'rect' | 'circle' | 'arrow' | 'pan';

interface LeftToolbarProps {
  activeTool: string;
  activeColor: StrokeColor;
  onToolClick: (tool: ToolId) => void;
  onColorChange: (c: StrokeColor) => void;
}

const TOOLS = [
  { id: 'select' as const, Icon: IconSelect, label: 'SELECT', title: 'Select (V)' },
  { id: 'rect'   as const, Icon: IconRect,   label: 'RECT',   title: 'Rectangle (R)' },
  { id: 'circle' as const, Icon: IconCircle, label: 'CIRCLE', title: 'Circle (O)' },
  { id: 'arrow'  as const, Icon: IconArrow,  label: 'ARROW',  title: 'Arrow (A)' },
  { id: 'pan'    as const, Icon: IconPan,    label: 'PAN',    title: 'Pan (H)' },
] as const;

export function LeftToolbar({ activeTool, activeColor, onToolClick, onColorChange }: LeftToolbarProps) {
  return (
    <div className="absolute left-4 top-4 z-10 flex flex-col gap-1.5 rounded-2xl border border-zinc-800/80 bg-zinc-900/90 p-1.5 shadow-2xl">
      {TOOLS.map(({ id, Icon, label, title }) => (
        <button
          key={id}
          onClick={() => onToolClick(id)}
          title={title}
          className={`flex h-10 w-10 flex-col items-center justify-center rounded-xl transition-all ${
            activeTool === id
              ? 'bg-[hsl(240,30%,46%)] text-white'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          <Icon />
          <span className="mt-0.5 text-[7px] font-black">{label}</span>
        </button>
      ))}

      <div className="mx-1.5 my-1 h-px bg-zinc-800" />

      <button
        title="Delete Selected (Del)"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition-all hover:bg-rose-950/80 hover:text-rose-400"
      >
        <IconTrash />
      </button>
      <button title="Undo" className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition-all hover:bg-zinc-800 hover:text-white">
        <IconUndo />
      </button>
      <button title="Redo" className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition-all hover:bg-zinc-800 hover:text-white">
        <IconRedo />
      </button>

      {/* Color picker swatch */}
      <div className="group/color relative flex h-10 w-10 cursor-pointer items-center justify-center">
        <div className="h-5 w-5 rounded-full border border-white/50" style={{ backgroundColor: activeColor }} />
        <div className="absolute left-full top-0 z-30 ml-2 hidden flex-col gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 p-2 shadow-2xl group-hover/color:flex">
          <span className="mb-1 text-[9px] font-black uppercase tracking-wider text-zinc-500">COLOR</span>
          <div className="flex gap-1.5">
            {STROKE_COLORS.map(c => (
              <button
                key={c}
                onClick={() => onColorChange(c)}
                title={c}
                className={`h-6 w-6 rounded-full border-2 transition-all hover:scale-110 ${
                  activeColor === c ? 'scale-105 border-white' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
