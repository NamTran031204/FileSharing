import React, { useEffect, useState } from 'react';
import {
  FolderOpenOutlined,
  PictureOutlined,
  FolderOutlined,
  CloudOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  EditOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { Spin, message } from 'antd';
import { observer } from 'mobx-react-lite';
import CommonLayout from '../layout/CommonLayout.tsx';
import { DashboardControllerService } from '../api/api/DashboardControllerService';
import type {
  DashboardOverviewDTO,
  StorageStatsDTO,
  ReviewStatsDTO,
  RecentActivityItemDTO,
} from '../api/api/index.defs';
import { AuditAction } from '../api/api/index.defs';
import { useStore } from '../store';
import UserAvatar from '../components/core/common/UserAvatar.tsx';
import i18n from '../i18n';


function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function formatTimeAgo(ts?: Date): string {
  if (!ts) return '—';
  const date = ts instanceof Date ? ts : new Date(ts);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return i18n.t('layout:dashboardPage.timeAgo.justNow');
  if (diffMin < 60) return i18n.t('layout:dashboardPage.timeAgo.minutes', { n: diffMin });
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return i18n.t('layout:dashboardPage.timeAgo.hours', { n: diffH });
  const diffD = Math.floor(diffH / 24);
  return i18n.t('layout:dashboardPage.timeAgo.days', { n: diffD });
}

const ACTION_LABEL_KEY: Partial<Record<AuditAction, string>> = {
  [AuditAction.UPLOAD_COMPLETE]: 'uploadComplete',
  [AuditAction.UPLOAD_NEW_VERSION]: 'uploadNewVersion',
  [AuditAction.CREATE]: 'create',
  [AuditAction.UPDATE]: 'update',
  [AuditAction.TRASH]: 'trash',
  [AuditAction.DELETE]: 'delete',
  [AuditAction.STATUS_CHANGE]: 'statusChange',
  [AuditAction.DOWNLOAD]: 'download',
  [AuditAction.SHARE]: 'share',
  [AuditAction.RESTORE]: 'restore',
  [AuditAction.PERMISSION_CHANGE]: 'permissionChange',
};

function mapActionLabel(action?: AuditAction): string {
  const key = action ? ACTION_LABEL_KEY[action] : undefined;
  return action ? (key ? i18n.t(`layout:dashboardPage.actionLabel.${key}`) : action) : '—';
}

const MEDIA_COLORS = [
  'var(--color-primary)',
  'var(--color-secondary)',
  'var(--color-accent)',
];

const BAR_COLORS = [
  'bg-[var(--color-primary)]',
  'bg-[var(--color-secondary)]',
  'bg-[var(--color-accent)]',
  'bg-[var(--color-muted)]',
];


interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
}


const StatCard: React.FC<StatCardProps> = ({ label, value, icon }) => (
  <div className="bg-[var(--color-card)] rounded-xl p-8 canvas-shadow relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
    <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl text-[var(--color-primary)]">
      {icon}
    </div>
    <p className="text-xs tracking-widest text-[var(--color-muted-foreground)] uppercase mb-4">
      {label}
    </p>
    <p className="text-4xl font-bold text-[var(--color-foreground)]">{value}</p>
  </div>
);


const DashboardPage: React.FC = observer(() => {
  const { sessionStore } = useStore();
  const userName =
    sessionStore.appSession.user?.publicUserName ??
    sessionStore.appSession.user?.email ??
    'USER';

  const [isLoading, setIsLoading] = useState(true);
  const [overview, setOverview] = useState<DashboardOverviewDTO | null>(null);
  const [storageStats, setStorageStats] = useState<StorageStatsDTO | null>(null);
  const [reviewStats, setReviewStats] = useState<ReviewStatsDTO | null>(null);
  const [activities, setActivities] = useState<RecentActivityItemDTO[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setIsLoading(true);
        const [ov, st, rv, ac] = await Promise.all([
          DashboardControllerService.overview(),
          DashboardControllerService.storageStats(),
          DashboardControllerService.reviewStats(),
          DashboardControllerService.recentActivities({ limit: 10 }),
        ]);
        if (ov.isSuccessful) setOverview(ov.data ?? null);
        if (st.isSuccessful) setStorageStats(st.data ?? null);
        if (rv.isSuccessful) setReviewStats(rv.data ?? null);
        if (ac.isSuccessful) setActivities(ac.data ?? []);
      } catch {
        void message.error(i18n.t('layout:dashboardPage.khongTheTaiDuLieu'));
      } finally {
        setIsLoading(false);
      }
    };
    void fetchAll();
  }, []);

  const byMediaType = storageStats?.byMediaType ?? [];
  const totalBytes = storageStats?.totalStorageBytes ?? 0;

  let cumPct = 0;
  const gradientStops = byMediaType.map((item, i) => {
    const pct = totalBytes > 0 ? ((item.storageBytes ?? 0) / totalBytes) * 100 : 0;
    const from = cumPct;
    cumPct += pct;
    return `${MEDIA_COLORS[i] ?? 'var(--color-muted)'} ${from.toFixed(1)}% ${cumPct.toFixed(1)}%`;
  });
  const donutStyle: React.CSSProperties =
    gradientStops.length > 0
      ? { background: `conic-gradient(${gradientStops.join(', ')})` }
      : {
          background: `conic-gradient(
            var(--color-primary)   0%   60%,
            var(--color-secondary) 60%  85%,
            var(--color-accent)    85% 100%
          )`,
        };

  const projectStorageItems = (storageStats?.byProject ?? []).map((p, i) => ({
    name: p.projectName ?? p.projectId ?? '—',
    files: Number(p.fileCount ?? 0),
    size: formatBytes(p.storageBytes ?? 0),
    percent: totalBytes > 0 ? ((p.storageBytes ?? 0) / totalBytes) * 100 : 0,
    barColor: BAR_COLORS[i % BAR_COLORS.length],
  }));

  return (
    <CommonLayout>
      <div className="flex-1 overflow-y-auto bg-[var(--color-background)] p-8 lg:p-12">
        {/* ── Page Header ── */}
        <header className="mb-12 max-w-7xl mx-auto">
          <p className="text-sm tracking-[0.05em] text-[var(--color-muted-foreground)] uppercase mb-2">
            {i18n.t('layout:dashboardPage.platformOverview')}
          </p>
          <h1
            className="text-4xl md:text-5xl font-bold text-[var(--color-foreground)]"
            style={{ letterSpacing: '-0.02em' }}
          >
            {i18n.t('layout:dashboardPage.welcomeBack')} {userName.toUpperCase()}!
          </h1>
        </header>

        <Spin spinning={isLoading} size="large">
          <div className="max-w-7xl mx-auto space-y-12">
            {/* ── Overview Cards ── */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                label={i18n.t('layout:dashboardPage.projects')}
                value={Number(overview?.totalProjects ?? 0)}
                icon={<FolderOpenOutlined />}
              />
              <StatCard
                label={i18n.t('layout:dashboardPage.assets')}
                value={Number(overview?.totalAssets ?? 0).toLocaleString()}
                icon={<PictureOutlined />}
              />
              <StatCard
                label={i18n.t('layout:dashboardPage.folders')}
                value={Number(overview?.totalFolders ?? 0)}
                icon={<FolderOutlined />}
              />
              <StatCard
                label={i18n.t('layout:dashboardPage.storage')}
                value={formatBytes(overview?.totalStorageBytes ?? 0)}
                icon={<CloudOutlined />}
              />
            </section>

            {/* ── Middle: Storage Distribution + Review Status ── */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Storage Distribution */}
              <div className="bg-[var(--color-card)] rounded-xl p-8 canvas-shadow">
                <h3 className="text-lg font-bold text-[var(--color-foreground)] mb-8">
                  {i18n.t('layout:dashboardPage.storageDistribution')}
                </h3>
                <div className="flex flex-col md:flex-row items-center gap-8">
                  {/* Donut chart */}
                  <div className="relative w-48 h-48 shrink-0">
                    <div className="w-full h-full rounded-full" style={donutStyle} />
                    <div className="absolute inset-0 m-auto w-32 h-32 bg-[var(--color-card)] rounded-full flex flex-col items-center justify-center">
                      <span className="text-lg font-bold text-[var(--color-foreground)] text-center leading-tight">
                        {formatBytes(totalBytes)}
                      </span>
                      <span className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wide mt-1">
                        {i18n.t('layout:dashboardPage.total')}
                      </span>
                    </div>
                  </div>
                  {/* Legend */}
                  <div className="flex-1 w-full space-y-6">
                    {byMediaType.length === 0 ? (
                      <p className="text-sm text-[var(--color-muted-foreground)]">{i18n.t('layout:dashboardPage.noData')}</p>
                    ) : (
                      byMediaType.map((cat, i) => (
                        <div key={cat.mediaType ?? i} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ background: MEDIA_COLORS[i] ?? 'var(--color-muted)' }}
                            />
                            <div>
                              <p className="text-xs tracking-wider uppercase text-[var(--color-foreground)] font-medium">
                                {cat.mediaType}
                              </p>
                              <p className="text-xs text-[var(--color-muted-foreground)]">
                                {Number(cat.fileCount ?? 0)} files
                              </p>
                            </div>
                          </div>
                          <span className="font-semibold text-[var(--color-foreground)]">
                            {formatBytes(cat.storageBytes ?? 0)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Review Status */}
              <div className="bg-[var(--color-card)] rounded-xl p-8 canvas-shadow">
                <h3 className="text-lg font-bold text-[var(--color-foreground)] mb-8">
                  {i18n.t('layout:dashboardPage.reviewStatus')}
                </h3>
                <div className="space-y-4">
                  {/* Pending */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--color-background)] hover:bg-[var(--color-muted)]/50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-muted)] flex items-center justify-center text-[var(--color-primary)] text-base">
                        <ClockCircleOutlined />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-foreground)]">{i18n.t('layout:dashboardPage.pendingReview')}</p>
                        <p className="text-xs text-[var(--color-muted-foreground)]">{i18n.t('layout:dashboardPage.draftsInReview')}</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold group-hover:text-[var(--color-primary)] transition-colors text-[var(--color-foreground)]">
                      {Number(reviewStats?.pendingCount ?? 0)}
                    </span>
                  </div>

                  {/* Approved */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--color-background)] hover:bg-[var(--color-muted)]/50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-muted)] flex items-center justify-center text-[var(--color-primary)] text-base">
                        <CheckCircleOutlined />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-foreground)]">{i18n.t('layout:dashboardPage.approved')}</p>
                        <p className="text-xs text-[var(--color-muted-foreground)]">{i18n.t('layout:dashboardPage.readyForDelivery')}</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold group-hover:text-[var(--color-primary)] transition-colors text-[var(--color-foreground)]">
                      {Number(reviewStats?.approvedCount ?? 0)}
                    </span>
                  </div>

                  {/* Needs Changes */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-red-50 hover:bg-red-100/80 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-base">
                        <EditOutlined />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-red-700">{i18n.t('layout:dashboardPage.needsChanges')}</p>
                        <p className="text-xs text-red-500">{i18n.t('layout:dashboardPage.revisionsRequested')}</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-red-700">
                      {Number(reviewStats?.changesRequestedCount ?? 0)}
                    </span>
                  </div>

                  {/* No Review */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--color-background)] hover:bg-[var(--color-muted)]/50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-background)] flex items-center justify-center text-[var(--color-muted-foreground)] text-base">
                        <StopOutlined />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-foreground)]">{i18n.t('layout:dashboardPage.noReview')}</p>
                        <p className="text-xs text-[var(--color-muted-foreground)]">{i18n.t('layout:dashboardPage.internalAssets')}</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold group-hover:text-[var(--color-primary)] transition-colors text-[var(--color-foreground)]">
                      {Number(reviewStats?.noReviewSessionCount ?? 0)}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Recent Activity ── */}
            <section className="bg-[var(--color-card)] rounded-xl p-8 canvas-shadow overflow-hidden">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h3 className="text-lg font-bold text-[var(--color-foreground)]">
                    {i18n.t('layout:dashboardPage.recentActivity')}
                  </h3>
                  <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                    {i18n.t('layout:dashboardPage.latestActionsAcrossAllProjects')}
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs uppercase tracking-wider text-[var(--color-muted-foreground)]">
                      <th className="pb-4 font-medium pl-2 w-1/3">{i18n.t('layout:dashboardPage.user')}</th>
                      <th className="pb-4 font-medium px-4 w-1/6">{i18n.t('layout:dashboardPage.action')}</th>
                      <th className="pb-4 font-medium px-4 w-1/3">{i18n.t('layout:dashboardPage.target')}</th>
                      <th className="pb-4 font-medium pr-2 text-right w-1/6">{i18n.t('layout:dashboardPage.time')}</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {activities.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-[var(--color-muted-foreground)]">
                          {i18n.t('layout:dashboardPage.noRecentActivity')}
                        </td>
                      </tr>
                    ) : (
                      activities.map((row) => (
                        <tr
                          key={row.logId}
                          className="group hover:bg-[var(--color-background)] transition-colors"
                        >
                          <td className="py-4 pl-2 rounded-l-lg">
                            <div className="flex items-center gap-3">
                              <UserAvatar size={32} email={row.actorEmail} className="shrink-0" />
                              <span className="text-[var(--color-foreground)]">{row.actorEmail ?? '—'}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-2 py-1 bg-[var(--color-muted)] text-[var(--color-primary-dark)] rounded text-xs font-medium">
                              {mapActionLabel(row.action)}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-[var(--color-muted-foreground)] font-medium">
                            {row.targetName ?? row.targetId ?? '—'}
                          </td>
                          <td className="py-4 pr-2 text-right text-[var(--color-muted-foreground)] rounded-r-lg">
                            {formatTimeAgo(row.timestamp)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ── Storage by Project ── */}
            <section className="bg-[var(--color-card)] rounded-xl p-8 canvas-shadow mb-12">
              <h3 className="text-lg font-bold text-[var(--color-foreground)] mb-8">
                {i18n.t('layout:dashboardPage.storageByProject')}
              </h3>
              {projectStorageItems.length === 0 ? (
                <p className="text-sm text-[var(--color-muted-foreground)]">{i18n.t('layout:dashboardPage.noProjectData')}</p>
              ) : (
                <div className="space-y-8">
                  {projectStorageItems.map((proj) => (
                    <div key={proj.name}>
                      <div className="flex justify-between items-end mb-2">
                        <div>
                          <h4 className="font-semibold text-[var(--color-foreground)]">{proj.name}</h4>
                          <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                            {proj.files} files
                          </p>
                        </div>
                        <span className="text-sm font-medium text-[var(--color-foreground)]">
                          {proj.size}
                        </span>
                      </div>
                      <div className="w-full bg-[var(--color-background)] h-2 rounded-full overflow-hidden">
                        <div
                          className={`${proj.barColor} h-full rounded-full transition-all duration-500`}
                          style={{ width: `${proj.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </Spin>
      </div>
    </CommonLayout>
  );
});

export default DashboardPage;
