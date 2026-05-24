import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Button } from 'antd';

interface CanvasHeaderProps {
  imageName: string;
  currentIndex: number;
  total: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

const CanvasHeader = ({
  imageName,
  currentIndex,
  total,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
}: CanvasHeaderProps) => {
  return (
    <div className="z-10 flex h-14 shrink-0 items-center justify-between border-b border-border/40 bg-card px-6">
      <div className="text-sm font-semibold text-foreground">{imageName}</div>

      <div className="flex items-center gap-2">
        <Button
          icon={<LeftOutlined />}
          onClick={onPrev}
          disabled={!canGoPrev}
          className="flex h-8 w-8 items-center justify-center rounded-md border-border text-primary"
        />
        <span className="mx-1 text-[13px] text-muted-foreground">
          {currentIndex + 1} / {total}
        </span>
        <Button
          icon={<RightOutlined />}
          onClick={onNext}
          disabled={!canGoNext}
          className="flex h-8 w-8 items-center justify-center rounded-md border-border text-primary"
        />
      </div>
    </div>
  );
};

export default CanvasHeader;
