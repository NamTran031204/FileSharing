# Media Review Platform — Design System

## 1. Tổng quan

Platform review media (video & ấn phẩm design) với giao diện chuyên nghiệp, hỗ trợ feedback trực tiếp trên media thông qua pin annotation và comment thread.

**Tech stack**: React 18 + Tailwind CSS v3 + Ant Design 5 + TypeScript

---

## 2. Bảng màu (Color Palette)

| Token              | HSL                  | HEX       | Sử dụng                          |
|---------------------|----------------------|-----------|-----------------------------------|
| `--primary-dark`    | 237 45% 30%          | #2A2F6F   | Header, sidebar, nền tối          |
| `--primary`         | 240 30% 46%          | #535297   | Buttons, active states, links     |
| `--secondary`       | 244 30% 61%          | #7C78C1   | Hover, borders, secondary actions |
| `--accent`          | 246 72% 78%          | #A6A0ED   | Highlights, badges, pin markers   |
| `--muted`           | 252 100% 90%         | #D2CAFF   | Backgrounds nhẹ, surfaces         |
| `--background`      | 240 10% 96%          | #F3F2F7   | Nền chính của app                 |
| `--foreground`      | 235 45% 30%          | #2A2F6F   | Text chính                        |
| `--card`            | 0 0% 100%            | #FFFFFF   | Card backgrounds                  |
| `--border`          | 244 30% 80%          | #C5C0E6   | Borders, dividers                 |
| `--destructive`     | 0 84.2% 60.2%        | #EF4444   | Xoá, lỗi                         |

### Nguyên tắc sử dụng màu
- **KHÔNG** dùng mã màu trực tiếp trong component. Luôn dùng semantic token qua Tailwind classes.
- Ví dụ: `bg-primary-dark` thay vì `bg-[#2A2F6F]`
- Tất cả màu định nghĩa trong `src/index.css` dưới dạng HSL.

---

## 3. Typography

| Element         | Font                  | Size     | Weight   | Color              |
|-----------------|-----------------------|----------|----------|--------------------|
| Heading 1       | System (Ant Design)   | 24px     | 700      | foreground         |
| Heading 2       | System                | 20px     | 600      | foreground         |
| Heading 3       | System                | 14px     | 600      | foreground         |
| Body            | System                | 14px     | 400      | foreground         |
| Caption         | System                | 12px     | 400      | muted-foreground   |
| Small/Tag       | System                | 10px     | 500      | muted-foreground   |

> Sử dụng font stack mặc định của Ant Design để đảm bảo consistency.

---

## 4. Spacing & Sizing

| Token        | Value | Sử dụng                                |
|--------------|-------|----------------------------------------|
| `gap-1`      | 4px   | Khoảng cách giữa icons, Inline spacing |
| `gap-1.5`    | 6px   | Buttons cạnh nhau                      |
| `gap-2`      | 8px   | Elements trong group, Tight spacing    |
| `gap-3`      | 12px  | Sections cạnh nhau, Component internal |
| `gap-4`      | 16px  | Section gaps                           |
| `gap-6`      | 24px  | Page padding                           |
| `p-3`        | 12px  | Padding panel                          |
| `p-5`        | 20px  | Large card padding                     |
| `p-4`        | 16px  | Padding control bar                    |
| `p-6`        | 24px  | Padding header                         |
| `rounded-lg` | 8px   | Card, panel                            |

•	Border radius: 0.75rem (lg), 0.5rem (md), 0.25rem (sm)
•	Shadow: hover:shadow-md cho cards
•	Border: 1px solid hsl(var(--border)) — màu lightest #D2CAFF

---

## 5. Layout Grid
### Cấu trúc tổng thể
```
┌─────────────────────────────────────────────────┐
│  HEADER (h-[10vh])                              │
│  bg-primary-dark                                │
│  Breadcrumb navigation                          │
├──────┬──────────────────────┬───────────────────┤
│      │                                          │
│ SIDE │  Content Layout                          │
│ BAR  │                                          │
│      │                                          ┤
│ 60px │                                          │
│  ↔   │                                          │
│ 220px│                                          │
└──────┴──────────────────────-───────────────────┘
```

### Cấu trúc Màn hình review

```
┌─────────────────────────────────────────────────┐
│  HEADER (h-[10vh])                              │
│  bg-primary-dark                                │
│  Breadcrumb navigation                          │
├──────┬──────────────────────┬───────────────────┤
│      │                      │  TOOL PANEL       │
│ SIDE │  MEDIA PLAYER        │  w-[340px]        │
│ BAR  │  flex-1              │  bg-card          │
│      │  bg-black            ├───────────────────┤
│ 60px │                      │  FEEDBACK PANEL   │
│  ↔   │                      │  flex-1           │
│ 220px│                      │  bg-card          │
└──────┴──────────────────────┴───────────────────┘
```

### Chi tiết từng section

#### Header (`AppHeader`)
- Chiều cao: `h-[10vh]` (~10% viewport)
- Background: `bg-primary-dark`
- Padding: `px-6`
- Chứa: Ant Design `<Breadcrumb>` với custom styling

#### Sidebar (`AppSidebar`)
- Chiều cao: `h-[90vh]` (phần còn lại)
- Width mặc định: `60px` (collapsed)
- Width khi hover: `220px` (expanded)
- Transition: `duration-300 ease-in-out`
- Background: `bg-primary-dark`
- Component: Ant Design `<Menu>` với `inlineCollapsed`
- Các mục:
  - 🏠 Trang chủ
  - 📁 Projects
  - 👥 Team
  - 🔔 Thông báo
  - ⚙️ Cài đặt
  - Bên trong mục Projects có 3 option: Video, Design, Ảnh

#### Media Player (`MediaPlayer`)
- Chiếm toàn bộ chiều rộng còn lại (`flex-1`)
- Video area: `bg-black`, center content, hỗ trợ mọi tỉ lệ
- Controls bar: `bg-primary-dark`, chứa play/pause, slider, volume, pin mode, fullscreen
- Pin markers: `bg-accent`, `rounded-full`, animated pulse, positioned absolute theo %

#### Tool Panel (`ToolPanel`)
- Width cố định: `w-[340px]`
- Background: `bg-card`
- Border: `border-border`
- Các tool buttons:
  - Rectangle (`BorderOutlined`)
  - Circle (`RadiusSettingOutlined`)
  - Arrow (`ArrowRightOutlined`)
  - Text (`FontSizeOutlined`)
  - Paint/Freehand (`HighlightOutlined`)
  - Color picker (`BgColorsOutlined`)
- Actions: Undo, Redo, Clear all
- Active tool highlight: `bg-primary text-primary-foreground`

#### Feedback Panel (`FeedbackPanel`)
- Chiếm phần còn lại bên phải (`flex-1`)
- Header: Count comments
- Body: Scrollable comment thread
- Comment structure:
  - Avatar + Author + Timestamp + Pin tag (optional)
  - Content text
  - Reply button → inline reply input
  - Nested replies (indented `ml-8`)
- Footer: Input + Send button

---

## 6. Component Specifications

### Buttons
| Variant     | Background        | Text               | Border           | Hover              |
|-------------|-------------------|--------------------|--------------------|---------------------|
| Primary     | `bg-primary`      | `text-primary-fg`  | none               | `opacity-90`        |
| Default     | `bg-card`         | `text-foreground`  | `border-border`    | `border-secondary`  |
| Text/Ghost  | transparent       | `text-muted-fg`    | none               | `text-primary`      |
| Active Tool | `bg-primary`      | `text-white`       | `border-primary`   | —                   |
| Destructive | transparent       | `text-destructive` | none               | `opacity-80`        |

### Cards/Panels
- Background: `bg-card`
- Border: `border border-border`
- Border radius: `rounded-lg`
- Padding: `p-3`

### Pin Markers
- Size: `w-6 h-6`
- Background: `bg-accent`
- Border: `border-2 border-white`
- Shape: `rounded-full`
- Animation: `animate-pulse`
- Icon: `PushpinOutlined` (white)

### Comment Items
- Avatar: Ant Design `<Avatar>` size small, `bg-primary`
- Author: `text-xs font-semibold text-foreground`
- Timestamp: `text-[10px] text-muted-foreground`
- Content: `text-xs text-foreground/80`
- Pin tag: Ant Design `<Tag color="purple">`

---

## 7. Ant Design Configuration

### Overrides via Tailwind
Ant Design components được style override bằng Tailwind arbitrary selectors:

```tsx
// Ví dụ override Menu
className="[&_.ant-menu-item]:text-muted [&_.ant-menu-item-selected]:bg-primary"
```

### Components sử dụng
| Component     | Ant Design         | Vị trí            |
|---------------|--------------------|--------------------|
| Breadcrumb    | `<Breadcrumb>`     | Header             |
| Menu          | `<Menu>`           | Sidebar            |
| Button        | `<Button>`         | ToolPanel, Controls|
| Tooltip       | `<Tooltip>`        | Tools, Pins        |
| Input         | `<Input>`          | FeedbackPanel      |
| Slider        | `<Slider>`         | MediaPlayer        |
| Avatar        | `<Avatar>`         | Comments           |
| Tag           | `<Tag>`            | Pin indicators     |
| Divider       | `<Divider>`        | ToolPanel          |
| List          | `<List>`           | FeedbackPanel      |

---

## 10. Interaction States

| State          | Visual                                          |
|----------------|--------------------------------------------------|
| Hover (button) | Border chuyển sang `secondary`, text → `primary` |
| Active tool    | `bg-primary`, `text-white`                       |
| Pin mode ON    | Pin button icon chuyển sang `text-accent`        |
| Comment reply  | Inline input xuất hiện dưới comment (`ml-8`)     |
| Sidebar hover  | Mở rộng từ 60px → 220px, smooth transition      |
| Pin marker     | Pulse animation, tooltip hiển thị label          |

---

