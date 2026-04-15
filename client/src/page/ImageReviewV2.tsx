import {
  AimOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  BellOutlined,
  BorderOutlined,
  DeleteOutlined,
  DownloadOutlined,
  DownOutlined,
  DribbbleOutlined,
  EditOutlined,
  FontSizeOutlined,
  FullscreenOutlined,
  HighlightOutlined,
  LogoutOutlined,
  MessageOutlined,
  PaperClipOutlined,
  PictureOutlined,
  QuestionCircleOutlined,
  RedoOutlined,
  RightOutlined,
  SearchOutlined,
  SettingOutlined,
  TeamOutlined,
  UndoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Input, Slider } from 'antd';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import AppSidebar from '../components/AppSidebar';
import ImageReviewFeedbackItem, {
  type ImageReviewFeedback,
} from '../components/ImageReviewFeedbackItem';
import ImageReviewModeButton from '../components/ImageReviewModeButton';
// import useImage from "use-image";
// import {Image as KonvaImage} from "react-konva/ReactKonvaCore";

const { TextArea } = Input;

type MarkupMode = 'select' | 'draw' | 'text';
type ShapeTool = 'rectangle' | 'circle' | 'gesture';

interface ImageReviewV2Props {
  imageName?: string;
  campaignName?: string;
  imageUrl?: string;
}

interface ShapeToolOption {
  key: ShapeTool;
  label: string;
  icon: ReactNode;
}

interface WorkspaceAction {
  key: string;
  label: string;
  icon: ReactNode;
}

const DEFAULT_IMAGE_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDwc361glmFw5AHO-gkri9NQhDXcY-G8d__sNqinCFAAMBxMLD023GDItL6Fq0UYdx7eKNMeMjtALnXLwsQm5ZQ3GqkLbLrciXm3ibCxbZGxKWbnwq_0vw8fnDzfyiy4W43zeu46WtfDD08F7KeqhtzWT5eLpMgpwjSyzBmiFgHHGDFO3oHWncVv5yY9V22-4UH73KOWQcXrAwwIgBqqmiHJz2sf6qwv3z9ugV7Ut0RmY9do2l7E87XgaLALt1Slfm09gyB5k9lPww';

const FEEDBACK_ITEMS: ImageReviewFeedback[] = [
  {
    id: 'feedback-1',
    author: 'Marcus K.',
    createdAt: '12m ago',
    message:
      'The lighting on the left curvature feels a bit too harsh compared to the reference.',
    status: 'open',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDhh4g_d4hLdkWVmLr7Q--gunaCwtLYApYiRbzqBwB8OW8umQqWjQqrGqTrlijXOjoEHtMekPwp6PBjxYoikH3vzs4V8RcGpZ5D3wsHsAgUkAK2kGJJJkyDxvganBiJfsZxcCiz1u3KFGI26wz_gEjZJLzsjqEmHzku2rcSk8aQ7_2Fb4cD9FLAcy3TDRakGGxHX2BjHYD_G5ooINTZ6McI5H5T3vibUhRCmg5W1dYNIwgkmRUUpLsFtrZ9UWdSR4Xcok7TZkSaGvU',
    previewImageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAnF1gerDjlI9i8O8vjGrRK7rBvCSx2SLwgxvuMFPv9t3MjZ_mETex2pIKMX3oqEyzwPN4Hus1T6rDMUCnAADHqcO6hOcJpz3uZ2ZEouJW0lEjqnJj43mvR4a3pWmLPV7P4pQPhXdZkX7XSBwJdG5R1ZwWBOSaC0-xs-HkjC9dhbQ8_Wf23M1WNmMxDTvmSLb5V9tI-ha8ejj5QzlVxhqlE1c0GGVxcVgNd8g_M0xR3M-PAemTxFElcCWNAsCBImse2vRvzrXvLdpQ',
  },
  {
    id: 'feedback-2',
    author: 'Lena Chen',
    createdAt: '2h ago',
    message: 'Great work on the texture resolution here. Looks perfect for 4k print.',
    status: 'resolved',
    isMuted: true,
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAKjRlT82hVTb-zg-Xt58T0mBChioKZnMFnWEHPYJ-kg1Wop0coBNVahQx2m_1dM_36wrsmB-8Y75fgLkZZ54Cm__7Gjir2t_PzijmR3gRFOBRTAAzw9-v62bCG6V5g5osPPHD5rlXpdHVGHDUK4tFJUbw9DewqFQ5dl1cdAMAa9eBwZxfvVGxbFmtnuGNjRXnKLQxvS8nkXMwNkR5TOsK_gSEvQ1N2cnE8XzpC2doZe6HaRMgDtqKRczIrnqssig6gXzxZSKwhCaw',
    previewImageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDoXwXBdbYt2EuTWI_hF6H_Xg6GmMDtTSbsXzRZaqn1pZPQdG8I6Ibx72Piq2UVsTi-wm9esVv9yPtvGqbrab5TG1R3u4eIF9rDOQRbDFw0MfYtnkeLxwq5Cdzoj8WRE702tdqDzAhKMs-2TyUCP4a2Y593pP63-S2SdnI7vxhXSAI5VfrIYnro69ToutpTsl3xb2xSWkMopOt02ZBs5LA5GHUaXoJ0uHoOM-z5LxJnqMI15XMzbOgYwbQLfYX5dACXtwcX9GDD7z8',
  },
  {
    id: 'feedback-3',
    author: 'Curator',
    createdAt: '4h ago',
    message: 'Let us try a different color variant for this specific organic structure.',
    status: 'open',
    previewImageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDEeCd9NO51FHZqjM3ZK9woJVKaorFN3B-Etgx6y1bd42wgVfgelBMt3yfKZ7EKU55pxDe8cOo4lbZV9sDgkXYQs1mCOWnTBqN-xp5XQs9OYscy3DZxE1lX5-yocW6rGXf0zdbQK-lGOFt7BB7--BhBAQDWQTTE_e_6M9TJTibmeFzGUk_t_1RuidWEkbROotWKXo6HvCJQJRxRT-m6-mS1ceTY77mAhoBC9zLndqmkCbZSFKQldw35798AYcUcC9egiT9AMQMroCU',
  },
];

const MODE_OPTIONS: Array<{ key: MarkupMode; label: string; icon: ReactNode }> = [
  { key: 'select', label: 'SELECT', icon: <AimOutlined /> },
  { key: 'draw', label: 'DRAW', icon: <EditOutlined /> },
  { key: 'text', label: 'TEXT', icon: <FontSizeOutlined /> },
];

const SHAPE_OPTIONS: ShapeToolOption[] = [
  { key: 'rectangle', label: 'Rectangle', icon: <BorderOutlined /> },
  { key: 'circle', label: 'Circle', icon: <DribbbleOutlined /> },
  { key: 'gesture', label: 'Gesture', icon: <HighlightOutlined /> },
];

const WORKSPACE_ACTIONS: WorkspaceAction[] = [
  { key: 'artworks', label: 'Artworks', icon: <PictureOutlined /> },
  { key: 'collections', label: 'Collections', icon: <AppstoreOutlined /> },
  { key: 'team-library', label: 'Team Library', icon: <TeamOutlined /> },
  { key: 'analytics', label: 'Analytics', icon: <BarChartOutlined /> },
  { key: 'settings', label: 'Settings', icon: <SettingOutlined /> },
  { key: 'support', label: 'Support', icon: <QuestionCircleOutlined /> },
  { key: 'sign-out', label: 'Sign Out', icon: <LogoutOutlined /> },
];

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
//
// function BackgroundImage({ src }: { src: string }) {
//     // useImage tự động load ảnh và trả về HTMLImageElement
//     const [image, status] = useImage(src);
//
//     // Hiển thị placeholder khi ảnh đang load
//     if (status === "loading") {
//         return null; // Có thể thêm loading indicator nếu muốn
//     }
//
//     return (
//         <KonvaImage
//             image={image}      // HTMLImageElement
//             x={0}              // Góc trái-trên của ảnh
//             y={0}
//             width={CANVAS_WIDTH}   // Stretch full canvas
//             height={CANVAS_HEIGHT}
//         />
//     );
// }

const ImageReviewV2 = ({
  imageName = 'Hero_Final.jpg',
  campaignName = 'Marketing Campaign',
  imageUrl = DEFAULT_IMAGE_URL,
}: ImageReviewV2Props) => {
  const [activeMode, setActiveMode] = useState<MarkupMode>('select');
  const [activeShape, setActiveShape] = useState<ShapeTool>('rectangle');
  const [strokeSize, setStrokeSize] = useState<number>(4);
  const [searchText, setSearchText] = useState('');
  const [commentDraft, setCommentDraft] = useState('');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string>(
    FEEDBACK_ITEMS[0]?.id ?? '',
  );

  // TODO: replace local mock data with server response from the review feedback API.
  const filteredFeedback = useMemo(() => {
    const normalizedKeyword = searchText.trim().toLowerCase();

    if (!normalizedKeyword) {
      return FEEDBACK_ITEMS;
    }

    return FEEDBACK_ITEMS.filter((item) => {
      const searchableContent = `${item.author} ${item.message}`.toLowerCase();
      return searchableContent.includes(normalizedKeyword);
    });
  }, [searchText]);

  const openFeedbackCount = useMemo(
    () => FEEDBACK_ITEMS.filter((item) => item.status === 'open').length,
    [],
  );

  const handleZoomIn = () => {
    setZoomLevel((previousValue) => Math.min(previousValue + 10, 300));
  };

  const handleZoomOut = () => {
    setZoomLevel((previousValue) => Math.max(previousValue - 10, 25));
  };

  const handlePostComment = () => {
    if (!commentDraft.trim()) {
      return;
    }

    // TODO: send commentDraft to backend and refresh feedback list.
    setCommentDraft('');
  };

  return (
    <div className="bg-background text-foreground min-h-screen overflow-hidden flex flex-col">
      <AppHeader />

      <main className="flex flex-1 pt-16 h-screen overflow-hidden">
        <AppSidebar />

        <div className="flex-1 h-full flex overflow-hidden">
          <section className="flex-1 relative bg-background flex flex-col overflow-hidden">
            <div className="px-8 py-4 bg-white/70 backdrop-blur-sm border-b border-border flex items-center justify-between gap-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                <Link to="/dashboard" className="hover:text-primary-dark transition-colors">
                  Dashboard
                </Link>
                <RightOutlined className="text-[10px] text-muted-foreground" />
                <span className="truncate">{campaignName}</span>
                <RightOutlined className="text-[10px] text-muted-foreground" />
                <span className="font-semibold text-primary-dark truncate">{imageName}</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="text"
                  className="!h-9 px-3 rounded-full bg-muted text-primary-dark text-xs font-bold tracking-widest"
                >
                  v4
                  <DownOutlined className="text-[10px]" />
                </Button>
                <Button
                  type="text"
                  icon={<BellOutlined />}
                  className="!h-9 !w-9 rounded-full text-muted-foreground hover:!bg-muted"
                />
                <Button
                  type="text"
                  icon={<MessageOutlined />}
                  className="!h-9 !w-9 rounded-full text-muted-foreground hover:!bg-muted"
                />
                <Avatar
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGOrDfJbWpoHdpY3rrZMrq5TCW_-YUtO2nHfrtDg-m9763x3kK1sMlCDzHeAG-NhOX59Eqc4PYcj1T3yx3-UEHi1R1XwvX8Wz0-AGUFg_fdv9MAYQ7aA9Tic8HGyv4dLsCb3gbgvn3trKyYnSImNjXrVw-xze12Z7Dw8Drk4TTOB41iatYlrFgD6OBAewYeAD_kOiYXVeX2WJxaBNo872uODNJxvAydFNTTa6VMeTI3cFAVgDxK5q55znThl99diHyXG9dVcfYBP4"
                  size={36}
                  className="border border-border"
                />
              </div>
            </div>

            <div className="flex-1 relative p-8 flex items-center justify-center overflow-hidden">
              <div className="absolute left-6 top-6 grid grid-cols-2 gap-2 rounded-2xl bg-white/80 p-2 shadow-sm backdrop-blur-sm border border-border">
                {WORKSPACE_ACTIONS.map((action) => (
                  <Button
                    key={action.key}
                    type="text"
                    className="!h-auto px-3 py-2 rounded-lg text-xs text-muted-foreground hover:!bg-muted flex items-center justify-start gap-2"
                  >
                    {action.icon}
                    <span>{action.label}</span>
                  </Button>
                ))}
              </div>

              <div className="relative group max-w-full max-h-full shadow-2xl rounded-sm">
                <img
                  src={imageUrl}
                  alt={imageName}
                  className="max-w-full max-h-[760px] object-contain transition-transform duration-200"
                  style={{ transform: `scale(${zoomLevel / 100})` }}
                />
                <div className="absolute top-1/4 left-1/3 w-48 h-32 border-2 border-primary-dark bg-primary-dark/10 rounded-sm cursor-pointer group-hover:border-white transition-colors flex items-center justify-center">
                  <div className="bg-primary-dark text-white text-[10px] font-bold px-1.5 py-0.5 absolute -top-5 left-0 rounded-t-sm">
                    ID: 082
                  </div>
                </div>
              </div>

              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-xl flex items-center gap-1 p-1.5 rounded-2xl shadow-lg border border-white/50">
                <Button
                  type="text"
                  icon={<ZoomInOutlined />}
                  onClick={handleZoomIn}
                  className="!h-10 !w-10 rounded-xl text-primary-dark hover:!bg-muted"
                />
                <Button
                  type="text"
                  icon={<ZoomOutOutlined />}
                  onClick={handleZoomOut}
                  className="!h-10 !w-10 rounded-xl text-primary-dark hover:!bg-muted"
                />
                <div className="w-px h-6 bg-border/50 mx-1" />
                <Button
                  type="text"
                  className="!h-10 px-4 text-xs font-bold text-primary-dark hover:!bg-muted rounded-xl"
                  onClick={() => setZoomLevel(100)}
                >
                  FIT
                </Button>
                <Button
                  type="text"
                  className="!h-10 px-4 text-xs font-bold text-primary-dark hover:!bg-muted rounded-xl"
                  onClick={() => setZoomLevel(100)}
                >
                  {zoomLevel}%
                </Button>
                <div className="w-px h-6 bg-border/50 mx-1" />
                <Button
                  type="text"
                  icon={<FullscreenOutlined />}
                  className="!h-10 !w-10 rounded-xl text-primary-dark hover:!bg-muted"
                />
                <Button
                  type="text"
                  icon={<DownloadOutlined />}
                  className="!h-10 !w-10 rounded-xl text-primary-dark hover:!bg-muted"
                />
              </div>
            </div>
          </section>

          <aside className="w-[380px] h-full flex flex-col bg-muted border-l border-border">
            <div className="p-6 border-b border-border space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-foreground tracking-tight">MARKUP TOOLS</h3>
                <div className="flex gap-1">
                  <Button
                    type="text"
                    icon={<UndoOutlined className="text-lg" />}
                    className="!h-9 !w-9 rounded-lg text-muted-foreground hover:!text-primary-dark hover:!bg-white/60"
                  />
                  <Button
                    type="text"
                    icon={<RedoOutlined className="text-lg" />}
                    className="!h-9 !w-9 rounded-lg text-muted-foreground hover:!text-primary-dark hover:!bg-white/60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-1 bg-muted rounded-xl">
                {MODE_OPTIONS.map((mode) => (
                  <ImageReviewModeButton
                    key={mode.key}
                    icon={mode.icon}
                    label={mode.label}
                    active={activeMode === mode.key}
                    onClick={() => setActiveMode(mode.key)}
                  />
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {SHAPE_OPTIONS.map((shape) => (
                    <Button
                      key={shape.key}
                      type="text"
                      title={shape.label}
                      onClick={() => setActiveShape(shape.key)}
                      className={`!h-10 !w-10 rounded-xl border-0 transition-all ${
                        activeShape === shape.key
                          ? 'bg-white text-primary-dark shadow-sm'
                          : 'text-muted-foreground hover:!bg-white/60'
                      }`}
                      icon={shape.icon}
                    />
                  ))}

                  <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    className="!h-10 !w-10 rounded-xl border-0 text-destructive hover:!bg-white/60 ml-auto"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] font-bold text-muted-foreground tracking-wider">
                    <span>STROKE SIZE</span>
                    <span>{strokeSize}px</span>
                  </div>
                  <Slider
                    min={1}
                    max={20}
                    value={strokeSize}
                    onChange={setStrokeSize}
                    styles={{
                      track: { backgroundColor: 'var(--color-primary-dark)' },
                      rail: { backgroundColor: 'var(--color-muted)' },
                      handle: { borderColor: 'var(--color-primary-dark)' },
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-6 pb-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-foreground tracking-tight">FEEDBACK</h3>
                  <span className="px-2 py-1 bg-primary-dark/10 text-primary-dark text-[10px] font-black rounded-md">
                    {openFeedbackCount} ACTIVE
                  </span>
                </div>

                <Input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search comments..."
                  prefix={<SearchOutlined className="text-muted-foreground" />}
                  className="rounded-xl bg-white border border-border"
                />
              </div>

              <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-4">
                {filteredFeedback.map((item) => (
                  <ImageReviewFeedbackItem
                    key={item.id}
                    item={item}
                    active={selectedFeedbackId === item.id}
                    onSelect={setSelectedFeedbackId}
                  />
                ))}

                {!filteredFeedback.length ? (
                  <div className="rounded-2xl bg-white/80 border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
                    No feedback matches your search.
                  </div>
                ) : null}
              </div>

              <div className="p-6 bg-muted border-t border-border space-y-3">
                <TextArea
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  placeholder="Write a review comment..."
                  autoSize={{ minRows: 3, maxRows: 6 }}
                  className="rounded-xl border border-white/80 bg-white"
                />

                <div className="flex gap-3">
                  <Button
                    type="primary"
                    onClick={handlePostComment}
                    disabled={!commentDraft.trim()}
                    className="flex-1 !h-10 rounded-xl border-0 bg-gradient-to-tr from-primary-dark to-primary text-white text-xs font-bold shadow-md hover:!opacity-90"
                  >
                    POST COMMENT
                  </Button>
                  <Button
                    type="default"
                    icon={<PaperClipOutlined />}
                    className="!h-10 !w-10 rounded-xl border border-primary-dark/10 text-primary-dark bg-white hover:!bg-muted"
                  />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default ImageReviewV2;