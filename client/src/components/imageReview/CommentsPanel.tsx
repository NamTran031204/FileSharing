import CommentItem from './CommentItem';
import type { CommentItemData } from './types';

interface CommentsPanelProps {
  comments: CommentItemData[];
  onReply?: (commentId: number) => void;
}

const CommentsPanel = ({ comments, onReply }: CommentsPanelProps) => {
  if (comments.length === 0) {
    return <div className="text-center text-xs text-muted-foreground">No comments yet.</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} onReply={onReply} />
      ))}
    </div>
  );
};

export default CommentsPanel;
