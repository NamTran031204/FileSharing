import { CheckCircleFilled, UserOutlined } from '@ant-design/icons';
import { Avatar } from 'antd';

export type ReviewFeedbackStatus = 'open' | 'resolved';

export interface ImageReviewFeedback {
  id: string;
  author: string;
  avatarUrl?: string;
  createdAt: string;
  message: string;
  previewImageUrl?: string;
  status: ReviewFeedbackStatus;
  isMuted?: boolean;
}

interface ImageReviewFeedbackItemProps {
  item: ImageReviewFeedback;
  active: boolean;
  onSelect: (id: string) => void;
}

const ImageReviewFeedbackItem = ({
  item,
  active,
  onSelect,
}: ImageReviewFeedbackItemProps) => {
  const openStatusClass =
    'text-[9px] font-black px-2 py-0.5 bg-[#b5b1fe]/20 text-[#5a569c] rounded uppercase tracking-tight';

  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className={`w-full text-left p-4 rounded-2xl space-y-3 transition-all border ${
        item.isMuted ? 'opacity-70 bg-[#eeecff]' : 'bg-white shadow-sm'
      } ${
        active ? 'border-[#3b3a7e]/20' : 'border-transparent hover:border-[#3b3a7e]/10'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {item.avatarUrl ? (
            <Avatar src={item.avatarUrl} size={32} />
          ) : (
            <Avatar
              size={32}
              icon={<UserOutlined />}
              className="bg-[#3b3a7e]/10 text-[#3b3a7e]"
            />
          )}
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-[#0d1154] truncate">{item.author}</h4>
            <span className="text-[10px] text-[#777681]">{item.createdAt}</span>
          </div>
        </div>
        {item.status === 'open' ? (
          <span className={openStatusClass}>OPEN</span>
        ) : (
          <div className="flex items-center gap-1 text-[9px] font-black text-[#3f397e]">
            <CheckCircleFilled className="text-sm" />
            <span>RESOLVED</span>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <div className="w-16 h-12 rounded-lg bg-[#f4f2ff] overflow-hidden flex-shrink-0 border border-[#c8c5d2]/30">
          {item.previewImageUrl ? (
            <img
              src={item.previewImageUrl}
              alt={`${item.author} preview`}
              className="w-full h-full object-cover"
            />
          ) : null}
        </div>
        <p className="text-xs text-[#474650] leading-relaxed">{item.message}</p>
      </div>
    </button>
  );
};

export default ImageReviewFeedbackItem;