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
      className={`h-auto w-full border-0 py-3 px-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
        active
          ? 'bg-white text-[#3b3a7e] shadow-sm'
          : 'text-[#474650] hover:!bg-white/60'
      }`}
    >
      <span className="text-base leading-none">{icon}</span>
      <span className="text-[10px] font-bold tracking-wider">{label}</span>
    </Button>
  );
};

export default ImageReviewModeButton;