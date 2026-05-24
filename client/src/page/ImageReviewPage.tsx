import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import CommonLayout from '../layout/CommonLayout';
import { useEffect, useState } from 'react';
import { Circle, Image as KonvaImage, Layer, Rect, Stage, Transformer } from 'react-konva';
import type Konva from 'konva';
import useImage from 'use-image';

import CanvasHeader from '../components/imageReview/CanvasHeader';
import CapsuleControls from '../components/imageReview/CapsuleControls';
import CollapsibleSection from '../components/imageReview/CollapsibleSection';
import ShapesPanel from '../components/imageReview/ShapesPanel';
import CommentsPanel from '../components/imageReview/CommentsPanel';
import ActionLogPanel from '../components/imageReview/ActionLogPanel';
import ImageInfoPanel from '../components/imageReview/ImageInfoPanel';
import { mockActionLog, mockComments, mockImages, shapes } from '../components/imageReview/mockData';
import type { SidebarSectionState } from '../components/imageReview/types';
import useKonvaCanvas from '../hooks/useKonvaCanvas';
import type { MarkupMode, ShapeTool } from '../hooks/useKonvaCanvas';

const COLOR_PRIMARY = 'hsl(var(--primary))';
const COLOR_ACCENT = 'hsl(var(--accent))';

const DEFAULT_STROKE_SIZE = 4;

const ImageReviewPage = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const currentImage = mockImages[currentImageIndex];

  const [activeMode, setActiveMode] = useState<MarkupMode>('select');
  const [activeShape, setActiveShape] = useState<ShapeTool>('rectangle');

  const [bgImage] = useImage(currentImage.url);

  const {
    containerRef,
    containerWidth,
    containerHeight,
    stageRef,
    transformerRef,
    shapeRefs,
    stageScale,
    stagePosition,
    selectedTool,
    setSelectedTool,
    drawnShapes,
    setDrawnShapes,
    setSelectedShapeId,
    isDrawing,
    startPoint,
    currentPoint,
    handlers: {
      handleStageMouseDown,
      handleStageMouseMove,
      handleStageWheel,
      handleStageDragEnd,
      handleZoomIn,
      handleZoomOut,
      handleDragEnd,
      handleTransformEnd,
    },
    helpers: { getCircleProps, getRectProps },
    zoomPercent,
  } = useKonvaCanvas({
    worldWidth: bgImage?.width,
    worldHeight: bgImage?.height,
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<SidebarSectionState>({
    shapes: false,
    comments: true,
    actionLog: false,
    imageInfo: true,
  });
  const [commentToolActive, setCommentToolActive] = useState(false);

  useEffect(() => {
    if (activeMode === 'select') {
      setSelectedTool('select');
      return;
    }
    if (activeMode === 'text') {
      setSelectedTool('pan');
      return;
    }
    if (activeMode === 'draw') {
      if (activeShape === 'circle') {
        setSelectedTool('circle');
      } else if (activeShape === 'rectangle') {
        setSelectedTool('rect');
      } else {
        setSelectedTool('rotate');
      }
    }
  }, [activeMode, activeShape, setSelectedTool]);

  const canGoPrev = currentImageIndex > 0;
  const canGoNext = currentImageIndex < mockImages.length - 1;

  const handlePrevImage = () => {
    if (!canGoPrev) return;
    setCurrentImageIndex((prev) => prev - 1);
    setDrawnShapes([]);
    setSelectedShapeId(null);
  };

  const handleNextImage = () => {
    if (!canGoNext) return;
    setCurrentImageIndex((prev) => prev + 1);
    setDrawnShapes([]);
    setSelectedShapeId(null);
  };

  const toggleSection = (section: keyof SidebarSectionState) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleTogglePan = () => {
    if (selectedTool === 'pan') {
      setActiveMode('select');
    } else {
      setActiveMode('text');
    }
  };

  const handleToggleComment = () => {
    setCommentToolActive((prev) => !prev);
    // Mở Comments section khi bật comment tool
    setExpandedSections((prev) => ({ ...prev, comments: true }));
  };

  const handleShapeSelect = (shapeId: string) => {
    const currentShapeActive =
      activeMode === 'draw' && (activeShape === shapeId || (shapeId === 'arrow' && activeShape === 'gesture'));

    if (currentShapeActive) {
      setActiveMode('select');
      return;
    }

    if (shapeId === 'rectangle') {
      setActiveMode('draw');
      setActiveShape('rectangle');
    } else if (shapeId === 'circle') {
      setActiveMode('draw');
      setActiveShape('circle');
    } else if (shapeId === 'arrow') {
      // TODO: V2 chưa hỗ trợ arrow — map sang gesture (rotate) tạm
      setActiveMode('draw');
      setActiveShape('gesture');
    }
  };

  const handleReplyComment = (commentId: number) => {
    // TODO: implement reply — V2 hiện không có flow reply
    console.log('Reply to comment:', commentId);
  };

  // Derived state cho UI
  const activeShapeIdForUI =
    activeMode === 'draw'
      ? activeShape === 'rectangle'
        ? 'rectangle'
        : activeShape === 'circle'
        ? 'circle'
        : 'arrow'
      : null;
  const isPanActive = selectedTool === 'pan';

  const viewportCursor =
    selectedTool === 'select' ? 'default' : selectedTool === 'pan' ? 'grab' : 'crosshair';

  return (
    <CommonLayout>
    <div className="relative flex h-full overflow-hidden bg-card">
      {/* ============================ Canvas Area ============================ */}
      <div className="relative flex flex-1 flex-col overflow-hidden bg-background">
        <CanvasHeader
          imageName={currentImage.name}
          currentIndex={currentImageIndex}
          total={mockImages.length}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          onPrev={handlePrevImage}
          onNext={handleNextImage}
        />

        {/* Viewport */}
        <div
          ref={containerRef}
          className="relative flex flex-1 items-center justify-center overflow-hidden"
          style={{ cursor: viewportCursor }}
        >
          {containerWidth > 0 && containerHeight > 0 && (
            <Stage
              ref={stageRef}
              width={containerWidth}
              height={containerHeight}
              onMouseDown={handleStageMouseDown}
              onMouseMove={handleStageMouseMove}
              onWheel={handleStageWheel}
              scale={{ x: stageScale, y: stageScale }}
              position={stagePosition}
              draggable={selectedTool === 'pan'}
              onDragEnd={handleStageDragEnd}
            >
              <Layer>
                {bgImage && <KonvaImage image={bgImage} x={0} y={0} />}

                {drawnShapes.map((shape) => {
                  const isDraggable = selectedTool === 'select';

                  if (shape.type === 'circle') {
                    return (
                      <Circle
                        key={shape.id}
                        x={shape.x}
                        y={shape.y}
                        radius={shape.radius}
                        rotation={shape.rotation ?? 0}
                        stroke={shape.stroke}
                        strokeWidth={shape.strokeWidth}
                        draggable={isDraggable}
                        onClick={() => selectedTool === 'select' && setSelectedShapeId(shape.id)}
                        onTap={() => selectedTool === 'select' && setSelectedShapeId(shape.id)}
                        ref={(node) => {
                          shapeRefs.current[shape.id] = node;
                        }}
                        onDragEnd={(e) => handleDragEnd(shape.id, e)}
                        onTransformEnd={(e) =>
                          handleTransformEnd(shape.id, e.target as Konva.Shape)
                        }
                      />
                    );
                  }

                  return (
                    <Rect
                      key={shape.id}
                      x={shape.x}
                      y={shape.y}
                      width={shape.width}
                      height={shape.height}
                      rotation={shape.rotation ?? 0}
                      stroke={shape.stroke}
                      strokeWidth={shape.strokeWidth}
                      draggable={isDraggable}
                      onClick={() => selectedTool === 'select' && setSelectedShapeId(shape.id)}
                      onTap={() => selectedTool === 'select' && setSelectedShapeId(shape.id)}
                      ref={(node) => {
                        shapeRefs.current[shape.id] = node;
                      }}
                      onDragEnd={(e) => handleDragEnd(shape.id, e)}
                      onTransformEnd={(e) =>
                        handleTransformEnd(shape.id, e.target as Konva.Shape)
                      }
                    />
                  );
                })}

                <Transformer
                  ref={transformerRef}
                  rotateEnabled={selectedTool === 'rotate'}
                  enabledAnchors={[]}
                  ignoreStroke
                  keepRatio
                />

                {isDrawing && startPoint && currentPoint && (
                  <>
                    {selectedTool === 'circle' && (
                      <Circle
                        {...getCircleProps(startPoint, currentPoint)}
                        stroke={COLOR_PRIMARY}
                        strokeWidth={DEFAULT_STROKE_SIZE}
                        dash={[5, 5]}
                        opacity={0.7}
                      />
                    )}
                    {selectedTool === 'rect' && (
                      <Rect
                        {...getRectProps(startPoint, currentPoint)}
                        stroke={COLOR_ACCENT}
                        strokeWidth={DEFAULT_STROKE_SIZE}
                        dash={[5, 5]}
                        opacity={0.7}
                      />
                    )}
                  </>
                )}
              </Layer>
            </Stage>
          )}

          {/* Bottom capsule controls */}
          <CapsuleControls
            zoomPercent={zoomPercent}
            isPanActive={isPanActive}
            isCommentActive={commentToolActive}
            onTogglePan={handleTogglePan}
            onToggleComment={handleToggleComment}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
          />
        </div>

      </div>
        {sidebarCollapsed && (
            <Button
                icon={<LeftOutlined />}
                onClick={() => setSidebarCollapsed(false)}
                title="Hide sidebar"
                className="absolute right-[0px] top-1/2 z-30 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md border-border bg-background text-foreground"
            />
        )}

      {/* ============================ Right Sidebar ============================ */}
      <aside
        className={`flex flex-col overflow-hidden border-l border-border/40 bg-card transition-[width] duration-300 ${
          sidebarCollapsed ? 'w-0' : 'w-80'
        }`}
      >
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <CollapsibleSection
            title="Shapes"
            expanded={expandedSections.shapes}
            onToggle={() => toggleSection('shapes')}
          >
            <ShapesPanel
              shapes={shapes}
              activeShapeId={activeShapeIdForUI}
              onSelect={handleShapeSelect}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title={`Comments (${mockComments.length})`}
            expanded={expandedSections.comments}
            onToggle={() => toggleSection('comments')}
          >
            <CommentsPanel comments={mockComments} onReply={handleReplyComment} />
          </CollapsibleSection>

          <CollapsibleSection
            title="Action Log"
            expanded={expandedSections.actionLog}
            onToggle={() => toggleSection('actionLog')}
          >
            <ActionLogPanel items={mockActionLog} />
          </CollapsibleSection>

          <CollapsibleSection
            title="Image Info"
            expanded={expandedSections.imageInfo}
            onToggle={() => toggleSection('imageInfo')}
          >
            <ImageInfoPanel image={currentImage} />
          </CollapsibleSection>
        </div>
      </aside>
        {!sidebarCollapsed && (
            <Button
                icon={<RightOutlined />}
                onClick={() => setSidebarCollapsed(true)}
                title="Hide sidebar"
                className="absolute right-[336px] top-1/2 z-30 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md border-border bg-card text-foreground"
            />
        )}
    </div>
    </CommonLayout>
  );
};

export default ImageReviewPage;
