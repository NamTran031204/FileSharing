import {
    AimOutlined,
    AppstoreOutlined,
    BarChartOutlined,
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
    LeftOutlined,
    MessageOutlined,
} from '@ant-design/icons';
import {Button, Input, Slider} from 'antd';
import type {ReactNode} from 'react';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import AppHeader from '../components/AppHeader';
import AppSidebar from '../components/AppSidebar';
import ImageReviewFeedbackItem, {type ImageReviewFeedback,} from '../components/ImageReviewFeedbackItem';
import ImageReviewModeButton from '../components/ImageReviewModeButton';

import { Circle, Image as KonvaImage, Layer, Rect, Stage, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import useImage from 'use-image';
import { useMeasure } from 'react-use';

const {TextArea} = Input;

type MarkupMode = 'select' | 'draw' | 'text' | 'pan';
type ShapeTool = 'rectangle' | 'circle' | 'gesture';

interface Point {
    x: number;
    y: number;
}

interface BaseShape {
    id: string;
    type: ShapeTool;
    rotation?: number;
    stroke: string;
    strokeWidth: number;
}

interface CircleShape extends BaseShape {
    type: 'circle';
    x: number;
    y: number;
    radius: number;
}

interface RectShape extends BaseShape {
    type: 'rectangle';
    x: number;
    y: number;
    width: number;
    height: number;
}

type Shape = CircleShape | RectShape; // gesture not fully implemented yet

interface ImageReviewV2Props {
    campaignName?: string;
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

const REVIEW_IMAGES = [
    {
        id: 'img-1',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwc361glmFw5AHO-gkri9NQhDXcY-G8d__sNqinCFAAMBxMLD023GDItL6Fq0UYdx7eKNMeMjtALnXLwsQm5ZQ3GqkLbLrciXm3ibCxbZGxKWbnwq_0vw8fnDzfyiy4W43zeu46WtfDD08F7KeqhtzWT5eLpMgpwjSyzBmiFgHHGDFO3oHWncVv5yY9V22-4UH73KOWQcXrAwwIgBqqmiHJz2sf6qwv3z9ugV7Ut0RmY9do2l7E87XgaLALt1Slfm09gyB5k9lPww',
        name: 'Hero_Final_v1.jpg',
    },
    {
        id: 'img-2',
        url: 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=2000',
        name: 'Concept_Art_Alternative.jpg',
    }
];

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
    {key: 'select', label: 'SELECT', icon: <AimOutlined/>},
    {key: 'draw', label: 'DRAW', icon: <EditOutlined/>},
    {key: 'text', label: 'TEXT', icon: <FontSizeOutlined/>},
];

const SHAPE_OPTIONS: ShapeToolOption[] = [
    {key: 'rectangle', label: 'Rectangle', icon: <BorderOutlined/>},
    {key: 'circle', label: 'Circle', icon: <DribbbleOutlined/>},
    {key: 'gesture', label: 'Gesture', icon: <HighlightOutlined/>},
];

const WORKSPACE_ACTIONS: WorkspaceAction[] = [
    {key: 'artworks', label: 'Artworks', icon: <PictureOutlined/>},
    {key: 'collections', label: 'Collections', icon: <AppstoreOutlined/>},
    {key: 'team-library', label: 'Team Library', icon: <TeamOutlined/>},
    {key: 'analytics', label: 'Analytics', icon: <BarChartOutlined/>},
    {key: 'settings', label: 'Settings', icon: <SettingOutlined/>},
    {key: 'support', label: 'Support', icon: <QuestionCircleOutlined/>},
    {key: 'sign-out', label: 'Sign Out', icon: <LogoutOutlined/>},
];

const COLOR_PRIMARY = 'hsl(var(--primary))';
const COLOR_ACCENT = 'hsl(var(--accent))';

const ImageReviewV2 = ({
                           campaignName = 'Marketing Campaign',
                       }: ImageReviewV2Props) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const currentImage = REVIEW_IMAGES[currentImageIndex];

    const [activeMode, setActiveMode] = useState<MarkupMode>('select');
    const [activeShape, setActiveShape] = useState<ShapeTool>('rectangle');
    const [strokeSize, setStrokeSize] = useState<number>(4);
    const [strokeColor] = useState(COLOR_PRIMARY);

    const [searchText, setSearchText] = useState('');
    const [commentDraft, setCommentDraft] = useState('');

    // Konva State
    const stageRef = useRef<Konva.Stage | null>(null);
    const transformerRef = useRef<Konva.Transformer | null>(null);
    const shapeRefs = useRef<Record<string, Konva.Shape | null>>({});

    // Resize observer for the canvas container
    const [containerRef, { width: containerWidth, height: containerHeight }] = useMeasure<HTMLDivElement>();

    const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
    const [shapes, setShapes] = useState<Shape[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState<Point | null>(null);
    const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
    const [zoomLevel, setZoomLevel] = useState<number>(100);
    const [stagePosition, setStagePosition] = useState<Point>({ x: 0, y: 0 });

    const [bgImage] = useImage(currentImage.url);

    const [selectedFeedbackId, setSelectedFeedbackId] = useState<string>(
        FEEDBACK_ITEMS[0]?.id ?? '',
    );

    const [isMarkupOpen, setIsMarkupOpen] = useState(true);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(true);

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

    // Initial fit to screen when image loads or container changes
    useEffect(() => {
        if (bgImage && containerWidth > 0 && containerHeight > 0) {
            const scaleX = containerWidth / bgImage.width;
            const scaleY = containerHeight / bgImage.height;
            // Use 0.9 as padding
            const newScale = Math.min(scaleX, scaleY) * 0.9;

            setZoomLevel(Math.round(newScale * 100));

            // Center the image
            setStagePosition({
                x: (containerWidth - bgImage.width * newScale) / 2,
                y: (containerHeight - bgImage.height * newScale) / 2
            });
        }
    }, [bgImage, containerWidth, containerHeight]);

    // Konva Helpers
    const generateId = () => Math.random().toString(36).slice(2, 9);

    const getCircleProps = (p1: Point, p2: Point) => ({
        x: p1.x,
        y: p1.y,
        radius: Math.hypot(p2.x - p1.x, p2.y - p1.y),
    });

    const getRectProps = (p1: Point, p2: Point) => ({
        x: Math.min(p1.x, p2.x),
        y: Math.min(p1.y, p2.y),
        width: Math.abs(p2.x - p1.x),
        height: Math.abs(p2.y - p1.y),
    });

    const getWorldPoint = (stage: Konva.Stage, pointerPosition: Point) => {
        const transform = stage.getAbsoluteTransform().copy().invert();
        return transform.point(pointerPosition);
    };

    // Handle Transformer
    useEffect(() => {
        const transformer = transformerRef.current;
        if (!transformer) {
            return;
        }

        if (activeMode !== 'select' || !selectedShapeId) {
            transformer.nodes([]);
            transformer.getLayer()?.batchDraw();
            return;
        }

        const node = shapeRefs.current[selectedShapeId];
        if (node) {
            transformer.nodes([node]);
            transformer.getLayer()?.batchDraw();
        }
    }, [activeMode, selectedShapeId, shapes]);

    const handleStageMouseDown = (e: KonvaEventObject<MouseEvent>) => {
        if (activeMode !== 'draw') {
            // Click on empty area deselects
            if (e.target === e.target.getStage() || e.target.constructor.name === 'Image') {
               setSelectedShapeId(null);
            }
            return;
        }

        const stage = e.target.getStage();
        const pointerPosition = stage?.getPointerPosition();
        if (!stage || !pointerPosition) {
            return;
        }

        const worldPosition = getWorldPoint(stage, pointerPosition);

        if (!isDrawing) {
            setIsDrawing(true);
            setStartPoint(worldPosition);
            setCurrentPoint(worldPosition);
            return;
        }

        if (startPoint && currentPoint) {
            let newShape: Shape | null = null;

            if (activeShape === 'circle') {
                const { x, y, radius } = getCircleProps(startPoint, currentPoint);
                if (radius > 2) {
                    newShape = { id: generateId(), type: 'circle', x, y, radius, rotation: 0, stroke: strokeColor, strokeWidth: strokeSize };
                }
            }

            if (activeShape === 'rectangle') {
                const { x, y, width, height } = getRectProps(startPoint, currentPoint);
                if (width > 2 && height > 2) {
                    newShape = { id: generateId(), type: 'rectangle', x, y, width, height, rotation: 0, stroke: strokeColor, strokeWidth: strokeSize };
                }
            }

            if (newShape) {
                setShapes((prev) => [...prev, newShape!]);
            }
        }

        setIsDrawing(false);
        setStartPoint(null);
        setCurrentPoint(null);
    };

    const handleStageMouseMove = (e: KonvaEventObject<MouseEvent>) => {
        if (!isDrawing || activeMode !== 'draw') {
            return;
        }

        const stage = e.target.getStage();
        const pointerPosition = stage?.getPointerPosition();

        if (stage && pointerPosition) {
            setCurrentPoint(getWorldPoint(stage, pointerPosition));
        }
    };

    const handleStageWheel = (e: KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();

        const stage = stageRef.current;
        if (!stage) {
            return;
        }

        const pointerPosition = stage.getPointerPosition();
        if (!pointerPosition) {
            return;
        }

        const oldScale = zoomLevel / 100;
        const scaleBy = 1.05;
        const direction = e.evt.deltaY > 0 ? -1 : 1;
        const nextScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
        const clampedScale = Math.min(5, Math.max(0.1, nextScale));

        const mousePointTo = {
            x: (pointerPosition.x - stagePosition.x) / oldScale,
            y: (pointerPosition.y - stagePosition.y) / oldScale,
        };

        const nextPosition = {
            x: pointerPosition.x - mousePointTo.x * clampedScale,
            y: pointerPosition.y - mousePointTo.y * clampedScale,
        };

        setZoomLevel(Math.round(clampedScale * 100));
        setStagePosition(nextPosition);
    };

    const handleZoomIn = () => {
        setZoomLevel((prev) => Math.min(prev + 10, 500));
    };

    const handleZoomOut = () => {
        setZoomLevel((prev) => Math.max(prev - 10, 10));
    };

    const handleFit = () => {
        if (bgImage && containerWidth > 0 && containerHeight > 0) {
            const scaleX = containerWidth / bgImage.width;
            const scaleY = containerHeight / bgImage.height;
            const newScale = Math.min(scaleX, scaleY) * 0.9;

            setZoomLevel(Math.round(newScale * 100));
            setStagePosition({
                x: (containerWidth - bgImage.width * newScale) / 2,
                y: (containerHeight - bgImage.height * newScale) / 2
            });
        } else {
            setZoomLevel(100);
            setStagePosition({ x: 0, y: 0 });
        }
    }

    const handleDragEnd = useCallback((id: string, e: KonvaEventObject<DragEvent>) => {
        setShapes((prevShapes) =>
            prevShapes.map((shape) =>
                shape.id === id
                    ? {
                        ...shape,
                        x: e.target.x(),
                        y: e.target.y(),
                    }
                    : shape,
            ),
        );
    }, []);

    const handleTransformEnd = useCallback((id: string, node: Konva.Shape) => {
        setShapes((prevShapes) =>
            prevShapes.map((shape) =>
                shape.id === id
                    ? {
                        ...shape,
                        rotation: node.rotation(),
                    }
                    : shape,
            ),
        );
    }, []);

    const handlePostComment = () => {
        if (!commentDraft.trim()) {
            return;
        }
        setCommentDraft('');
    };

    // Xoá hình được chọn
    const handleDeleteSelected = () => {
        if (selectedShapeId) {
            setShapes((prev) => prev.filter((s) => s.id !== selectedShapeId));
            setSelectedShapeId(null);
        }
    };

    const goPrevImage = () => {
        setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : REVIEW_IMAGES.length - 1));
        setShapes([]); // clear shapes on image change
        setSelectedShapeId(null);
    };

    const goNextImage = () => {
        setCurrentImageIndex((prev) => (prev < REVIEW_IMAGES.length - 1 ? prev + 1 : 0));
        setShapes([]); // clear shapes on image change
        setSelectedShapeId(null);
    };

    return (
        <div className="bg-background text-foreground min-h-screen overflow-hidden flex flex-col">
            <AppHeader/>

            <main className="flex flex-1 pt-16 h-screen overflow-hidden">
                <AppSidebar/>

                <div className="flex-1 h-full flex overflow-hidden">
                    <section className="flex-1 relative bg-background flex flex-col overflow-hidden">
                        <div className="flex-1 relative p-8 flex items-center justify-center overflow-hidden">
                            <div
                                className="absolute left-6 top-6 grid grid-cols-2 gap-2 z-10 rounded-2xl bg-card p-2 shadow-sm border border-border">
                                {WORKSPACE_ACTIONS.map((action) => (
                                    <Button
                                        key={action.key}
                                        type="text"
                                        className="h-auto! px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted! flex items-center justify-start gap-2"
                                    >
                                        {action.icon}
                                        <span>{action.label}</span>
                                    </Button>
                                ))}
                            </div>

                            {/* Image Switcher Controls */}
                            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 bg-card px-3 py-1.5 rounded-full shadow-sm border border-border">
                                <Button
                                    type="text"
                                    icon={<LeftOutlined />}
                                    onClick={goPrevImage}
                                    className="h-8! w-8! rounded-full text-muted-foreground hover:text-primary hover:bg-muted!"
                                />
                                <div className="flex flex-col items-center px-2 min-w-[120px]">
                                    <span className="text-xs font-bold text-foreground truncate max-w-full" title={currentImage.name}>
                                        {currentImage.name}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {currentImageIndex + 1} / {REVIEW_IMAGES.length}
                                    </span>
                                </div>
                                <Button
                                    type="text"
                                    icon={<RightOutlined />}
                                    onClick={goNextImage}
                                    className="h-8! w-8! rounded-full text-muted-foreground hover:text-primary hover:bg-muted!"
                                />
                            </div>

                            <div
                                ref={containerRef}
                                className="relative w-full h-full shadow-2xl rounded-sm overflow-hidden bg-white/5"
                                style={{
                                     cursor: activeMode === 'select' ? 'default' : activeMode === 'draw' ? 'crosshair' : 'grab'
                                }}
                            >
                                {/* Only render Stage if we have valid dimensions */}
                                {containerWidth > 0 && containerHeight > 0 && (
                                    <Stage
                                        ref={stageRef}
                                        width={containerWidth}
                                        height={containerHeight}
                                        onMouseDown={handleStageMouseDown}
                                        onMouseMove={handleStageMouseMove}
                                        onWheel={handleStageWheel}
                                        scale={{ x: zoomLevel / 100, y: zoomLevel / 100 }}
                                        position={stagePosition}
                                        draggable={activeMode === 'pan'}
                                        onDragEnd={() => {
                                            const stage = stageRef.current;
                                            if (stage) {
                                                setStagePosition({ x: stage.x(), y: stage.y() });
                                            }
                                        }}
                                    >
                                        <Layer>
                                            {bgImage && <KonvaImage image={bgImage} x={0} y={0} />}

                                            {shapes.map((shape) => {
                                                const isDraggable = activeMode === 'select';

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
                                                            onClick={() => activeMode === 'select' && setSelectedShapeId(shape.id)}
                                                            onTap={() => activeMode === 'select' && setSelectedShapeId(shape.id)}
                                                            ref={(node) => {
                                                                shapeRefs.current[shape.id] = node;
                                                            }}
                                                            onDragEnd={(e) => handleDragEnd(shape.id, e)}
                                                            onTransformEnd={(e) => handleTransformEnd(shape.id, e.target as Konva.Shape)}
                                                        />
                                                    );
                                                }

                                                return (
                                                    <Rect
                                                        key={shape.id}
                                                        x={shape.x}
                                                        y={shape.y}
                                                        width={(shape as RectShape).width}
                                                        height={(shape as RectShape).height}
                                                        rotation={shape.rotation ?? 0}
                                                        stroke={shape.stroke}
                                                        strokeWidth={shape.strokeWidth}
                                                        draggable={isDraggable}
                                                        onClick={() => activeMode === 'select' && setSelectedShapeId(shape.id)}
                                                        onTap={() => activeMode === 'select' && setSelectedShapeId(shape.id)}
                                                        ref={(node) => {
                                                            shapeRefs.current[shape.id] = node;
                                                        }}
                                                        onDragEnd={(e) => handleDragEnd(shape.id, e)}
                                                        onTransformEnd={(e) => handleTransformEnd(shape.id, e.target as Konva.Shape)}
                                                    />
                                                );
                                            })}

                                            <Transformer
                                                ref={transformerRef}
                                                rotateEnabled={true}
                                                enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                                                ignoreStroke
                                                keepRatio
                                            />

                                            {isDrawing && startPoint && currentPoint && (
                                                <>
                                                    {activeShape === 'circle' && (
                                                        <Circle
                                                            {...getCircleProps(startPoint, currentPoint)}
                                                            stroke={COLOR_PRIMARY}
                                                            strokeWidth={strokeSize}
                                                            dash={[5, 5]}
                                                            opacity={0.7}
                                                        />
                                                    )}
                                                    {activeShape === 'rectangle' && (
                                                        <Rect
                                                            {...getRectProps(startPoint, currentPoint)}
                                                            stroke={COLOR_ACCENT}
                                                            strokeWidth={strokeSize}
                                                            dash={[5, 5]}
                                                            opacity={0.7}
                                                        />
                                                    )}
                                                </>
                                            )}
                                        </Layer>
                                    </Stage>
                                )}
                            </div>

                            <div
                                className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 bg-card flex items-center gap-1 p-1.5 rounded-2xl shadow-lg border border-border">
                                <Button
                                    type="text"
                                    icon={<ZoomInOutlined/>}
                                    onClick={handleZoomIn}
                                    className="h-10! w-10! rounded-xl text-primary hover:bg-muted!"
                                />
                                <Button
                                    type="text"
                                    icon={<ZoomOutOutlined/>}
                                    onClick={handleZoomOut}
                                    className="h-10! w-10! rounded-xl text-primary hover:bg-muted!"
                                />
                                <div className="w-px h-6 bg-border/50 mx-1"/>
                                <Button
                                    type="text"
                                    className="h-10! px-4 text-xs font-bold text-primary hover:bg-muted! rounded-xl"
                                    onClick={handleFit}
                                >
                                    FIT
                                </Button>
                                <Button
                                    type="text"
                                    className="h-10! px-4 text-xs font-bold text-primary hover:bg-muted! rounded-xl"
                                    onClick={handleFit}
                                >
                                    {zoomLevel}%
                                </Button>
                                <div className="w-px h-6 bg-border/50 mx-1"/>
                                <Button
                                    type="text"
                                    icon={<FullscreenOutlined/>}
                                    className="h-10! w-10! rounded-xl text-primary hover:bg-muted!"
                                />
                                <Button
                                    type="text"
                                    icon={<DownloadOutlined/>}
                                    className="h-10! w-10! rounded-xl text-primary hover:bg-muted!"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Use absolute positioning to prevent layout shift of main canvas when sidebar width changes */}
                    <aside
                        className={`h-full flex flex-col bg-card border-l border-border transition-all duration-300 ease-in-out ${
                            isMarkupOpen || isFeedbackOpen ? 'w-[380px]' : 'w-[50px]'
                        }`}
                    >
                        <div className="border-b border-border">
                            <div
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                                onClick={() => setIsMarkupOpen(!isMarkupOpen)}
                            >
                                {(isMarkupOpen || isFeedbackOpen) && (
                                    <h3 className="text-sm font-bold text-foreground tracking-tight uppercase">Markup Tools</h3>
                                )}
                                {!isMarkupOpen && !isFeedbackOpen && (
                                    <EditOutlined className="text-muted-foreground mx-auto" />
                                )}

                                {(isMarkupOpen || isFeedbackOpen) && (
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                type="text"
                                                icon={<UndoOutlined className="text-lg"/>}
                                                className="h-8! w-8! rounded-lg text-muted-foreground hover:text-primary hover:bg-muted!"
                                            />
                                            <Button
                                                type="text"
                                                icon={<RedoOutlined className="text-lg"/>}
                                                className="h-8! w-8! rounded-lg text-muted-foreground hover:text-primary hover:bg-muted!"
                                            />
                                        </div>
                                        <Button
                                            type="text"
                                            icon={isMarkupOpen ? <DownOutlined/> : <RightOutlined/>}
                                            className="h-8! w-8! rounded-lg text-muted-foreground hover:text-primary hover:bg-muted!"
                                        />
                                    </div>
                                )}
                            </div>

                            {isMarkupOpen && (
                                <div className="p-4 pt-0 space-y-5 animate-in slide-in-from-top-2">
                                    <div className="grid grid-cols-3 gap-2 p-1 bg-muted/40 rounded-xl">
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
                                                    className={`h-10! w-10! rounded-xl border-0 transition-all ${
                                                        activeShape === shape.key
                                                            ? 'bg-primary text-white shadow-sm'
                                                            : 'text-muted-foreground hover:bg-muted! hover:text-primary'
                                                    }`}
                                                    icon={shape.icon}
                                                />
                                            ))}

                                            <Button
                                                type="text"
                                                icon={<DeleteOutlined/>}
                                                disabled={!selectedShapeId}
                                                onClick={handleDeleteSelected}
                                                className="h-10! w-10! rounded-xl border-0 text-destructive hover:bg-muted! ml-auto disabled:opacity-50"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <div
                                                className="flex justify-between text-[11px] font-bold text-muted-foreground tracking-wider uppercase">
                                                <span>Stroke Size</span>
                                                <span>{strokeSize}px</span>
                                            </div>
                                            <Slider
                                                min={1}
                                                max={20}
                                                value={strokeSize}
                                                onChange={setStrokeSize}
                                                styles={{
                                                    track: {backgroundColor: 'hsl(var(--primary))'},
                                                    rail: {backgroundColor: 'hsl(var(--border))'},
                                                    handle: {borderColor: 'hsl(var(--primary))'},
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 flex flex-col min-h-0">
                            <div
                                className={`p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors ${isFeedbackOpen ? 'border-b border-border' : ''}`}
                                onClick={() => setIsFeedbackOpen(!isFeedbackOpen)}
                            >
                                {(isMarkupOpen || isFeedbackOpen) && (
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold text-foreground tracking-tight uppercase">Feedback</h3>
                                        <span
                                            className="px-2 py-1 bg-accent/30 text-primary text-[10px] font-bold rounded-md">
                                            {openFeedbackCount} ACTIVE
                                        </span>
                                    </div>
                                )}
                                {!isMarkupOpen && !isFeedbackOpen && (
                                    <MessageOutlined className="text-muted-foreground mx-auto mt-4" />
                                )}

                                {(isMarkupOpen || isFeedbackOpen) && (
                                    <Button
                                        type="text"
                                        icon={isFeedbackOpen ? <DownOutlined/> : <RightOutlined/>}
                                        className="h-8! w-8! rounded-lg text-muted-foreground hover:text-primary hover:bg-muted!"
                                    />
                                )}
                            </div>

                            {isFeedbackOpen && (
                                <div className="flex-1 flex flex-col min-h-0 animate-in slide-in-from-top-2">
                                    <div className="p-4 pb-2">
                                        <Input
                                            value={searchText}
                                            onChange={(event) => setSearchText(event.target.value)}
                                            placeholder="Search comments..."
                                            prefix={<SearchOutlined className="text-muted-foreground"/>}
                                            className="rounded-xl bg-background border border-border focus:border-secondary hover:border-secondary"
                                        />
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-4 pt-2 space-y-4">
                                        {filteredFeedback.map((item) => (
                                            <ImageReviewFeedbackItem
                                                key={item.id}
                                                item={item}
                                                active={selectedFeedbackId === item.id}
                                                onSelect={setSelectedFeedbackId}
                                            />
                                        ))}

                                        {!filteredFeedback.length ? (
                                            <div
                                                className="rounded-xl bg-background border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
                                                No feedback matches your search.
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="p-4 bg-background/50 border-t border-border space-y-3">
                                        <TextArea
                                            value={commentDraft}
                                            onChange={(event) => setCommentDraft(event.target.value)}
                                            placeholder="Write a review comment..."
                                            autoSize={{minRows: 3, maxRows: 6}}
                                            className="rounded-xl border border-border bg-card focus:border-secondary hover:border-secondary"
                                        />

                                        <div className="flex gap-3">
                                            <Button
                                                type="primary"
                                                onClick={handlePostComment}
                                                disabled={!commentDraft.trim()}
                                                className="flex-1 h-10! rounded-xl border-0 bg-primary text-white text-xs font-bold shadow-md hover:opacity-90!"
                                            >
                                                POST COMMENT
                                            </Button>
                                            <Button
                                                type="default"
                                                icon={<PaperClipOutlined/>}
                                                className="h-10! w-10! rounded-xl border border-border text-foreground bg-card hover:border-secondary hover:text-primary"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
};

export default ImageReviewV2;