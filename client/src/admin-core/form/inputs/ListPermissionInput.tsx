import {useEffect, useState} from 'react';
import {observer} from 'mobx-react-lite';
import {useTranslation} from 'react-i18next';
import {Checkbox, Spin} from 'antd';
import type {AdminPermissionGroupDto} from '../../../api/api/index.defs';
import {adminApi, adminCall} from '../../../api/adminApiResource';
import {checkPermissionUser} from '@plugin-core/auth/utils/auth.utils';
import {useSessionStore} from '@plugin-core/shared/store/useSessionStore';

interface Props {
    value?: string[];
    onChange?: (v: string[]) => void;
    /** Chi xem: khoa toan bo checkbox */
    readOnly?: boolean;
}

const ACTION_READ = 'GetPaged';

// Cay nhom -> tai nguyen -> hanh dong, du lieu tu GET /api/admin/permissions (khong hardcode catalogue o FE).
// Tick hanh dong tu tick GetPaged cua tai nguyen; bo tick GetPaged thi bo cac hanh dong con lai.
// Actor khong co permission nao thi checkbox do bi disable (G3), SA co du catalogue nen khong bi khoa.
const ListPermissionInput = observer(({value = [], onChange, readOnly}: Props) => {
    const {t} = useTranslation('admin');
    const appSession = useSessionStore((s) => s.appSession);
    const [groups, setGroups] = useState<AdminPermissionGroupDto[] | null>(null);

    useEffect(() => {
        adminCall(() => adminApi.permissions.list()).then((r) => setGroups(r.data ?? []));
    }, []);

    if (!groups) return <Spin/>;

    const can = (p: string) => !readOnly && checkPermissionUser(appSession, p);
    const baseOf = (p: string) => p.slice(0, p.lastIndexOf('.'));
    const actionOf = (p: string) => p.slice(p.lastIndexOf('.') + 1);

    const toggle = (perms: string[], p: string, checked: boolean) => {
        const set = new Set(value);
        const base = baseOf(p);
        const readPerm = `${base}.${ACTION_READ}`;
        if (checked) {
            set.add(p);
            if (perms.includes(readPerm) && can(readPerm)) set.add(readPerm);
        } else {
            set.delete(p);
            if (p === readPerm) perms.filter((x) => x !== readPerm && can(x)).forEach((x) => set.delete(x));
        }
        onChange?.(Array.from(set));
    };

    return (
        <div className="flex flex-col gap-4">
            {groups.map((g) => (
                <div key={g.group}>
                    <div className="mb-2 font-semibold text-foreground">
                        {t(`permissionGroup.${g.group}`, {defaultValue: g.group})}
                    </div>
                    <div className="flex flex-col gap-2 rounded border border-border p-3">
                        {(g.resources ?? []).map((res) => {
                            const perms = res.permissions ?? [];
                            return (
                                <div key={res.resource} className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                    <span className="w-36 shrink-0 text-muted-foreground">
                                        {t(`permission.Admin.${res.resource}._`, {defaultValue: res.resource})}
                                    </span>
                                    {perms.map((p) => (
                                        <Checkbox key={p} checked={value.includes(p)} disabled={!can(p)}
                                                  onChange={(e) => toggle(perms, p, e.target.checked)}>
                                            {t(`permission.${p}`, {defaultValue: actionOf(p)})}
                                        </Checkbox>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
});

export default ListPermissionInput;
