---
name: ui-component
description: 'Tạo và kiểm tra React components tuân thủ "Lumina Pro" design system. Sử dụng khi: tạo UI mới, review component, fix design inconsistency với purple/lavender palette, đảm bảo màu sắc/spacing/typography đúng chuẩn. Hỗ trợ React 18, Tailwind v4, Ant Design 5.'
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
- **Tailwind CSS v3** (với custom tokens)
- **Ant Design 5** (components chính)
- **Design tokens** định nghĩa trong `src/index.css`

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

**LUÔN LUÔN** dùng semantic tokens qua Tailwind classes:

```tsx
// ✅ ĐÚNG - Sử dụng design tokens
<div className="bg-primary-dark text-foreground border-border">
  
// ❌ SAI - Hard-coded colors
<div className="bg-[#2A2F6F] text-[#2A2F6F] border-[#C5C0E6]">
```

**Bảng màu design tokens - "Lumina Pro" Theme** (xem chi tiết trong [design-system-spec](./references/design-system-spec.md)):

| Token | HEX | Sử dụng |
|-------|-----|---------|
| `bg-background` | #F3F2F7 | Main application canvas (Light lavender-gray) |
| `bg-card` | #FFFFFF | Sidebar panels, project cards, comment boxes (Pure White) |
| `text-foreground` / `bg-primary-dark` | #2A2F6F | Primary text, headers, sidebars (Deep Navy-Purple) |
| `bg-primary` | #535297 | CTAs, active states, buttons (Primary Purple) |
| `bg-accent` | #A6A0ED | Badges, markers, secondary highlights (Soft Purple) |
| `bg-muted` | #D2CAFF | Backgrounds of less critical UI sections (Soft Lavender) |
| `border-border` | #C5C0E6 | Borders and dividers (Light Lavender) |
| `bg-secondary` | #7C78C1 | Hover states, secondary actions |
| `text-muted-foreground` | #6B6B6B | Secondary text, captions |
| `text-destructive` | #EF4444 | Error states, delete actions |

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
  className="bg-[hsl(var(--primary))] text-white hover:opacity-90"
>
  Action
</Button>

// Default button (White surface with Lavender border)
<Button 
  className="bg-[hsl(var(--card))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))] hover:border-[hsl(var(--secondary))]"
>
  Cancel
</Button>

// Ghost/Text button
<Button 
  type="text"
  className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]"
>
  Link
</Button>

// Destructive button
<Button 
  type="text"
  className="text-[hsl(var(--destructive))] hover:opacity-80"
>
  Delete
</Button>
```

**Card/Panel Component (Pure White with Lavender border):**
```tsx
<div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-3">
  {/* Content */}
</div>
```

**Badge/Highlight (Soft Purple #A6A0ED):**
```tsx
<span className="bg-[hsl(var(--accent))]/30 text-[hsl(var(--primary))] px-2 py-1 rounded-md text-xs font-semibold">
  Featured
</span>
```

**Pin Marker (Soft Purple annotation #A6A0ED):**
```tsx
<div className="w-6 h-6 bg-[hsl(var(--accent))] border-2 border-white rounded-full animate-pulse flex items-center justify-center">
  <PushpinOutlined className="text-white text-xs" />
</div>
```

#### **Bước 6: Ant Design Integration - Lumina Pro Styling**

Sử dụng Ant Design components với Tailwind overrides theo Lumina Pro theme:

```tsx
import { Menu, Button, Breadcrumb, Avatar, Tag, Tooltip } from 'antd';

// Menu với Lumina Pro colors
<Menu
  className="
    [&_.ant-menu-item]:text-white/70
    [&_.ant-menu-item-selected]:bg-[hsl(var(--secondary))]
    [&_.ant-menu-item-selected]:text-white
  "
  items={menuItems}
/>

// Button với Primary Purple
<Button className="bg-[hsl(var(--primary))] text-white hover:opacity-90">
  Click me
</Button>

// Tag với Soft Purple highlight
<Tag color="purple" className="bg-[hsl(var(--accent))]/20 text-[hsl(var(--primary))] border-[hsl(var(--accent))]">
  Pin #1
</Tag>

// Avatar với Navy-Purple background
<Avatar className="bg-[hsl(var(--primary-dark))]">
  U
</Avatar>
```

#### **Bước 7: Interaction States - Lumina Pro Theme**

```tsx
// Hover states (Lavender border → Medium Purple)
<button className="border border-[hsl(var(--border))] hover:border-[hsl(var(--secondary))] hover:text-[hsl(var(--primary))] transition-colors">

// Active tool state (Primary Purple background)
<button className={cn(
  "border border-transparent",
  isActive && "bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]"
)}>

// Pin mode active (Soft Purple highlight)
<button className={cn(
  "text-[hsl(var(--muted-foreground))]",
  isPinMode && "text-[hsl(var(--accent))]"
)}>

// Sidebar hover expansion (Navy-Purple background)
<aside className="w-[60px] hover:w-[220px] bg-[hsl(var(--primary-dark))] transition-all duration-300 ease-in-out">

// Card hover (Shadow + Lavender tint)
<div className="bg-[hsl(var(--card))] hover:shadow-md hover:bg-[hsl(var(--muted))]/20 transition-all">
```

### 2. Kiểm tra Component Hiện Có

Khi review hoặc fix component:

#### **Checklist kiểm tra - Lumina Pro Theme:**

1. **✅ Màu sắc - Lumina Pro Palette**
   - [ ] KHÔNG có hard-coded colors (`#HEX` trực tiếp)
   - [ ] Tất cả màu dùng `hsl(var(--token))`: `bg-[hsl(var(--primary))]`
   - [ ] Background: #F3F2F7 (Light lavender-gray)
   - [ ] Cards/Surfaces: #FFFFFF (Pure White)
   - [ ] Text: #2A2F6F (Deep Navy-Purple)
   - [ ] Primary actions: #535297 (Primary Purple)
   - [ ] Highlights: #A6A0ED (Soft Purple)
   - [ ] Borders: #C5C0E6 (Light Lavender)

2. **✅ Typography**
   - [ ] Font sizes đúng: `text-2xl` (H1), `text-xl` (H2), `text-sm` (H3/Body), `text-xs` (Caption)
   - [ ] Font weights đúng: `font-bold` (H1), `font-semibold` (H2/H3), `font-black` (uppercase labels)
   - [ ] Text colors: `text-[hsl(var(--foreground))]` (#2A2F6F) cho primary text

3. **✅ Spacing**
   - [ ] Padding đúng: `p-6` (header), `p-5` (large card), `p-3` (panel)
   - [ ] Gap đúng: `gap-4` (sections), `gap-3` (components), `gap-2` (tight)
   - [ ] Border radius đúng: `rounded-lg` (8px), `rounded-md` (6px), `rounded-2xl` (16px)

4. **✅ Layout - Lumina Pro Structure**
   - [ ] Header: `h-[10vh]`, `bg-[hsl(var(--primary-dark))]` (#2A2F6F), `px-6`
   - [ ] Sidebar: `w-[60px]` → `hover:w-[220px]`, Navy-Purple background
   - [ ] Main background: `bg-[hsl(var(--background))]` (#F3F2F7)
   - [ ] Panels: White cards với Lavender borders

5. **✅ Components - Lumina Pro Styling**
   - [ ] Ant Design components có Lumina Pro overrides
   - [ ] Primary buttons: Purple (#535297) background
   - [ ] Cards: White (#FFFFFF) với Lavender border (#C5C0E6)
   - [ ] Pins/Badges: Soft Purple (#A6A0ED) với pulse animation
   - [ ] Tags: Purple variants với appropriate contrast

6. **✅ Interaction States**
   - [ ] Hover: Lavender border → Medium Purple (#7C78C1)
   - [ ] Active: Primary Purple (#535297) background, white text
   - [ ] Highlight: Soft Purple (#A6A0ED) tint
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
  className="bg-primary text-white hover:opacity-90 px-4 py-2"
>
  Submit
</Button>
```

## Reference Files

- **[Design System Specification](./references/design-system-spec.md)**: Toàn bộ design system chi tiết (colors, typography, layout, components)

## Best Practices - Lumina Pro Theme

1. **Design tokens first**: Luôn dùng `hsl(var(--token))` thay vì HEX colors
2. **Component reusability**: Tạo base components với Lumina Pro styling
3. **Type safety**: Sử dụng TypeScript interfaces/types cho props
4. **Consistency**: Purple palette (#2A2F6F → #535297 → #A6A0ED) xuyên suốt
5. **Accessibility**: Navy-Purple text (#2A2F6F) đảm bảo contrast ratio WCAG AA
6. **Performance**: Memoize components nặng với `React.memo`
7. **Visual hierarchy**: White cards (#FFFFFF) trên Lavender background (#F3F2F7)

## Common Mistakes - Lumina Pro Theme

| Lỗi | Ví dụ SAI | Cách fix ĐÚNG |
|-----|-----------|---------------|
| Hard-coded colors | `bg-[#535297]` | `bg-[hsl(var(--primary))]` |
| Wrong background | `bg-gray-100` | `bg-[hsl(var(--background))]` (#F3F2F7) |
| Wrong text color | `text-gray-800` | `text-[hsl(var(--foreground))]` (#2A2F6F) |
| Wrong borders | `border-gray-300` | `border-[hsl(var(--border))]` (#C5C0E6) |
| Wrong hover | `hover:bg-blue-500` | `hover:border-[hsl(var(--secondary))]` |
| Missing purple tint | Generic grays | Use Lumina lavender tones (#D2CAFF) |
| Wrong spacing | Random px values | Dùng gap-2/3/4, p-3/4/5/6 |
| No transition | Instant changes | `transition-all duration-300 ease-in-out` |

## Output Format

Sau khi hoàn thành, cung cấp:

1. **Summary**: Component được tạo/fix
2. **Files changed**: Danh sách files
3. **Compliance report**: Checklist đã pass
4. **Screenshots/Preview**: Nếu có (optional)
5. **Next steps**: Suggestions cho improvements

---

**Lưu ý quan trọng**: Skill này không tự động format code. Chạy `npm run lint` hoặc `npm run format` sau khi tạo/sửa components.
