---
name: html-to-react-refactor
description: |
  Convert static HTML pages to professional React components using the project's tech stack. 
  Use this skill when you need to refactor HTML (CSS3, Tailwind, Google Fonts/Icons) into React components with Ant Design integration.
  
  The skill handles two HTML structures:
  1. Full web pages with header/nav/main sections → automatically use AppHeader + AppSidebar from src/components/core/layout
  2. Partial components → convert to React component with proper layout wrapper
  
  The skill will automatically:
  - PRIORITIZE core components from src/components/core/ and utils from src/utils/ before creating new ones
  - Extract reusable components to src/components (never references V1 folder)
  - Convert simple HTML elements to Ant Design components when appropriate
  - Preserve Tailwind styling while integrating with antd theme
  - Generate TypeScript interfaces for component props
  - Define variable names and TODO comments for logic/API implementation (user completes)
  - Output final page component to #file:page
---

# HTML-to-React Refactoring Skill

This skill transforms static HTML pages and components into well-structured React components that leverage your project's tech stack: React, TypeScript, Tailwind CSS, and Ant Design.

## When to Use

- Converting static HTML mockups to React
- Refactoring plain HTML forms to React forms with Ant Design
- Creating new page components from design files
- Migrating HTML components to align with project standards

## Tech Stack Integration

- **React**: Functional components with TypeScript
- **Tailwind CSS**: Preserved from HTML, optimized for React
- **Ant Design (v5+)**: For buttons, inputs, forms, modals, tables, etc.
- **Antd Icons**: For Material Symbols and icon replacements
- **Core Components**: Always prefer `src/components/core/` before creating custom ones
- **Shared Utils**: Always use `src/utils/` helpers — never reimplement existing utilities

## Input Requirements

**File format**: HTML file with HTML5 structure

**Expected structure**:
```html
<!-- Full page: auto-detect and use shared components -->
<body>
  <header>...</header>
  <nav>...</nav>
  <main>...</main>
</body>

<!-- Or partial component: any HTML structure -->
<div class="container">...</div>
```

## Core Components Catalog (`src/components/core/`)

**ALWAYS check and use these before building anything from scratch:**

### Layout
| Component | Import | When to use |
|---|---|---|
| `AppHeader` | `@/components/core/layout/AppHeader` | Fixed top nav on every full page |
| `AppSidebar` | `@/components/core/layout/AppSidebar` | Left sidebar nav on every full page |

Full page shell pattern:
```tsx
import CommonLayout from '@/layout/CommonLayout';
// CommonLayout already composes AppHeader + AppSidebar — use it for full pages
```

### Common UI
| Component | Import | When to use |
|---|---|---|
| `ActionDropdown` | `@/components/core/common/ActionDropdown` | Any "⋯" action menu on cards/rows. Supports permission check via `canAccess` prop and `ActionDropdownItem[]` config |
| `BusyOverlay` | `@/components/core/common/BusyOverlay` | Global loading spinner — add once in root, control via `uiUtils.setBusy()` / `clearBusy()` |
| `RequiredPermission` | `@/components/core/common/RequiredPermission` | Wrap any UI that should only render for users with a given permission |

### Forms
| Component | Import | When to use |
|---|---|---|
| `CusCommonSelect` | `@/components/core/forms/CusCommonSelect` | Any `<select>` with async datasource, search, or Vietnamese text support |
| `CusCommonDateRangeInput` | `@/components/core/forms/CusCommonDateRangeInput` | Date range pickers with preset options (Today, Yesterday, Last 7 days, etc.) |
| `FloatLabel` | `@/components/core/forms/FloatLabel` | Wrap any input to get a floating label UX |

### CRUD / Page Layout
| Component | Import | When to use |
|---|---|---|
| `FolderAssetCommonCrudPage` | `@/components/core/crud/FolderAssetCommonCrudPage` | Full page with sidebar tree + toolbar + folder/asset grid. Use for any folder-asset browser page |
| `FolderAssetBody` | `@/components/core/crud/FolderAssetBody` | Just the breadcrumb + folder grid + asset grid body (no page shell) |
| `TopActions` | `@/components/core/crud/TopActions` | Toolbar action buttons (with permission filtering). Pass `TopActionConfig[]` |

### Grid
| Component | Import | When to use |
|---|---|---|
| `SmartRow` | `@/components/core/grid/SmartRow` | Responsive `Row` that auto-handles margin/gap per breakpoint |
| `ColSpanResponsive` | `@/components/core/grid/ColSpanResponsive` | `Col` that adapts span per screen size |

## Utils Catalog (`src/utils/`)

**ALWAYS use these — never reimplement:**

| Util | Import | Key exports |
|---|---|---|
| `uiUtils` | `@/utils/uiUtils` (default) | `showSuccess(msg)`, `showError(msg)`, `showWarning(msg)`, `showInfor(msg)`, `showConfirm(props)`, `setBusy()`, `clearBusy()` |
| `permissionUtils` | `@/utils/permissionUtils` | `hasPermission()`, `canEdit()`, `canDelete()`, `canShare()`, `canAddUser()`, `isOwner()` |
| `auth.utils` | `@/utils/auth.utils` | `checkPermissionUser(session, permissionName)` |
| `date.util` | `@/utils/date.util` | `getDateRange(preset)`, `disableAfter()`, `disableBefore()`, etc. |
| `text.util` | `@/utils/text.util` | `toLowerCaseNonAccentVietnamese(str)` |
| `FileViewUtil` | `@/utils/FileViewUtil` | File type / view utilities |

## Refactoring Process

### Step 1: Analyze HTML Structure
- Detect whether input is a full page (header/nav/main) or a partial component
- Identify layout type, nested elements, and styling patterns
- Check for existing component patterns (cards, lists, forms, action menus)
- Read `src/index.css` and identify available theme tokens/colors before mapping visual styles

### Step 2: Plan Component Architecture
- **Full page**: Use `CommonLayout` (which wraps AppHeader + AppSidebar). For folder/asset pages, use `FolderAssetCommonCrudPage`
- **Partial component**: Wrap in layout container, identify reusable patterns
- **Before creating anything**: cross-check the Core Components Catalog and Utils Catalog above

### Step 3: Convert to React — Core-First Rule
Map HTML patterns to core components in this priority order:
1. Core component exists → use it (correct import path)
2. Ant Design component exists → use it
3. Custom Tailwind component → only as last resort

Specific mappings:
- Action menus ("⋯", kebab menus) → `ActionDropdown` with `ActionDropdownItem[]`
- Toast/notifications → `uiUtils.showSuccess/Error/Warning/Infor()`
- Confirm dialogs → `uiUtils.showConfirm({ title, content, okLabel })`
- Loading overlays → `uiUtils.setBusy()` / `clearBusy()`
- Permission-gated UI → wrap with `<RequiredPermission permissionName="...">`
- Selects with search → `CusCommonSelect` with `datasource` prop
- Date range pickers → `CusCommonDateRangeInput`
- Toolbar buttons with permissions → `TopActions` with `TopActionConfig[]`

Also:
- Align color-related Tailwind classes with tokens in `src/index.css` (`bg-primary`, `text-foreground`, `border-border`) — no hardcoded hex/hsl
- Generate TypeScript interfaces for all component props

### Step 4: Extract Reusable Components
- Identify repeating patterns (cards, list items, form fields, etc.)
- Create separate component files in `src/components/`
- **NEVER** import or reference from `src/components/V1` (legacy)

### Step 5: Output Structure
- **Main page component**: `src/page/<PageName>.tsx`
- **Sub-components**: `src/components/<ComponentName>.tsx`
- **Styling**: Tailwind classes + design tokens from `src/index.css`
- **Types**: Full TypeScript with Props interfaces

## Component Mapping Guide

| HTML Pattern | React Component | Import |
|---|---|---|
| `<button>` | `<Button>` (antd) | `antd` |
| `<input type="text">` | `<Input>` (antd) | `antd` |
| `<input type="checkbox">` | `<Checkbox>` (antd) | `antd` |
| `<select>` (with data/search) | `CusCommonSelect` | `@/components/core/forms/CusCommonSelect` |
| `<select>` (simple static) | `<Select>` (antd) | `antd` |
| `<textarea>` | `<Input.TextArea>` (antd) | `antd` |
| `<form>` | `<Form>` (antd) | `antd` |
| Date range inputs | `CusCommonDateRangeInput` | `@/components/core/forms/CusCommonDateRangeInput` |
| "⋯" / kebab menu | `ActionDropdown` | `@/components/core/common/ActionDropdown` |
| Loading spinner | `BusyOverlay` + `uiUtils.setBusy()` | `@/components/core/common/BusyOverlay` |
| Toast / snackbar | `uiUtils.showSuccess/Error()` | `@/utils/uiUtils` |
| Confirm dialog | `uiUtils.showConfirm()` | `@/utils/uiUtils` |
| Permission-gated block | `RequiredPermission` | `@/components/core/common/RequiredPermission` |
| Navigation | `useNavigate` / `Link` | `react-router-dom` |
| Icons (SVG/Material) | Antd Icon components | `@ant-design/icons` |

## Output Format

### Full Page Component
```typescript
import CommonLayout from '@/layout/CommonLayout';
import AppHeader from '@/components/core/layout/AppHeader';
import AppSidebar from '@/components/core/layout/AppSidebar';
import ActionDropdown, { type ActionDropdownItem } from '@/components/core/common/ActionDropdown';
import RequiredPermission from '@/components/core/common/RequiredPermission';
import TopActions, { type TopActionConfig } from '@/components/core/crud/TopActions';
import uiUtils from '@/utils/uiUtils';

const PageName: React.FC = () => {
  // TODO: Implement data fetching
  
  const topActions: TopActionConfig[] = [
    { title: 'Thêm mới', type: 'primary', icon: <PlusOutlined />, onClick: () => {} },
  ];

  return (
    <CommonLayout>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex h-[72px] items-center justify-between px-8 border-b border-border bg-card">
          {/* toolbar slot */}
          <TopActions topActions={topActions} />
        </div>
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {/* page content */}
        </div>
      </div>
    </CommonLayout>
  );
};

export default PageName;
```

### Folder/Asset Page (use the ready-made layout)
```typescript
import FolderAssetCommonCrudPage from '@/components/core/crud/FolderAssetCommonCrudPage';

const MyFolderPage: React.FC = () => (
  <FolderAssetCommonCrudPage
    pageTitle="My Files"
    folderTreeSlot={<FolderTreePanel />}
    toolbarSlot={<SearchInput />}
    topActions={[{ title: 'Upload', type: 'primary', onClick: () => {} }]}
    folders={folders}
    assets={assets}
    mapFolderToCard={(f) => ({ name: f.name, itemCount: f.childCount })}
    mapAssetToCard={(a) => ({ name: a.name, sizeLabel: a.size, versionLabel: a.version, type: a.type })}
  />
);
```

### Action Menu on Cards
```typescript
import ActionDropdown, { type ActionDropdownItem } from '@/components/core/common/ActionDropdown';

const actions: ActionDropdownItem<MyRecord>[] = [
  { title: 'edit', onClick: (r) => handleEdit(r) },
  { title: 'remove', isDanger: true, onClick: (r) => handleDelete(r) },
];

<ActionDropdown actions={actions} record={item} />
```

### Notifications & Confirm
```typescript
import uiUtils from '@/utils/uiUtils';

// Toast
uiUtils.showSuccess('Lưu thành công');
uiUtils.showError('Đã có lỗi xảy ra');

// Confirm dialog
const ok = await uiUtils.showConfirm({
  title: 'Xác nhận xoá',
  content: 'Bạn có chắc muốn xoá?',
  okLabel: 'Xoá',
});
if (ok) { /* proceed */ }
```

## Logic & API Integration

⚠️ Components generated by this skill do NOT include business logic or API calls.

**Skill responsibility**: define state structure, placeholder hooks, TypeScript types, TODO comments.  
**User responsibility**: implement API calls, data fetching, error handling in the TODO sections.

## Important Constraints

- ✅ **DO**: Check Core Components Catalog first — if a core component fits, use it
- ✅ **DO**: Use `uiUtils` for toasts, confirm dialogs, and busy state
- ✅ **DO**: Use `RequiredPermission` wrapper for permission-gated UI
- ✅ **DO**: Use `ActionDropdown` for action menus — don't hand-roll Dropdown + Menu
- ✅ **DO**: Align colors with Tailwind tokens from `src/index.css`
- ✅ **DO**: Use TypeScript with Props interfaces
- ❌ **DON'T**: Implement business logic or API calls in components
- ❌ **DON'T**: Import from `src/components/V1` (legacy folder)
- ❌ **DON'T**: Re-implement toast/confirm/loading logic — use `uiUtils`
- ❌ **DON'T**: Hardcode colors (`#hex`, `hsl(...)`) — use design tokens

## File Locations

- **Output page**: `src/page/<PageName>.tsx`
- **Extracted components**: `src/components/<ComponentName>.tsx`
- **Core components** (use, don't copy): `src/components/core/`
- **Utilities** (use, don't rewrite): `src/utils/`
- **Do NOT use**: `src/components/V1/`
