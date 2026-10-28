import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Button } from 'antd';
import { CloseOutlined, HeartFilled, HeartOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import type { ProofAssetItem } from '../../api/proofApi';
import i18n from '../../i18n';

interface Props {
    assets: ProofAssetItem[];
    index: number;
    selected: Set<string>;
    readOnly: boolean;
    onIndexChange: (index: number) => void;
    onToggle: (assetId: string) => void;
    onClose: () => void;
}

const ProofLightbox = observer(({ assets, index, selected, readOnly, onIndexChange, onToggle, onClose }: Props) => {
    const asset = assets[index];

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' && index > 0) onIndexChange(index - 1);
            else if (e.key === 'ArrowRight' && index < assets.length - 1) onIndexChange(index + 1);
            else if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [index, assets.length, onIndexChange, onClose]);

    if (!asset) return null;
    const isSelected = selected.has(asset.assetId);

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-canvas" role="dialog" aria-label={i18n.t('proof:proofLightbox.xemAnh')}>
            <div className="flex items-center justify-between px-4 py-3 text-primary-foreground">
                <span className="truncate text-sm">{asset.assetName} · {index + 1}/{assets.length}</span>
                <button
                    type="button"
                    aria-label={i18n.t('proof:proofLightbox.dong')}
                    className="flex size-11 items-center justify-center rounded-full bg-canvas-elevated text-primary-foreground"
                    onClick={onClose}
                >
                    <CloseOutlined />
                </button>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center">
                <button
                    type="button"
                    aria-label={i18n.t('proof:proofLightbox.anhTruoc')}
                    disabled={index === 0}
                    className="absolute left-2 z-10 flex size-11 items-center justify-center rounded-full border border-canvas-border bg-canvas-elevated text-primary-foreground disabled:opacity-30"
                    onClick={() => onIndexChange(index - 1)}
                >
                    <LeftOutlined />
                </button>
                <img
                    src={asset.previewUrl ?? asset.thumbnailUrl ?? ''}
                    alt={asset.assetName}
                    className="max-h-full max-w-full object-contain"
                />
                <button
                    type="button"
                    aria-label={i18n.t('proof:proofLightbox.anhSau')}
                    disabled={index === assets.length - 1}
                    className="absolute right-2 z-10 flex size-11 items-center justify-center rounded-full border border-canvas-border bg-canvas-elevated text-primary-foreground disabled:opacity-30"
                    onClick={() => onIndexChange(index + 1)}
                >
                    <RightOutlined />
                </button>
            </div>

            <div className="flex items-center justify-center py-4">
                {readOnly ? (
                    isSelected && <HeartFilled className="text-2xl text-destructive" aria-label={i18n.t('proof:proofLightbox.daChon')} />
                ) : (
                    <Button
                        shape="round"
                        size="large"
                        type={isSelected ? 'primary' : 'default'}
                        aria-label={isSelected ? i18n.t('proof:proofLightbox.boChon') : i18n.t('proof:proofLightbox.chonAnh')}
                        className={isSelected ? '!border-destructive !bg-destructive !text-primary-foreground' : ''}
                        icon={isSelected ? <HeartFilled /> : <HeartOutlined />}
                        onClick={() => onToggle(asset.assetId)}
                    >
                        {isSelected ? i18n.t('proof:proofLightbox.daChon') : i18n.t('proof:proofLightbox.chonAnh')}
                    </Button>
                )}
            </div>
        </div>
    );
});

export default ProofLightbox;
