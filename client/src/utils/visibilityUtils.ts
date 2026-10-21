import { FolderVisibility, GrantedVisibility, type FolderTreeItemDTO } from '../api/api/index.defs';

const treeMap = (items: FolderTreeItemDTO[]) => new Map(items.map((i) => [i.folderId, i]));

/** chuoi folder tu goc den folder hien tai (gom ca chinh no) */
const chainOf = (folderId: string, items: FolderTreeItemDTO[]): FolderTreeItemDTO[] => {
    const map = treeMap(items);
    const current = map.get(folderId);
    if (!current) return [];
    const ancestors = (current.ancestorIds ?? [])
        .map((id) => map.get(id))
        .filter((i): i is FolderTreeItemDTO => i !== undefined);
    return [...ancestors, current];
};

/** to tien gan nhat (khong tinh chinh folder) dang RESTRICTED, neu co */
export const findRestrictedAncestor = (folderId: string, items: FolderTreeItemDTO[]): FolderTreeItemDTO | undefined =>
    chainOf(folderId, items).slice(0, -1).reverse().find((i) => i.visibility === FolderVisibility.RESTRICTED);

/** mo phong ProjectPermissionResolver: RESTRICTED thang PUBLIC, khong co thi theo project */
export const resolveEffectiveVisibility = (
    folderId: string,
    items: FolderTreeItemDTO[],
    projectVisibility?: GrantedVisibility,
): FolderVisibility => {
    const chain = chainOf(folderId, items);
    if (chain.some((i) => i.visibility === FolderVisibility.RESTRICTED)) return FolderVisibility.RESTRICTED;
    if (chain.some((i) => i.visibility === FolderVisibility.PUBLIC)) return FolderVisibility.PUBLIC;
    // INHERIT o day nghia la theo project PRIVATE
    return projectVisibility === GrantedVisibility.PUBLIC ? FolderVisibility.PUBLIC : FolderVisibility.INHERIT;
};

/** folder con (moi cap) co visibility rieng, khac INHERIT */
export const listNonInheritDescendants = (folderId: string, items: FolderTreeItemDTO[]): FolderTreeItemDTO[] =>
    items.filter(
        (i) =>
            (i.ancestorIds ?? []).includes(folderId) &&
            i.visibility != null &&
            i.visibility !== FolderVisibility.INHERIT,
    );

/** "Inherit tu <ten>" cho folder INHERIT: tim to tien gan nhat co visibility rieng */
export const describeInheritSource = (folderId: string, items: FolderTreeItemDTO[], projectName: string): string => {
    const chain = chainOf(folderId, items).slice(0, -1).reverse();
    const source = chain.find((i) => i.visibility != null && i.visibility !== FolderVisibility.INHERIT);
    return source?.folderName ?? projectName;
};
