import { CloudUploadOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { Button, Modal, Select, Tag } from 'antd';
import { observer } from 'mobx-react-lite';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    GrantedProjectPermission,
    ProcessingStatus,
    type AssetSummaryDto,
    type FolderEntity,
    type FolderTreeItemDTO,
} from '../api/api/index.defs';
import { type ActionDropdownItem } from '../components/core/common/ActionDropdown.tsx';
import { type AssetType } from '../components/assets/AssetCard.tsx';
import FolderTreePanel, { type FolderTreeNode } from '../components/folder/FolderTreePanel.tsx';
import FolderAssetCommonCrudPage from '../components/core/crud/FolderAssetCommonCrudPage';
import UploadAssetButton from '../components/assets/UploadAssetButton.tsx';
import UploadFolderButton from '../components/folder/UploadFolderButton.tsx';
import ContextActionBar from '../components/core/layout/ContextActionBar.tsx';
import FolderInsightPanel, {
    type InsightProcessingItem,
    type InsightSummaryItem,
} from '../components/folder/FolderInsightPanel.tsx';
import { ApiPendingNote } from '../components/core/common/ApiPendingNote';
import uiUtils from '../utils/uiUtils.tsx';
import { useStore } from '../store';

const resolveAssetType = (mimeType?: string): AssetType => {
    if (!mimeType) return 'doc';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType === 'image/svg+xml') return 'svg';
    if (mimeType.startsWith('image/')) return 'image';
    return 'doc';
};

const formatBytes = (bytes?: number): string => {
    if (!bytes || bytes === 0) return '—';
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex++;
    }
    return `${value.toFixed(1)} ${units[unitIndex]}`;
};

const formatDuration = (ms?: number): string | undefined => {
    if (!ms) return undefined;
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

/** Segmented "Images" gom cả ảnh raster lẫn SVG, khác với resolveAssetType tách riêng 'svg'. */
const matchesTypeFilter = (mimeType: string | undefined, filter: string): boolean => {
    if (filter === 'all') return true;
    const type = resolveAssetType(mimeType);
    if (filter === 'image') return type === 'image' || type === 'svg';
    return type === filter;
};

const buildTreeNodes = (items: FolderTreeItemDTO[], projectName: string): FolderTreeNode[] => {
    const nodeMap = new Map<string, FolderTreeNode>();
    const roots: FolderTreeNode[] = [];

    items.forEach((item) => {
        if (!item.folderId) return;
        nodeMap.set(item.folderId, {
            id: item.folderId,
            name: item.folderName ?? '—',
            children: [],
        });
    });

    items.forEach((item) => {
        if (!item.folderId) return;
        const node = nodeMap.get(item.folderId);
        if (!node) return;
        if (item.parentFolderId && nodeMap.has(item.parentFolderId)) {
            nodeMap.get(item.parentFolderId)?.children?.push(node);
            return;
        }
        roots.push(node);
    });

    return [{ id: 'root', name: projectName, children: roots }];
};

const FolderAssetPage = observer(function FolderAssetPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { folderStore, sessionStore } = useStore();

    const currentFolderId = searchParams.get('folderId') ?? undefined;
    const projectName = sessionStore.currentProjectName || projectId || 'Project';

    const [treeCollapsed, setTreeCollapsed] = useState(false);
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterUser, setFilterUser] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [insightCollapsed, setInsightCollapsed] = useState(true);

    const searchSkipRef = useRef(false);

    useEffect(() => {
        if (!projectId) return;
        void folderStore.fetchTree(projectId);
    }, [projectId, folderStore]);

    useEffect(() => {
        if (!projectId) return;
        sessionStore.setCurrentProject({ projectId, projectName: sessionStore.currentProjectName || projectId });
        sessionStore.setCurrentFolder(
            currentFolderId
                ? ({ folderId: currentFolderId } as FolderEntity)
                : undefined
        );
        if (searchQuery) searchSkipRef.current = true;
        setSearchQuery('');
        folderStore.setKeyword('');
        folderStore.setPage(1);
        void folderStore.fetchFolders(projectId, currentFolderId);
        void folderStore.fetchAssetsPage(projectId, currentFolderId);

        if (currentFolderId) {
            folderStore.subscribeToFolderSSE(currentFolderId);
        } else {
            folderStore.unsubscribeFromFolderSSE();
        }

        return () => {
            folderStore.unsubscribeFromFolderSSE();
        };
    }, [projectId, currentFolderId, folderStore, sessionStore]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (searchSkipRef.current) {
            searchSkipRef.current = false;
            return;
        }
        if (!projectId) return;
        const timer = setTimeout(() => {
            folderStore.setKeyword(searchQuery);
            folderStore.setPage(1);
            void folderStore.fetchFolders(projectId, currentFolderId);
            void folderStore.fetchAssetsPage(projectId, currentFolderId);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleAssetClick = (summary: AssetSummaryDto) => {
        const assetId = summary.asset?.assetId;
        if (!assetId) return;
        const mimeType = summary.latestVersion?.mimeType ?? '';
        if (mimeType.startsWith('video/')) {
            navigate(`/review/video?assetId=${assetId}`);
        } else if (mimeType.startsWith('image/')) {
            navigate(`/review/image-v2?assetId=${assetId}`);
        }
    };

    const handleFolderClick = (folder: FolderEntity) => {
        if (!folder.folderId || !projectId) return;
        navigate(`/projects/${projectId}?folderId=${folder.folderId}`);
    };

    const handleBreadcrumbFolderClick = (folderId: string) => {
        if (!projectId) return;
        navigate(`/projects/${projectId}?folderId=${folderId}`);
    };

    const handleGoToRoot = () => {
        if (!projectId) return;
        navigate(`/projects/${projectId}`);
    };

    const handleTreeSelect = (id: string | number) => {
        if (id === 'root') {
            handleGoToRoot();
            return;
        }
        if (!projectId) return;
        navigate(`/projects/${projectId}?folderId=${id}`);
    };

    const handleRefresh = () => {
        if (!projectId) return;
        void folderStore.fetchFolders(projectId, currentFolderId);
        void folderStore.fetchAssetsPage(projectId, currentFolderId);
    };

    const handleBackToParent = () => {
        const parentFolderId = breadcrumbFolders.at(-1)?.parentFolderId;
        if (parentFolderId) {
            handleBreadcrumbFolderClick(parentFolderId);
            return;
        }
        handleGoToRoot();
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            uiUtils.showSuccess('Đã sao chép link folder');
        } catch {
            uiUtils.showError('Trình duyệt chặn clipboard, hãy sao chép thủ công từ thanh địa chỉ');
        }
    };

    const handleMutationSuccess = () => {
        if (!projectId) return;
        void folderStore.fetchFolders(projectId, currentFolderId);
        void folderStore.fetchAssetsPage(projectId, currentFolderId);
        void folderStore.fetchTree(projectId);
    };

    const breadcrumbFolders = useMemo((): FolderTreeItemDTO[] => {
        if (!currentFolderId) return [];
        const map = new Map(folderStore.treeItems.map((i) => [i.folderId!, i]));
        const current = map.get(currentFolderId);
        if (!current) return [];
        const ancestors = (current.ancestorIds ?? [])
            .map((id) => map.get(id))
            .filter((item): item is FolderTreeItemDTO => item !== undefined);
        return [...ancestors, current];
    }, [folderStore.treeItems, currentFolderId]);

    const treeData = useMemo(
        () => buildTreeNodes(folderStore.treeItems, projectName),
        [folderStore.treeItems, projectName]
    );

    const isLoading = folderStore.isFolderLoading || folderStore.isLoading;

    const currentFolderName = breadcrumbFolders.at(-1)?.folderName ?? projectName;

    const pathLabel = ['Projects', projectName, ...breadcrumbFolders.slice(0, -1).map((f) => f.folderName ?? '—')].join(
        ' / '
    );

    const visibleAssets = useMemo(
        () => folderStore.assets.filter((summary) => matchesTypeFilter(summary.latestVersion?.mimeType, typeFilter)),
        [folderStore.assets, typeFilter]
    );

    const totalBytes = useMemo(
        () => folderStore.assets.reduce((sum, summary) => sum + (summary.latestVersion?.fileSize ?? 0), 0),
        [folderStore.assets]
    );

    const processingItems = useMemo<InsightProcessingItem[]>(
        () =>
            folderStore.assets
                .filter((summary) => {
                    const status = summary.latestVersion?.processingStatus;
                    return status === ProcessingStatus.PENDING || status === ProcessingStatus.PROCESSING;
                })
                .map((summary, index) => ({
                    key: summary.asset?.assetId ?? `processing-${index}`,
                    name: summary.asset?.assetName ?? summary.latestVersion?.fileName ?? '—',
                    status: summary.latestVersion?.processingStatus ?? ProcessingStatus.PENDING,
                })),
        [folderStore.assets]
    );

    const summaryItems: InsightSummaryItem[] = [
        { label: 'Folders', value: folderStore.folders.length },
        { label: 'Files', value: folderStore.assets.length },
        { label: 'Total size', value: formatBytes(totalBytes) },
        { label: 'Processing', value: processingItems.length },
    ];

    const contextBar = (
        <ContextActionBar
            title={currentFolderName}
            pathLabel={pathLabel}
            // danh sach thanh vien that se do tu ProjectControllerService.members — xem note "right" ben duoi
            participants={[]}
            onBack={currentFolderId ? handleBackToParent : undefined}
            onShare={() => uiUtils.showInfor('Chia sẻ folder — chưa nối API')}
            onTranslate={() => uiUtils.showInfor('Dịch tên file và bình luận — chưa nối API')}
            onDownload={() => uiUtils.showInfor('Tải folder dạng .zip — chưa nối API')}
            onCopyLink={handleCopyLink}
            onRefresh={handleRefresh}
            refreshLoading={isLoading}
            moreItems={[
                {
                    key: 'move',
                    label: 'Move to...',
                    onClick: () => uiUtils.showInfor('Di chuyển folder — chưa nối API'),
                },
                {
                    key: 'rename',
                    label: 'Rename',
                    disabled: !currentFolderId,
                    onClick: () => {
                        if (!currentFolderId) return;
                        folderStore.openEditFolderModal(currentFolderId);
                    },
                },
                { type: 'divider' },
                {
                    key: 'archive',
                    label: 'Archive',
                    danger: true,
                    onClick: () => uiUtils.showInfor('Lưu trữ folder — chưa nối API'),
                },
            ]}
            right={
                <>
                    <ApiPendingNote
                        compact
                        label="Members"
                        hint="Danh sách thành viên có quyền trên folder/project"
                    />
                    {currentFolderId && (
                        <Tag color="purple" className="m-0 rounded-md border-0 font-semibold">
                            Live status
                        </Tag>
                    )}
                </>
            }
        />
    );

    const folderActions: ActionDropdownItem<FolderEntity>[] = [
        {
            title: 'edit',
            titleCustom: 'Sua',
            permission: GrantedProjectPermission.CREATE_FOLDER_ASSET,
            onClick: (record) => {
                if (!record?.folderId) return;
                folderStore.openEditFolderModal(record.folderId);
            },
        },
        {
            title: 'remove',
            titleCustom: 'Xoa',
            permission: GrantedProjectPermission.DELETE,
            isDanger: true,
            onClick: (record) => {
                if (!record?.folderId) return;
                folderStore.openDeleteFolderModal(record.folderId);
            },
        },
    ];

    const assetActions: ActionDropdownItem<AssetSummaryDto>[] = [
        {
            title: 'edit',
            titleCustom: 'Sua',
            permission: GrantedProjectPermission.UPDATE,
            onClick: (record) => {
                const assetId = record?.asset?.assetId;
                if (!assetId) return;
                folderStore.openEditAssetModal(assetId);
            },
        },
        {
            title: 'remove',
            titleCustom: 'Xoa',
            permission: GrantedProjectPermission.DELETE,
            isDanger: true,
            onClick: (record) => {
                const assetId = record?.asset?.assetId;
                if (!assetId) return;
                folderStore.openDeleteAssetModal(assetId);
            },
        },
    ];

    const newActions: ActionDropdownItem<unknown>[] = [
        {
            title: 'uploadFile',
            titleCustom: 'Upload File',
            icon: <CloudUploadOutlined className="text-base text-primary" />,
            onClick: () => folderStore.openUploadAssetModal(),
        },
        {
            title: 'uploadFolder',
            titleCustom: 'Upload Folder',
            icon: <FolderOpenOutlined className="text-base text-primary" />,
            onClick: () => folderStore.openUploadFolderModal(),
        },
    ];

    const contentTop = showAdvancedSearch ? (
        <div className="flex shrink-0 items-end gap-4 rounded-xl border border-border bg-card px-6 py-5">
            <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    User
                </label>
                <Select
                    value={filterUser}
                    onChange={setFilterUser}
                    className="min-w-40"
                    options={[{ value: 'all', label: 'All Users' }]}
                />
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                </label>
                <Select
                    value={filterStatus}
                    onChange={setFilterStatus}
                    className="min-w-40"
                    options={[
                        { value: 'all', label: 'All' },
                        { value: 'private', label: 'Private' },
                        { value: 'public', label: 'Public' },
                    ]}
                />
            </div>
            <Button
                type="primary"
                onClick={handleRefresh}
                className="h-8 rounded-lg bg-linear-to-br from-primary-dark to-primary font-semibold"
            >
                Search
            </Button>
        </div>
    ) : null;

    return (
        <>
            <FolderAssetCommonCrudPage<FolderEntity, AssetSummaryDto>
                sidebarCollapsed
                topBarSlot={contextBar}
                folderTreeSlot={
                    <FolderTreePanel
                        treeData={treeData}
                        activeId={currentFolderId ?? 'root'}
                        onSelect={handleTreeSelect}
                        collapsed={treeCollapsed}
                        onToggleCollapse={() => setTreeCollapsed((value) => !value)}
                        searchValue={searchQuery}
                        onSearchChange={setSearchQuery}
                        typeFilter={typeFilter}
                        onTypeFilterChange={setTypeFilter}
                        advancedOpen={showAdvancedSearch}
                        onToggleAdvanced={() => setShowAdvancedSearch((value) => !value)}
                        newActions={newActions}
                    />
                }
                asideSlot={
                    <FolderInsightPanel
                        summaryItems={summaryItems}
                        processingItems={processingItems}
                        collapsed={insightCollapsed}
                        onToggle={() => setInsightCollapsed((value) => !value)}
                    />
                }
                folders={folderStore.folders}
                assets={visibleAssets}
                isLoadingFolders={folderStore.isFolderLoading}
                isLoadingAssets={folderStore.isLoading}
                mapFolderToCard={(folder) => ({
                    name: folder.folderName ?? '—',
                    itemCount: folder.stats?.assetCount ?? 0,
                })}
                mapAssetToCard={(summary) => {
                    const version = summary.latestVersion;
                    return {
                        name: summary.asset?.assetName ?? version?.fileName ?? '—',
                        sizeLabel: formatBytes(version?.fileSize),
                        versionLabel: version?.versionNumber != null ? `v${version.versionNumber}` : 'v?',
                        type: resolveAssetType(version?.mimeType),
                        durationLabel: formatDuration(version?.mediaInfo?.durationMs),
                        thumbnailUrl: (version as Record<string, unknown>)?.thumbnailUrl as string | undefined,
                        processingStatus: version?.processingStatus,
                    };
                }}
                folderActions={folderActions}
                assetActions={assetActions}
                onFolderClick={handleFolderClick}
                onAssetClick={handleAssetClick}
                getFolderKey={(folder) => folder.folderId ?? ''}
                getAssetKey={(asset) => asset.asset?.assetId ?? ''}
                emptyFoldersText={searchQuery ? 'No folders match your search.' : 'No sub-folders here.'}
                emptyAssetsText={
                    searchQuery || typeFilter !== 'all'
                        ? 'No assets match your search.'
                        : 'No assets in this folder.'
                }
                emptyAssetsAction={
                    <Button
                        type="primary"
                        icon={<CloudUploadOutlined />}
                        onClick={() => folderStore.openUploadAssetModal()}
                        className="rounded-lg bg-linear-to-br from-primary-dark to-primary font-semibold"
                    >
                        Upload File
                    </Button>
                }
                contentTop={contentTop}
            />

            <Modal
                open={folderStore.isUploadAssetOpen || folderStore.isUploadFolderOpen}
                onCancel={() => folderStore.closeModal()}
                footer={null}
                width={900}
                className="[&_.ant-modal-content]:bg-card"
                title={
                    <span className="text-lg font-semibold text-foreground">
                        {folderStore.isUploadFolderOpen ? 'Upload Folder' : 'Upload File'}
                    </span>
                }
                destroyOnHidden
            >
                <div className="max-h-[70vh] overflow-auto">
                    {folderStore.isUploadFolderOpen
                        ? <UploadFolderButton
                            parentFolderId={currentFolderId}
                            onSuccess={handleMutationSuccess}
                          />
                        : <UploadAssetButton
                            parentFolderId={currentFolderId}
                            onSuccess={handleMutationSuccess}
                          />
                    }
                </div>
            </Modal>
        </>
    );
});

export default FolderAssetPage;
