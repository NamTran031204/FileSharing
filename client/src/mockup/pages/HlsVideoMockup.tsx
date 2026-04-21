import { VideoCameraOutlined } from '@ant-design/icons';
import { Card, Space, Tag, Typography } from 'antd';
import Hls from 'hls.js';
import { useEffect, useRef, useState } from 'react';
import CommonLayout from '../../layout/CommonLayout';

const { Title } = Typography;

const FIXED_MASTER_PLAYLIST_URL = '/hls-local/master.m3u8';

const HlsVideoMockup = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);

  useEffect(() => {
    setActiveUrl(FIXED_MASTER_PLAYLIST_URL);
  }, []);

  useEffect(() => {
    const videoElement = videoRef.current;

    if (!videoElement || !activeUrl) {
      return;
    }

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const resetVideoSource = () => {
      videoElement.pause();
      videoElement.removeAttribute('src');
      videoElement.load();
    };

    resetVideoSource();

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      });

      hlsRef.current = hls;
      hls.loadSource(activeUrl);
      hls.attachMedia(videoElement);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        void videoElement.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) {
          return;
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }

    if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      const handleLoadedMetadata = () => {
        void videoElement.play().catch(() => {});
      };

      const handleError = () => {};

      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.addEventListener('error', handleError);
      videoElement.src = activeUrl;

      return () => {
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        videoElement.removeEventListener('error', handleError);
        resetVideoSource();
      };
    }

    return undefined;
  }, [activeUrl]);

  return (
    <CommonLayout>
      <div className="flex-1 overflow-y-auto bg-background p-6 md:p-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
          <Card className="rounded-2xl border border-border bg-card shadow-sm">
            <Space direction="vertical" size={12} className="w-full">
              <Tag className="w-fit border border-accent/40 bg-accent/20 px-3 py-1 text-xs font-semibold text-primary-dark">
                MOCKUP HLS PLAYER
              </Tag>

              <Title level={2} className="!mb-0 !text-foreground">
                Mockup để test HLS
              </Title>
            </Space>
          </Card>

          <Card className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary-dark">
              <VideoCameraOutlined />
              preview
            </div>

            <video
              ref={videoRef}
              controls
              playsInline
              className="aspect-video w-full rounded-xl border border-border bg-border"
            />
          </Card>
        </div>
      </div>
    </CommonLayout>
  );
};

export default HlsVideoMockup;
