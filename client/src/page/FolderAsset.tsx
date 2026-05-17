import {
  CloudUploadOutlined,
  FolderOpenOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import { Breadcrumb, Button, Empty, Input, Modal, Select, Skeleton, message, type BreadcrumbProps } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AssetControllerService } from '../api/api/AssetControllerService';
import { FolderControllerService } from '../api/api/FolderControllerService';
import type { AssetSummaryDto, FolderEntity } from '../api/api/index.defs';
import ActionDropdown from '../components/ActionDropdown';
import AssetCard, { type AssetType } from '../components/AssetCard';
import FolderCard from '../components/FolderCard';
import FolderTreePanel, { type FolderTreeNode } from '../components/FolderTreePanel';
import UploadButton from '../components/UploadButton';
import UploadFolderButton from '../components/UploadFolderButton';
import CommonLayout from '../layout/CommonLayout';
import { useStore } from '../store';

const PAGE_SIZE = 50;

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

const buildFolderTrail = async (folderId: string): Promise<FolderEntity[]> => {
  const trail: FolderEntity[] = [];
  let currentId: string | undefined = folderId;
  const MAX_DEPTH = 20;
  let depth = 0;

  while (currentId && depth < MAX_DEPTH) {
    const response = await FolderControllerService.getById({ folderId: currentId });
    if (!response?.isSuccessful || !response.data) break;
    trail.unshift(response.data);
    currentId = response.data.parentFolderId ?? undefined;
    depth++;
  }

  return trail;
};

const toTreeNodes = (folders: FolderEntity[]): FolderTreeNode[] =>
  folders.map((f) => ({ id: f.folderId ?? '', name: f.folderName ?? '—', children: [] }));

const FolderAsset = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { sessionStore } = useStore();

  const currentFolderId = searchParams.get('folderId') ?? undefined;
  const projectName = sessionStore.currentProjectName || projectId || 'Project';

  // UI state
  const [treeCollapsed, setTreeCollapsed] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadModalType, setUploadModalType] = useState<'file' | 'folder' | null>(null);

  // Advanced search filters — TODO: wire to API query when backend supports it
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Data
  const [folders, setFolders] = useState<FolderEntity[]>([]);
  const [assets, setAssets] = useState<AssetSummaryDto[]>([]);
  const [folderTrail, setFolderTrail] = useState<FolderEntity[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);

  // ---------------------------------------------------------------------------
  // Data loaders
  // ---------------------------------------------------------------------------

  const loadFolders = async (folderId?: string) => {
    if (!projectId) return;
    try {
      setIsLoadingFolders(true);
      const response = await FolderControllerService.getPage({
        body: {
          maxResultCount: PAGE_SIZE,
          skipCount: 0,
          sorting: 'folderName asc',
          filter: { projectId, parentFolderId: folderId, isActive: true },
        },
      });
      if (!response?.isSuccessful) throw new Error(response?.message || 'Cannot load folders');
      setFolders(response.data?.data ?? []);
    } catch (error) {
      console.error('Load folders failed:', error);
      message.error('Không thể tải danh sách folder');
      setFolders([]);
    } finally {
      setIsLoadingFolders(false);
    }
  };

  const loadAssets = async (folderId?: string) => {
    if (!projectId) return;
    try {
      setIsLoadingAssets(true);
      const response = await AssetControllerService.getPage1({
        body: {
          maxResultCount: PAGE_SIZE,
          skipCount: 0,
          sorting: 'updatedAt desc',
          filter: { projectId, folderId, isActive: true },
        },
      });
      if (!response?.isSuccessful) throw new Error(response?.message || 'Cannot load assets');
      setAssets(response.data?.data ?? []);
    } catch (error) {
      console.error('Load assets failed:', error);
      message.error('Không thể tải danh sách asset');
      setAssets([]);
    } finally {
      setIsLoadingAssets(false);
    }
  };

  const loadFolderTrail = async (folderId?: string) => {
    if (!folderId) {
      setFolderTrail([]);
      sessionStore.setCurrentFolder(undefined);
      return;
    }
    try {
      const trail = await buildFolderTrail(folderId);
      setFolderTrail(trail);
      const leaf = trail[trail.length - 1];
      if (leaf) {
        sessionStore.setCurrentFolder({
          folderId: leaf.folderId,
          folderName: leaf.folderName,
          folderPath: leaf.folderPath,
        });
      }
    } catch (error) {
      console.error('Load folder trail failed:', error);
      setFolderTrail([]);
    }
  };

  useEffect(() => {
    setSearchQuery('');
    void loadFolders(currentFolderId);
    void loadAssets(currentFolderId);
    void loadFolderTrail(currentFolderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, currentFolderId]);

  // ---------------------------------------------------------------------------
  // Navigation handlers
  // ---------------------------------------------------------------------------

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
    } else {
      if (!projectId) return;
      navigate(`/projects/${projectId}?folderId=${id}`);
    }
  };

  // ---------------------------------------------------------------------------
  // Filtered data
  // ---------------------------------------------------------------------------

  const filteredFolders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return folders;
    return folders.filter((f) => (f.folderName ?? '').toLowerCase().includes(q));
  }, [folders, searchQuery]);

  const filteredAssets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter((a) =>
      (a.asset?.assetName ?? a.latestVersion?.fileName ?? '').toLowerCase().includes(q)
    );
  }, [assets, searchQuery]);

  // Tree nodes derived from loaded folders (flat list — children loaded on demand)
  const treeData: FolderTreeNode[] = useMemo(() => [
    {
      id: 'root',
      name: projectName,
      children: toTreeNodes(folders),
    },
  ], [folders, projectName]);

  const activeTreeId = currentFolderId ?? 'root';
  const isLoading = isLoadingFolders || isLoadingAssets;
  const uploadModalTitle = uploadModalType === 'folder' ? 'Upload Folder' : 'Upload File';

  // ---------------------------------------------------------------------------
  // Breadcrumb
  // ---------------------------------------------------------------------------

  const breadcrumbItems: BreadcrumbProps['items'] = [
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
    ...folderTrail.slice(0, -1).map((folder) => ({
      title: (
        <button
          type="button"
          className="hover:text-primary transition-colors"
          onClick={() => handleBreadcrumbFolderClick(folder.folderId!)}
        >
          {folder.folderName}
        </button>
      ),
    })),
    ...(folderTrail.length > 0
      ? [{
          title: (
            <span className="text-foreground font-medium">
              {folderTrail[folderTrail.length - 1]?.folderName}
            </span>
          ),
        }]
      : []),
  ];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <CommonLayout>
      <div className="flex flex-1 overflow-hidden">
        {/* Folder Tree Panel */}
        {!treeCollapsed && (
          <FolderTreePanel
            treeData={treeData}
            activeId={activeTreeId}
            onSelect={handleTreeSelect}
            onCollapse={() => setTreeCollapsed(true)}
          />
        )}

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex h-[72px] shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-8">
            {treeCollapsed && (
              <button
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-foreground transition-all hover:border-primary hover:bg-background hover:text-primary"
                onClick={() => setTreeCollapsed(false)}
                title="Expand folder tree"
              >
                <MenuUnfoldOutlined className="text-lg" />
              </button>
            )}

            <div className="flex flex-1 items-center gap-3">
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
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className={`h-10 rounded-lg font-semibold ${showAdvancedSearch ? 'border-primary text-primary' : ''}`}
              >
                Advanced
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  void loadFolders(currentFolderId);
                  void loadAssets(currentFolderId);
                }}
                loading={isLoading}
                className="h-10 rounded-lg"
              >
                Refresh
              </Button>
            </div>

            <ActionDropdown
              actions={[
                {
                  title: 'uploadFile',
                  titleCustom: 'Upload File',
                  icon: <CloudUploadOutlined className="text-base text-primary" />,
                  onClick: () => setUploadModalType('file'),
                },
                {
                  title: 'uploadFolder',
                  titleCustom: 'Upload Folder',
                  icon: <FolderOpenOutlined className="text-base text-primary" />,
                  onClick: () => setUploadModalType('folder'),
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
          </div>

          {/* Advanced Search Panel */}
          {showAdvancedSearch && (
            <div className="flex shrink-0 items-end gap-4 border-b border-border bg-card px-8 py-5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  User
                </label>
                {/* TODO: populate from project members API */}
                <Select
                  value={filterUser}
                  onChange={setFilterUser}
                  className="min-w-40"
                  options={[
                    { value: 'all', label: 'All Users' },
                  ]}
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
                onClick={() => {
                  // TODO: pass filterUser + filterStatus to loadFolders/loadAssets when API supports it
                  void loadFolders(currentFolderId);
                  void loadAssets(currentFolderId);
                }}
                className="h-8 rounded-lg bg-linear-to-br from-primary-dark to-primary font-semibold"
              >
                Search
              </Button>
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="mx-auto flex max-w-7xl flex-col gap-10">
              {/* Breadcrumb */}
              <Breadcrumb
                separator={<span className="text-muted-foreground">/</span>}
                items={breadcrumbItems}
                className="text-sm font-semibold text-muted-foreground"
              />

              {/* Folders Section */}
              <section className="space-y-5">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-foreground">Folders</h2>
                  {!isLoadingFolders && (
                    <span className="rounded-full bg-accent/30 px-2 py-0.5 text-xs font-semibold text-primary">
                      {filteredFolders.length}
                    </span>
                  )}
                </div>

                {isLoadingFolders ? (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="rounded-2xl border border-border/30 bg-card p-5">
                        <Skeleton active paragraph={{ rows: 1 }} />
                      </div>
                    ))}
                  </div>
                ) : filteredFolders.length === 0 ? (
                  <div className="rounded-2xl border border-border/30 bg-card px-6 py-10">
                    <Empty
                      image={<FolderOpenOutlined className="text-4xl text-muted-foreground" />}
                      description={
                        <span className="text-sm text-muted-foreground">
                          {searchQuery ? 'No folders match your search.' : 'No sub-folders here.'}
                        </span>
                      }
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {filteredFolders.map((folder) => (
                      <FolderCard
                        key={folder.folderId}
                        name={folder.folderName ?? '—'}
                        itemCount={folder.stats?.assetCount ?? 0}
                        onClick={() => handleFolderClick(folder)}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Assets Section */}
              <section className="space-y-5">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-foreground">Files</h2>
                  {!isLoadingAssets && (
                    <span className="rounded-full bg-accent/30 px-2 py-0.5 text-xs font-semibold text-primary">
                      {filteredAssets.length}
                    </span>
                  )}
                </div>

                {isLoadingAssets ? (
                  <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="rounded-2xl border border-border/30 bg-card p-5">
                        <Skeleton active paragraph={{ rows: 3 }} />
                      </div>
                    ))}
                  </div>
                ) : filteredAssets.length === 0 ? (
                  <div className="rounded-2xl border border-border/30 bg-card px-6 py-10">
                    <Empty
                      description={
                        <span className="text-sm text-muted-foreground">
                          {searchQuery ? 'No assets match your search.' : 'No assets in this folder.'}
                        </span>
                      }
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
                    {filteredAssets.map((summary) => {
                      const asset = summary.asset;
                      const version = summary.latestVersion;
                      const assetType = resolveAssetType(version?.mimeType);
                      const duration = formatDuration(version?.mediaInfo?.durationMs);

                      return (
                        <AssetCard
                          key={asset?.assetId}
                          name={asset?.assetName ?? version?.fileName ?? '—'}
                          sizeLabel={formatBytes(version?.fileSize)}
                          versionLabel={version?.versionNumber != null ? `v${version.versionNumber}` : 'v?'}
                          type={assetType}
                          durationLabel={duration}
                          onClick={() => {
                            // TODO: open asset detail / preview
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <Modal
        open={uploadModalType !== null}
        onCancel={() => setUploadModalType(null)}
        footer={null}
        width={900}
        className="[&_.ant-modal-content]:bg-card"
        title={<span className="text-lg font-semibold text-foreground">{uploadModalTitle}</span>}
        destroyOnClose
      >
        <div className="max-h-[70vh] overflow-auto">
          {uploadModalType === 'folder' ? <UploadFolderButton /> : <UploadButton />}
        </div>
      </Modal>
    </CommonLayout>
  );
};

export default FolderAsset;
