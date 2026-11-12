/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import {type AlainUtilArrayConfig} from "@plugin-core/shared/utils/array/array.type";
import {type ArrayServiceArrToTreeNodeOptions, type ArrayServiceArrToTreeOptions} from "@plugin-core/shared/utils/array/array-type.service";


class ArrayUtil {
    private c: AlainUtilArrayConfig;

    constructor() {
        this.c = {
            deepMapName: 'deep',
            parentMapName: 'parent',
            idMapName: 'id',
            parentIdMapName: 'parent_id',
            childrenMapName: 'children',
            titleMapName: 'title',
            checkedMapname: 'checked',
            selectedMapname: 'selected',
            expandedMapname: 'expanded',
            disabledMapname: 'disabled'
        };
    }

    arrToTree<T extends object = any>(arr: readonly T[], options?: ArrayServiceArrToTreeOptions<T>): T[] {
        if (!Array.isArray(arr) || arr.length === 0) {
            return [];
        }

        const opt = {
            idMapName: this.c.idMapName,
            parentIdMapName: this.c.parentIdMapName,
            childrenMapName: this.c.childrenMapName,
            cb: null,
            ...options
        } as ArrayServiceArrToTreeOptions<T>;
        const tree: T[] = [];
        const childrenOf: { [key: string]: T[] } = {};
        let rootPid = opt.rootParentIdValue;
        const arrType = arr as ReadonlyArray<{ [key: string]: any }>;
        if (!rootPid) {
            const pids = arrType.map(i => i[opt.parentIdMapName!]);
            const emptyPid = pids.findIndex(w => w == null);
            rootPid = emptyPid !== -1 ? pids[emptyPid] : pids.sort()[0];
        }
        for (const item of arrType) {
            const id = item[opt.idMapName!];
            const pid = item[opt.parentIdMapName!];
            childrenOf[id] = childrenOf[id] || [];
            item[opt.childrenMapName!] = childrenOf[id];
            if (opt.cb) {
                opt.cb(item as T);
            }
            if (pid !== rootPid) {
                childrenOf[pid] = childrenOf[pid] || [];
                childrenOf[pid].push(item as T);
            } else {
                tree.push(item as T);
            }
        }
        return tree;
    }

    /**
     * 数组转换成 `nz-tree` 数据源，通过 `options` 转化项名，也可以使用 `options.cb` 更高级决定数据项
     */
    arrToTreeNode<T extends object = any>(arr: readonly T[], options?: ArrayServiceArrToTreeNodeOptions): any[] {
        const opt = {
            idMapName: this.c.idMapName,
            parentIdMapName: this.c.parentIdMapName,
            titleMapName: this.c.titleMapName,
            isLeafMapName: 'isLeaf',
            checkedMapname: this.c.checkedMapname,
            selectedMapname: this.c.selectedMapname,
            expandedMapname: this.c.expandedMapname,
            disabledMapname: this.c.disabledMapname,
            cb: null,
            ...options
        } as ArrayServiceArrToTreeNodeOptions<T>;
        const tree = this.arrToTree<T>(arr, {
            idMapName: opt.idMapName,
            parentIdMapName: opt.parentIdMapName,
            childrenMapName: 'children'
        });
        this.visitTree<T>(tree, (item: { [key: string]: any }, parent, deep) => {
            item.key = item[opt.idMapName!];
            item.title = item[opt.titleMapName!];
            item.checked = item[opt.checkedMapname!];
            item.selected = item[opt.selectedMapname!];
            item.expanded = item[opt.expandedMapname!];
            item.disabled = item[opt.disabledMapname!];
            if (item[opt.isLeafMapName!] == null) {
                item.isLeaf = item.children.length === 0;
            } else {
                item.isLeaf = item[opt.isLeafMapName!];
            }
            if (opt.cb) {
                opt.cb(item as any, parent, deep);
            }
        });
        return tree.map(node => node);
    }

    /**
     * 递归访问整个树
     */
    visitTree<T extends object = any>(
        tree: readonly T[],
        cb: (item: T, parent: T | null, deep: number) => void,
        options?: {
            /** 子项名，默认：`'children'` */
            childrenMapName?: string;
        }
    ): void {
        options = {
            childrenMapName: this.c.childrenMapName,
            ...options
        };
        const inFn = (data: readonly T[], parent: T | null, deep: number): void => {
            for (const item of data) {
                cb(item, parent, deep);
                const childrenVal = (item as { [key: string]: any })[options!.childrenMapName!];
                if (Array.isArray(childrenVal) && childrenVal.length > 0) {
                    inFn(childrenVal, item, deep + 1);
                }
            }
        };
        inFn(tree, null, 1);
    }

    mapToArray = (values: any) => {
        if (!values) {
            return [];
        }

        return Object.entries(values).map(([id, value]) => ({
            id,
            ...value as any
        })) || []
    }
}

export default new ArrayUtil();
