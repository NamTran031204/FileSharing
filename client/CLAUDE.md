# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Vite dev server (port 5173)
npm run build        # tsc -b && vite build
npm run lint         # ESLint check
npm run gen-api      # Regenerate API client from Swagger (server must be running at :5000)
npm run preview      # Preview production build
```

## Design System: Lumina Pro

**Color palette** — always use these CSS custom properties, never hardcode hex values:

| Token | Value | Role |
|---|---|---|
| `--color-background` | `hsl(240 10% 96%)` | Main canvas background |
| `--color-card` | `hsl(0 0% 100%)` | Sidebar panels, cards |
| `--color-foreground` | `hsl(237 45% 30%)` | Deep navy-purple, primary text |
| `--color-primary-dark` | `hsl(237 45% 30%)` | Same as foreground |
| `--color-primary` | `hsl(240 30% 46%)` | CTAs, active states |
| `--color-secondary` | `hsl(244 30% 61%)` | Hover, secondary actions |
| `--color-accent` | `hsl(246 72% 78%)` | Badges, highlights |
| `--color-muted` | `hsl(252 100% 90%)` | Less critical UI elements |
| `--color-border` | `hsl(244 30% 80%)` | Borders, dividers |
| `--color-destructive` | `hsl(0 84.2% 60.2%)` | Errors, destructive actions |
| `--color-primary-foreground` | `hsl(0 0% 100%)` | Text on primary backgrounds |
| `--color-muted-foreground` | `hsl(244 10% 40%)` | Muted/secondary text |

Utility class: `.canvas-shadow` — deep navy drop shadow for elevated surfaces.

All tokens are declared in `src/index.css` via `@theme`. Tailwind v4 picks them up as utilities automatically (e.g. `bg-[var(--color-primary)]`).

**Component library**: Ant Design 6 (`antd`) + `@ant-design/icons`. Tailwind handles layout and spacing; Ant Design handles interactive controls (Button, Modal, Select, Input, Table, etc.). No custom Ant Design theme config — default tokens, with visual customization via Tailwind.

## Architecture

### App Shell & Layout

```
CommonLayout
├── AppHeader  (fixed, h-16, blur backdrop, logo + breadcrumbs + notifications + avatar)
├── AppSidebar (left nav: Home, Projects, Settings, Help + "New Project" button)
└── <page content>
```

Active layout components live in `src/layout/`:
- `CommonLayout.tsx` — standard shell (header + sidebar + content area)
- `MainLayout.tsx` — alternative wrapper

### Routing (`src/utils/RouterConfigUtil.tsx` + `src/App.tsx`)

Routes are declared as a `ROUTER_CONFIG` array and flattened to a flat list. Only these routes are active/non-legacy:

| Path | Component | Notes |
|---|---|---|
| `/home` | `MainPage` | Welcome + quick actions |
| `/projects` | `ProjectMain` | Project listing & management |
| `/projects/:projectId` | `FolderAsset2` | **Primary asset browser** |
| `/review/image-v2` | `ImageReviewV2` | Canvas image review tool |
| `/loginv2` | `LoginPageV2` | Active login page |

Routes under `/mockup/*`, `/login` (non-v2), `/register`, and paths importing from `phase1/` folders are legacy — do not extend them.

### State Management (MobX)

Single `rootStore` initialized in `main.tsx`, accessed via `useStore()` hook.

**`sessionStore`** is the only store — it holds:
- Auth state: `isLogined`, `user`
- Project context: `currentProject`, `currentProjectId`, `currentProjectName`
- Folder context: `currentFolder`, `currentFolderId`, `currentFolderName`, `currentFolderPath`
- Permissions: `permissionGranted`
- `setSession()`, `setCurrentProject()`, `setCurrentFolder()`, `clearSession()`

### API Layer (`src/api/`)

- `src/api/api/` — **Auto-generated** from OpenAPI spec via `npm run gen-api`. Never hand-edit.
- `src/api/baseApi.ts` — HTTP client using `fetch`. Injects JWT from localStorage; dispatches `auth:unauthorized` event on 401.
- `src/api/apiClient.ts` — Axios instance (declared but `baseApi` uses `fetch`; Axios is used in upload services).
- Hand-written resource wrappers: `authApiResource.ts`, `fileApiResource.ts`, `userFileApiResource.ts`, `userApiResource.ts` — add custom logic (multipart, chunking) on top of generated services.

API base URL: `http://localhost:5000/api`

### Key Pages (non-legacy)

**`FolderAsset2`** (`src/page/FolderAsset2.tsx`) — Main asset browser at `/projects/:projectId`:
- Left: collapsible `FolderTreePanel`
- Main: breadcrumb + action bar + folder/asset card grid
- Right: asset details sidebar
- Handles file and folder upload (drag-drop)

**`ProjectMain`** (`src/page/ProjectMain.tsx`) — Project listing with search, filter, sort, pagination (24/page).

**`ImageReviewV2`** (`src/page/ImageReviewV2.tsx`) — Konva canvas for image review with annotation and feedback tools.

### Services (`src/service/`)

- `uploadService.ts` — Chunked/multipart upload with adaptive bandwidth (uses `spark-md5` for MD5, `uuid` for chunk IDs).
- `folderUploadService.ts` — Two-phase folder upload: (1) `POST /api/folder/create-tree` to build folder tree; (2) upload each file sequentially with progress tracking via File System Access API.
- `downloadService.ts` — File download with progress.

### Notable Dependencies

- `konva` + `react-konva` — Canvas-based image review drawing
- `hls.js` + `react-player` — HLS video streaming playback
- `react-colorful` — Color picker in review tools
- `spark-md5` — MD5 hashing for file deduplication
- `react-oauth/google` — Google OAuth login

## Constraints & Conventions

- **`src/api/api/`** is generated code — run `npm run gen-api` (server must be running) to update it after backend changes.
- **Tailwind v4**: uses `@theme` in `index.css` instead of `tailwind.config.js`. No separate config file.
- **`vite.config.ts`** has a hardcoded Windows path (`E:/DaiCuongBK/...`) for the HLS video temp directory — update if working on a different machine.
- **No test suite** configured on either frontend or backend.
- **`axios`** is declared as a dependency but the core `baseApi.ts` uses `fetch`. Axios is used directly in upload/download services for progress events.
- Folders named `phase1/`, `v1/`, or `mockup/` contain legacy/prototype code — do not reference or extend them.
