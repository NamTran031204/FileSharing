import { useState } from 'react';
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
  EditOutlined,
  DeleteOutlined,
  PushpinOutlined,
  PaperClipOutlined,
  SmileOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Button, Input, Tooltip } from 'antd';
import ReviewLayout from '../layout/ReviewLayout';

const { TextArea } = Input;

interface Annotation {
  id: number;
  x: string;
  y: string;
  type: 'pin' | 'error';
}

interface Comment {
  id: number;
  author: string;
  timestamp: string;
  content: string;
  pinNumber?: number;
  priority?: 'high' | 'normal';
}

/**
 * ImageReviewPage - Màn hình review ảnh
 * Lumina Pro Theme: Professional image review với annotation tools
 * Route: /review/image
 */
const ImageReviewPage = () => {
  const [zoomLevel, setZoomLevel] = useState(85);
  const [activeTool, setActiveTool] = useState<string>('edit');
  const [annotations, setAnnotations] = useState<Annotation[]>([
    { id: 1, x: '30%', y: '20%', type: 'pin' },
    { id: 2, x: '70%', y: '40%', type: 'error' },
  ]);

  const [comments] = useState<Comment[]>([
    {
      id: 1,
      author: 'Alex Rivera',
      timestamp: '2m ago',
      content: 'The texture here feels a bit too sharp. Can we soften the grain in the highlight area?',
      pinNumber: 1,
      priority: 'normal',
    },
    {
      id: 2,
      author: 'Sarah Chen',
      timestamp: '15m ago',
      content: 'Logo placement should follow the new guidelines. Move it 20px to the left.',
      pinNumber: 2,
      priority: 'high',
    },
  ]);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 10, 25));

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'edit') {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      const newAnnotation: Annotation = {
        id: annotations.length + 1,
        x: `${x}%`,
        y: `${y}%`,
        type: 'pin',
      };
      
      setAnnotations([...annotations, newAnnotation]);
    }
  };

  return (
    <ReviewLayout>
      <div className="flex flex-col h-full p-6 gap-6">
        {/* Context Header */}
        <div className="flex justify-between items-end px-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#A6A0ED] mb-1 block">
              Active Project: Summer Campaign
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0d1154]">
              Asset_092_Hero_Final.jpg
            </h1>
          </div>
          <div className="flex gap-3">
            <Button className="px-4 py-2 bg-[#eeecff] text-[#3b3a7e] font-bold text-xs rounded-lg hover:bg-[#e7e6ff] transition-colors border-none h-auto">
              Compare Versions
            </Button>
            <Button className="px-6 py-2 bg-gradient-to-r from-[#3b3a7e] to-[#535297] text-white font-bold text-xs rounded-lg shadow-lg shadow-[#3b3a7e]/20 border-none h-auto hover:opacity-90">
              Approve Asset
            </Button>
          </div>
        </div>

        {/* Image Canvas */}
        <div className="relative flex-1 bg-[#2A2F6F] rounded-3xl overflow-hidden canvas-shadow flex items-center justify-center group">
          {/* Main Image */}
          <div 
            className="relative max-w-4xl w-full mx-12 cursor-crosshair"
            onClick={handleCanvasClick}
          >
            <img
              src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200"
              alt="Hero asset"
              className="w-full rounded-lg shadow-2xl"
              style={{ transform: `scale(${zoomLevel / 100})` }}
            />

            {/* Annotation Circles */}
            {annotations.map((annotation) => (
              <Tooltip key={annotation.id} title={`Pin #${annotation.id}`}>
                <div
                  className={`
                    absolute rounded-full flex items-center justify-center 
                    cursor-pointer hover:scale-110 transition-transform
                    ${annotation.type === 'pin' 
                      ? 'w-8 h-8 border-2 border-[#A6A0ED] bg-[#A6A0ED]/20' 
                      : 'w-10 h-10 border-2 border-[#ba1a1a] bg-[#ba1a1a]/20'
                    }
                  `}
                  style={{ 
                    left: annotation.x, 
                    top: annotation.y,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  {annotation.type === 'pin' ? (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  ) : (
                    <span className="text-white text-[10px] font-black">{annotation.id}</span>
                  )}
                </div>
              </Tooltip>
            ))}
          </div>

          {/* Floating Canvas Controls */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-4 shadow-2xl">
            <button 
              onClick={handleZoomOut}
              className="p-2 hover:bg-[#e7e6ff] rounded-xl text-[#3b3a7e] transition-all"
            >
              <ZoomOutOutlined />
            </button>
            <div className="w-[1px] h-4 bg-[#c8c5d2]/30"></div>
            <span className="text-xs font-black text-[#0d1154]">{zoomLevel}%</span>
            <div className="w-[1px] h-4 bg-[#c8c5d2]/30"></div>
            <button 
              onClick={handleZoomIn}
              className="p-2 hover:bg-[#e7e6ff] rounded-xl text-[#3b3a7e] transition-all"
            >
              <ZoomInOutlined />
            </button>
            <button className="p-2 hover:bg-[#e7e6ff] rounded-xl text-[#3b3a7e] transition-all">
              <FullscreenOutlined />
            </button>
          </div>

          {/* Tool Palette (Left Side of Canvas) */}
          <div className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-md p-2 rounded-2xl flex flex-col gap-2 shadow-2xl">
            <Tooltip title="Edit" placement="right">
              <button
                onClick={() => setActiveTool('edit')}
                className={`
                  p-3 rounded-xl transition-all
                  ${activeTool === 'edit' 
                    ? 'bg-[#3b3a7e] text-white shadow-lg shadow-[#3b3a7e]/20' 
                    : 'hover:bg-[#e7e6ff] text-[#0d1154]'
                  }
                `}
              >
                <EditOutlined />
              </button>
            </Tooltip>
            
            <Tooltip title="Gesture" placement="right">
              <button
                onClick={() => setActiveTool('gesture')}
                className={`
                  p-3 rounded-xl transition-all
                  ${activeTool === 'gesture' 
                    ? 'bg-[#3b3a7e] text-white shadow-lg shadow-[#3b3a7e]/20' 
                    : 'hover:bg-[#e7e6ff] text-[#0d1154]'
                  }
                `}
              >
                <PushpinOutlined />
              </button>
            </Tooltip>

            <Tooltip title="Text" placement="right">
              <button
                onClick={() => setActiveTool('text')}
                className="p-3 hover:bg-[#e7e6ff] text-[#0d1154] rounded-xl transition-all"
              >
                <PushpinOutlined />
              </button>
            </Tooltip>

            <div className="h-[1px] w-full bg-[#c8c5d2]/30 my-1"></div>

            <Tooltip title="Delete" placement="right">
              <button className="p-3 hover:bg-[#e7e6ff] text-[#ba1a1a] rounded-xl transition-all">
                <DeleteOutlined />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Right Feedback Sidebar */}
      <aside className="w-80 bg-white h-full overflow-y-auto p-6 flex flex-col gap-6">
        {/* Activity Log */}
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-[#0d1154] mb-4">
            Activity Log
          </h3>
          
          <div className="flex flex-col gap-6">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className={`
                  rounded-2xl p-4 relative
                  ${comment.priority === 'high' 
                    ? 'bg-[#ba1a1a]/5 border border-[#ba1a1a]/10' 
                    : 'bg-[#eeecff]'
                  }
                `}
              >
                {/* Comment Header */}
                <div className="flex items-center gap-2 mb-2">
                  {comment.pinNumber && (
                    <div className="w-6 h-6 rounded-full bg-[#A6A0ED]/30 flex items-center justify-center text-[10px] font-bold text-[#3b3a7e]">
                      {comment.pinNumber}
                    </div>
                  )}
                  <span className="text-[11px] font-bold text-[#0d1154]">
                    {comment.author}
                  </span>
                  <span className="text-[10px] text-[#474650]/60 ml-auto">
                    {comment.timestamp}
                  </span>
                </div>

                {/* Comment Content */}
                <p className="text-xs text-[#474650] leading-relaxed">
                  {comment.content}
                </p>

                {/* Comment Tags */}
                {comment.priority === 'high' ? (
                  <div className="mt-3 flex items-center gap-2">
                    <WarningOutlined className="text-[#ba1a1a] text-xs" />
                    <span className="text-[10px] font-bold text-[#ba1a1a] uppercase">
                      High Priority
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <span className="px-2 py-1 bg-[#e0e0ff] text-[10px] font-bold text-[#3b3a7e] rounded-md uppercase">
                      Action Required
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add Feedback Section */}
        <div className="mt-auto">
          <div className="bg-[#eeecff] p-4 rounded-2xl">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#474650]/60 block mb-2">
              Add Feedback
            </label>
            <TextArea
              placeholder="Type a comment or drag a tool to annotate..."
              className="w-full bg-transparent border-none focus:ring-0 text-sm p-0 placeholder-[#474650]/40 resize-none h-24"
            />
            <div className="flex justify-between items-center mt-2">
              <div className="flex gap-1">
                <button className="p-1 text-[#474650] hover:text-[#3b3a7e] transition-colors">
                  <PaperClipOutlined className="text-lg" />
                </button>
                <button className="p-1 text-[#474650] hover:text-[#3b3a7e] transition-colors">
                  <SmileOutlined className="text-lg" />
                </button>
              </div>
              <Button className="px-4 py-1.5 bg-[#3b3a7e] text-white text-[10px] font-bold uppercase rounded-lg border-none h-auto hover:opacity-90">
                Post
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </ReviewLayout>
  );
};

export default ImageReviewPage;
