import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {observer} from 'mobx-react-lite';
import {useStore} from '../../store';
import {Button, Col, Form, Input, Modal, Segmented, Space, Tag} from 'antd';
import {useTableStore} from '@plugin-core/table/paged/hooks/useTableStore';
import {PagedTable} from '@plugin-core/table/paged';
import {PageLayoutWithTable} from '@plugin-core/table/paged/components/PageLayoutWithTable';
import TableUtil from '@plugin-core/table/utils/table.util';
import type {ITableAction} from '@plugin-core/table/cells/TableActionCell';
import type {AdminEmailTemplateDto, AdminEmailTemplateRowDto} from '../../api/api/index.defs';
import {adminApi, adminCall} from '../../api/adminApiResource';
import uiUtils from '../../utils/uiUtils';
import AdminLayout from './AdminLayout.tsx';
import {formatDateTime} from './adminFormat';

type Locale = 'vi' | 'en';

const AdminEmailTemplatePage = observer(() => {
    const {t} = useTranslation('admin');
    const {sessionStore} = useStore();
    const tableStore = useTableStore(adminApi.templates);
    const {onLoadData} = tableStore();
    // dong dang sua (mot ma) + ngon ngu + mau hieu luc cua ngon ngu do
    const [row, setRow] = useState<AdminEmailTemplateRowDto | null>(null);
    const [locale, setLocale] = useState<Locale>('vi');
    const [current, setCurrent] = useState<AdminEmailTemplateDto | null>(null);
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [previewHtml, setPreviewHtml] = useState<string | null>(null);
    const [toEmail, setToEmail] = useState('');

    const loadLocale = async (code: string, l: Locale) => {
        const r = await adminCall(() => adminApi.templates.get({code, locale: l}));
        if (!r.ok || !r.data) return;
        setLocale(l);
        setCurrent(r.data);
        setSubject(r.data.subject ?? '');
        setBody(r.data.body ?? '');
        setPreviewHtml(null);
    };

    const openEdit = (r: AdminEmailTemplateRowDto) => {
        setRow(r);
        // gui thu mac dinh toi email cua chinh SA, sua duoc
        setToEmail(sessionStore.appSession.user?.email ?? '');
        loadLocale(r.code!, 'vi');
    };

    const close = () => {
        setRow(null);
        setCurrent(null);
    };

    // Loi EMAIL_TEMPLATE_INVALID (thieu bien bat buoc, cu phap sai...) tra ve message tu backend va hien toast
    const onSave = async () => {
        if (!row) return;
        const r = await adminCall(
            () => adminApi.templates.update({code: row.code!, locale, body: {subject, body}}),
            'admin:template.savedOk',
        );
        if (r.ok) {
            close();
            onLoadData();
        }
    };

    const onPreview = async () => {
        if (!row) return;
        const r = await adminCall(() => adminApi.templates.preview({body: {code: row.code, subject, body}}));
        if (r.ok) setPreviewHtml(r.data?.body ?? '');
    };

    const onSendTest = async () => {
        if (!row) return;
        await adminCall(
            () => adminApi.templates.sendTest({code: row.code!, locale, body: {mode: 'SEND', toEmail: toEmail || undefined}}),
            'admin:template.testSentOk',
        );
    };

    const onReset = () => {
        if (!row) return;
        uiUtils.showConfirm({
            title: t('template.resetConfirm'),
            content: `${row.code} / ${locale}`,
            onOk: async () => {
                const r = await adminCall(
                    () => adminApi.templates.reset({code: row.code!, locale}),
                    'admin:template.resetOk',
                );
                if (r.ok) {
                    close();
                    onLoadData();
                }
            },
        });
    };

    const actions: ITableAction<AdminEmailTemplateRowDto>[] = [
        {title: 'edit', onClick: openEdit},
    ];

    const columns = TableUtil.getColumns<AdminEmailTemplateRowDto>(
        [
            {title: <span>{t('template.code')}</span>, dataIndex: 'code', key: 'code'},
            {title: <span>{t('template.name')}</span>, dataIndex: 'name', key: 'name'},
            {title: <span>{t('template.description')}</span>, dataIndex: 'description', key: 'description'},
            {
                title: <span>{t('template.variables')}</span>, dataIndex: 'variables', key: 'variables',
                render: (v: string[] = []) => v.map((x) => <Tag key={x}>{x}</Tag>),
            },
            {
                title: <span>{t('template.state')}</span>, dataIndex: 'locales', key: 'locales',
                render: (ls: AdminEmailTemplateRowDto['locales'] = []) => ls.map((l) => (
                    <Tag key={l.locale} color={l.overridden ? 'var(--color-primary)' : undefined}>
                        {`${(l.locale ?? '').toUpperCase()}: ${t(l.overridden ? 'template.edited' : 'template.default')}`}
                    </Tag>
                )),
            },
            {
                title: <span>{t('template.updatedAt')}</span>, key: 'updatedAt',
                render: (_: unknown, r: AdminEmailTemplateRowDto) => formatDateTime(
                    (r.locales ?? []).map((l) => l.updatedAt).filter(Boolean).sort().pop(),
                ),
            },
        ],
        {actions},
    );

    const searchFields = (
        <>
            <Col xs={24} md={8}>
                <Form.Item name="searchText" label={t('template.searchText')}>
                    <Input allowClear placeholder={t('template.searchPlaceholder')}/>
                </Form.Item>
            </Col>
            <Col xs={12} md={4} className="flex items-end">
                <Form.Item>
                    <Button type="primary" htmlType="submit">{t('common.search')}</Button>
                </Form.Item>
            </Col>
        </>
    );

    return (
        <AdminLayout>
            {/* khong co topActions: khong co nut Them moi, ma template co dinh trong backend */}
            <PageLayoutWithTable
                titleHeader={<h2 className="m-0 text-lg font-semibold text-foreground">{t('template.title')}</h2>}
                searchFields={searchFields}
                tableStore={tableStore}>
                <PagedTable isHiddenListTitle columns={columns} tableStore={tableStore}/>
            </PageLayoutWithTable>

            <Modal open={!!row} onCancel={close} width={820} destroyOnHidden
                   title={row ? `${row.name} (${row.code})` : ''}
                   footer={
                       <Space>
                           {current?.overridden && <Button danger onClick={onReset}>{t('template.reset')}</Button>}
                           <Button onClick={onPreview}>{t('template.preview')}</Button>
                           <Button onClick={close}>{t('common.cancel')}</Button>
                           <Button type="primary" onClick={onSave}>{t('common.save')}</Button>
                       </Space>
                   }>
                <div className="flex flex-col gap-3">
                    <Segmented<Locale> value={locale} onChange={(l) => row && loadLocale(row.code!, l)}
                                       options={[{value: 'vi', label: t('template.localeVi')}, {value: 'en', label: t('template.localeEn')}]}/>
                    <div>
                        <div className="mb-1 text-muted-foreground">{t('template.subject')}</div>
                        <Input value={subject} onChange={(e) => setSubject(e.target.value)}/>
                    </div>
                    <div>
                        <div className="mb-1 flex flex-wrap items-center gap-1 text-muted-foreground">
                            <span>{t('template.variablesInsert')}:</span>
                            {(current?.variables ?? []).map((v) => (
                                <Tag key={v} className="cursor-pointer" onClick={() => setBody((b) => `${b}{{${v}}}`)}>{v}</Tag>
                            ))}
                        </div>
                        <Input.TextArea rows={12} value={body} onChange={(e) => setBody(e.target.value)}
                                        className="font-mono text-xs"/>
                    </div>
                    <Space.Compact>
                        <Input value={toEmail} onChange={(e) => setToEmail(e.target.value)} placeholder={t('template.testTo')}/>
                        <Button onClick={onSendTest}>{t('template.sendTest')}</Button>
                    </Space.Compact>
                    {previewHtml !== null && (
                        // sandbox rong: khong chay script, khong gui form
                        <iframe title="preview" sandbox="" srcDoc={previewHtml}
                                className="h-80 w-full rounded border border-border bg-card"/>
                    )}
                </div>
            </Modal>
        </AdminLayout>
    );
});

export default AdminEmailTemplatePage;
