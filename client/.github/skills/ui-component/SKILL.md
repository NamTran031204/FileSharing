---
name: ui-component
description: 'Tạo và kiểm tra React components tuân thủ design system. Sử dụng khi: tạo UI mới, review component, fix design inconsistency, đảm bảo màu sắc/spacing/typography đúng chuẩn. Hỗ trợ React 18, Tailwind CSS v3, Ant Design 5.'
argument-hint: 'Tên component hoặc file path cần tạo/kiểm tra'
---

# UI Component Design System Compliance

Skill này giúp tạo và kiểm tra React components tuân thủ hoàn toàn design system của dự án (Media Review Platform).

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

**Bảng màu design tokens** (xem chi tiết trong [design-system-spec](./references/design-system-spec.md)):

| Token | Sử dụng |
|-------|---------|
| `bg-primary-dark` | Header, sidebar, nền tối |
| `bg-primary` | Buttons, active states, links |
| `bg-secondary` | Hover, borders, secondary actions |
| `bg-accent` | Highlights, badges, pin markers |
| `bg-muted` | Backgrounds nhẹ, surfaces |
| `bg-background` | Nền chính của app |
| `bg-card` | Card backgrounds |
| `text-foreground` | Text chính |
| `text-muted-foreground` | Text secondary |
| `border-border` | Borders, dividers |
| `text-destructive` | Xoá, lỗi |

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

#### **Bước 5: Component Patterns**

**Button Component:**
```tsx
// Primary button
<Button 
  className="bg-primary text-white hover:opacity-90"
>
  Action
</Button>

// Default button
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

**Card/Panel Component:**
```tsx
<div className="bg-card border border-border rounded-lg p-3">
  {/* Content */}
</div>
```

**Pin Marker (annotation):**
```tsx
<div className="w-6 h-6 bg-accent border-2 border-white rounded-full animate-pulse flex items-center justify-center">
  <PushpinOutlined className="text-white text-xs" />
</div>
```

#### **Bước 6: Ant Design Integration**

Sử dụng Ant Design components với Tailwind overrides:

```tsx
import { Menu, Button, Breadcrumb, Avatar, Tag, Tooltip } from 'antd';

// Menu với custom styling
<Menu
  className="[&_.ant-menu-item]:text-muted [&_.ant-menu-item-selected]:bg-primary"
  items={menuItems}
/>

// Button với Tailwind
<Button className="bg-primary hover:opacity-90">
  Click me
</Button>

// Tag với color preset
<Tag color="purple">Pin #1</Tag>
```

#### **Bước 7: Interaction States**

```tsx
// Hover states
<button className="border border-border hover:border-secondary hover:text-primary transition-colors">

// Active tool state
<button className={cn(
  "border border-transparent",
  isActive && "bg-primary text-white border-primary"
)}>

// Pin mode active
<button className={cn(
  "text-muted-foreground",
  isPinMode && "text-accent"
)}>

// Sidebar hover expansion
<aside className="w-[60px] hover:w-[220px] transition-all duration-300 ease-in-out">
```

### 2. Kiểm tra Component Hiện Có

Khi review hoặc fix component:

#### **Checklist kiểm tra:**

1. **✅ Màu sắc - Colors**
   - [ ] KHÔNG có hard-coded colors (`#HEX` hoặc `bg-[#HEX]`)
   - [ ] Tất cả màu dùng design tokens (`bg-primary`, `text-foreground`, etc.)
   - [ ] Màu hover/active states đúng spec

2. **✅ Typography**
   - [ ] Font sizes đúng: `text-2xl` (H1), `text-xl` (H2), `text-sm` (H3/Body), `text-xs` (Caption)
   - [ ] Font weights đúng: `font-bold` (H1), `font-semibold` (H2/H3)
   - [ ] Text colors đúng token: `text-foreground`, `text-muted-foreground`

3. **✅ Spacing**
   - [ ] Padding đúng: `p-6` (header), `p-5` (large card), `p-3` (panel)
   - [ ] Gap đúng: `gap-4` (sections), `gap-3` (components), `gap-2` (tight)
   - [ ] Border radius đúng: `rounded-lg` (8px), `rounded-md` (6px)

4. **✅ Layout**
   - [ ] Header: `h-[10vh]`, `bg-primary-dark`, `px-6`
   - [ ] Sidebar: `w-[60px]` → `hover:w-[220px]`, transition smooth
   - [ ] Panels: đúng width specification (e.g., `w-[340px]` cho Tool Panel)

5. **✅ Components**
   - [ ] Ant Design components có Tailwind overrides khi cần
   - [ ] Buttons đúng variants (Primary, Default, Ghost, Destructive)
   - [ ] Cards có `bg-card border border-border rounded-lg`
   - [ ] Pins có `bg-accent`, `animate-pulse`, `rounded-full`

6. **✅ Interaction States**
   - [ ] Hover states: border → `secondary`, text → `primary`
   - [ ] Active states: `bg-primary`, `text-white`
   - [ ] Transitions: `transition-colors`, `duration-300 ease-in-out`

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

## Best Practices

1. **Design tokens first**: Luôn check design system spec trước khi code
2. **Component reusability**: Tạo base components có thể tái sử dụng
3. **Type safety**: Sử dụng TypeScript interfaces/types cho props
4. **Consistency**: Giữ naming conventions và patterns nhất quán
5. **Accessibility**: Thêm ARIA labels, keyboard navigation khi cần
6. **Performance**: Memoize components nặng với `React.memo`
7. **Documentation**: Comment các variants phức tạp hoặc edge cases

## Common Mistakes

| Lỗi | Cách fix |
|-----|----------|
| Hard-coded colors | Thay bằng design tokens |
| Wrong spacing values | Dùng gap-2/3/4, p-3/4/5/6 |
| Missing hover states | Thêm hover:* classes |
| Inline styles | Chuyển sang Tailwind classes |
| Wrong font sizes | Dùng text-xs/sm/xl/2xl |
| No transition | Thêm transition-colors/all |

## Output Format

Sau khi hoàn thành, cung cấp:

1. **Summary**: Component được tạo/fix
2. **Files changed**: Danh sách files
3. **Compliance report**: Checklist đã pass
4. **Screenshots/Preview**: Nếu có (optional)
5. **Next steps**: Suggestions cho improvements

---

**Lưu ý quan trọng**: Skill này không tự động format code. Chạy `npm run lint` hoặc `npm run format` sau khi tạo/sửa components.
