import { FolderOutlined, LinkOutlined } from '@ant-design/icons';
import { Empty, Skeleton, Tag } from 'antd';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AccessControllerService } from '../api/api/AccessControllerService';
import type { SharedFolderDTO } from '../api/api/index.defs';
import CommonLayout from '../layout/CommonLayout.tsx';
import { useStore } from '../store';
import { LangUtil } from '../utils/lang.util';
import i18n from '../i18n';

/** "Duoc chia se voi toi": folder co grant cua minh o project minh khong la thanh vien */
const SharedWithMePage = observer(function SharedWithMePage() {
    const navigate = useNavigate();
    const { sessionStore } = useStore();
    const [items, setItems] = useState<SharedFolderDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        AccessControllerService.sharedWithMe()
            .then((res) => { if (!cancelled) setItems(res.data ?? []); })
            .catch(() => { if (!cancelled) setError(true); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const open = (item: SharedFolderDTO) => {
        if (!item.projectId || !item.folderId) return;
        sessionStore.setCurrentProject({ projectId: item.projectId, projectName: item.projectName });
        sessionStore.setCurrentFolder(undefined);
        navigate(`/projects/${item.projectId}?folderId=${item.folderId}`);
    };

    return (
        <CommonLayout>
            <main className="flex-1 overflow-y-auto bg-background">
                <div className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-10">
                    <h1 className="text-3xl font-extrabold tracking-tighter text-foreground">{i18n.t('access:sharedWithMe.title')}</h1>
                    <p className="mb-8 mt-1 text-sm font-medium text-muted-foreground">{i18n.t('access:sharedWithMe.subtitle')}</p>

                    {loading && (
                        <div className="rounded-2xl border border-border/30 bg-card p-6">
                            <Skeleton active paragraph={{ rows: 3 }} />
                        </div>
                    )}

                    {!loading && error && (
                        <p className="text-sm text-destructive">{i18n.t('access:sharedWithMe.loadError')}</p>
                    )}

                    {!loading && !error && items.length === 0 && (
                        <div className="rounded-2xl border border-border/30 bg-card px-6 py-16">
                            <Empty description={<span className="text-sm text-muted-foreground">{i18n.t('access:sharedWithMe.empty')}</span>} />
                        </div>
                    )}

                    {!loading && !error && items.length > 0 && (
                        <ul className="m-0 flex list-none flex-col gap-3 p-0">
                            {items.map((item) => (
                                <li key={item.folderId}>
                                    <button
                                        type="button"
                                        onClick={() => open(item)}
                                        className="flex w-full items-center gap-4 rounded-2xl border border-border/40 bg-card px-5 py-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                                    >
                                        <FolderOutlined className="text-2xl text-primary" />
                                        <div className="min-w-0 flex-1">
                                            <p className="m-0 truncate text-base font-semibold text-foreground">{item.folderName}</p>
                                            <p className="m-0 truncate text-xs text-muted-foreground">
                                                {i18n.t('access:sharedWithMe.inProject', { projectName: item.projectName ?? '' })}
                                            </p>
                                        </div>
                                        {item.viaLink && (
                                            <Tag icon={<LinkOutlined />} className="m-0 rounded-md border-0">
                                                {i18n.t('access:sharedWithMe.viaLink')}
                                            </Tag>
                                        )}
                                        <Tag className="m-0 rounded-md border-0 font-semibold">
                                            {item.role ? i18n.t(`access:role.${item.role}`) : ''}
                                        </Tag>
                                        <span className="hidden text-xs text-muted-foreground sm:inline">
                                            {item.grantedAt ? new Date(item.grantedAt).toLocaleDateString(LangUtil.getDateLocale()) : ''}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </main>
        </CommonLayout>
    );
});

export default SharedWithMePage;
