# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FileSharing is a media asset management platform: users upload files (images, video, raw) into projects/folders; the backend transcodes and processes them asynchronously. Stack: Spring Boot 3.5 / Java 21 multi-module Maven backend + React 19 / Vite / MobX / Ant Design 6 frontend.

## Commands

### Infrastructure (run once)
```bash
# From server/dockers/
docker compose up -d   # MongoDB :27017, Kafka :9092, MinIO :9000/:9001, Kafka UI :8080
```

### Backend (from server/)
```bash
mvn clean install -DskipTests          # Build all modules (installs filesharing-core to local repo first)
mvn clean install -pl filesharing-core # Build shared library only

# Run individual services (each in its own terminal):
mvn spring-boot:run -pl filesharing-filehandler    # Main API  → :5000
mvn spring-boot:run -pl filesharing-notification   # Email     → :5001
mvn spring-boot:run -pl filesharing-uploadservice  # Upload    → :8080 (WebFlux)
mvn spring-boot:run -pl filesharing-videocodec     # (no HTTP, Kafka worker)
mvn spring-boot:run -pl filesharing-imagecodec     # (no HTTP, Kafka worker)
mvn spring-boot:run -pl filesharing-imagerawproccess  # (no HTTP, Kafka worker)

mvn test -pl <module>   # Run tests for a specific module
```

### Frontend (from client/)
```bash
npm install
npm run dev        # Vite dev server → :5173 (proxies /api → :5000)
npm run build      # tsc -b && vite build
npm run lint       # ESLint
npm run gen-api    # Regenerate API client from OpenAPI (filehandler must be running at :5000)
```

## Project Structure

```
FileSharing/
├── server/                         # Maven multi-module project
│   ├── pom.xml                     # Parent POM, dependency management
│   ├── filesharing-core/           # Shared library (NOT a runnable service)
│   │   └── …/core/
│   │       ├── entity/models/      # All domain entities (Asset, Folder, Project, …)
│   │       ├── enums/              # Shared enumerations
│   │       ├── exceptions/         # GlobalExceptionHandler + custom exceptions
│   │       ├── config/             # MinIOConfig, JacksonConfig
│   │       └── utils/
│   ├── filesharing-filehandler/    # Main REST API (:5000) — JWT auth, CRUD, Kafka producer
│   ├── filesharing-uploadservice/  # Reactive upload service (:8080, WebFlux + Redis)
│   ├── filesharing-notification/   # Email service (:5001, Thymeleaf templates)
│   ├── filesharing-videocodec/     # Kafka worker: video → HLS segments (FFmpeg)
│   ├── filesharing-imagecodec/     # Kafka worker: image processing / thumbnails
│   ├── filesharing-imagerawproccess/ # Kafka worker: RAW image processing
│   └── dockers/
│       └── docker-compose.yml      # MongoDB, Kafka/Zookeeper, MinIO, mc init
└── client/                         # React SPA (see client/CLAUDE.md for full detail)
    └── src/api/api/                # Auto-generated — run `npm run gen-api` to update
```

## Global Conventions

### Module dependencies
`filesharing-core` is a library, not a service. Every other module declares it as a `<dependency>`. Domain entity changes must be made in core and then `mvn install`-ed before dependent modules can compile.

### Kafka topics (filehandler ↔ workers)
| Topic | Direction | Purpose |
|---|---|---|
| `notification_email_sender` | filehandler → notification | Send email |
| `video_encode_topic` | filehandler → videocodec | Encode video |
| `video_encode_result_topic` | videocodec → filehandler | Encoding result |
| `image_process_topic` | filehandler → imagecodec | Process image |
| `image_process_result_topic` | imagecodec → filehandler | Processing result |

All consumers use `enable-auto-commit: false` + `ack-mode: manual`.

### Service communication
There is no API gateway. The frontend hits filehandler (:5000) directly. Filehandler communicates with workers exclusively via Kafka — no direct HTTP calls between services.

### Environment variables (override dev defaults)
| Variable | Default | Used by |
|---|---|---|
| `KAFKA_SERVERS` | `localhost:9092` | filehandler, workers |
| `KAFKA_AUTH` | `false` | filehandler |
| `KAFKA_USER` / `KAFKA_PASS` | `admin` / `adminKafka123` | filehandler |
| `MONGO_USER` / `MONGO_PASSWORD` | set in docker-compose | MongoDB container |
| `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` | set in docker-compose | MinIO container |

Dev credentials (MongoDB, MinIO, JWT secret) are hardcoded in `application.yml`. Do not use these values in non-dev environments.

### Package roots (inconsistency)
`filesharing-filehandler` uses `org.example.filesharing` as its root package; all other modules use `com.file.service.*`. This is a known inconsistency — do not "fix" it without updating Spring component scan configs.

### No test suite
Neither backend nor frontend has a configured test suite. Running `mvn test` on any module will pass trivially (no tests defined).

### Frontend detail
See [client/CLAUDE.md](client/CLAUDE.md) for the full frontend architecture, design system tokens, routing, state management, and API layer conventions.
