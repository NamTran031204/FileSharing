import type { MetadataEntity } from '../../../api/api/index.defs';
import { IconCheck, IconChevronDown, IconChevronLeft, IconChevronRight, IconClock, IconDiff } from '../../imageReview/icons/ReviewIcons';

interface VersionNavigatorProps {
  versions: MetadataEntity[];
  currentVersionNumber: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSelectVersion: (versionNumber: number) => void;
  onCompare: () => void;
}

export function VersionNavigator({
  versions,
  currentVersionNumber,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  onSelectVersion,
  onCompare,
}: VersionNavigatorProps) {
  const sortedVersions = [...versions].sort((a, b) => (a.versionNumber ?? 0) - (b.versionNumber ?? 0));
  const currentIdx = sortedVersions.findIndex(v => v.versionNumber === currentVersionNumber);

  return (
    <div className="flex items-center gap-4">
      {/* Prev/Next navigation */}
      <div className="flex items-center rounded-lg border border-[hsl(244,30%,80%)]/30 bg-[hsl(240,10%,96%)] p-1 shadow-xs">
        <button
          onClick={onPrev}
          disabled={!canGoPrev}
          className="rounded p-1 text-[hsl(237,45%,30%)] transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          title="Previous Version"
        >
          <IconChevronLeft />
        </button>
        <span className="min-w-[50px] select-none px-3 text-center text-xs font-black text-[hsl(237,45%,30%)]">
          {sortedVersions.length > 0 ? `${currentIdx + 1} / ${sortedVersions.length}` : '— / —'}
        </span>
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className="rounded p-1 text-[hsl(237,45%,30%)] transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          title="Next Version"
        >
          <IconChevronRight />
        </button>
      </div>

      {/* Version dropdown */}
      <div className="group relative">
        <button className="flex cursor-pointer items-center gap-2 rounded-lg border border-[hsl(244,30%,80%)]/30 bg-[hsl(240,10%,96%)] px-3 py-1.5 text-xs font-bold text-[hsl(237,45%,30%)] transition-all hover:border-[hsl(240,30%,46%)]">
          <IconClock />
          <span>v{currentVersionNumber}</span>
          <IconChevronDown />
        </button>
        <div className="absolute left-0 top-full z-30 mt-1 hidden w-44 rounded-lg border border-[hsl(244,30%,80%)]/35 bg-white py-1 shadow-xl group-hover:block">
          {sortedVersions.slice().reverse().map(v => (
            <button
              key={v.versionNumber}
              onClick={() => onSelectVersion(v.versionNumber!)}
              className={`flex w-full items-center justify-between px-4 py-2 text-left text-xs font-bold hover:bg-[hsl(240,10%,96%)] ${
                v.versionNumber === currentVersionNumber
                  ? 'text-[hsl(240,30%,46%)]'
                  : 'text-[hsl(244,10%,40%)]'
              }`}
            >
              <span>v{v.versionNumber}{v.versionNumber === currentVersionNumber ? ' (Current)' : ''}</span>
              {v.versionNumber === currentVersionNumber && <IconCheck />}
            </button>
          ))}
          {sortedVersions.length === 0 && (
            <div className="px-4 py-2 text-xs text-[hsl(244,10%,40%)]">Loading…</div>
          )}
        </div>
      </div>

      {/* Compare button */}
      <button
        onClick={onCompare}
        className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[hsl(246,72%,78%)]/20 bg-[hsl(246,72%,78%)]/10 px-3 py-1.5 text-xs font-bold text-[hsl(240,30%,46%)] shadow-xs transition-all hover:bg-[hsl(246,72%,78%)]/20"
      >
        <IconDiff />
        <span>Compare</span>
      </button>
    </div>
  );
}
