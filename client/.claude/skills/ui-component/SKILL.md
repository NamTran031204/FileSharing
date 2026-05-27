---
name: ui-component
description: 'Tạo và kiểm tra React components tuân thủ "Lumina Pro" design system. Sử dụng khi: tạo UI mới, review component, fix design inconsistency với purple/lavender palette, đảm bảo màu sắc/spacing/typography đúng chuẩn. Hỗ trợ React 18, Tailwind v4, Ant Design 5. LUÔN ưu tiên tái sử dụng core components từ src/components/core/ và utils từ src/utils/ trước khi tạo mới.'
argument-hint: 'Tên component hoặc file path cần tạo/kiểm tra'
---

# UI Component Design System Compliance
## "Lumina Pro" Theme

Skill này giúp tạo và kiểm tra React components tuân thủ hoàn toàn **"Lumina Pro"** design system - theme chuyên nghiệp với purple/lavender palette cho Media Review Platform.

## Khi nào sử dụng skill này

- **Tạo component mới**: Button, Card, Panel, Form, Modal, Layout sections
- **Review component hiện có**: Kiểm tra màu sắc, spacing, typography, interaction states
- **Fix design inconsistency**: Sửa component không đúng design system
- **Refactor UI**: Cập nhật component cũ lên chuẩn mới
- **Validate trước commit**: Đảm bảo code tuân thủ design system

## Tech Stack

- **React 18** + **TypeScript**
- **Tailwind CSS v4** (với `@theme` custom tokens)
- **Ant Design 5** (components chính)
- **Design tokens** định nghĩa trong `src/index.css` - Tailwind tự động generate classes từ `@theme`

---

## Quy tắc ưu tiên: Core-First

**Trước khi viết bất kỳ component nào**, kiểm tra bảng dưới. Nếu đã có sẵn → import và dùng, không tạo lại.

### Core Components (`src/components/core/`)

#### Layout
| Component | Import path | Dùng khi |
|---|---|---|
| `AppHeader` | `@/components/core/layout/AppHeader` | Fixed top nav cho toàn app |
| `AppSidebar` | `@/components/core/layout/AppSidebar` | Sidebar trái với nav + New Project button |
| `CommonLayout` | `@/layout/CommonLayout` | Shell bọc ngoài mọi full page (đã bao gồm Header + Sidebar) |

#### Common UI
| Component | Import path | Dùng khi |
|---|---|---|
| `ActionDropdown` | `@/components/core/common/ActionDropdown` | Menu "⋯" / kebab trên card, row, table. Nhận `ActionDropdownItem[]` + `record`. Tích hợp sẵn permission check |
| `BusyOverlay` | `@/components/core/common/BusyOverlay` | Overlay loading toàn màn hình — thêm 1 lần ở root, dùng `uiUtils.setBusy()` |
| `RequiredPermission` | `@/components/core/common/RequiredPermission` | Bọc UI chỉ hiển thị khi user có permission. Props: `permissionName`, `fallback` |

#### Forms
| Component | Import path | Dùng khi |
|---|---|---|
| `CusCommonSelect` | `@/components/core/forms/CusCommonSelect` | Select có search tiếng Việt, async datasource. Nhận prop `datasource: SelectDataSource` |
| `CusCommonDateRangeInput` | `@/components/core/forms/CusCommonDateRangeInput` | Date range picker có preset (Hôm nay, 7 ngày trước, v.v.) |
| `FloatLabel` | `@/components/core/forms/FloatLabel` | Wrapper tạo floating label cho bất kỳ input nào |

#### CRUD / Page Layout
| Component | Import path | Dùng khi |
|---|---|---|
| `FolderAssetCommonCrudPage` | `@/components/core/crud/FolderAssetCommonCrudPage` | Full page có sidebar tree + toolbar + lưới folder/asset |
| `FolderAssetBody` | `@/components/core/crud/FolderAssetBody` | Chỉ phần body: breadcrumb + lưới folder + lưới asset (không có shell page) |
| `TopActions` | `@/components/core/crud/TopActions` | Nút action ở toolbar, có filter permission tự động. Nhận `TopActionConfig[]` |

#### Grid
| Component | Import path | Dùng khi |
|---|---|---|
| `SmartRow` | `@/components/core/grid/SmartRow` | Responsive Row với gap tự động theo breakpoint |
| `ColSpanResponsive` | `@/components/core/grid/ColSpanResponsive` | Col tự điều chỉnh span theo màn hình |

### Utils (`src/utils/`)

| Util | Import | Exports chính |
|---|---|---|
| `uiUtils` | `@/utils/uiUtils` (default export) | `showSuccess(msg)`, `showError(msg)`, `showWarning(msg)`, `showInfor(msg)`, `showConfirm(props)` → `Promise<boolean>`, `setBusy()`, `clearBusy()` |
| `permissionUtils` | `@/utils/permissionUtils` | `hasPermission()`, `canEdit()`, `canDelete()`, `canShare()`, `canAddUser()`, `isOwner()` |
| `auth.utils` | `@/utils/auth.utils` | `checkPermissionUser(session, permissionName)` |
| `date.util` | `@/utils/date.util` | `getDateRange(preset)`, `disableAfter()`, `disableBefore()`, `disableAfterAndAfterNow()`, v.v. |
| `text.util` | `@/utils/text.util` | `toLowerCaseNonAccentVietnamese(str)` |
| `FileViewUtil` | `@/utils/FileViewUtil` | Tiện ích xem file / kiểm tra loại file |

### Ví dụ sử dụng đúng

```tsx
// ✅ Toast / confirm — dùng uiUtils, không tự tạo Modal hoặc antd.message
import uiUtils from '@/utils/uiUtils';
uiUtils.showSuccess('Lưu thành công');
const confirmed = await uiUtils.showConfirm({ title: 'Xoá?', okLabel: 'Xoá' });

// ✅ Action menu — dùng ActionDropdown, không tự tạo Dropdown + Menu
import ActionDropdown, { type ActionDropdownItem } from '@/components/core/common/ActionDropdown';
const actions: ActionDropdownItem<MyItem>[] = [
  { title: 'edit', onClick: (r) => handleEdit(r) },
  { title: 'remove', isDanger: true, onClick: (r) => handleDelete(r) },
];
<ActionDropdown actions={actions} record={item} />

// ✅ Permission guard — dùng RequiredPermission, không tự check
import RequiredPermission from '@/components/core/common/RequiredPermission';
<RequiredPermission permissionName="MODIFY">
  <Button>Chỉnh sửa</Button>
</RequiredPermission>

// ✅ Toolbar actions — dùng TopActions
import TopActions, { type TopActionConfig } from '@/components/core/crud/TopActions';
const topActions: TopActionConfig[] = [
  { title: 'Thêm mới', type: 'primary', icon: <PlusOutlined />, onClick: handleAdd },
];
<TopActions topActions={topActions} />

// ✅ Select với search — dùng CusCommonSelect
import CusCommonSelect from '@/components/core/forms/CusCommonSelect';
<CusCommonSelect datasource={{ data: options, isPending: loading }} onChange={setValue} />
```

## Quy trình làm việc

### 1. Tạo Component Mới

Khi tạo component React mới, tuân thủ các quy tắc sau:

#### **Bước 1: Xác định yêu cầu**
- Component thuộc loại gì? (Button, Card, Panel, Form, Layout)
- Variants cần hỗ trợ? (Primary, Default, Ghost, Destructive)
- Interactive states? (Hover, Active, Disabled, Loading)
- Responsive? Mobile/Desktop considerations

#### **Bước 2: Chọn màu sắc từ design tokens**

**KHÔNG BAO GIỜ** dùng mã màu trực tiếp như `#2A2F6F` hoặc `bg-[#2A2F6F]`.

**LUÔN LUÔN** dùng Tailwind classes được tạo tự động từ `@theme` trong `src/index.css`:

```tsx
// ✅ ĐÚNG - Sử dụng Tailwind classes từ @theme
<div className="bg-background text-foreground border-border">
  
// ❌ SAI - Hard-coded colors
<div className="bg-[#2A2F6F] text-[#2A2F6F] border-[#C5C0E6]">
```

**Bảng màu design tokens - "Lumina Pro" Theme** (Tailwind classes tự động từ `@theme`):

| Tailwind Class                           | CSS Variable        | HEX     | Sử dụng                                                   |
|------------------------------------------|---------------------|---------|-----------------------------------------------------------|
| `bg-background`, `text-background`       | `--color-background` | #F3F2F7 | Main application canvas (Light lavender-gray)             |
| `bg-card`, `text-card`                   | `--color-card`      | #FFFFFF | Sidebar panels, project cards, comment boxes (Pure White) |
| `text-foreground`, `bg-foreground`       | `--color-foreground` | #2A2F6F | Primary text, headers, sidebars (Deep Navy-Purple)        |
| `text-primary-dark`, `bg-primary-dark`   | `--color-primary-dark` | #2A2F6F | Same as foreground                                        |
| `bg-primary`, `text-primary`             | `--color-primary`   | #535297 | CTAs, active states, buttons (Primary Purple)             |
| `bg-accent`, `text-accent`               | `--color-accent`    | #A6A0ED | Badges, markers, secondary highlights (Soft Purple)       |
| `bg-muted`, `text-muted`                 | `--color-muted`     | #D2CAFF | Backgrounds of less critical UI sections (Soft Lavender)  |
| `border-border`                          | `--color-border`    | #C5C0E6 | Borders and dividers (Light Lavender)                     |
| `bg-secondary`, `text-secondary`         | `--color-secondary` | #7C78C1 | Hover states, secondary actions                           |
| `text-primary-foreground`                | `--color-primary-foreground` | #FFFFFF | Text trên primary backgrounds                           |
| `text-muted-foreground`                  | `--color-muted-foreground` | #6B6B6B | Secondary text, captions                                  |
| `text-destructive`, `bg-destructive`     | `--color-destructive` | #EF4444 | Error states, delete actions                              |

#### **Bước 3: Áp dụng Typography**

```tsx
// Heading 1
<h1 className="text-2xl font-bold text-foreground">

// Heading 2
<h2 className="text-xl font-semibold text-foreground">

// Heading 3
<h3 className="text-sm font-semibold text-foreground">

// Body
<p className="text-sm text-foreground">

// Caption
<span className="text-xs text-muted-foreground">

// Small/Tag
<span className="text-[10px] font-medium text-muted-foreground">
```

#### **Bước 4: Spacing & Sizing**

```tsx
// Component spacing
<div className="gap-4">        {/* 16px - Section gaps */}
<div className="gap-3">        {/* 12px - Component internal */}
<div className="gap-2">        {/* 8px - Tight spacing */}

// Padding
<div className="p-6">          {/* 24px - Header/Page padding */}
<div className="p-5">          {/* 20px - Large card padding */}
<div className="p-4">          {/* 16px - Control bar */}
<div className="p-3">          {/* 12px - Panel padding */}

// Border radius
<div className="rounded-lg">   {/* 8px - Card, panel */}
<div className="rounded-md">   {/* 6px - Medium */}
<div className="rounded-sm">   {/* 4px - Small */}
```

#### **Bước 5: Component Patterns - Lumina Pro Theme**

**Button Component:**
```tsx
// Primary button (Purple #535297 - Interactive)
<Button 
  className="bg-primary text-primary-foreground hover:opacity-90"
>
  Action
</Button>

// Default button (White surface with Lavender border)
<Button 
  className="bg-card text-foreground border border-border hover:border-secondary"
>
  Cancel
</Button>

// Ghost/Text button
<Button 
  type="text"
  className="text-muted-foreground hover:text-primary"
>
  Link
</Button>

// Destructive button
<Button 
  type="text"
  className="text-destructive hover:opacity-80"
>
  Delete
</Button>
```

**Card/Panel Component (Pure White with Lavender border):**
```tsx
<div className="bg-card border border-border rounded-lg p-3">
  {/* Content */}
</div>
```

**Badge/Highlight (Soft Purple #A6A0ED):**
```tsx
<span className="bg-accent/30 text-primary px-2 py-1 rounded-md text-xs font-semibold">
  Featured
</span>
```

**Pin Marker (Soft Purple annotation #A6A0ED):**
```tsx
<div className="w-6 h-6 bg-accent border-2 border-card rounded-full animate-pulse flex items-center justify-center">
  <PushpinOutlined className="text-card text-xs" />
</div>
```

#### **Bước 6: Ant Design Integration - Lumina Pro Styling**

Sử dụng Ant Design components với Tailwind overrides theo Lumina Pro theme:

```tsx
import { Menu, Button, Breadcrumb, Avatar, Tag, Tooltip } from 'antd';

// Menu với Lumina Pro colors
<Menu
  className="
    [&_.ant-menu-item]:text-primary-foreground/70
    [&_.ant-menu-item-selected]:bg-secondary
    [&_.ant-menu-item-selected]:text-primary-foreground
  "
  items={menuItems}
/>

// Button với Primary Purple
<Button className="bg-primary text-primary-foreground hover:opacity-90">
  Click me
</Button>

// Tag với Soft Purple highlight
<Tag color="purple" className="bg-accent/20 text-primary border-accent">
  Pin #1
</Tag>

// Avatar với Navy-Purple background
<Avatar className="bg-primary-dark">
  U
</Avatar>
```

#### **Bước 7: Interaction States - Lumina Pro Theme**

```tsx
// Hover states (Lavender border → Medium Purple)
<button className="border border-border hover:border-secondary hover:text-primary transition-colors">

// Active tool state (Primary Purple background)
<button className={cn(
  "border border-transparent",
  isActive && "bg-primary text-primary-foreground border-primary"
)}>

// Pin mode active (Soft Purple highlight)
<button className={cn(
  "text-muted-foreground",
  isPinMode && "text-accent"
)}>

// Sidebar hover expansion (Navy-Purple background)
<aside className="w-[60px] hover:w-[220px] bg-primary-dark transition-all duration-300 ease-in-out">

// Card hover (Shadow + Lavender tint)
<div className="bg-card hover:shadow-md hover:bg-muted/20 transition-all">
```

### 2. Kiểm tra Component Hiện Có

Khi review hoặc fix component:

#### **Checklist kiểm tra - Lumina Pro Theme:**

1. **✅ Màu sắc - Lumina Pro Palette**
   - [ ] KHÔNG có hard-coded colors (`#HEX` trực tiếp, `hsl(...)` cứng)
   - [ ] Tất cả màu dùng Tailwind classes: `bg-primary`, `text-foreground`
   - [ ] Background: `bg-background` (#F3F2F7 - Light lavender-gray)
   - [ ] Cards/Surfaces: `bg-card` (#FFFFFF - Pure White)
   - [ ] Text: `text-foreground` (#2A2F6F - Deep Navy-Purple)
   - [ ] Primary actions: `bg-primary` (#535297 - Primary Purple)
   - [ ] Highlights: `bg-accent` (#A6A0ED - Soft Purple)
   - [ ] Borders: `border-border` (#C5C0E6 - Light Lavender)

2. **✅ Typography**
   - [ ] Font sizes đúng: `text-2xl` (H1), `text-xl` (H2), `text-sm` (H3/Body), `text-xs` (Caption)
   - [ ] Font weights đúng: `font-bold` (H1), `font-semibold` (H2/H3), `font-black` (uppercase labels)
   - [ ] Text colors: `text-[hsl(var(--foreground))]` (#2A2F6F) cho primary text

3. **✅ Spacing**
   - [ ] Padding đúng: `p-6` (header), `p-5` (large card), `p-3` (panel)
   - [ ] Gap đúng: `gap-4` (sections), `gap-3` (components), `gap-2` (tight)
   - [ ] Border radius đúng: `rounded-lg` (8px), `rounded-md` (6px), `rounded-2xl` (16px)

4. **✅ Layout - Lumina Pro Structure**
   - [ ] Header: `h-[10vh]`, `bg-primary-dark` (#2A2F6F), `px-6`
   - [ ] Sidebar: `w-[60px]` → `hover:w-[220px]`, `bg-primary-dark`
   - [ ] Main background: `bg-background` (#F3F2F7)
   - [ ] Panels: `bg-card` with `border-border`

5. **✅ Components - Lumina Pro Styling**
   - [ ] Ant Design components có Lumina Pro overrides
   - [ ] Primary buttons: `bg-primary` text-primary-foreground`
   - [ ] Cards: `bg-card` với `border-border`
   - [ ] Pins/Badges: `bg-accent` với pulse animation
   - [ ] Tags: Purple variants với appropriate contrast

6. **✅ Interaction States**
   - [ ] Hover: `border-border` → `hover:border-secondary`
   - [ ] Active: `bg-primary` background, `text-primary-foreground`
   - [ ] Highlight: `bg-accent` tint
   - [ ] Transitions: `transition-all duration-300 ease-in-out`

#### **Quy trình fix:**

1. **Scan file** để tìm violations
2. **Report findings** với line numbers
3. **Suggest fixes** với code examples
4. **Apply fixes** nếu user xác nhận
5. **Verify** sau khi fix

### 3. Review trước Commit

Trước khi commit UI changes, kiểm tra:

- KHÔNG có hard-coded colors trong code
- Tất cả components dùng design tokens
- Spacing/typography đúng chuẩn
- Interaction states hoạt động đúng

## Ví dụ Sử Dụng

### Ví dụ 1: Tạo Comment Item Component

```tsx
import { Avatar, Tag } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';

interface CommentItemProps {
  author: string;
  timestamp: string;
  content: string;
  pinNumber?: number;
}

export function CommentItem({ author, timestamp, content, pinNumber }: CommentItemProps) {
  return (
    <div className="flex gap-2 p-2 hover:bg-muted/50 rounded-md transition-colors">
      {/* Avatar */}
      <Avatar size="small" className="bg-primary">
        {author[0].toUpperCase()}
      </Avatar>
      
      {/* Content */}
      <div className="flex-1">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-foreground">
            {author}
          </span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <ClockCircleOutlined />
            {timestamp}
          </span>
          {pinNumber && (
            <Tag color="purple" className="text-[10px]">
              Pin #{pinNumber}
            </Tag>
          )}
        </div>
        
        {/* Body */}
        <p className="text-xs text-foreground/80">
          {content}
        </p>
      </div>
    </div>
  );
}
```

### Ví dụ 2: Fix Button Component

**Before (❌ SAI):**
```tsx
<button 
  style={{ backgroundColor: '#535297', color: 'white' }}
  className="px-4 py-2"
>
  Submit
</button>
```

**After (✅ ĐÚNG):**
```tsx
<Button 
  className="bg-primary text-primary-foreground px-4 py-2"
>
  Submit
</Button>
```

## Reference Files

- **[Design System Specification](./references/design-system-spec.md)**: Toàn bộ design system chi tiết (colors, typography, layout, components)

## Best Practices - Lumina Pro Theme

1. **Tailwind classes first**: Luôn dùng `bg-primary`, `text-foreground` từ `@theme`
2. **KHÔNG hardcode**: Tránh `bg-[#535297]`, `bg-[hsl(var(--primary))]`, v.v
3. **Component reusability**: Tạo base components với Lumina Pro styling
4. **Type safety**: Sử dụng TypeScript interfaces/types cho props
5. **Consistency**: Purple palette (#2A2F6F → #535297 → #A6A0ED) xuyên suốt
6. **Accessibility**: Navy-Purple text (`text-foreground`) đảm bảo contrast ratio WCAG AA
7. **Performance**: Memoize components nặng với `React.memo`
8. **Visual hierarchy**: White cards (`bg-card`) trên Lavender background (`bg-background`)

## Common Mistakes - Lumina Pro Theme

| Lỗi | Ví dụ SAI | Cách fix ĐÚNG |
|-----|-----------|---------------|
| Hard-coded colors | `bg-[#535297]` | `bg-primary` |
| Hard-coded hsl | `bg-[hsl(var(--primary))]` | `bg-primary` |
| Wrong background | `bg-gray-100` | `bg-background` |
| Wrong text color | `text-gray-800` | `text-foreground` |
| Wrong borders | `border-gray-300` | `border-border` |
| Wrong hover | `hover:bg-blue-500` | `hover:border-secondary` |
| Missing purple tint | Generic grays | Use `bg-muted`, `text-accent` |
| Wrong spacing | Random px values | Dùng `gap-2/3/4`, `p-3/4/5/6` |
| No transition | Instant changes | `transition-all duration-300 ease-in-out` |

## Output Format

Sau khi hoàn thành, cung cấp:

1. **Summary**: Component được tạo/fix
2. **Files changed**: Danh sách files
3. **Compliance report**: Checklist đã pass
4. **Screenshots/Preview**: Nếu có (optional)
5. **Next steps**: Suggestions cho improvements

---

**Lưu ý quan trọng**: 
- Skill này không tự động format code. Chạy `npm run lint` hoặc `npm run format` sau khi tạo/sửa components.
- **LUÔN sử dụng Tailwind classes từ `@theme`** như `bg-primary`, `text-foreground` - KHÔNG hardcode màu HEX hoặc hsl value
- Tất cả design tokens được tự động tạo thành Tailwind classes bởi Tailwind v4 `@theme`
