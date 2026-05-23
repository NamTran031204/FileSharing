import {
    CloudUploadOutlined,
    FolderOpenOutlined,
    MenuUnfoldOutlined,
    PlusOutlined,
    ReloadOutlined,
    SearchOutlined,
    SlidersOutlined,
} from '@ant-design/icons';
import { Button, Input, Modal, Select } from 'antd';
import { observer } from 'mobx-react-lite';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    GrantedProjectPermission,
    type AssetSummaryDto,
    type FolderEntity,
    type FolderTreeItemDTO,
} from '../api/api/index.defs';
import ActionDropdown, { type ActionDropdownItem } from '../components/ActionDropdown';
import { type AssetType } from '../components/AssetCard';
import FolderTreePanel, { type FolderTreeNode } from '../components/FolderTreePanel';
import FolderAssetCommonCrudPage from '../components/core/crud/FolderAssetCommonCrudPage';
import type { TopActionConfig } from '../components/core/crud/TopActions';
import UploadAssetButton from '../components/UploadAssetButton';
import UploadFolderButton from '../components/UploadFolderButton';
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

const FolderAssetPage = observer(function FolderAssetPageV2() {
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

    useEffect(() => {
        if (!projectId) return;
        sessionStore.setCurrentProject({ projectId, projectName: sessionStore.currentProjectName || projectId });
        if (!currentFolderId) sessionStore.setCurrentFolder(undefined);
        setSearchQuery('');
        folderStore.setPage(1);
        void folderStore.fetchFolders(projectId, currentFolderId);
        void folderStore.fetchAssetsPage(projectId, currentFolderId);
        void folderStore.fetchTree(projectId, currentFolderId);
    }, [projectId, currentFolderId, folderStore, sessionStore]);

    useEffect(() => {
        if (!currentFolderId) {
            sessionStore.setCurrentFolder(undefined);
            return;
        }
        const currentBreadcrumb = folderStore.breadcrumb[folderStore.breadcrumb.length - 1];
        if (!currentBreadcrumb?.folderId) return;
        sessionStore.setCurrentFolder({
            folderId: currentBreadcrumb.folderId,
            folderName: currentBreadcrumb.folderName,
            folderPath: undefined,
        });
    }, [currentFolderId, folderStore.breadcrumb, sessionStore]);

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
        void folderStore.fetchTree(projectId, currentFolderId);
    };

    const filteredFolders = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return folderStore.folders;
        return folderStore.folders.filter((f) => (f.folderName ?? '').toLowerCase().includes(q));
    }, [folderStore.folders, searchQuery]);

    const filteredAssets = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return folderStore.assets;
        return folderStore.assets.filter((a) =>
            (a.asset?.assetName ?? a.latestVersion?.fileName ?? '').toLowerCase().includes(q)
        );
    }, [folderStore.assets, searchQuery]);

    const treeData = useMemo(
        () => buildTreeNodes(folderStore.treeItems, projectName),
        [folderStore.treeItems, projectName]
    );

    const isLoading = folderStore.isFolderLoading || folderStore.isLoading;

    const breadcrumbItems = [
        { title: <Link to="/home">Home</Link> },
        { title: <Link to="/projects">Projects</Link> },
        {
            title: currentFolderId ? (
                <button type="button" className="hover:text-primary transition-colors" onClick={handleGoToRoot}>
                    {projectName}
                </button>
            ) : (
                <span>{projectName}</span>
            ),
        },
        ...folderStore.breadcrumb.slice(0, -1).map((folder) => ({
            title: folder.folderId ? (
                <button
                    type="button"
                    className="hover:text-primary transition-colors"
                    onClick={() => handleBreadcrumbFolderClick(folder.folderId!)}
                >
                    {folder.folderName}
                </button>
            ) : (
                <span>{folder.folderName}</span>
            ),
        })),
        ...(folderStore.breadcrumb.length > 0
            ? [
                {
                    title: (
                        <span className="text-foreground font-medium">
                {folderStore.breadcrumb[folderStore.breadcrumb.length - 1]?.folderName}
              </span>
                    ),
                },
            ]
            : []),
    ];

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

    const toolbarSlot = (
        <>
            {treeCollapsed && (
                <button
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-foreground transition-all hover:border-primary hover:bg-background hover:text-primary"
                    onClick={() => setTreeCollapsed(false)}
                    title="Expand folder tree"
                >
                    <MenuUnfoldOutlined className="text-lg" />
                </button>
            )}
            <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                prefix={<SearchOutlined className="text-muted-foreground" />}
                placeholder="Search files and folders..."
                allowClear
                className="h-10 max-w-[480px] rounded-lg"
            />
            <Button
                icon={<SlidersOutlined />}
                onClick={() => setShowAdvancedSearch((v) => !v)}
                className={`h-10 rounded-lg font-semibold ${showAdvancedSearch ? 'border-primary text-primary' : ''}`}
            >
                Advanced
            </Button>
            <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={isLoading}
                className="h-10 rounded-lg"
            >
                Refresh
            </Button>
        </>
    );

    const topActions: TopActionConfig[] = [
        {
            content: (
                <ActionDropdown
                    actions={[
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
                    ]}
                    trigger={
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            className="h-10 rounded-lg bg-linear-to-br from-primary-dark to-primary px-5 font-semibold shadow-md shadow-primary-dark/20"
                        >
                            New
                        </Button>
                    }
                />
            ),
        },
    ];

    // Advanced search panel rendered as contentTop inside the body scroll area
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
                folderTreeSlot={
                    !treeCollapsed ? (
                        <FolderTreePanel
                            treeData={treeData}
                            activeId={currentFolderId ?? 'root'}
                            onSelect={handleTreeSelect}
                            onCollapse={() => setTreeCollapsed(true)}
                        />
                    ) : undefined
                }
                toolbarSlot={toolbarSlot}
                topActions={topActions}
                breadcrumbItems={breadcrumbItems}
                folders={filteredFolders}
                assets={filteredAssets}
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
                    };
                }}
                folderActions={folderActions}
                assetActions={assetActions}
                onFolderClick={handleFolderClick}
                getFolderKey={(folder) => folder.folderId ?? ''}
                getAssetKey={(asset) => asset.asset?.assetId ?? ''}
                emptyFoldersText={searchQuery ? 'No folders match your search.' : 'No sub-folders here.'}
                emptyAssetsText={searchQuery ? 'No assets match your search.' : 'No assets in this folder.'}
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
                    {folderStore.isUploadFolderOpen ? <UploadFolderButton /> : <UploadAssetButton />}
                </div>
            </Modal>
        </>
    );
});

export default FolderAssetPage;
