import type { CommentItemData, CommentReply } from './types';

interface CommentItemProps {
  comment: CommentItemData | CommentReply;
  isReply?: boolean;
  onReply?: (commentId: number) => void;
}

const CommentAvatar = ({ initials }: { initials: string }) => (
  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-semibold text-white">
    {initials}
  </div>
);

const CommentItem = ({ comment, isReply, onReply }: CommentItemProps) => {
  const replies = 'replies' in comment ? comment.replies : [];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <CommentAvatar initials={comment.avatar} />
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-foreground">{comment.author}</div>
          <div className="text-[11px] text-muted-foreground">{comment.time}</div>
        </div>
      </div>

      <div className="pl-9 text-[13px] leading-relaxed text-foreground">{comment.text}</div>

      {comment.reactions.length > 0 && (
        <div className="mt-1 flex gap-2 pl-9">
          {comment.reactions.map((reaction, idx) => (
            <button
              key={idx}
              type="button"
              className="flex items-center gap-1 rounded-full bg-background px-2 py-1 text-xs transition-colors hover:bg-muted/30"
            >
              <span>{reaction.emoji}</span>
              <span>{reaction.count}</span>
            </button>
          ))}
        </div>
      )}

      {!isReply && onReply && (
        <div className="mt-1 pl-9">
          <button
            type="button"
            onClick={() => onReply(comment.id)}
            className="text-xs font-medium text-primary hover:underline"
          >
            Reply
          </button>
        </div>
      )}

      {replies.length > 0 && (
        <div className="ml-9 mt-3 flex flex-col gap-4 border-l-2 border-border/40 pl-4">
          {replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} isReply />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
