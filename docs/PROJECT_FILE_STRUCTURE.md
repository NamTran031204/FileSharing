# FileSharing Project - Complete File Structure Documentation

## Project Overview
FileSharing is a microservices-based file sharing application with the following main components:
- **Client**: React/TypeScript frontend using Vite
- **Server**: Spring Boot microservices architecture
- **Services**: File handler, notification, and video codec services

---

## Directory Structure

### Root Level
```
FileSharing/
├── client/                          # Frontend React application
├── server/                          # Backend microservices
├── minio-project/                   # MinIO object storage setup
└── docs/                            # Documentation
```

---

## CLIENT SIDE - React/TypeScript Frontend

### Frontend Build Configuration
- **vite.config.ts** - Vite build configuration
- **package.json** - Frontend dependencies and scripts
- **eslint.config.js** - ESLint configuration

### Frontend Entry Point
- **src/main.tsx** - Application entry point

### Core Application Files
- **src/App.tsx** - Main application component
- **src/layout/MainLayout.tsx** - Main page layout
- **src/layout/ReviewLayout.tsx** - Image review page layout

### API Integration Layer (src/api/)
- **baseApi.ts** - Base API client configuration
- **enums.ts** - API enumeration constants
- **authApi/authApiResource.ts** - Authentication API endpoints
- **fileApi/fileApiResource.ts** - File operations API endpoints
- **fileApi/userFileApiResource.ts** - User file management API endpoints
- **userApiResource.ts** - User management API endpoints

### Services (src/service/)
- **uploadService.ts** - File upload logic
- **downloadService.ts** - File download logic

### Utilities (src/utils/)
- **FileViewUtil.ts** - File viewing utilities
- **adaptiveBandwidth.ts** - Bandwidth adaptation utilities
- **permissionUtils.ts** - Permission checking utilities

### Data Transfer Objects (src/dto/)
- **MetadataDto.ts** - File metadata DTO

### Core Components (src/components/)

#### Layout Components
- **AppHeader.tsx** - Application header
- **AppSidebar.tsx** - Application sidebar navigation
- **V1/layout/NavBar.tsx** - Navigation bar

#### Navigation Components
- **V1/breadCrumb/BreadCrumbMenu.tsx** - Breadcrumb navigation
- **V1/breadCrumb/DownloadButton.tsx** - Download button component

#### File Management Components
- **V1/file/FileCardComp.tsx** - Individual file card display
- **V1/file/FileCardList.tsx** - File list container
- **V1/file/FileDetailModal.tsx** - File detail modal dialog
- **V1/file/UserFilePermissionList.tsx** - File permissions list
- **V1/file/EmailSender.tsx** - Email sharing component

#### User Profile Components (src/components/userProfile/)
- **UserProfile.tsx** - User profile page
- **UserIcon.tsx** - User avatar icon
- **AvatarImage.tsx** - Avatar image display
- **UpdateDeleteAvatar.tsx** - Avatar management

#### Progress Components (src/components/uploadDownloadProgress/)
- **DownloadProgress.tsx** - Download progress indicator

#### Routing Components
- **ProtectedRoute.tsx** - Route protection wrapper
- **NotFoundPage.tsx** - 404 page

#### Upload Component
- **UploadButton.tsx** - File upload button

### Pages (src/page/)

#### Authentication Pages
- **Phase1/auth/LoginPage.tsx** - User login page
- **Phase1/auth/RegisterPage.tsx** - User registration page
- **LoginPageV2.tsx** - Alternative login page

#### File Management Pages
- **Phase1/userFilePage/index.tsx** - User files listing page
- **Phase1/uploadPage/index.tsx** - File upload page
- **Phase1/filePreviewPage/index.tsx** - File preview page
- **Phase1/trashPage/index.tsx** - Trash/deleted files page

#### Image Review Page
- **ImageReviewPage.tsx** - Image review and annotation page

### Mockup/Demo Components
- **src/mockup/KonvaDemo.tsx** - Konva canvas demo for drawing

---

## SERVER SIDE - Microservices

### Parent POM (server/pom.xml)
Maven parent configuration for all microservices

---

## Microservice 1: FileSharing File Handler

### Main Module
- **FileSharingApplication.java** - Main Spring Boot application entry

### Configuration Files (src/main/java/org/example/filesharing/configurations/)
- **AsyncConfig.java** - Async processing configuration
- **DbConfig.java** - Database configuration
- **FfmpegConfig.java** - FFmpeg configuration
- **MinIOConfig.java** - MinIO S3 storage configuration
- **OpenApiConfig.java** - OpenAPI/Swagger configuration
- **SecurityConfig.java** - Spring Security configuration
- **WebConfig.java** - Web MVC configuration

### Kafka Configuration (configurations/kafka/)
- **KafkaConsumerConfig.java** - Kafka consumer setup
- **KafkaProducerConfig.java** - Kafka producer setup
- **KafkaTopic.java** - Kafka topic definitions

### Controllers (src/main/java/org/example/filesharing/controllers/)
- **AuthController.java** - Authentication endpoints
- **FileController.java** - File operations endpoints
- **FileMetadataController.java** - File metadata endpoints
- **UserController.java** - User management endpoints
- **Test.java** - Testing endpoint

### Entities & DTOs (src/main/java/org/example/filesharing/entities/)

#### Common Entities
- **CommonResponse.java** - Standard API response wrapper
- **PageRequestDto.java** - Pagination request DTO
- **PageResult.java** - Pagination result wrapper

#### Authentication DTOs (dtos/auth/)
- **UserLoginRequestDto.java** - Login request
- **UserLoginResponseDto.java** - Login response
- **UserRegisterRequestDto.java** - Registration request
- **UserRegisterResponseDto.java** - Registration response
- **UserFileAuthPermissionRequestDto.java** - File auth permission request

#### File Upload/Chunk DTOs (dtos/chunk/)
- **AbortUploadRequestDto.java** - Abort upload request
- **CompleteUploadRequest.java** - Complete upload request

#### File DTOs (dtos/file/)
- **EmailSenderRequestDto.java** - Email sending request
- **UserFileFilterPageRequestDto.java** - File filtering and pagination

#### Metadata DTOs (dtos/metadata/)
- **MetadataDTO.java** - File metadata DTO
- **MetadataUpdateRequestDto.java** - Metadata update request
- **InitiateUploadResponseDto.java** - Upload initialization response
- **DownloadFileRequestDto.java** - Download request
- **DownloadFileResponseDto.java** - Download response
- **DirectDownloadRequestDto.java** - Direct download request

#### User DTOs (dtos/user/)
- **UserDto.java** - User data transfer object
- **CreateUserRequestDto.java** - Create user request
- **UpdateUserRequestDto.java** - Update user request
- **UserSearchRequestDto.java** - User search request

#### Domain Models (models/)
- **UserEntity.java** - User database entity
- **MetadataEntity.java** - File metadata entity
- **ChunkEntity.java** - Upload chunk entity
- **UserFilePermission.java** - File permission entity
- **AuthProviderInfo.java** - Authentication provider info

### Enumerations (src/main/java/org/example/filesharing/enums/)

#### Authentication Enums (auth/)
- **AuthProvider.java** - Auth providers (local, OAuth, etc.)
- **UserRole.java** - User roles (admin, user, etc.)

#### Permission Enums (objectPermission/)
- **ObjectPermission.java** - Permission types (read, write, delete)
- **ObjectVisibility.java** - Visibility levels (private, shared, public)
- **FileAppPermission.java** - File-specific permissions

#### Status Enums
- **UploadStatus.java** - Upload states (pending, completed, failed)

### Exception Handling (src/main/java/org/example/filesharing/exceptions/)
- **ErrorCode.java** - Error code definitions
- **GlobalExceptionHandler.java** - Global exception handler
- **specException/FileBusinessException.java** - File operation exceptions
- **specException/UserBusinessException.java** - User operation exceptions

### Filters
- **filters/JwtAuthenticationFilter.java** - JWT authentication filter

### Services (src/main/java/org/example/filesharing/services/)

#### Service Interfaces
- **UserService.java** - User operations interface
- **FileService.java** - File operations interface
- **MetadataService.java** - Metadata operations interface
- **MinIoService.java** - MinIO S3 operations interface
- **JwtService.java** - JWT token operations
- **AuditService.java** - Audit logging
- **UserDetailsServiceImpl.java** - Spring Security user details

#### Service Implementations (services/impl/)
- **UserServiceImpl.java** - User operations implementation
- **MetadataServiceImpl.java** - Metadata operations implementation
- **MinIoServiceImpl.java** - MinIO S3 operations implementation

### Kafka Producers (src/main/java/org/example/filesharing/jobs/kafka/)
- **EmailProducer.java** - Email notification producer
- **VideoEncodeProducer.java** - Video encoding request producer

### Repositories
- **repositories/UserRepo.java** - User data repository
- **repositories/MetadataRepo.java** - Metadata data repository

### Utilities
- **utils/PermissionUtil.java** - Permission checking utilities
- **utils/StringUtils.java** - String manipulation utilities

### Build File
- **pom.xml** - Maven dependencies and build configuration

### Tests
- **src/test/java/org/example/filesharing/FileSharingApplicationTests.java** - Main tests

---

## Microservice 2: FileSharing Notification

### Main Module
- **FilesharingNotificationApplication.java** - Notification service entry point

### Configuration (src/main/java/server/filesharingnotification/config/)
- **KafkaConsumerConfig.java** - Kafka consumer configuration
- **KafkaProducerConfig.java** - Kafka producer configuration
- **KafkaTopic.java** - Kafka topic definitions

### Kafka Consumer (consumer/)
- **EmailConsumer.java** - Listens for email events

### Services (service/)
- **EmailService.java** - Email sending service

### DTOs (entity/dto/)
- **EmailSenderRequestDto.java** - Email request data

### Build File
- **pom.xml** - Maven dependencies

### Tests
- **src/test/java/server/filesharingnotification/FilesharingNotificationApplicationTests.java** - Tests

---

## Microservice 3: FileSharing Video Codec

### Main Module
- **FilesharingVideocodecApplication.java** - Video codec service entry point

### Configuration (src/main/java/com/file/service/filesharingvideocodec/config/)
- **FfmpegConfig.java** - FFmpeg configuration
- **MinIOConfig.java** - MinIO configuration
- **VideoEncodingConfig.java** - Video encoding profiles

### DTOs (dto/)
- **EncodingResult.java** - Encoding result data
- **ProfileResult.java** - Profile encoding result

### Exceptions (exception/)
- **EncodingException.java** - Encoding error handling

### Services (service/)
- **VideoEncodingService.java** - Video encoding operations
- **VideoUploadService.java** - Video upload handling
- **EncodingOrchestrationService.java** - Orchestrates encoding workflow

### Kafka Listener (listener/)
- **VideoEncodingKafkaListener.java** - Listens for encoding requests

### Models (model/)
- **EncodingProfile.java** - Encoding profile definition

### Tasks (task/)
- **VideoEncodingTask.java** - Encoding task executor

### Utilities (util/)
- **EncodingLogger.java** - Encoding operation logging

### Build File
- **pom.xml** - Maven dependencies

### Tests
- **src/test/java/com/file/service/filesharingvideocodec/FilesharingVideocodecApplicationTests.java** - Tests

---

## MinIO Project
- **minio-project/** - MinIO object storage setup and configuration

---

## Key Architectural Patterns

### Microservices Architecture
1. **File Handler Service** - Main business logic
2. **Notification Service** - Email notifications via Kafka
3. **Video Codec Service** - Video encoding via Kafka

### Communication
- **Kafka** - Event-driven communication between services
- **REST APIs** - Client-server communication

### Data Storage
- **Database** - User and metadata persistence
- **MinIO S3** - File and video object storage

### Security
- **JWT Authentication** - Token-based API security
- **Spring Security** - Authorization and access control

### Frontend Architecture
- **React + TypeScript** - Component-based UI
- **Vite** - Modern build tool
- **Ant Design** - UI component library

---

## File Statistics

### Backend Statistics
- **Total Java Files**: 100+
- **Main Service**: File Handler (70+ files)
- **Services**: 3 microservices
- **Controllers**: 5 main endpoints
- **DTOs**: 25+ data transfer objects
- **Entities**: 5 main domain models

### Frontend Statistics
- **Total TypeScript/TSX Files**: 50+
- **Pages**: 8 main pages
- **Components**: 25+ reusable components
- **Services**: 2 business logic services
- **API Resources**: 5 API integration layers

### Total Project Files
- **Source Code Files**: 150+
- **Configuration Files**: 15+
- **Test Files**: 3+

---

## Development Setup

### Backend Requirements
- Java 8+
- Maven 3.6+
- Spring Boot 2.x/3.x
- MySQL/PostgreSQL Database
- Kafka Message Broker
- MinIO S3 Storage

### Frontend Requirements
- Node.js 16+
- npm/yarn
- React 18+
- TypeScript 4+

---

## API Endpoints Summary

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### User Management
- `GET /api/users/**` - User operations
- `POST /api/users/**` - User creation/updates

### File Operations
- `POST /api/files/upload/**` - File upload
- `GET /api/files/download/**` - File download
- `GET /api/files/list` - List user files
- `DELETE /api/files/**` - Delete file

### File Metadata
- `GET /api/metadata/**` - Get file metadata
- `PUT /api/metadata/**` - Update metadata

---

## Database Entities

1. **UserEntity** - User profiles and authentication
2. **MetadataEntity** - File metadata and tracking
3. **ChunkEntity** - Upload chunk information
4. **UserFilePermission** - File access permissions

---

## Kafka Topics

1. **email-topic** - Email notification events
2. **video-encode-topic** - Video encoding requests
3. **video-encode-complete-topic** - Encoding completion events

---

## File Naming Conventions

### Java Files
- Controllers: `*Controller.java`
- Services: `*Service.java` (interface) and `*ServiceImpl.java` (implementation)
- Entities: `*Entity.java`
- DTOs: `*Dto.java`
- Repositories: `*Repo.java`

### TypeScript Files
- Components: `.tsx` for components with JSX
- Services: `.ts` for business logic
- Utilities: `*Util.ts` or `*Utils.ts`
- Pages: `index.tsx` in page directories

---

Last Updated: 2026-04-12
