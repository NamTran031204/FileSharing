import {
  IconSelect, IconRect, IconCircle, IconArrow, IconPan,
  IconTrash, IconUndo, IconRedo,
} from '../imageReview/icons/ReviewIcons';
import { STROKE_COLORS } from '../imageReview/constants';
import type { StrokeColor } from '../imageReview/constants';
import uiUtils from '../../utils/uiUtils.tsx';
import i18n from '../../i18n';

export type MarkupToolId = 'select' | 'rect' | 'circle' | 'arrow' | 'pan';

export interface FloatingMarkupToolbarProps {
  activeTool: string;
  activeColor: StrokeColor;
  onToolClick: (tool: MarkupToolId) => void;
  onColorChange: (c: StrokeColor) => void;
  // onDelete/onUndo/onRedo optional: neu khong truyen, fallback toast bao chua ho tro
  // (thieu history stack that trong useKonvaCanvas).
  onDelete?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

const getTools = () => [
  { id: 'select' as const, Icon: IconSelect, title: i18n.t('review:tool.select') },
  { id: 'rect'   as const, Icon: IconRect,   title: i18n.t('review:tool.rect') },
  { id: 'circle' as const, Icon: IconCircle, title: i18n.t('review:tool.circle') },
  { id: 'arrow'  as const, Icon: IconArrow,  title: i18n.t('review:tool.arrow') },
  { id: 'pan'    as const, Icon: IconPan,    title: i18n.t('review:tool.pan') },
];

export function FloatingMarkupToolbar({
  activeTool,
  activeColor,
  onToolClick,
  onColorChange,
  onDelete,
  onUndo,
  onRedo,
}: FloatingMarkupToolbarProps) {
  const handleDelete = onDelete ?? (() => uiUtils.showInfor(i18n.t('review:floatingMarkupToolbar.xoaVungChonChuaHo')));
  const handleUndo = onUndo ?? (() => uiUtils.showInfor(i18n.t('review:floatingMarkupToolbar.undoChuaHoTroThieu')));
  const handleRedo = onRedo ?? (() => uiUtils.showInfor(i18n.t('review:floatingMarkupToolbar.redoChuaHoTroThieu')));

  return (
    <div className="absolute left-4 top-4 z-30 flex items-center gap-1 rounded-full border border-[var(--color-canvas-border)] bg-[var(--color-canvas-elevated)] px-2 py-1.5 shadow-2xl backdrop-blur-md">
      {getTools().map(({ id, Icon, title }) => (
        <button
          key={id}
          onClick={() => onToolClick(id)}
          title={title}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
            activeTool === id
              ? 'bg-[var(--color-accent)] text-[var(--color-foreground)]'
              : 'text-white/70 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Icon />
        </button>
      ))}

      <div className="mx-1 h-5 w-px bg-white/15" />

      <button
        onClick={handleDelete}
        title={i18n.t('review:floatingMarkupToolbar.deleteSelectedDel')}
        className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-all hover:bg-rose-950/60 hover:text-rose-400"
      >
        <IconTrash />
      </button>
      <button
        onClick={handleUndo}
        title={i18n.t('review:floatingMarkupToolbar.undo')}
        className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-all hover:bg-white/10 hover:text-white"
      >
        <IconUndo />
      </button>
      <button
        onClick={handleRedo}
        title={i18n.t('review:floatingMarkupToolbar.redo')}
        className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-all hover:bg-white/10 hover:text-white"
      >
        <IconRedo />
      </button>

      <div className="mx-1 h-5 w-px bg-white/15" />

      <div className="group/color relative flex h-8 w-8 cursor-pointer items-center justify-center">
        <div className="h-4 w-4 rounded-full border border-white/50" style={{ backgroundColor: activeColor }} />
        <div className="absolute left-full top-0 z-30 ml-2 hidden flex-col gap-1.5 rounded-lg border border-[var(--color-canvas-border)] bg-[var(--color-canvas-elevated)] p-2 shadow-2xl group-hover/color:flex">
          <span className="mb-1 text-[9px] font-black uppercase tracking-wider text-white/50">{i18n.t('review:floatingMarkupToolbar.color')}</span>
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
