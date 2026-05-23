import { Breadcrumb, Empty, Skeleton, type BreadcrumbProps } from 'antd';
import { FolderOpenOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';
import FolderCard from "../../folder/FolderCard.tsx";
import type {ActionDropdownItem} from "../common/ActionDropdown.tsx";
import AssetCard, {type AssetType} from "../../assets/AssetCard.tsx";

export interface FolderCardData {
  name: string;
  itemCount: number;
}

export interface AssetCardData {
  name: string;
  sizeLabel: string;
  versionLabel: string;
  type: AssetType;
  thumbnailUrl?: string;
  durationLabel?: string;
}

export interface FolderAssetBodyProps<TFolder, TAsset> {
  breadcrumbItems?: BreadcrumbProps['items'];

  folders: TFolder[];
  assets: TAsset[];
  isLoadingFolders?: boolean;
  isLoadingAssets?: boolean;

  mapFolderToCard: (folder: TFolder) => FolderCardData;
  mapAssetToCard: (asset: TAsset) => AssetCardData;

  folderActions?: ActionDropdownItem<TFolder>[];
  assetActions?: ActionDropdownItem<TAsset>[];

  onFolderClick?: (folder: TFolder) => void;
  onAssetClick?: (asset: TAsset) => void;

  /** Hàm key — tránh React warning khi 2 folder có cùng name */
  getFolderKey?: (folder: TFolder, index: number) => string;
  getAssetKey?: (asset: TAsset, index: number) => string;

  emptyFoldersText?: ReactNode;
  emptyAssetsText?: ReactNode;

  foldersTitle?: string;
  assetsTitle?: string;

  contentTop?: ReactNode;
  contentBetweenFolderAndAsset?: ReactNode;
}

const SkeletonGrid = ({ rows = 1, count = 4 }: { rows?: number; count?: number }) => (
  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-2xl border border-border/30 bg-card p-5">
        <Skeleton active paragraph={{ rows }} />
      </div>
    ))}
  </div>
);

/**
 * Body chung cho FolderAssetCommonCrudPage và FolderAssetCommonCrudTab:
 *   - Breadcrumb
 *   - Folders section (grid card)
 *   - Assets section (grid card)
 *
 * Không bao gồm sidebar tree, toolbar, page title hay topActions —
 * những phần đó do wrapper bên ngoài (FolderAssetCommonCrudPage / FolderAssetCommonCrudTab) tự lo.
 */
const FolderAssetBody = <TFolder, TAsset>({
  breadcrumbItems,
  folders,
  assets,
  isLoadingFolders,
  isLoadingAssets,
  mapFolderToCard,
  mapAssetToCard,
  folderActions,
  assetActions,
  onFolderClick,
  onAssetClick,
  getFolderKey,
  getAssetKey,
  emptyFoldersText,
  emptyAssetsText,
  foldersTitle = 'Folders',
  assetsTitle = 'Files',
  contentTop,
  contentBetweenFolderAndAsset,
}: FolderAssetBodyProps<TFolder, TAsset>) => {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10">
      {breadcrumbItems && breadcrumbItems.length > 0 && (
        <Breadcrumb
          separator={<span className="text-muted-foreground">/</span>}
          items={breadcrumbItems}
          className="text-sm font-semibold text-muted-foreground"
        />
      )}

      {contentTop}

      {/* Folders section */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">{foldersTitle}</h2>
          {!isLoadingFolders && (
            <span className="rounded-full bg-accent/30 px-2 py-0.5 text-xs font-semibold text-primary">
              {folders.length}
            </span>
          )}
        </div>

        {isLoadingFolders ? (
          <SkeletonGrid rows={1} />
        ) : folders.length === 0 ? (
          <div className="rounded-2xl border border-border/30 bg-card px-6 py-10">
            <Empty
              image={<FolderOpenOutlined className="text-4xl text-muted-foreground" />}
              description={
                <span className="text-sm text-muted-foreground">
                  {emptyFoldersText ?? 'No folders here.'}
                </span>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {folders.map((folder, idx) => {
              const data = mapFolderToCard(folder);
              const key = getFolderKey?.(folder, idx) ?? `${data.name}-${idx}`;
              return (
                <FolderCard<TFolder>
                  key={key}
                  name={data.name}
                  itemCount={data.itemCount}
                  record={folder}
                  actions={folderActions}
                  onClick={() => onFolderClick?.(folder)}
                />
              );
            })}
          </div>
        )}
      </section>

      {contentBetweenFolderAndAsset}

      {/* Assets section */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">{assetsTitle}</h2>
          {!isLoadingAssets && (
            <span className="rounded-full bg-accent/30 px-2 py-0.5 text-xs font-semibold text-primary">
              {assets.length}
            </span>
          )}
        </div>

        {isLoadingAssets ? (
          <SkeletonGrid rows={3} />
        ) : assets.length === 0 ? (
          <div className="rounded-2xl border border-border/30 bg-card px-6 py-10">
            <Empty
              description={
                <span className="text-sm text-muted-foreground">
                  {emptyAssetsText ?? 'No assets in this folder.'}
                </span>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {assets.map((asset, idx) => {
              const data = mapAssetToCard(asset);
              const key = getAssetKey?.(asset, idx) ?? `${data.name}-${idx}`;
              return (
                <AssetCard<TAsset>
                  key={key}
                  name={data.name}
                  sizeLabel={data.sizeLabel}
                  versionLabel={data.versionLabel}
                  type={data.type}
                  thumbnailUrl={data.thumbnailUrl}
                  durationLabel={data.durationLabel}
                  record={asset}
                  actions={assetActions}
                  onClick={() => onAssetClick?.(asset)}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default FolderAssetBody;
