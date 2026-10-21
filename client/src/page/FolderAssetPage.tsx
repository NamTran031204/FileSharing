import { CloudUploadOutlined, FolderOpenOutlined, GlobalOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { Button, Modal, Select, Tag } from 'antd';
import { observer } from 'mobx-react-lite';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    FolderVisibility,
    GrantedProjectPermission,
    ProcessingStatus,
    UserGrantedRole,
    type ProjectEntity,
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
import { FolderControllerService } from '../api/api/FolderControllerService';
import { ProjectControllerService } from '../api/api/ProjectControllerService';
import VisibilityModal from '../components/folder/VisibilityModal.tsx';
import ProjectVisibilityToggle from '../components/project/ProjectVisibilityToggle.tsx';
import { describeInheritSource, resolveEffectiveVisibility } from '../utils/visibilityUtils';
import userApiResource from '../api/userApiResource.ts';
import ProofLinkModal from '../components/proof/ProofLinkModal.tsx';
import ProofSelectionsDrawer from '../components/proof/ProofSelectionsDrawer.tsx';
import i18n from '../i18n';

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
    const projectName = sessionStore.currentProjectName || projectId || i18n.t('layout:folderAssetPage.project');

    const [treeCollapsed, setTreeCollapsed] = useState(false);
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterUser, setFilterUser] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [insightCollapsed, setInsightCollapsed] = useState(true);
    const [proofLinkOpen, setProofLinkOpen] = useState(false);
    const [proofSelectionsOpen, setProofSelectionsOpen] = useState(false);
    // folder hien tai de lay shareToken va userPermissions (folderStore.folders chi chua folder con)
    const [currentFolder, setCurrentFolder] = useState<FolderEntity | null>(null);
    // sessionStore.user chua duoc nap o app nen lay userId hien tai truc tiep tu API
    const [myUserId, setMyUserId] = useState('');
    // project de biet ownerId/visibility (quyen doi visibility chi cho owner/admin)
    const [project, setProject] = useState<ProjectEntity | null>(null);
    const [visibilityFolderId, setVisibilityFolderId] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        userApiResource.getCurrentUser()
            .then((user) => setMyUserId(user?.userId ?? ''))
            .catch(() => setMyUserId(''));
    }, []);

    useEffect(() => {
        if (!projectId) return;
        ProjectControllerService.getById({ projectId })
            .then((res) => setProject(res.data ?? null))
            .catch(() => setProject(null));
    }, [projectId, refreshKey]);

    const canManageVisibility =
        sessionStore.appSession.isGrantedRole(UserGrantedRole.ROLE_ADMIN) ||
        (!!myUserId && project?.ownerId === myUserId);

    useEffect(() => {
        if (!currentFolderId) {
            setCurrentFolder(null);
            return;
        }
        let cancelled = false;
        FolderControllerService.getById({ folderId: currentFolderId })
            .then((res) => { if (!cancelled) setCurrentFolder(res.data ?? null); })
            .catch(() => { if (!cancelled) setCurrentFolder(null); });
        return () => { cancelled = true; };
    }, [currentFolderId, proofLinkOpen, refreshKey]);

    const currentFolderPermissions = useMemo(
        () => (currentFolder && currentFolder.folderId === currentFolderId ? currentFolder.userPermissions ?? [] : [])
            .filter((p) => p.userId === myUserId)
            .flatMap((p) => p.permissions ?? []),
        [currentFolder, currentFolderId, myUserId],
    );
    const effectiveVisibility = currentFolderId
        ? resolveEffectiveVisibility(currentFolderId, folderStore.treeItems, project?.visibility)
        : undefined;
    const canShareProof =
        currentFolderPermissions.includes(GrantedProjectPermission.ADD_USER) &&
        effectiveVisibility === FolderVisibility.PUBLIC;
    const canViewProof = currentFolderPermissions.includes(GrantedProjectPermission.READ);

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
            uiUtils.showSuccess(i18n.t('layout:folderAssetPage.daSaoChepLinkFolder'));
        } catch {
            uiUtils.showError(i18n.t('layout:folderAssetPage.trinhDuyetChanClipboardHay'));
        }
    };

    const handleVisibilityChanged = () => {
        if (!projectId) return;
        void folderStore.fetchTree(projectId);
        void folderStore.fetchFolders(projectId, currentFolderId);
        setRefreshKey((k) => k + 1);
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

    const pathLabel = [i18n.t('layout:folderAssetPage.projects'), projectName, ...breadcrumbFolders.slice(0, -1).map((f) => f.folderName ?? '—')].join(
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
        { label: i18n.t('layout:folderAssetPage.folders'), value: folderStore.folders.length },
        { label: i18n.t('layout:folderAssetPage.files'), value: folderStore.assets.length },
        { label: i18n.t('layout:folderAssetPage.totalSize'), value: formatBytes(totalBytes) },
        { label: i18n.t('layout:folderAssetPage.processing'), value: processingItems.length },
    ];

    const visibilityTag = currentFolderId ? (
        <Tag className="m-0 rounded-md border-0 font-semibold">
            {effectiveVisibility === FolderVisibility.PUBLIC ? <GlobalOutlined /> : <LockOutlined />}{' '}
            {breadcrumbFolders.at(-1)?.visibility && breadcrumbFolders.at(-1)?.visibility !== FolderVisibility.INHERIT
                ? breadcrumbFolders.at(-1)?.visibility
                : i18n.t('layout:folderAssetPage.inheritTu', {projectName: describeInheritSource(currentFolderId, folderStore.treeItems, projectName)})}
        </Tag>
    ) : null;

    const contextBar = (
        <ContextActionBar
            title={currentFolderName}
            pathLabel={pathLabel}
            // danh sach thanh vien that se do tu ProjectControllerService.members — xem note "right" ben duoi
            participants={[]}
            onBack={currentFolderId ? handleBackToParent : undefined}
            onShare={() => {
                if (!currentFolderId) {
                    uiUtils.showInfor(i18n.t('layout:folderAssetPage.hayMoMotFolderDe'));
                    return;
                }
                if (!canShareProof) {
                    uiUtils.showInfor(i18n.t('layout:folderAssetPage.banKhongCoQuyenTao'));
                    return;
                }
                setProofLinkOpen(true);
            }}
            onTranslate={() => uiUtils.showInfor(i18n.t('layout:folderAssetPage.dichTenFileVaBinh'))}
            onDownload={() => uiUtils.showInfor(i18n.t('layout:folderAssetPage.taiFolderDangZipChua'))}
            onCopyLink={handleCopyLink}
            onRefresh={handleRefresh}
            refreshLoading={isLoading}
            moreItems={[
                {
                    key: 'move',
                    label: i18n.t('layout:folderAssetPage.moveTo'),
                    onClick: () => uiUtils.showInfor(i18n.t('layout:folderAssetPage.diChuyenFolderChuaNoi')),
                },
                {
                    key: 'rename',
                    label: i18n.t('layout:folderAssetPage.rename'),
                    disabled: !currentFolderId,
                    onClick: () => {
                        if (!currentFolderId) return;
                        folderStore.openEditFolderModal(currentFolderId);
                    },
                },
                ...(currentFolderId && canManageVisibility
                    ? [{
                        key: 'visibility',
                        label: i18n.t('layout:folderAssetPage.quyenTruyCap'),
                        onClick: () => setVisibilityFolderId(currentFolderId),
                    }]
                    : []),
                { type: 'divider' },
                {
                    key: 'archive',
                    label: i18n.t('layout:folderAssetPage.archive'),
                    danger: true,
                    onClick: () => uiUtils.showInfor(i18n.t('layout:folderAssetPage.luuTruFolderChuaNoi')),
                },
            ]}
            right={
                <>
                    {!currentFolderId && canManageVisibility && projectId && (
                        <ProjectVisibilityToggle
                            projectId={projectId}
                            visibility={project?.visibility}
                            onChanged={handleVisibilityChanged}
                        />
                    )}
                    {currentFolderId && visibilityTag}
                    {currentFolderId && canViewProof && (
                        <Button className="h-9 rounded-lg" onClick={() => setProofSelectionsOpen(true)}>
                            {i18n.t('layout:folderAssetPage.luaChonCuaKhach')}
                        </Button>
                    )}
                    <ApiPendingNote
                        compact
                        label={i18n.t('layout:folderAssetPage.members')}
                        hint={i18n.t('layout:folderAssetPage.danhSachThanhVienCo')}
                    />
                    {currentFolderId && (
                        <Tag color="purple" className="m-0 rounded-md border-0 font-semibold">
                            {i18n.t('layout:folderAssetPage.liveStatus')}
                        </Tag>
                    )}
                </>
            }
        />
    );

    const folderActions: ActionDropdownItem<FolderEntity>[] = [
        ...(canManageVisibility
            ? [{
                title: 'visibility',
                titleCustom: i18n.t('layout:folderAssetPage.quyenTruyCap'),
                icon: <SafetyOutlined className="text-base" />,
                onClick: (record?: FolderEntity) => {
                    if (record?.folderId) setVisibilityFolderId(record.folderId);
                },
            }]
            : []),
        {
            title: 'edit',
            titleCustom: i18n.t('layout:folderAssetPage.sua'),
            permission: GrantedProjectPermission.CREATE_FOLDER_ASSET,
            onClick: (record) => {
                if (!record?.folderId) return;
                folderStore.openEditFolderModal(record.folderId);
            },
        },
        {
            title: 'remove',
            titleCustom: i18n.t('layout:folderAssetPage.xoa'),
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
            titleCustom: i18n.t('layout:folderAssetPage.sua'),
            permission: GrantedProjectPermission.UPDATE,
            onClick: (record) => {
                const assetId = record?.asset?.assetId;
                if (!assetId) return;
                folderStore.openEditAssetModal(assetId);
            },
        },
        {
            title: 'remove',
            titleCustom: i18n.t('layout:folderAssetPage.xoa'),
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
            titleCustom: i18n.t('layout:folderAssetPage.uploadFile'),
            icon: <CloudUploadOutlined className="text-base text-primary" />,
            onClick: () => folderStore.openUploadAssetModal(),
        },
        {
            title: 'uploadFolder',
            titleCustom: i18n.t('layout:folderAssetPage.uploadFolder'),
            icon: <FolderOpenOutlined className="text-base text-primary" />,
            onClick: () => folderStore.openUploadFolderModal(),
        },
    ];

    const contentTop = showAdvancedSearch ? (
        <div className="flex shrink-0 items-end gap-4 rounded-xl border border-border bg-card px-6 py-5">
            <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {i18n.t('layout:folderAssetPage.user')}
                </label>
                <Select
                    value={filterUser}
                    onChange={setFilterUser}
                    className="min-w-40"
                    options={[{ value: 'all', label: i18n.t('layout:folderAssetPage.allUsers') }]}
                />
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {i18n.t('layout:folderAssetPage.status')}
                </label>
                <Select
                    value={filterStatus}
                    onChange={setFilterStatus}
                    className="min-w-40"
                    options={[
                        { value: 'all', label: i18n.t('layout:folderAssetPage.all') },
                        { value: 'private', label: i18n.t('layout:folderAssetPage.private') },
                        { value: 'public', label: i18n.t('layout:folderAssetPage.public') },
                    ]}
                />
            </div>
            <Button
                type="primary"
                onClick={handleRefresh}
                className="h-8 rounded-lg bg-linear-to-br from-primary-dark to-primary font-semibold"
            >
                {i18n.t('layout:folderAssetPage.search')}
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
                    visibilityBadge:
                        folder.visibility === FolderVisibility.RESTRICTED ? <LockOutlined className="text-xs text-muted-foreground" />
                        : folder.visibility === FolderVisibility.PUBLIC ? <GlobalOutlined className="text-xs text-primary" />
                        : undefined,
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
                emptyFoldersText={searchQuery ? i18n.t('layout:folderAssetPage.noFoldersMatchYourSearch') : i18n.t('layout:folderAssetPage.noSubFoldersHere')}
                emptyAssetsText={
                    searchQuery || typeFilter !== 'all'
                        ? i18n.t('layout:folderAssetPage.noAssetsMatchYourSearch')
                        : i18n.t('layout:folderAssetPage.noAssetsInThisFolder')
                }
                emptyAssetsAction={
                    <Button
                        type="primary"
                        icon={<CloudUploadOutlined />}
                        onClick={() => folderStore.openUploadAssetModal()}
                        className="rounded-lg bg-linear-to-br from-primary-dark to-primary font-semibold"
                    >
                        {i18n.t('layout:folderAssetPage.uploadFile')}
                    </Button>
                }
                contentTop={contentTop}
            />

            {visibilityFolderId && projectId && (
                <VisibilityModal
                    open
                    folderId={visibilityFolderId}
                    projectId={projectId}
                    ownerId={project?.ownerId}
                    treeItems={folderStore.treeItems}
                    onClose={() => setVisibilityFolderId(null)}
                    onChanged={handleVisibilityChanged}
                />
            )}

            {currentFolderId && (
                <>
                    <ProofLinkModal
                        open={proofLinkOpen}
                        folderId={currentFolderId}
                        initialToken={currentFolder?.shareToken}
                        initialExpiry={currentFolder?.shareExpiry}
                        onClose={() => setProofLinkOpen(false)}
                    />
                    <ProofSelectionsDrawer
                        open={proofSelectionsOpen}
                        folderId={currentFolderId}
                        onClose={() => setProofSelectionsOpen(false)}
                    />
                </>
            )}

            <Modal
                open={folderStore.isUploadAssetOpen || folderStore.isUploadFolderOpen}
                onCancel={() => folderStore.closeModal()}
                footer={null}
                width={900}
                className="[&_.ant-modal-content]:bg-card"
                title={
                    <span className="text-lg font-semibold text-foreground">
                        {folderStore.isUploadFolderOpen ? i18n.t('layout:folderAssetPage.uploadFolder') : i18n.t('layout:folderAssetPage.uploadFile')}
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
