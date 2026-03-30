## Plan: Media Review Phase 2 Research

TL;DR: Plan a research sprint to define the Media Review platform scope (video/image review with annotations, timeline feedback, versioning) by clarifying user needs, mapping must-have features, evaluating tech stack extensions on top of the current file-sharing base (React/TS + Spring Boot + MinIO + Mongo), and producing concrete specs (PRD, APIs, data models, pipeline choices) before any implementation.

**Steps**
1. Stakeholder & persona discovery: interview target roles (media provider, reviewer/client, project manager) to capture goals, pain points, devices/platforms, and success metrics; confirm grading priorities for the capstone.
2. Market/benchmark study: review 3–4 analog products (Frame.io, Vimeo Review, Filestage, Figma comments) to extract must-have vs nice-to-have for phase 2; note standout flows (timecode comments, compare versions, share links, approvals).
3. Functional scope definition: draft user stories and acceptance criteria for upload/folder ingest, playback/streaming, time/region annotations, threaded comments, review workflow (approve/request changes), versioning/compare, sharing/notifications, search/filter, and offline/error states; label MVP vs stretch.
4. Media pipeline decisions: document ingest limits (formats, max size/duration), codec/rendition matrix, streaming approach (HLS/DASH vs presigned range) leveraging MinIO, thumbnail/sprite generation, and storage layout for originals vs renditions; outline when transcoding runs (ingest vs on-demand) and how to resume/monitor jobs.
5. UX research and IA: sketch player + timeline + comment side panel, image annotator, version switcher/compare, and sharing entry points; map role/permission actions (READ/COMMENT/MODIFY) to UI controls; plan responsive/mobile behaviors.
6. Data model & API design: propose entities (MediaAsset, Version, Rendition, Annotation, CommentThread, ReviewSession) and fields (duration, resolution, codecs, timecodes, regions); draft REST/GraphQL contracts for ingest, playback URLs, annotations CRUD, versions, approvals, notifications; align permission model using existing COMMENT/MODIFY tiers.
7. Tech stack evaluation: assess additions to current stack—FFmpeg-based worker + queue (Redis/Sidekiq-like) for transcode/thumbnails, HLS player (video.js + hls.js), image annotation lib (Konva/FabricJS), WebSocket/SSE for live comment updates, ClamAV for virus scan, rate limiting, metrics/logging (Micrometer + Prometheus). Compare build-vs-use managed services (if any) and select defaults.
8. Non-functional & compliance: define targets for latency (ingest-to-playback), availability, storage/bandwidth budget, security checks (magic-byte validation, auth on presigned URLs, audit log), backup/retention, and data privacy for client assets.
9. Validation plan: identify required spikes/POCs—FFmpeg to HLS on MinIO, sample HLS playback in current preview page, annotation overlay prototype—and outline test plan (unit/API/e2e) plus performance checks.
10. Roadmap & milestones: sequence deliverables (PRD, API/data model spec, architecture note, UX wireframes, spikes) with owners and acceptance criteria before build.

**Relevant files**
- [ans.md](ans.md#L234-L242) — Phase 2 vision and high-level feature bullets.
- [client/src/service/uploadService.ts](client/src/service/uploadService.ts) — Existing chunked upload to reuse for large media and folder ingest extension.
- [client/src/service/downloadService.ts](client/src/service/downloadService.ts) — Range download helper; informs streaming options comparison.
- [client/src/page/filePreviewPage/index.tsx](client/src/page/filePreviewPage/index.tsx) — Current preview surface to evolve into player/annotator.
- [client/src/utils/permissionUtils.ts](client/src/utils/permissionUtils.ts) — Permission helpers; COMMENT/MODIFY mapping for review actions.
- [server/src/main/java/org/example/filesharing/entities/models/MetadataEntity.java](server/src/main/java/org/example/filesharing/entities/models/MetadataEntity.java) — Base metadata; candidate for media fields (duration, codecs) and version linkage.
- [server/src/main/java/org/example/filesharing/services/impl/MinIoServiceImpl.java](server/src/main/java/org/example/filesharing/services/impl/MinIoServiceImpl.java) — Presigned URL logic to adapt for originals/renditions and HLS segments.

**Verification**
1. Approved PRD capturing personas, user stories, scope boundaries (MVP vs stretch).
2. Signed-off media pipeline doc: codec/rendition matrix, storage layout, transcode strategy, and security constraints.
3. API/data model spec (OpenAPI/ADR) covering media metadata, renditions, annotations, versions, review status, and permissions.
4. UX wireframes for player, annotations, timeline, version switching, and sharing entry points with permission mapping.
5. Spike reports: FFmpeg→HLS on MinIO, HLS playback POC in current UI, and annotation overlay prototype with timecodes.

**Decisions**
- Scope focus: async review for video + image; no real-time co-editing.
- Streaming default: favor HLS with multiple bitrates stored in MinIO; fall back to presigned range for small assets.
- Processing model: offload transcode/thumbnail to a worker with queue and retries (avoid blocking API nodes).

**Further Considerations**
1. Folder ingest priority: clarify whether to batch-upload via client-side zip vs directory traversal; impacts UX and API design.
2. Comment/notification channel: choose between in-app only vs email/webhook; affects data model and permissions.
3. Version compare UX: select MVP (side-by-side playback/image toggle) vs advanced (frame diff, AB swap); influences pipeline and UI complexity.
