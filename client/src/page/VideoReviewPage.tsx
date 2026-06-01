import { useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { useSearchParams } from 'react-router-dom';
import CommonLayout from '../layout/CommonLayout';
import { ReviewCoreStore } from '../store/review/ReviewCoreStore';
import { MediaType } from '../api/api/index.defs';
import type { MediaAdapter } from '../components/mediaReview/bridge/MediaAdapter';
import MediaReviewLayout from '../components/mediaReview/MediaReviewLayout';

const VideoReviewPage = observer(() => {
  const [searchParams] = useSearchParams();
  const assetId = searchParams.get('assetId') ?? '';
  const versionParam = searchParams.get('version');

  const coreStoreRef = useRef(new ReviewCoreStore(MediaType.VIDEO));
  const adapterRef = useRef<MediaAdapter>({
    mediaType: MediaType.VIDEO,
    focusAnnotation: (_annotationId) => {
      // TODO: implement when VideoPlayer is built — seek to annotation timestamp
    },
    buildRegion: (_shapes) => [],
  });

  return (
    <CommonLayout>
      <MediaReviewLayout
        reviewStore={coreStoreRef.current}
        mediaAdapter={adapterRef.current}
        assetId={assetId}
        versionParam={versionParam}
      >
        <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-zinc-950">
          <div className="flex flex-col items-center gap-3 text-center">
            <svg className="h-12 w-12 text-zinc-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <p className="text-sm font-bold text-zinc-500">Video Player — Coming Soon</p>
            <p className="text-xs text-zinc-600">Sidebar, comments, SSE, and version nav are live.</p>
          </div>
        </div>
      </MediaReviewLayout>
    </CommonLayout>
  );
});

export default VideoReviewPage;
