import { ArrowRightOutlined, BorderOutlined, Loading3QuartersOutlined } from '@ant-design/icons';
import type { ShapeOption } from './types';

interface ShapesPanelProps {
  shapes: ShapeOption[];
  activeShapeId?: string | null;
  onSelect: (shapeId: string) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  rectangle: <BorderOutlined className="text-base" />,
  circle: <Loading3QuartersOutlined className="text-base" />,
  arrow: <ArrowRightOutlined className="text-base" />,
};

const ShapesPanel = ({ shapes, activeShapeId, onSelect }: ShapesPanelProps) => {
  return (
    <div className="flex flex-col gap-2">
      {shapes.map((shape) => {
        const active = activeShapeId === shape.id;
        return (
          <button
            key={shape.id}
            type="button"
            onClick={() => onSelect(shape.id)}
            className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-all ${
              active
                ? 'border-2 border-primary bg-background'
                : 'border border-border/40 bg-card hover:border-primary hover:bg-background'
            }`}
          >
            <span className="flex h-6 w-6 items-center justify-center text-primary">
              {ICON_MAP[shape.id] ?? <BorderOutlined />}
            </span>
            <span className="text-sm font-medium text-foreground">{shape.name}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ShapesPanel;
