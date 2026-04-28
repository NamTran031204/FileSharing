import {
    VideoCameraOutlined,
} from '@ant-design/icons';
import {Card, Space, Tag, Typography} from 'antd';
import Hls from 'hls.js';
import {useEffect, useRef, useState} from 'react';
import AppHeader from '../../components/AppHeader';
import AppSidebar from '../../components/AppSidebar';

const {Title} = Typography;

const FIXED_MASTER_PLAYLIST_URL = '/hls-local/master.m3u8';

const HlsVideoMockup = () => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const hlsRef = useRef<Hls | null>(null);

    const [activeUrl, setActiveUrl] = useState<string | null>(null);
    // const [status, setStatus] = useState<PlayerStatus>('idle');
    // const [errorMessage, setErrorMessage] = useState<string | null>(null);
    // const [streamInfo, setStreamInfo] = useState<string>('');
    // const [selectedFolderName] = useState<string>('E:/DaiCuongBK/Project3/FileSharing/server/filesharing-videocodec/temp/dir');

    useEffect(() => {
        setActiveUrl(FIXED_MASTER_PLAYLIST_URL);
        // setStreamInfo('Fixed local path mode • Playlist: master.m3u8');
    }, []);

    useEffect(() => {
        const videoElement = videoRef.current;

        if (!videoElement || !activeUrl) {
            return;
        }

        // setStatus('loading');
        // setErrorMessage(null);
        // setStreamInfo('');

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

            hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
                // setStatus('ready');
                // setStreamInfo(`HLS.js mode • ${data.levels.length} quality level(s)`);
                void videoElement.play().catch(() => {
                    // Browser may block autoplay; user can click play manually.
                });
            });

            hls.on(Hls.Events.ERROR, (_event, data) => {
                if (!data.fatal) {
                    return;
                }

                // setStatus('error');
                // setErrorMessage(`HLS fatal error: ${data.type} - ${data.details}`);
            });

            return () => {
                hls.destroy();
                hlsRef.current = null;
            };
        }

        if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            const handleLoadedMetadata = () => {
                // setStatus('ready');
                // setStreamInfo('Native HLS mode');
                void videoElement.play().catch(() => {
                    // Browser may block autoplay; user can click play manually.
                });
            };

            const handleError = () => {
                // setStatus('error');
                // setErrorMessage('Native HLS playback failed. Please verify playlist and segment files.');
            };

            videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
            videoElement.addEventListener('error', handleError);
            videoElement.src = activeUrl;

            return () => {
                videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
                videoElement.removeEventListener('error', handleError);
                resetVideoSource();
            };
        }

        // setStatus('error');
        // setErrorMessage('This browser does not support HLS playback.');

        return undefined;
    }, [activeUrl]);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <AppHeader/>

            <div className="flex min-h-screen pt-16">
                <AppSidebar/>

                <main className="flex-1 overflow-y-auto p-6 md:p-8">
                    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
                        <Card className="rounded-2xl border border-border bg-card shadow-sm">
                            <Space direction="vertical" size={12} className="w-full">
                                <Tag className="w-fit border border-primary/20 bg-muted px-3 py-1 text-xs font-semibold text-primary-dark">
                                    MOCKUP HLS PLAYER
                                </Tag>

                                <Title level={2} className="mb-1! text-foreground!">
                                    Video Streaming Test
                                </Title>
                            </Space>
                        </Card>


                        <Card className="rounded-2xl border border-border bg-card shadow-sm">
                            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary-dark">
                                <VideoCameraOutlined/>
                                HLS Video Preview
                            </div>

                            <video
                                ref={videoRef}
                                controls
                                playsInline
                                className="aspect-video w-full rounded-xl border border-border bg-black"
                            />
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default HlsVideoMockup;
