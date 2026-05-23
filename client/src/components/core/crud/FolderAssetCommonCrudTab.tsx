import type { ReactNode } from 'react';
import FolderAssetBody, { type FolderAssetBodyProps } from './FolderAssetBody';

export interface OrdCrudPageTabProps<TFolder, TAsset>
  extends FolderAssetBodyProps<TFolder, TAsset> {
  /** Slot sidebar (folder tree) — optional */
  folderTreeSlot?: ReactNode;
  /** Slot toolbar (search + filter) — không có topActions, không có pageTitle */
  toolbarSlot?: ReactNode;
  /** Class custom cho content scroll area */
  contentClassName?: string;
}

/**
 * Bản thu gọn của FolderAssetCommonCrudPage — bỏ:
 *   - pageTitle
 *   - topActions
 *   - CommonLayout wrapper (giả định đã có wrapper bên ngoài cung cấp app shell)
 *
 * Dùng để embed vào tab/section khác (vd: bên trong AntD Tabs).
 *
 * Layout:
 *   flex flex-1
 *     ├── folderTreeSlot  (optional)
 *     └── main flex-1
 *         ├── toolbarSlot  (optional, h-[72px])
 *         └── content scrollable: breadcrumb + folders + assets
 */
const FolderAssetCommonCrudTab = <TFolder, TAsset>({
  folderTreeSlot,
  toolbarSlot,
  contentClassName,
  ...bodyProps
}: OrdCrudPageTabProps<TFolder, TAsset>) => {
  return (
    <div className="flex flex-1 overflow-hidden">
      {folderTreeSlot}

      <div className="flex flex-1 flex-col overflow-hidden">
        {toolbarSlot && (
          <div className="flex h-[72px] shrink-0 items-center gap-3 border-b border-border bg-card px-8">
            {toolbarSlot}
          </div>
        )}

        <div className={`flex-1 overflow-y-auto px-8 py-6 ${contentClassName ?? ''}`}>
          <FolderAssetBody<TFolder, TAsset> {...bodyProps} />
        </div>
      </div>
    </div>
  );
};

export default FolderAssetCommonCrudTab;
