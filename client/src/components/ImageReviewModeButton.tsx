import { Button } from 'antd';
import type { ReactNode } from 'react';

interface ImageReviewModeButtonProps {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const ImageReviewModeButton = ({
  icon,
  label,
  active,
  onClick,
}: ImageReviewModeButtonProps) => {
  return (
    <Button
      type="text"
      onClick={onClick}
      className={`!h-auto w-full border-0 py-3 px-2 rounded-lg flex flex-col items-center gap-1 transition-all duration-300 ease-in-out ${
        active
          ? 'bg-primary text-white shadow-sm'
          : 'text-muted-foreground hover:!bg-white/60 hover:text-primary'
      }`}
    >
      <span className="text-base leading-none">{icon}</span>
      <span className="text-[10px] font-bold tracking-wider">{label}</span>
    </Button>
  );
};

export default ImageReviewModeButton;