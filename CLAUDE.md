# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend (client/)

```bash
cd client
npm run dev          # Start Vite dev server
npm run build        # tsc -b && vite build
npm run lint         # ESLint check
npm run gen-api      # Regenerate API client from Swagger (node src/gen-api.cjs)
npm run preview      # Preview production build
```

### Backend (server/)

```bash
cd server
mvn clean install                  # Build all modules
mvn clean install -pl filesharing-filehandler   # Build single module
mvn spring-boot:run -pl filesharing-filehandler # Run main API service
```

### Local Infrastructure

```bash
cd server/dockers
docker compose up -d               # Start MongoDB, MinIO, Kafka, ZooKeeper, Kafka UI
docker compose down                # Stop all services
```

Required env vars for docker-compose: `MONGO_USER`, `MONGO_PASSWORD`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`.

Infrastructure ports: MongoDB `27017`, MinIO API `9000`, MinIO Console `9001`, Kafka `9092`, Kafka UI `8080`.

The main API service runs on **port 5000**. Swagger UI: `http://localhost:5000/swagger-ui.html`.

## Architecture

### Repository Layout

```
FileSharing/
├── client/          # React 19 + TypeScript + Vite frontend
├── server/          # Multi-module Spring Boot Maven project
│   ├── filesharing-filehandler/      # Main API service (port 5000) — start here
│   ├── filesharing-notification/     # Kafka-driven email service
│   ├── filesharing-videocodec/       # FFmpeg HLS encoding worker
│   ├── filesharing-imagecodec/       # Image thumbnail/sprite worker
│   └── filesharing-imagerawproccess/ # Raw image processing worker
│   └── dockers/                      # Docker Compose for local dev infra
└── docs/            # Product requirements, DB schema, permission matrix, use-cases
```

Worker services (`videocodec`, `imagecodec`, `imagerawproccess`) are Kafka consumers — they receive jobs from `filehandler` and write results back to MinIO/MongoDB via separate Kafka result topics.

### Backend (Java 21, Spring Boot 3.5.6)

**Key packages in `filesharing-filehandler`:**
- `controllers/` — REST endpoints (15 controllers, each mapping to a domain)
- `services/impl/` — Business logic implementations
- `entities/models/` — MongoDB documents (FolderEntity, AssetEntity, ProjectEntity, etc.)
- `entities/dtos/` — Request/response DTOs organized by domain
- `repositories/` — Spring Data MongoDB repositories
- `utils/ProjectPermissionResolver` — Centralized RBAC permission evaluation
- `enums/permission/GrantedProjectPermission` — Permission enum used throughout

**Persistence**: MongoDB only (no relational DB). Collection names match entity class names by default.

**Auth**: JWT (24h access token, 7d refresh token) + Spring Security. Google OAuth via `/api/auth/google`.

**Async processing**: `filehandler` publishes Kafka events; worker services consume them. Topics: `video_encode_topic`, `image_process_topic`, `notification_email_sender`.

**File storage**: MinIO (S3-compatible). Files are stored as objects; `objectName` (UUID-based) is the key linking `MetadataEntity` to MinIO.

**Permission model**: Per-project roles (`GrantedProjectPermission`: READ, COMMENT, CREATE_FOLDER_ASSET, ADD_USER, DELETE, OWNER). Folder-level overrides via `FolderEntity.permissions[]`. Resolved through `ProjectPermissionResolver.resolveEffectiveFolderPermissions()`.

### Frontend (React 19, TypeScript 5.9)

**Tech stack**: Vite 7, Tailwind CSS v4, Ant Design 6, MobX 6, React Router 7, Axios.

**State management**: MobX with a single `rootStore` (in `src/store/`). Access via `useStore()` hook. `sessionStore` holds auth session, current project/folder context, and permission map.

**API layer** (`src/api/`):
- `src/api/api/` — Auto-generated service classes from Swagger (`npm run gen-api`). Do **not** hand-edit these files.
- `src/api/baseApi.ts` — Base class with `tokenManager` (handles JWT + refresh)
- `src/api/apiClient.ts` — Axios instance configuration
- Hand-written resources (e.g. `authApiResource.ts`, `fileApiResource.ts`) wrap generated services for custom logic like multipart upload.

**Services** (`src/service/`): `uploadService.ts` handles chunked/multipart upload with adaptive bandwidth. `folderUploadService.ts` orchestrates the multi-step folder upload flow (create tree → upload files sequentially).

**Routing**: Flat route config in `App.tsx` using a `ROUTER_CONFIG` array; route paths are resolved by a flattening utility. Protected routes use `ProtectedRoute`.

**Design system**: "Lumina Pro" — deep navy-purple palette defined as CSS custom properties in `src/index.css`. Always use these tokens (e.g. `var(--color-primary)`) instead of hardcoded hex values. Ant Design theme is customized to match.

### Folder Upload Flow (two-phase)

1. **Phase 1** — Client calls `POST /api/folder/create-tree` with a tree of `FolderTreeNodeDTO` nodes. Server creates all folders atomically and returns `folderMappings[]` (relativePath → folderId).
2. **Phase 2** — Client uploads each file sequentially: `POST /api/asset/create-new` → `uploadService.uploadFile()` → `POST /api/asset/version/create-new`. Progress is tracked via a trace file written to the user's local folder (File System Access API / `showDirectoryPicker()`).

See `client/docs/upload-folder-plan.md` for full spec including cancel/rollback and resume logic.

### Key Design Decisions

- **No test suite**: Neither frontend nor backend has a testing framework configured.
- **API code generation**: The `src/api/api/` directory is entirely generated. Run `npm run gen-api` after any backend controller change — the server must be running to generate.
- **`vite.config.ts` has a hardcoded path** (`E:/DaiCuongBK/Project3/FileSharing/...`) for the HLS video temp directory — update if working on a different machine.
- **MongoDB document IDs**: Domain entities use custom `@Id` fields (e.g. `folderId`, `assetId`, `projectId`) generated by server, not MongoDB's default `_id`.
- **`BaseAuditService<T>`**: All write service impls extend this base class which provides `buildAudit()` (set createdBy/updatedBy) and `applyUpdateAudit()`.
