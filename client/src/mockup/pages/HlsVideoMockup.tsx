import {
    FolderOpenOutlined,
    VideoCameraOutlined,
} from '@ant-design/icons';
import {Alert, Button, Card, Space, Tag, Typography} from 'antd';
import Hls from 'hls.js';
import {useEffect, useRef, useState, type ChangeEvent} from 'react';
import AppHeader from '../../components/AppHeader';
import AppSidebar from '../../components/AppSidebar';

const {Title, Paragraph, Text} = Typography;

type PlayerStatus = 'idle' | 'loading' | 'ready' | 'error';

interface LocalFileEntry {
    file: File;
    relativePath: string;
    fileName: string;
}

const normalizePath = (value: string) => value.replace(/\\/g, '/');

const cleanUri = (value: string) => {
    const withoutQuery = value.split('#')[0]?.split('?')[0] ?? '';
    return normalizePath(withoutQuery).replace(/^\.\//, '').trim();
};

const getBaseDir = (relativePath: string) => {
    const normalized = normalizePath(relativePath);
    const lastSlashIndex = normalized.lastIndexOf('/');

    if (lastSlashIndex < 0) {
        return '';
    }

    return normalized.slice(0, lastSlashIndex + 1);
};

const joinRelativePath = (baseDir: string, childPath: string) => {
    const parts = `${baseDir}${childPath}`.split('/');
    const stack: string[] = [];

    for (const part of parts) {
        if (!part || part === '.') {
            continue;
        }

        if (part === '..') {
            stack.pop();
            continue;
        }

        stack.push(part);
    }

    return stack.join('/');
};

const findEntryByUri = (
    uri: string,
    currentPlaylistPath: string,
    entries: LocalFileEntry[],
) => {
    const cleanedUri = cleanUri(uri);

    if (!cleanedUri || /^https?:\/\//i.test(cleanedUri)) {
        return null;
    }

    const baseCandidate = joinRelativePath(getBaseDir(currentPlaylistPath), cleanedUri);
    const directCandidate = cleanedUri;
    const fileNameCandidate = cleanedUri.split('/').pop() ?? cleanedUri;

    return (
        entries.find((entry) => entry.relativePath.endsWith(baseCandidate))
        ?? entries.find((entry) => entry.relativePath.endsWith(directCandidate))
        ?? entries.find((entry) => entry.fileName === fileNameCandidate)
        ?? null
    );
};

const resolveMediaPlaylist = async (
    initialEntry: LocalFileEntry,
    entries: LocalFileEntry[],
) => {
    let currentEntry = initialEntry;

    for (let depth = 0; depth < 5; depth += 1) {
        const manifestText = await currentEntry.file.text();
        const candidateUri = manifestText
            .split(/\r?\n/)
            .map((line) => line.trim())
            .find((line) => line && !line.startsWith('#') && cleanUri(line).toLowerCase().endsWith('.m3u8'));

        if (!candidateUri) {
            return {entry: currentEntry, manifestText};
        }

        const nestedEntry = findEntryByUri(candidateUri, currentEntry.relativePath, entries);

        if (!nestedEntry) {
            return {entry: currentEntry, manifestText};
        }

        currentEntry = nestedEntry;
    }

    return {
        entry: currentEntry,
        manifestText: await currentEntry.file.text(),
    };
};

const rewriteManifestToBlobUrls = (
    manifestText: string,
    playlistPath: string,
    entries: LocalFileEntry[],
    registerUrl: (value: string) => void,
) => {
    const blobUrlCache = new Map<string, string>();

    const resolveUriToBlobUrl = (uriValue: string) => {
        const cleanedUri = cleanUri(uriValue);

        if (!cleanedUri || /^https?:\/\//i.test(cleanedUri)) {
            return uriValue;
        }

        if (blobUrlCache.has(cleanedUri)) {
            return blobUrlCache.get(cleanedUri) ?? uriValue;
        }

        const entry = findEntryByUri(cleanedUri, playlistPath, entries);

        if (!entry) {
            return uriValue;
        }

        const blobUrl = URL.createObjectURL(entry.file);
        registerUrl(blobUrl);
        blobUrlCache.set(cleanedUri, blobUrl);

        return blobUrl;
    };

    return manifestText
        .split(/\r?\n/)
        .map((line) => {
            const trimmedLine = line.trim();

            if (!trimmedLine) {
                return line;
            }

            if (trimmedLine.startsWith('#')) {
                return line.replace(/URI="([^"]+)"/g, (_match, uriValue: string) => {
                    const replacedUri = resolveUriToBlobUrl(uriValue);
                    return `URI="${replacedUri}"`;
                });
            }

            return resolveUriToBlobUrl(trimmedLine);
        })
        .join('\n');
};

const HlsVideoMockup = () => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const hlsRef = useRef<Hls | null>(null);
    const generatedBlobUrlsRef = useRef<string[]>([]);

    const [activeUrl, setActiveUrl] = useState<string | null>(null);
    const [status, setStatus] = useState<PlayerStatus>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [streamInfo, setStreamInfo] = useState<string>('');
    const [selectedFolderName, setSelectedFolderName] = useState<string>('');

    const clearGeneratedBlobUrls = () => {
        for (const blobUrl of generatedBlobUrlsRef.current) {
            URL.revokeObjectURL(blobUrl);
        }

        generatedBlobUrlsRef.current = [];
    };

    useEffect(() => {
        return () => {
            clearGeneratedBlobUrls();
        };
    }, []);

    useEffect(() => {
        const videoElement = videoRef.current;

        if (!videoElement || !activeUrl) {
            return;
        }

        setStatus('loading');
        setErrorMessage(null);
        setStreamInfo('');

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
                setStatus('ready');
                setStreamInfo(`HLS.js mode • ${data.levels.length} quality level(s)`);
                void videoElement.play().catch(() => {
                    // Browser may block autoplay; user can click play manually.
                });
            });

            hls.on(Hls.Events.ERROR, (_event, data) => {
                if (!data.fatal) {
                    return;
                }

                setStatus('error');
                setErrorMessage(`HLS fatal error: ${data.type} - ${data.details}`);
            });

            return () => {
                hls.destroy();
                hlsRef.current = null;
            };
        }

        if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            const handleLoadedMetadata = () => {
                setStatus('ready');
                setStreamInfo('Native HLS mode');
                void videoElement.play().catch(() => {
                    // Browser may block autoplay; user can click play manually.
                });
            };

            const handleError = () => {
                setStatus('error');
                setErrorMessage('Native HLS playback failed. Please verify playlist and segment files.');
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

        setStatus('error');
        setErrorMessage('This browser does not support HLS playback.');

        return undefined;
    }, [activeUrl]);

    const handleChooseLocalFolder = () => {
        fileInputRef.current?.click();
    };

    const handleLocalFolderPicked = async (event: ChangeEvent<HTMLInputElement>) => {
        const pickedFiles = Array.from(event.target.files ?? []);
        event.target.value = '';

        if (!pickedFiles.length) {
            return;
        }

        setStatus('loading');
        setErrorMessage(null);

        try {
            clearGeneratedBlobUrls();

            const entries: LocalFileEntry[] = pickedFiles.map((file) => ({
                file,
                relativePath: normalizePath(file.webkitRelativePath || file.name),
                fileName: file.name,
            }));

            const playlistEntries = entries.filter((entry) => entry.fileName.toLowerCase().endsWith('.m3u8'));

            if (!playlistEntries.length) {
                throw new Error('Khong tim thay file .m3u8 trong thu muc da chon.');
            }

            const preferredEntry =
                playlistEntries.find((entry) => entry.fileName.toLowerCase() === 'master.m3u8')
                ?? playlistEntries[0];

            if (!preferredEntry) {
                throw new Error('Khong the doc duoc file playlist.');
            }

            const {entry: mediaPlaylistEntry, manifestText} = await resolveMediaPlaylist(preferredEntry, entries);

            const rewrittenManifest = rewriteManifestToBlobUrls(
                manifestText,
                mediaPlaylistEntry.relativePath,
                entries,
                (blobUrl) => generatedBlobUrlsRef.current.push(blobUrl),
            );

            const manifestBlob = new Blob([rewrittenManifest], {type: 'application/vnd.apple.mpegurl'});
            const manifestBlobUrl = URL.createObjectURL(manifestBlob);
            generatedBlobUrlsRef.current.push(manifestBlobUrl);

            const rootFolder = preferredEntry.relativePath.split('/')[0] ?? '';
            setSelectedFolderName(rootFolder);
            setStreamInfo(`Local folder mode • ${entries.length} files • Playlist: ${mediaPlaylistEntry.fileName}`);
            setActiveUrl(manifestBlobUrl);
        } catch (error) {
            setStatus('error');
            setErrorMessage(error instanceof Error ? error.message : 'Khong the tao stream tu du lieu local.');
        }
    };

    const localFolderInputProps: Record<string, string | boolean> = {
        webkitdirectory: true,
        directory: true,
    };

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

                                <Paragraph className="mb-0! text-sm text-muted-foreground">
                                    Nguon du lieu: <Text className="text-primary-dark">Local folder on your machine</Text>
                                </Paragraph>

                                <Paragraph className="mb-0! text-sm text-muted-foreground">
                                    Folder da chon:{' '}
                                    <Text className="text-primary-dark">{selectedFolderName || 'Chua chon'}</Text>
                                </Paragraph>
                            </Space>
                        </Card>

                        <Card className="rounded-2xl border border-border bg-card shadow-sm">
                            <Space direction="vertical" size={12} className="w-full">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept=".m3u8,.ts,.m4s,.aac,.mp4,.key"
                                    className="hidden"
                                    onChange={handleLocalFolderPicked}
                                    {...localFolderInputProps}
                                />

                                <Space wrap>
                                    <Button
                                        type="primary"
                                        icon={<FolderOpenOutlined/>}
                                        onClick={handleChooseLocalFolder}
                                    >
                                        Chon thu muc local
                                    </Button>
                                </Space>

                                <Alert
                                    type="info"
                                    showIcon
                                    message="Huong dan test nhanh"
                                    description="Chon thu muc local chua file .m3u8 va cac segment .ts de phat truc tiep tren mockup."
                                />

                                {status === 'loading' && (
                                    <Alert
                                        type="info"
                                        showIcon
                                        message="Loading HLS playlist..."
                                    />
                                )}

                                {status === 'ready' && (
                                    <Alert
                                        type="success"
                                        showIcon
                                        message="Stream loaded successfully"
                                        description={streamInfo}
                                    />
                                )}

                                {status === 'error' && errorMessage && (
                                    <Alert
                                        type="error"
                                        showIcon
                                        message="Cannot play stream"
                                        description={errorMessage}
                                    />
                                )}

                                {!activeUrl && status === 'idle' && (
                                    <Alert
                                        type="warning"
                                        showIcon
                                        message="Chua co stream"
                                        description="Hay chon thu muc local de tao stream URL tam thoi cho player."
                                    />
                                )}
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
