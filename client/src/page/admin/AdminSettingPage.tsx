import {useCallback, useEffect, useState} from 'react';
import {observer} from 'mobx-react-lite';
import {useTranslation} from 'react-i18next';
import {Button, Card, Checkbox, Form, Input, InputNumber, Modal, Select, Space, Switch, Tag} from 'antd';
import type {AdminSettingGroupDto, AdminSettingItemDto} from '../../api/api/index.defs';
import {adminApi, adminCall} from '../../api/adminApiResource';
import uiUtils from '../../utils/uiUtils';
import AdminLayout from './AdminLayout.tsx';
import {checkPermissionUser} from '@plugin-core/auth/utils/auth.utils';
import {useSessionStore} from '@plugin-core/shared/store/useSessionStore';
import {ADMIN_PER} from '../../components/core/layout/sidebarMenu';

const MASK = '••••••••';
const isNumeric = (type?: string) => type === 'INT' || type === 'LONG';
const clearName = (key?: string) => `clear:${key}`;
// key i18n phang (i18next dung dau cham de long nhau): upload.max-file-size -> upload_max_file_size
const itemKey = (key?: string) => (key ?? '').replace(/[.-]/g, '_');

// Gia tri hien thi (read-only) cua 1 key; secret khong bao gio co plaintext
const displayValue = (it: AdminSettingItemDto, unset: string) => {
    if (it.secret) return it.maskedSet ? MASK : unset;
    return it.value === undefined || it.value === null || it.value === '' ? '—' : it.value;
};

// Gia tri ban dau cua control theo type
const initialOf = (it: AdminSettingItemDto): unknown => {
    if (it.secret) return '';
    if (it.type === 'BOOL') return it.value === 'true';
    if (isNumeric(it.type)) return it.value === undefined || it.value === '' ? undefined : Number(it.value);
    if (it.type === 'STRING_LIST') return (it.value ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    return it.value ?? '';
};

// Doi gia tri control ve chuoi gui backend (backend nhan Map<String,String>)
const toWire = (it: AdminSettingItemDto, v: unknown): string => {
    if (it.type === 'STRING_LIST') return ((v as string[]) ?? []).join(',');
    return v === undefined || v === null ? '' : String(v);
};

type TFn = (k: string, o?: Record<string, unknown>) => string;

// Nhan + mo ta theo ngon ngu, thieu ban dich thi lui ve key ky thuat (khong hien chuoi i18n tho)
const labelOf = (it: AdminSettingItemDto, t: TFn) => t(`setting.item.${itemKey(it.key)}.label`, {defaultValue: it.key});
const descOf = (it: AdminSettingItemDto, t: TFn) => t(`setting.item.${itemKey(it.key)}.desc`, {defaultValue: ''});

const SettingField = ({it, t}: {it: AdminSettingItemDto; t: TFn}) => {
    let control;
    if (it.secret) {
        control = <Input.Password autoComplete="new-password" placeholder={t('setting.secretKeepHint')}/>;
    } else if (it.type === 'BOOL') {
        control = <Switch/>;
    } else if (isNumeric(it.type)) {
        control = <InputNumber className="w-full" min={it.min !== undefined ? Number(it.min) : undefined}
                               max={it.max !== undefined ? Number(it.max) : undefined}/>;
    } else if (it.type === 'STRING_LIST') {
        control = <Select mode="tags" tokenSeparators={[',']} open={false}/>;
    } else if (it.type === 'ENUM') {
        control = <Select options={(it.options ?? []).map((o) => ({value: o, label: o}))}/>;
    } else {
        control = <Input placeholder={it.defaultValue}/>;
    }
    const rules = it.type === 'URL' ? [{type: 'url' as const}] : it.type === 'EMAIL' ? [{type: 'email' as const}] : [];
    return (
        <>
            <Form.Item name={it.key} label={<span>{labelOf(it, t)} <span className="font-mono text-xs text-muted-foreground">{it.key}</span></span>}
                       tooltip={descOf(it, t) || undefined} rules={rules}
                       valuePropName={it.type === 'BOOL' ? 'checked' : 'value'}
                       extra={it.secret ? undefined : it.defaultValue ? `${t('setting.default')}: ${it.defaultValue}` : undefined}>
                {control}
            </Form.Item>
            {it.secret && (
                <Form.Item name={clearName(it.key)} valuePropName="checked" className="-mt-4">
                    <Checkbox>{t('setting.clearValue')}</Checkbox>
                </Form.Item>
            )}
        </>
    );
};

const AdminSettingPage = observer(() => {
    const {t} = useTranslation('admin');
    const appSession = useSessionStore((s) => s.appSession);
    const canUpdate = checkPermissionUser(appSession, ADMIN_PER.Setting.Update);
    const canTestMail = checkPermissionUser(appSession, ADMIN_PER.Setting.TestMail);
    const [groups, setGroups] = useState<AdminSettingGroupDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState<AdminSettingGroupDto | null>(null);
    const [form] = Form.useForm();

    const load = useCallback(async () => {
        setLoading(true);
        const r = await adminCall(() => adminApi.settings.list());
        setLoading(false);
        // nhom co dinh (readOnly) khong hien tren man quan tri, chi con nhom sua duoc
        if (r.ok) setGroups((r.data ?? []).filter((g) => !g.readOnly));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const openEdit = (g: AdminSettingGroupDto) => {
        setEditing(g);
    };

    // Chi gui key da doi; secret de trong = giu nguyen, xoa chi qua clear
    const onSave = async () => {
        if (!editing) return;
        const all = await form.validateFields().catch(() => null);
        if (!all) return;
        const values: Record<string, string> = {};
        const clear: string[] = [];
        for (const it of editing.items ?? []) {
            const k = it.key!;
            if (it.secret) {
                if (all[clearName(k)]) clear.push(k);
                else if (all[k]) values[k] = String(all[k]);
                continue;
            }
            if (toWire(it, all[k]) !== toWire(it, initialOf(it))) values[k] = toWire(it, all[k]);
        }
        if (!Object.keys(values).length && !clear.length) {
            setEditing(null);
            return;
        }
        const r = await adminCall(
            () => adminApi.settings.updateGroup({group: editing.group!, body: {values, clear}}),
            'admin:setting.savedOk',
        );
        if (r.ok) {
            setEditing(null);
            load();
        }
    };

    const onReset = (it: AdminSettingItemDto) =>
        uiUtils.showConfirm({
            title: t('setting.resetConfirm'),
            content: it.key,
            onOk: async () => {
                const r = await adminCall(() => adminApi.settings.reset({key: it.key!}), 'admin:setting.resetOk');
                if (r.ok) load();
            },
        });

    // Kiem tra ket noi SMTP (CONNECT) hoac gui thu toi email cua chinh SA (SEND)
    const onMailTest = async (mode: 'CONNECT' | 'SEND') => {
        const r = await adminCall(() => adminApi.settings.mailTest({body: {mode}}));
        if (!r.ok) return;
        if (r.data?.ok) uiUtils.showSuccess(t('setting.mailOk', {ms: r.data.latencyMs ?? '?'}));
        else uiUtils.showError(r.data?.error || t('common.error'));
    };

    return (
        <AdminLayout>
            <h2 className="m-0 mb-4 text-lg font-semibold text-foreground">{t('setting.title')}</h2>
            <div className="grid gap-4 grid-cols-1 xl:grid-cols-2">
                {groups.map((g) => (
                    <Card key={g.group} loading={loading} size="small"
                          title={t(`setting.group.${g.group}`, {defaultValue: g.group})}
                          extra={
                              <Space>
                                  {g.group === 'MAIL' && canTestMail && (
                                      <>
                                          <Button size="small" onClick={() => onMailTest('CONNECT')}>{t('setting.mailConnect')}</Button>
                                          <Button size="small" onClick={() => onMailTest('SEND')}>{t('setting.mailSend')}</Button>
                                      </>
                                  )}
                                  {g.readOnly
                                      ? <Tag color="var(--color-muted-foreground)" title={t('setting.fixedHint')}>{t('setting.fixedBadge')}</Tag>
                                      : canUpdate && <Button size="small" type="primary" onClick={() => openEdit(g)}>{t('common.edit')}</Button>}
                              </Space>
                          }>
                        <div className="flex flex-col gap-2">
                            {(g.items ?? []).map((it) => (
                                <div key={it.key} className="flex flex-col gap-0.5 border-b border-border pb-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-foreground">{labelOf(it, t as TFn)}</span>
                                        <span className="text-muted-foreground break-all">{displayValue(it, t('setting.notConfigured'))}</span>
                                        {!g.readOnly && it.overridden && <Tag color="var(--color-primary)">{t('setting.overridden')}</Tag>}
                                        {it.apply === 'RESTART' && <Tag color="var(--color-warning)">{t('setting.needRestart')}</Tag>}
                                        {!g.readOnly && it.overridden && canUpdate && (
                                            <Button size="small" type="link" onClick={() => onReset(it)}>{t('setting.reset')}</Button>
                                        )}
                                    </div>
                                    {descOf(it, t as TFn) && <span className="text-xs text-muted-foreground">{descOf(it, t as TFn)}</span>}
                                    <span className="font-mono text-xs text-muted-foreground">{it.key}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                ))}
            </div>

            <Modal open={!!editing} onCancel={() => setEditing(null)} onOk={onSave} width={560} destroyOnHidden
                   title={editing ? t(`setting.group.${editing.group}`, {defaultValue: editing.group}) : ''}
                   okText={t('common.save')} cancelText={t('common.cancel')}>
                <Form form={form} layout="vertical" autoComplete="off"
                      initialValues={Object.fromEntries((editing?.items ?? []).map((it) => [it.key!, initialOf(it)]))}>
                    {(editing?.items ?? []).map((it) => <SettingField key={it.key} it={it} t={t as TFn}/>)}
                </Form>
            </Modal>
        </AdminLayout>
    );
});

export default AdminSettingPage;
