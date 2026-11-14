import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { Button, Input, Result, Segmented, Spin } from 'antd';
import { CheckCircleFilled, HeartFilled, HeartOutlined, LockOutlined } from '@ant-design/icons';
import { ApiError } from '../api/baseApi';
import { ProofGuestStore } from '../store/proofGuestStore';
import ProofLightbox from '../components/proof/ProofLightbox';
import ProofSubmitModal from '../components/proof/ProofSubmitModal';
import i18n from '../i18n';

const errorText = (code: string): string | undefined => ({
    '5601': i18n.t('proof:proofGuestPage.linkKhongHopLeHoac'),
    '5602': i18n.t('proof:proofGuestPage.linkNayDaHetHan'),
    '5703': i18n.t('proof:proofGuestPage.linkNayDaHetHan'),
} as Record<string, string>)[code];

const ProofGuestPage = observer(() => {
    const { shareToken = '' } = useParams();
    const store = useMemo(() => new ProofGuestStore(shareToken), [shareToken]);

    const [nameInput, setNameInput] = useState('');
    const [nameError, setNameError] = useState<string | null>(null);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [submitOpen, setSubmitOpen] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        void store.init();
    }, [store]);

    const readOnly = store.phase === 'submitted';

    const handleEnter = async () => {
        const name = nameInput.trim();
        if (!name || name.length > 100) {
            setNameError(i18n.t('proof:proofGuestPage.vuiLongNhapTenToi'));
            return;
        }
        setNameError(null);
        try {
            await store.enterName(name);
        } catch (e) {
            if (e instanceof ApiError && (e.code === '5601' || e.code === '5602' || e.code === '5703')) {
                store.fail(e);
                return;
            }
            setNameError(e instanceof ApiError ? e.message : i18n.t('proof:proofGuestPage.khongTheVaoXemHay'));
        }
    };

    const handleSubmit = async (note: string) => {
        setSubmitError(null);
        try {
            await store.submit(note);
            setSubmitOpen(false);
        } catch (e) {
            setSubmitError(e instanceof ApiError ? e.message : i18n.t('proof:proofGuestPage.guiThatBaiHayThu'));
        }
    };

    if (store.phase === 'loading') {
        return <div className="flex h-screen items-center justify-center bg-background"><Spin size="large" /></div>;
    }

    if (store.phase === 'error') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background px-4">
                <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6">
                    <Result
                        status="warning"
                        title={errorText(store.errorCode ?? '') ?? i18n.t('proof:proofGuestPage.khongMoDuocTrangNay')}
                        subTitle={i18n.t('proof:proofGuestPage.hayLienHeNguoiGui')}
                    />
                </div>
            </div>
        );
    }

    if (store.phase === 'name') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
                <div className="w-full max-w-md text-center">
                    <span className="inline-block rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                        {i18n.t('proof:proofGuestPage.khongCanTaiKhoan')}
                    </span>
                    <h1 className="mt-4 text-3xl font-semibold text-foreground">{store.landing?.folderName}</h1>
                    <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-destructive" />
                    <p className="mb-6 mt-3 text-muted-foreground">{store.landing?.imageCount ?? 0} {i18n.t('proof:proofGuestPage.anhNhapTenDeXem')}</p>
                    <div className="rounded-2xl border border-border bg-card p-5 text-left">
                        <Input
                            size="large"
                            value={nameInput}
                            maxLength={100}
                            placeholder={i18n.t('proof:proofGuestPage.tenCuaBan')}
                            onChange={(e) => setNameInput(e.target.value)}
                            onPressEnter={() => void handleEnter()}
                        />
                        {nameError && <p className="mt-2 text-destructive">{nameError}</p>}
                        <Button
                            type="primary"
                            shape="round"
                            size="large"
                            block
                            className="mt-4"
                            loading={store.isCreatingSession}
                            onClick={() => void handleEnter()}
                        >
                            {i18n.t('proof:proofGuestPage.xemAnh')}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const visible = store.visibleAssets;

    return (
        <div className="min-h-screen bg-background pb-32">
            <header className="sticky top-0 z-10 border-b border-border bg-card/90 px-4 py-4 backdrop-blur sm:px-6">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-lg font-semibold text-foreground">{store.landing?.folderName}</h1>
                        <p className="text-sm text-muted-foreground">{i18n.t('proof:proofGuestPage.xinChao', {guestName: store.session?.guestName})}</p>
                    </div>
                    {readOnly && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm font-medium text-foreground">
                            <LockOutlined />
                            {i18n.t('proof:proofGuestPage.daGuiAnh', {count: store.selectedCount})}
                        </span>
                    )}
                    {!readOnly && (
                        <Segmented
                            value={store.filter}
                            onChange={(v) => store.setFilter(v as 'all' | 'selected')}
                            options={[
                                { label: i18n.t('proof:proofGuestPage.tatCa'), value: 'all' },
                                { label: i18n.t('proof:proofGuestPage.daChon', {selectedCount: store.selectedCount}), value: 'selected' },
                            ]}
                        />
                    )}
                </div>
            </header>

            {readOnly && (
                <div className="mx-4 mt-6 flex max-w-6xl items-center gap-3 rounded-2xl bg-muted px-5 py-4 text-foreground sm:mx-6 lg:mx-auto">
                    <CheckCircleFilled className="text-primary" />
                    <span>{i18n.t('proof:proofGuestPage.camOnBanLuaChon')}</span>
                </div>
            )}

            <main className="mx-auto mt-8 max-w-6xl px-4 sm:px-6">
                {visible.length === 0 ? (
                    <p className="py-12 text-center text-muted-foreground">{i18n.t('proof:proofGuestPage.khongCoAnhDeHien')}</p>
                ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5">
                        {visible.map((asset, i) => {
                            const isSelected = store.selected.has(asset.assetId);
                            return (
                                <div
                                    key={asset.assetId}
                                    className={`relative overflow-hidden rounded-2xl border bg-card transition-shadow motion-reduce:transition-none hover:shadow-md ${isSelected ? 'border-destructive outline outline-2 outline-destructive' : 'border-border'}`}
                                >
                                    <button
                                        type="button"
                                        className="block aspect-[4/5] w-full"
                                        aria-label={`Xem ${asset.assetName}`}
                                        onClick={() => setLightboxIndex(i)}
                                    >
                                        <img
                                            src={asset.thumbnailUrl ?? asset.previewUrl ?? ''}
                                            alt={asset.assetName}
                                            loading="lazy"
                                            className="h-full w-full object-cover"
                                        />
                                    </button>
                                    {readOnly ? (
                                        isSelected && (
                                            <span className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-destructive text-primary-foreground">
                                                <HeartFilled />
                                            </span>
                                        )
                                    ) : (
                                        <Button
                                            shape="circle"
                                            size="large"
                                            aria-label={isSelected ? i18n.t('proof:proofGuestPage.boChon') : i18n.t('proof:proofGuestPage.chonAnh')}
                                            className={`!absolute right-3 top-3 !size-11 ${isSelected ? '!border-destructive !bg-destructive !text-primary-foreground' : ''}`}
                                            icon={isSelected ? <HeartFilled /> : <HeartOutlined />}
                                            onClick={() => store.toggle(asset.assetId)}
                                        />
                                    )}
                                    <p className="truncate px-3 py-2 text-sm text-muted-foreground">{asset.assetName}</p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {!readOnly && (
                <div className="fixed inset-x-0 bottom-6 z-10 px-4">
                    <div className="canvas-shadow mx-auto flex max-w-xl items-center justify-between gap-4 rounded-full bg-canvas py-3 pl-6 pr-3 text-primary-foreground">
                        <span>{i18n.t('proof:proofGuestPage.daChonAnh', {selectedCount: store.selectedCount})}</span>
                        <Button
                            type="primary"
                            shape="round"
                            size="large"
                            disabled={store.selectedCount === 0}
                            className="disabled:!border-canvas-border disabled:!bg-canvas-elevated disabled:!text-primary-foreground/60"
                            onClick={() => { setSubmitError(null); setSubmitOpen(true); }}
                        >
                            {i18n.t('proof:proofGuestPage.guiLuaChon')}
                        </Button>
                    </div>
                </div>
            )}

            {lightboxIndex !== null && (
                <ProofLightbox
                    assets={visible}
                    index={Math.min(lightboxIndex, visible.length - 1)}
                    selected={store.selected}
                    readOnly={readOnly}
                    onIndexChange={setLightboxIndex}
                    onToggle={(id) => store.toggle(id)}
                    onClose={() => setLightboxIndex(null)}
                />
            )}

            <ProofSubmitModal
                open={submitOpen}
                count={store.selectedCount}
                submitting={store.isSubmitting}
                error={submitError}
                onSubmit={(note) => void handleSubmit(note)}
                onCancel={() => setSubmitOpen(false)}
            />
        </div>
    );
});

export default ProofGuestPage;
