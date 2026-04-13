import type { ReactNode } from 'react';
import { Button, Tooltip } from 'antd';

interface ReviewToolButtonProps {
  title: string;
  icon: ReactNode;
  isActive?: boolean;
  isDanger?: boolean;
  onClick?: () => void;
}

const ReviewToolButton = ({ title, icon, isActive = false, isDanger = false, onClick }: ReviewToolButtonProps) => {
  const colorClass = isDanger
    ? 'text-[#ba1a1a] hover:bg-[#ba1a1a]/10'
    : isActive
      ? 'bg-[#3b3a7e] text-white shadow-lg shadow-[#3b3a7e]/20'
      : 'text-[#474650] hover:bg-[#e7e6ff]';

  return (
    <Tooltip title={title} placement="right">
      <Button
        type="text"
        icon={icon}
        onClick={onClick}
        className={`h-11 w-11 !rounded-xl border-none flex items-center justify-center transition-all ${colorClass}`}
      />
    </Tooltip>
  );
};

export default ReviewToolButton;