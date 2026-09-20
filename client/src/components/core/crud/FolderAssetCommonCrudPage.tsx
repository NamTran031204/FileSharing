import type { ReactNode } from 'react';
import FolderAssetBody, { type FolderAssetBodyProps } from './FolderAssetBody';
import TopActions, { type TopActionConfig } from './TopActions';
import CommonLayout from "../../../layout/CommonLayout.tsx";

export interface OrdCrudPageProps<TFolder, TAsset>
  extends FolderAssetBodyProps<TFolder, TAsset> {
  /** Tiêu đề trang — render trong content area, không phải app header */
  pageTitle?: string;
  /** Slot cho FolderTreePanel (hoặc bất kỳ sidebar nào) — đặt bên trái */
  folderTreeSlot?: ReactNode;
  /** Slot full-width ngay dưới AppHeader — chỗ của ContextActionBar */
  topBarSlot?: ReactNode;
  /** Slot rail bên phải vùng nội dung — chỗ của FolderInsightPanel */
  asideSlot?: ReactNode;
  /** Slot cho search box / advanced filter — đặt trong toolbar */
  toolbarSlot?: ReactNode;
  /** Các nút action ở góc phải toolbar */
  topActions?: TopActionConfig[];
  /** Hoàn toàn tắt toolbar (không render) */
  hiddenToolbar?: boolean;
  /** Class custom cho content scroll area */
  contentClassName?: string;
  /** true = AppSidebar hien icon-only cho man nay (mac dinh false, giu nguyen UI hien tai) */
  sidebarCollapsed?: boolean;
}

/**
 * Wrapper page cho folder/asset — design template: src/page/FolderAsset.tsx
 *
 * Layout:
 *   CommonLayout
 *     ├── topBarSlot           (ContextActionBar — full width)
 *     └── flex flex-1
 *         ├── folderTreeSlot   (sidebar tree)
 *         └── main flex-1
 *             ├── toolbar (h-[72px])  →  toolbarSlot + TopActions
 *             └── flex flex-1
 *                 ├── content scrollable
 *                 │   ├── pageTitle (optional)
 *                 │   ├── contentTop
 *                 │   ├── Folders grid
 *                 │   ├── contentBetween
 *                 │   └── Assets grid
 *                 └── asideSlot        (rail phải)
 */
const FolderAssetCommonCrudPage = <TFolder, TAsset>({
  pageTitle,
  folderTreeSlot,
  topBarSlot,
  asideSlot,
  toolbarSlot,
  topActions,
  hiddenToolbar,
  contentClassName,
  sidebarCollapsed,
  ...bodyProps
}: OrdCrudPageProps<TFolder, TAsset>) => {
  return (
    <CommonLayout sidebarCollapsed={sidebarCollapsed}>
      {topBarSlot}

      <div className="flex flex-1 overflow-hidden">
        {folderTreeSlot}

        <div className="flex flex-1 flex-col overflow-hidden">
          {!hiddenToolbar && (toolbarSlot || topActions?.length) && (
            <div className="flex h-[72px] shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-8">
              <div className="flex flex-1 items-center gap-3">{toolbarSlot}</div>
              <TopActions topActions={topActions} />
            </div>
          )}

          <div className="flex flex-1 overflow-hidden">
            <div className={`flex-1 overflow-y-auto px-8 py-6 ${contentClassName ?? ''}`}>
              {pageTitle && (
                <h1 className="mb-6 text-2xl font-bold text-foreground">{pageTitle}</h1>
              )}
              <FolderAssetBody<TFolder, TAsset> {...bodyProps} />
            </div>

            {asideSlot}
          </div>
        </div>
      </div>
    </CommonLayout>
  );
};

export default FolderAssetCommonCrudPage;
