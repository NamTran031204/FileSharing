import type { VideoAnnotation } from './types';

export const buildSeedAnnotations = (
  videoWidth: number,
  videoHeight: number,
): VideoAnnotation[] => {
  const now = Date.now();
  return [
    {
      id: 'seed-rect-1',
      type: 'rect',
      x: videoWidth * 0.15,
      y: videoHeight * 0.2,
      width: videoWidth * 0.3,
      height: videoHeight * 0.25,
      rotation: 0,
      stroke: 'hsl(var(--primary))',
      strokeWidth: 4,
      startMs: 2000,
      endMs: 5000,
      createdAt: now,
    },
    {
      id: 'seed-circle-1',
      type: 'circle',
      x: videoWidth * 0.7,
      y: videoHeight * 0.5,
      radius: Math.min(videoWidth, videoHeight) * 0.12,
      rotation: 0,
      stroke: 'hsl(var(--accent))',
      strokeWidth: 4,
      startMs: 8000,
      endMs: 12000,
      createdAt: now,
    },
  ];
};
