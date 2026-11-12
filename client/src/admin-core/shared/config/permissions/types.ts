export interface OrdPermissionTreeDataNode {
    name: string;
    children?: OrdPermissionTreeDataNode[];
    actions?: string[];
}

export interface PERMISSION_TREE_TYPE {
    name?: string, // single node
    groupName?: string,
    items?: OrdPermissionTreeDataNode[]
}