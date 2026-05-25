import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { VideoAnnotation } from './types';

const sameSet = (a: Set<string>, b: Set<string>) => {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
};

interface Options {
  videoRef: RefObject<HTMLVideoElement | null>;
  annotations: VideoAnnotation[];
}

export const useVideoAnnotations = ({ videoRef, annotations }: Options) => {
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [currentMs, setCurrentMs] = useState(0);
  const annotationsRef = useRef(annotations);

  useEffect(() => {
    annotationsRef.current = annotations;
  }, [annotations]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const v = videoRef.current;
      if (v) {
        const t = v.currentTime * 1000;
        setCurrentMs((prev) => (Math.abs(prev - t) < 1 ? prev : t));
        const next = new Set<string>();
        for (const a of annotationsRef.current) {
          if (t >= a.startMs && t <= a.endMs) next.add(a.id);
        }
        setVisibleIds((prev) => (sameSet(prev, next) ? prev : next));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [videoRef]);

  return { visibleIds, currentMs };
};
