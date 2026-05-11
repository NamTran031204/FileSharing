# ActionMenu - Huong dan su dung

ActionMenu la component menu hanh dong dung chung, su dung theo Lumina Pro design system. Component nhan danh sach action tu component cha, va tu dong xu ly dong menu khi click ben ngoai hoac nhan phim Escape.

## Vi tri file

- Component: src/components/ActionMenu.tsx

## API

### Props

- actions: ActionMenuItem[]
  - Danh sach hanh dong hien thi.
- style?: string
  - Tailwind class them cho container menu (vd: width, background, border).

### ActionMenuItem

- key: string
  - Gia tri dinh danh duy nhat cho action.
- label: string
  - Noi dung hien thi tren tung dong.
- action?: () => void
  - Ham xu ly chinh khi click.
- callback?: () => void
  - Ham xu ly bo sung khi click (optional).
- style?: string
  - Tailwind class rieng cho action (vd: text-destructive).

## Cach su dung

```tsx
import ActionMenu, { type ActionMenuItem } from '@/components/ActionMenu';

const actions: ActionMenuItem[] = [
  {
    key: 'rename',
    label: 'Doi ten',
    action: () => {
      // TODO: mo modal doi ten
    },
  },
  {
    key: 'download',
    label: 'Tai xuong',
    action: () => {
      // TODO: goi API tai file
    },
  },
  {
    key: 'delete',
    label: 'Xoa',
    action: () => {
      // TODO: goi API xoa
    },
    style: 'text-destructive hover:bg-destructive/10',
  },
];

export default function FileRowActions() {
  return (
    <ActionMenu
      actions={actions}
      style="min-w-48"
    />
  );
}
```

## Luu y

- Khong hardcode mau. Su dung Tailwind classes tu @theme (vd: text-foreground, bg-card, border-border).
- style va item.style chi nen them cac class can thiet (width, highlight, text colors).
- action va callback duoc thuc thi theo thu tu: action truoc, callback sau.
