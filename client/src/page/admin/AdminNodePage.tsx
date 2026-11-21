import {useCallback, useEffect, useState} from 'react';
import {observer} from 'mobx-react-lite';
import {useTranslation} from 'react-i18next';
import {Button, Card, Empty, Progress, Tag} from 'antd';
import {Line, LineChart, ResponsiveContainer} from 'recharts';
import type {AdminNodeDto} from '../../api/api/index.defs';
import {adminApi, adminCall} from '../../api/adminApiResource';
import uiUtils from '../../utils/uiUtils';
import AdminLayout from './AdminLayout.tsx';
import {checkPermissionUser} from '@plugin-core/auth/utils/auth.utils';
import {useSessionStore} from '@plugin-core/shared/store/useSessionStore';
import {ADMIN_PER} from '../../components/core/layout/sidebarMenu';
import {formatBytes, formatPercent, formatUptime} from './adminFormat';

const POLL_MS = 5000;

const STATUS_COLOR: Record<string, string> = {
    ONLINE: 'var(--color-success)',
    STALE: 'var(--color-destructive)',
    DRAINING: 'var(--color-warning)',
};

const NodeCard = ({node, onDrain, canDrain}: {node: AdminNodeDto; onDrain: (n: AdminNodeDto) => void; canDrain: boolean}) => {
    const {t} = useTranslation('admin');
    const w = node.worker;
    const heapPct = node.memory?.heapMax && Number(node.memory.heapMax) > 0
        ? Math.round((Number(node.memory.heapUsed) / Number(node.memory.heapMax)) * 100) : 0;
    const samples = (node.samples ?? []).map((s) => ({sys: s.sys ?? 0, proc: s.proc ?? 0, child: s.child ?? 0}));
    return (
        <Card size="small" title={<span>{node.nodeId} <Tag color={STATUS_COLOR[node.status ?? '']}>{node.status}</Tag></span>}
              extra={node.kind === 'WORKER' && canDrain && (
                  <Button size="small" onClick={() => onDrain(node)}>
                      {t(node.draining ? 'node.undrain' : 'node.drain')}
                  </Button>
              )}>
            <div className="text-muted-foreground text-xs mb-2">
                {node.host} · pid {node.pid} · {node.cores} {t('node.cores')} · {t('node.uptime')}: {formatUptime(node.startedAt)}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <span>{t('node.cpuSystem')}: {formatPercent(node.cpu?.system)}</span>
                <span>{t('node.cpuProcess')}: {formatPercent(node.cpu?.process)}</span>
                {/* children null (vd Windows khong co tien trinh con) hien dau gach */}
                <span>{t('node.cpuChildren')}: {formatPercent(node.cpu?.children)}</span>
                <span>{t('node.diskFree')}: {formatBytes(node.workspaceFreeBytes)}</span>
                <span>{t('node.ram')}: {formatBytes(node.memory?.systemFree)} / {formatBytes(node.memory?.systemTotal)}</span>
                <span>{t('node.heap')}: {formatBytes(node.memory?.heapUsed)} / {formatBytes(node.memory?.heapMax)}</span>
            </div>
            <Progress percent={heapPct} size="small" className="mt-1"/>
            {w && (
                <div className="mt-2 text-sm">
                    {t('node.slots')}: {w.inUse ?? 0}/{w.maxConcurrent ?? 0}
                    <Progress percent={w.maxConcurrent ? Math.round(((w.inUse ?? 0) / w.maxConcurrent) * 100) : 0}
                              size="small" showInfo={false}/>
                </div>
            )}
            {samples.length > 1 && (
                <div className="mt-2 h-12">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={samples}>
                            <Line type="monotone" dataKey="sys" stroke="var(--color-primary)" dot={false} isAnimationActive={false}/>
                            <Line type="monotone" dataKey="proc" stroke="var(--color-info)" dot={false} isAnimationActive={false}/>
                            <Line type="monotone" dataKey="child" stroke="var(--color-warning)" dot={false} isAnimationActive={false}/>
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
            {node.kind === 'WORKER' && (
                <div className="mt-2 text-sm">
                    <div className="font-semibold">{t('node.runningJobs')}</div>
                    {(node.runningJobs ?? []).length === 0
                        ? <span className="text-muted-foreground">—</span>
                        : (node.runningJobs ?? []).map((j) => (
                            <div key={j.jobId} className="flex gap-2 text-xs">
                                <span className="font-mono">{j.jobId}</span>
                                <span>{j.jobType}</span>
                                <span>{j.percent ?? 0}%</span>
                                <span className="text-muted-foreground">{j.currentStep}</span>
                            </div>
                        ))}
                </div>
            )}
        </Card>
    );
};

const AdminNodePage = observer(() => {
    const {t} = useTranslation('admin');
    const canDrain = checkPermissionUser(useSessionStore((s) => s.appSession), ADMIN_PER.Node.Drain);
    const [nodes, setNodes] = useState<AdminNodeDto[]>([]);
    const [loaded, setLoaded] = useState(false);

    const load = useCallback(async () => {
        const r = await adminCall(() => adminApi.nodes.list());
        if (r.ok) setNodes(r.data ?? []);
        setLoaded(true);
    }, []);

    // Poll 5s; tab an thi dung, hien lai thi tai ngay va chay tiep; don interval khi roi trang
    useEffect(() => {
        let timer: ReturnType<typeof setInterval> | undefined;
        const stop = () => {
            if (timer) clearInterval(timer);
            timer = undefined;
        };
        const start = () => {
            stop();
            if (document.hidden) return;
            load();
            timer = setInterval(load, POLL_MS);
        };
        start();
        document.addEventListener('visibilitychange', start);
        return () => {
            stop();
            document.removeEventListener('visibilitychange', start);
        };
    }, [load]);

    const onDrain = (n: AdminNodeDto) => {
        const draining = !n.draining;
        uiUtils.showConfirm({
            title: t(draining ? 'node.drainConfirm' : 'node.undrainConfirm'),
            content: n.nodeId,
            onOk: async () => {
                const r = await adminCall(
                    () => adminApi.nodes.drain({nodeId: n.nodeId!, body: {draining}}),
                    draining ? 'admin:node.drainedOk' : 'admin:node.undrainedOk',
                );
                if (r.ok) load();
            },
        });
    };

    const byService = nodes.reduce<Record<string, AdminNodeDto[]>>((acc, n) => {
        (acc[n.service ?? '—'] ??= []).push(n);
        return acc;
    }, {});

    return (
        <AdminLayout>
            <h2 className="m-0 mb-4 text-lg font-semibold text-foreground">{t('node.title')}</h2>
            {loaded && nodes.length === 0 && <Empty description={t('node.empty')}/>}
            {Object.entries(byService).map(([service, list]) => (
                <section key={service} className="mb-6">
                    <h3 className="mb-2 font-semibold text-foreground">{service}</h3>
                    <div className="grid gap-4 grid-cols-1 xl:grid-cols-2">
                        {list.map((n) => <NodeCard key={n.nodeId} node={n} onDrain={onDrain} canDrain={canDrain}/>)}
                    </div>
                </section>
            ))}
        </AdminLayout>
    );
});

export default AdminNodePage;
