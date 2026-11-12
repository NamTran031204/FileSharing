/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import {l} from "@plugin-core/shared/language/lang.utils";
import React from "react";
import {type TreeDataNode} from "antd";
import ArrayUtil from "@plugin-core/shared/utils/array/array.util";
import {AppBootstrapDto} from "@plugin-core/auth/service/session/dto";
import {checkPermissionUser} from "@plugin-core/auth/utils/auth.utils";
import {type OrdPermissionTreeDataNode, type PERMISSION_TREE_TYPE} from "@plugin-core/shared/config/permissions/types";

class OrdPermissionArrayUtil {
    private listPermissionBase: string[] = [];
    private _root: TreeDataNode[] | undefined;
    private _session: AppBootstrapDto | null = null;

    /**
     * Set session để check permissions
     */
    setSession(session: AppBootstrapDto | null): void {
        this._session = session;
    }

    getTreeDataRoot(permissionsTreeData: PERMISSION_TREE_TYPE[]): TreeDataNode[] {
        this.listPermissionBase = [];

        this._root = [
            {
                title: l.trans('permission.All'),
                key: 'root',
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
                //@ts-ignore
                // eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
                children: permissionsTreeData.map((it, _) => {
                    if (it?.name) {
                        const singleNode = this.getNodes([
                            {
                                name: it.name,
                                children: [],
                                actions: []
                            }
                        ]);
                        if (singleNode.length > 0) {
                            return {
                                title: l.trans('permission.' + it.name),
                                key: it.name,
                            };
                        }
                        return {
                            key: 'hidden',
                            title: 'ignore'
                        };
                    }

                    const nodes = this.getNodes(it.items || []);
                    if (nodes.length > 0) {
                        const treePermission = ArrayUtil.arrToTreeNode(nodes, {
                            idMapName: 'name',
                            parentIdMapName: 'parentName',
                            titleMapName: 'title',
                        });
                        return {
                            title: l.trans('permission.group.' + it.groupName),
                            key: it.groupName,
                            children: [...treePermission]
                        };
                    } else {
                        return {
                            key: 'hidden',
                            title: 'ignore'
                        };
                    }
                }).filter(s => s.key !== 'hidden')
            }
        ];
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
        // @ts-ignore
        return this._root;
    }

    private getNodes = (items: OrdPermissionTreeDataNode[]) => {
        const flatNode = this.flattenMenu(items)
            .filter(x => this._session && checkPermissionUser(this._session, x.name));
        if (!flatNode || flatNode.length <= 0) {
            return [];
        }
        flatNode.forEach(it => {
            if (it?.actions?.length > 0) {
                this.listPermissionBase.push(it.name);
                it.actions.forEach((actionName: string) => {
                    flatNode.push({
                        name: it.name + '.' + actionName,
                        parentName: it.name,
                        title: (<>
                            {l.trans('permission.action.' + actionName)}
                            <b className="ms-1">({l.trans('permission.' + it?.name)})</b>
                        </>),
                        expanded: false
                    });
                });
                it.expanded = false;
            }
        });
        flatNode.forEach(it => {
            if (!it?.title) {
                it.title = l.trans('permission.' + it?.name);
                if (it?.expanded !== false) {
                    it.expanded = true;
                }
            }
        });

        return flatNode;
    }
    private flattenMenu = (menu: OrdPermissionTreeDataNode[], parentName = null) => {
        const result: any[] = [];

        function flatten(items: any, parentName: any) {
            for (const item of items) {
                const {children, ...rest} = item;
                result.push({...rest, parentName});
                if (children) {
                    flatten(children, rest.name);
                }
            }
        }

        flatten(menu, parentName);
        return result;
    }

    includePermissionBase(listPermissionName: string[]) {
        this.listPermissionBase.forEach(it => {
            if (!listPermissionName.includes(it)) {
                const existAction = listPermissionName.find(x => x.includes(it));
                if (existAction) {
                    listPermissionName.push(it);
                }
            }
        });
    }

    ignorePermissionBaseWhenSetGranted(granted: string[]) {
        if (granted) {
            try {
                return granted?.filter(x => !this.listPermissionBase.includes(x)) || [];
            // eslint-disable-next-line no-empty -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
            } catch {

            }

        }
        return [];
    }

}

export default new OrdPermissionArrayUtil();
