import { observer } from 'mobx-react-lite';
import type { AnnotationCore } from '../../../store/review/ReviewCoreStore';
import { IconChevronLeft, IconChevronRight, IconLayerCircle, IconLayerRect } from '../../imageReview/icons/ReviewIcons';
import { LayerListItem } from './LayerListItem';

interface LayersPanelProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  annotations: AnnotationCore[];
  highlightedAnnotationId: string | null;
  onHighlightToggle: (id: string | null) => void;
  variant: 'image' | 'video';
}

export const LayersPanel = observer(({
  collapsed,
  onToggleCollapsed,
  annotations,
  highlightedAnnotationId,
  onHighlightToggle,
  variant,
}: LayersPanelProps) => {
  return (
    <aside
      className={`relative flex h-full shrink-0 flex-col overflow-hidden border-r border-[var(--color-border)] bg-[var(--color-card)] transition-[width] duration-300 ${
        collapsed ? 'w-12' : 'w-[280px]'
      }`}
    >
      <button
        onClick={onToggleCollapsed}
        title={collapsed ? 'Show layers' : 'Hide layers'}
        className="absolute top-1/2 z-30 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] shadow-md"
        style={{ right: -12 }}
      >
        {collapsed ? <IconChevronRight /> : <IconChevronLeft />}
      </button>

      {collapsed ? (
        <div className="flex flex-1 flex-col items-center gap-3 overflow-hidden pt-4 text-[var(--color-muted-foreground)]">
          <IconLayerRect />
          <IconLayerCircle />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col p-4">
          <h3 className="mb-3 shrink-0 text-xs font-black uppercase tracking-wider text-[var(--color-foreground)]">
            Layers
          </h3>
          <div className="flex-1 space-y-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {annotations.length === 0 ? (
              <p className="py-4 text-center text-[10px] text-[var(--color-muted-foreground)]">No layers yet</p>
            ) : (
              annotations.map((ann, idx) => (
                <LayerListItem
                  key={ann.annotationId}
                  ann={ann}
                  index={idx}
                  variant={variant}
                  isHighlighted={highlightedAnnotationId === ann.annotationId}
                  onClick={() =>
                    onHighlightToggle(highlightedAnnotationId === ann.annotationId ? null : ann.annotationId ?? null)
                  }
                />
              ))
            )}
          </div>
        </div>
      )}
    </aside>
  );
});
