export interface ImageVersion {
  id: number;
  name: string;
  date: string;
}

export interface ImageReviewItem {
  id: number;
  name: string;
  url: string;
  size: string;
  dimensions: string;
  uploadDate: string;
  uploader: string;
  versions: ImageVersion[];
}

export interface CommentReaction {
  emoji: string;
  count: number;
}

export interface CommentReply {
  id: number;
  author: string;
  avatar: string;
  time: string;
  text: string;
  reactions: CommentReaction[];
}

export interface CommentItemData extends CommentReply {
  replies: CommentReply[];
}

export interface ActionLogItem {
  id: number;
  icon: string;
  action: string;
  details?: string;
  time: string;
}

export interface ShapeOption {
  id: 'rectangle' | 'circle' | 'arrow' | string;
  name: string;
}

export type ReviewTool = 'pan' | 'comment' | null;

export interface SidebarSectionState {
  shapes: boolean;
  comments: boolean;
  actionLog: boolean;
  imageInfo: boolean;
}
