import type { ActionLogItem, CommentItemData, ImageReviewItem, ShapeOption } from './types';

// TODO: Replace with real API call (AssetControllerService.getById + versions)
export const mockImages: ImageReviewItem[] = [
  {
    id: 1,
    name: 'hero-banner-desktop.png',
    url: 'data:image/svg+xml,%3Csvg width="800" height="600" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="800" height="600" fill="%23535297"/%3E%3Ctext x="50%25" y="50%25" fill="white" font-size="24" text-anchor="middle" dy=".3em"%3EHERO BANNER%3C/text%3E%3C/svg%3E',
    size: '2.4 MB',
    dimensions: '1920 × 1080',
    uploadDate: '2024-01-20 14:30',
    uploader: 'Nam Nguyen',
    versions: [
      { id: 3, name: 'v3 - Current', date: '2024-01-20 14:30' },
      { id: 2, name: 'v2', date: '2024-01-19 10:15' },
      { id: 1, name: 'v1', date: '2024-01-18 16:45' },
    ],
  },
  {
    id: 2,
    name: 'product-card-mobile.jpg',
    url: 'data:image/svg+xml,%3Csvg width="600" height="800" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="600" height="800" fill="%23A6A0ED"/%3E%3Ctext x="50%25" y="50%25" fill="white" font-size="24" text-anchor="middle" dy=".3em"%3EPRODUCT CARD%3C/text%3E%3C/svg%3E',
    size: '1.8 MB',
    dimensions: '750 × 1334',
    uploadDate: '2024-01-20 11:20',
    uploader: 'John Doe',
    versions: [
      { id: 2, name: 'v2 - Current', date: '2024-01-20 11:20' },
      { id: 1, name: 'v1', date: '2024-01-19 15:30' },
    ],
  },
  {
    id: 3,
    name: 'footer-illustration.svg',
    url: 'data:image/svg+xml,%3Csvg width="1200" height="400" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="1200" height="400" fill="%232A2F6F"/%3E%3Ctext x="50%25" y="50%25" fill="white" font-size="24" text-anchor="middle" dy=".3em"%3EFOOTER ILLUSTRATION%3C/text%3E%3C/svg%3E',
    size: '450 KB',
    dimensions: '1920 × 640',
    uploadDate: '2024-01-19 16:45',
    uploader: 'Sarah Chen',
    versions: [{ id: 1, name: 'v1 - Current', date: '2024-01-19 16:45' }],
  },
];

// TODO: Replace with real API call (CommentControllerService.getByAsset)
export const mockComments: CommentItemData[] = [
  {
    id: 1,
    author: 'John Doe',
    avatar: 'JD',
    time: '2 hours ago',
    text: 'The color contrast needs improvement. Can we make the CTA button more prominent?',
    reactions: [
      { emoji: '👍', count: 3 },
      { emoji: '👀', count: 1 },
    ],
    replies: [
      {
        id: 11,
        author: 'Nam Nguyen',
        avatar: 'NN',
        time: '1 hour ago',
        text: "Good point! I'll adjust the saturation and add more shadow.",
        reactions: [],
      },
    ],
  },
  {
    id: 2,
    author: 'Sarah Chen',
    avatar: 'SC',
    time: '3 hours ago',
    text: 'Looks great overall! Just one thing - the typography hierarchy could be clearer.',
    reactions: [{ emoji: '✅', count: 2 }],
    replies: [],
  },
];

// TODO: Replace with real API call (AssetActivityControllerService.getLogs)
export const mockActionLog: ActionLogItem[] = [
  { id: 1, icon: '🔄', action: 'Image changed', details: 'hero-banner-desktop.png', time: 'Just now' },
  { id: 2, icon: '🔍', action: 'Zoomed to 150%', time: '2 min ago' },
  { id: 3, icon: '💬', action: 'Comment added', details: 'by John Doe', time: '5 min ago' },
  { id: 4, icon: '⬜', action: 'Rectangle drawn', time: '8 min ago' },
  { id: 5, icon: '✅', action: 'Image approved', details: 'by Sarah Chen', time: '1 hour ago' },
];

export const shapes: ShapeOption[] = [
  { id: 'rectangle', name: 'Rectangle' },
  { id: 'circle', name: 'Circle' },
  { id: 'arrow', name: 'Arrow' },
];
