import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { CloseOutlined, HeartFilled, HeartOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import type { ProofAssetItem } from '../../api/proofApi';

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
        <div className="fixed inset-0 z-50 flex flex-col bg-canvas" role="dialog" aria-label="Xem ảnh">
            <div className="flex items-center justify-between px-4 py-3 text-primary-foreground">
                <span className="truncate text-sm">{asset.assetName} · {index + 1}/{assets.length}</span>
                <button type="button" aria-label="Đóng" className="p-2 text-primary-foreground" onClick={onClose}>
                    <CloseOutlined />
                </button>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center">
                <button
                    type="button"
                    aria-label="Ảnh trước"
                    disabled={index === 0}
                    className="absolute left-2 z-10 p-3 text-primary-foreground disabled:opacity-30"
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
                    aria-label="Ảnh sau"
                    disabled={index === assets.length - 1}
                    className="absolute right-2 z-10 p-3 text-primary-foreground disabled:opacity-30"
                    onClick={() => onIndexChange(index + 1)}
                >
                    <RightOutlined />
                </button>
            </div>

            <div className="flex items-center justify-center py-4">
                {readOnly ? (
                    isSelected && <HeartFilled className="text-2xl text-destructive" aria-label="Đã chọn" />
                ) : (
                    <button
                        type="button"
                        aria-label={isSelected ? 'Bỏ chọn' : 'Chọn ảnh'}
                        className="text-3xl text-primary-foreground"
                        onClick={() => onToggle(asset.assetId)}
                    >
                        {isSelected ? <HeartFilled className="text-destructive" /> : <HeartOutlined />}
                    </button>
                )}
            </div>
        </div>
    );
});

export default ProofLightbox;
