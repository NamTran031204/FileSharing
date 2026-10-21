import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { Button, Input, Result, Segmented, Spin } from 'antd';
import { CheckCircleFilled, HeartFilled, HeartOutlined } from '@ant-design/icons';
import { ApiError } from '../api/baseApi';
import { ProofGuestStore } from '../store/proofGuestStore';
import ProofLightbox from '../components/proof/ProofLightbox';
import ProofSubmitModal from '../components/proof/ProofSubmitModal';

const ERROR_TEXT: Record<string, string> = {
    '5601': 'Link không hợp lệ hoặc đã bị thu hồi.',
    '5602': 'Link này đã hết hạn.',
};

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
            setNameError('Vui lòng nhập tên (tối đa 100 ký tự)');
            return;
        }
        setNameError(null);
        try {
            await store.enterName(name);
        } catch (e) {
            if (e instanceof ApiError && (e.code === '5601' || e.code === '5602')) {
                store.fail(e);
                return;
            }
            setNameError(e instanceof ApiError ? e.message : 'Không thể vào xem, hãy thử lại');
        }
    };

    const handleSubmit = async (note: string) => {
        setSubmitError(null);
        try {
            await store.submit(note);
            setSubmitOpen(false);
        } catch (e) {
            setSubmitError(e instanceof ApiError ? e.message : 'Gửi thất bại, hãy thử lại');
        }
    };

    if (store.phase === 'loading') {
        return <div className="flex h-screen items-center justify-center bg-background"><Spin size="large" /></div>;
    }

    if (store.phase === 'error') {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Result
                    status="warning"
                    title={ERROR_TEXT[store.errorCode ?? ''] ?? 'Không mở được trang này.'}
                    subTitle="Hãy liên hệ người gửi link cho bạn."
                />
            </div>
        );
    }

    if (store.phase === 'name') {
        return (
            <div className="flex h-screen items-center justify-center bg-background px-4">
                <div className="w-full max-w-md rounded-lg border border-border bg-card p-6">
                    <h1 className="mb-1 text-xl font-semibold text-foreground">{store.landing?.folderName}</h1>
                    <p className="mb-4 text-muted-foreground">{store.landing?.imageCount ?? 0} ảnh · Nhập tên để xem và chọn ảnh</p>
                    <Input
                        value={nameInput}
                        maxLength={100}
                        placeholder="Tên của bạn"
                        onChange={(e) => setNameInput(e.target.value)}
                        onPressEnter={() => void handleEnter()}
                    />
                    {nameError && <p className="mt-2 text-destructive">{nameError}</p>}
                    <Button
                        type="primary"
                        block
                        className="mt-4"
                        loading={store.isCreatingSession}
                        onClick={() => void handleEnter()}
                    >
                        Xem ảnh
                    </Button>
                </div>
            </div>
        );
    }

    const visible = store.visibleAssets;

    return (
        <div className="min-h-screen bg-background pb-24">
            <header className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-lg font-semibold text-foreground">{store.landing?.folderName}</h1>
                        <p className="text-sm text-muted-foreground">Xin chào {store.session?.guestName}</p>
                    </div>
                    {!readOnly && (
                        <Segmented
                            value={store.filter}
                            onChange={(v) => store.setFilter(v as 'all' | 'selected')}
                            options={[
                                { label: 'Tất cả', value: 'all' },
                                { label: `Đã chọn (${store.selectedCount})`, value: 'selected' },
                            ]}
                        />
                    )}
                </div>
            </header>

            {readOnly && (
                <div className="mx-auto mt-4 flex max-w-6xl items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-foreground">
                    <CheckCircleFilled className="text-primary" />
                    <span>Cảm ơn bạn! Lựa chọn đã được gửi, bạn không thể chỉnh sửa nữa.</span>
                </div>
            )}

            <main className="mx-auto mt-4 max-w-6xl px-4">
                {visible.length === 0 ? (
                    <p className="py-12 text-center text-muted-foreground">Không có ảnh để hiển thị.</p>
                ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {visible.map((asset, i) => {
                            const isSelected = store.selected.has(asset.assetId);
                            return (
                                <div key={asset.assetId} className="relative overflow-hidden rounded-lg border border-border bg-card">
                                    <button
                                        type="button"
                                        className="block aspect-square w-full"
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
                                        isSelected && <HeartFilled className="absolute right-2 top-2 text-xl text-destructive" />
                                    ) : (
                                        <button
                                            type="button"
                                            aria-label={isSelected ? 'Bỏ chọn' : 'Chọn ảnh'}
                                            className="absolute right-2 top-2 rounded-full bg-card p-2 text-lg"
                                            onClick={() => store.toggle(asset.assetId)}
                                        >
                                            {isSelected ? <HeartFilled className="text-destructive" /> : <HeartOutlined className="text-foreground" />}
                                        </button>
                                    )}
                                    <p className="truncate px-2 py-1 text-xs text-muted-foreground">{asset.assetName}</p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {!readOnly && (
                <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-card px-4 py-3">
                    <div className="mx-auto flex max-w-6xl items-center justify-between">
                        <span className="text-foreground">Đã chọn {store.selectedCount} ảnh</span>
                        <Button
                            type="primary"
                            disabled={store.selectedCount === 0}
                            onClick={() => { setSubmitError(null); setSubmitOpen(true); }}
                        >
                            Gửi
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
