import { useEffect } from 'react';
import type { RefObject } from 'react';
import type { Point } from '../../../hooks/useKonvaCanvas';

interface Options {
  videoRef: RefObject<HTMLVideoElement | null>;
  stageScale: number;
  stagePosition: Point;
  enabled: boolean;
}

export const useVideoSync = ({ videoRef, stageScale, stagePosition, enabled }: Options) => {
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (!enabled) {
      v.style.transform = '';
      v.style.transformOrigin = '';
      return;
    }
    v.style.transformOrigin = '0 0';
    v.style.transform = `translate(${stagePosition.x}px, ${stagePosition.y}px) scale(${stageScale})`;
  }, [videoRef, stageScale, stagePosition, enabled]);

  useEffect(() => {
    return () => {
      const v = videoRef.current;
      if (v) {
        v.style.transform = '';
        v.style.transformOrigin = '';
      }
    };
  }, [videoRef]);
};
