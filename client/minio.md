# Đề Mục Khóa Học MinIO với Java Backend và TypeScript Client
<!-- TOC -->
* [Đề Mục Khóa Học MinIO với Java Backend và TypeScript Client](#đề-mục-khóa-học-minio-với-java-backend-và-typescript-client)
  * [Phần 1: Thiết Lập và Cấu Hình MinIO Server](#phần-1-thiết-lập-và-cấu-hình-minio-server)
    * [1.1 Giới Thiệu Tổng Quan về MinIO](#11-giới-thiệu-tổng-quan-về-minio)
      * [1.1.1 MinIO là gì và tại sao nên sử dụng MinIO](#111-minio-là-gì-và-tại-sao-nên-sử-dụng-minio)
      * [1.1.2 Kiến trúc của MinIO và các thành phần chính](#112-kiến-trúc-của-minio-và-các-thành-phần-chính)
      * [1.1.3 So sánh MinIO với các giải pháp lưu trữ đối tượng khác](#113-so-sánh-minio-với-các-giải-pháp-lưu-trữ-đối-tượng-khác)
      * [1.1.4 Các trường hợp sử dụng phổ biến của MinIO](#114-các-trường-hợp-sử-dụng-phổ-biến-của-minio)
    * [1.2 Cài Đặt MinIO Bằng Docker](#12-cài-đặt-minio-bằng-docker)
      * [1.2.1 Yêu cầu hệ thống và chuẩn bị môi trường Docker](#121-yêu-cầu-hệ-thống-và-chuẩn-bị-môi-trường-docker)
      * [1.2.2 Tạo Docker Compose file cho MinIO](#122-tạo-docker-compose-file-cho-minio)
      * [1.2.3 Cấu hình biến môi trường cho MinIO container](#123-cấu-hình-biến-môi-trường-cho-minio-container)
      * [1.2.4 Cấu hình volume mapping để lưu trữ dữ liệu persistent](#124-cấu-hình-volume-mapping-để-lưu-trữ-dữ-liệu-persistent)
      * [1.2.5 Cấu hình network cho MinIO container](#125-cấu-hình-network-cho-minio-container)
      * [1.2.6 Khởi động và kiểm tra trạng thái MinIO container](#126-khởi-động-và-kiểm-tra-trạng-thái-minio-container)
      * [1.2.7 Truy cập MinIO Console qua giao diện web](#127-truy-cập-minio-console-qua-giao-diện-web)
    * [1.3 Cài Đặt MinIO Trên Máy Ảo Ubuntu](#13-cài-đặt-minio-trên-máy-ảo-ubuntu)
      * [1.3.1 Yêu cầu hệ thống và chuẩn bị máy ảo Ubuntu](#131-yêu-cầu-hệ-thống-và-chuẩn-bị-máy-ảo-ubuntu)
      * [1.3.2 Tải và cài đặt MinIO binary trên Ubuntu](#132-tải-và-cài-đặt-minio-binary-trên-ubuntu)
      * [1.3.3 Tạo user và group riêng cho MinIO service](#133-tạo-user-và-group-riêng-cho-minio-service)
      * [1.3.4 Cấu hình thư mục lưu trữ dữ liệu MinIO](#134-cấu-hình-thư-mục-lưu-trữ-dữ-liệu-minio)
      * [1.3.5 Tạo systemd service file cho MinIO](#135-tạo-systemd-service-file-cho-minio)
      * [1.3.6 Cấu hình biến môi trường trong file environment](#136-cấu-hình-biến-môi-trường-trong-file-environment)
      * [1.3.7 Khởi động MinIO service và kiểm tra trạng thái](#137-khởi-động-minio-service-và-kiểm-tra-trạng-thái)
      * [1.3.8 Cấu hình MinIO tự động khởi động cùng hệ thống](#138-cấu-hình-minio-tự-động-khởi-động-cùng-hệ-thống)
    * [1.3 Cài Đặt MinIO Trên Máy Ảo Ubuntu](#13-cài-đặt-minio-trên-máy-ảo-ubuntu-1)
      * [1.3.1 Yêu cầu hệ thống và chuẩn bị máy ảo Ubuntu](#131-yêu-cầu-hệ-thống-và-chuẩn-bị-máy-ảo-ubuntu-1)
      * [1.3.2 Tải và cài đặt MinIO binary trên Ubuntu](#132-tải-và-cài-đặt-minio-binary-trên-ubuntu-1)
      * [1.3.3 Tạo user và group riêng cho MinIO service](#133-tạo-user-và-group-riêng-cho-minio-service-1)
      * [1.3.4 Cấu hình thư mục lưu trữ dữ liệu MinIO](#134-cấu-hình-thư-mục-lưu-trữ-dữ-liệu-minio-1)
      * [1.3.5 Tạo systemd service file cho MinIO](#135-tạo-systemd-service-file-cho-minio-1)
      * [1.3.6 Cấu hình biến môi trường trong file environment](#136-cấu-hình-biến-môi-trường-trong-file-environment-1)
      * [1.3.7 Khởi động MinIO service và kiểm tra trạng thái](#137-khởi-động-minio-service-và-kiểm-tra-trạng-thái-1)
      * [1.3.8 Cấu hình MinIO tự động khởi động cùng hệ thống](#138-cấu-hình-minio-tự-động-khởi-động-cùng-hệ-thống-1)
    * [1.5 Cấu Hình Khắc Phục Lỗi CORS](#15-cấu-hình-khắc-phục-lỗi-cors)
      * [1.5.1 Nguyên nhân gây ra lỗi CORS khi truy cập MinIO từ browser](#151-nguyên-nhân-gây-ra-lỗi-cors-khi-truy-cập-minio-từ-browser)
      * [1.5.2 Cấu hình CORS cho MinIO bằng MinIO Client (mc)](#152-cấu-hình-cors-cho-minio-bằng-minio-client-mc)
      * [1.5.3 Tạo file cấu hình CORS JSON với các header cần thiết](#153-tạo-file-cấu-hình-cors-json-với-các-header-cần-thiết)
      * [1.5.4 Áp dụng cấu hình CORS cho bucket cụ thể](#154-áp-dụng-cấu-hình-cors-cho-bucket-cụ-thể)
      * [1.5.5 Kiểm tra cấu hình CORS đã được áp dụng thành công](#155-kiểm-tra-cấu-hình-cors-đã-được-áp-dụng-thành-công)
      * [1.5.2 Cấu hình CORS cho MinIO bằng MinIO Client (mc)](#152-cấu-hình-cors-cho-minio-bằng-minio-client-mc-1)
      * [1.5.3 Tạo file cấu hình CORS JSON với các header cần thiết](#153-tạo-file-cấu-hình-cors-json-với-các-header-cần-thiết-1)
      * [1.5.4 Áp dụng cấu hình CORS cho bucket cụ thể](#154-áp-dụng-cấu-hình-cors-cho-bucket-cụ-thể-1)
      * [1.5.5 Kiểm tra cấu hình CORS đã được áp dụng thành công](#155-kiểm-tra-cấu-hình-cors-đã-được-áp-dụng-thành-công-1)
      * [1.5.6 Xử lý lỗi CORS với các HTTP method đặc biệt (PUT, DELETE)](#156-xử-lý-lỗi-cors-với-các-http-method-đặc-biệt-put-delete)
    * [1.6 Cấu Hình Khắc Phục Lỗi Network](#16-cấu-hình-khắc-phục-lỗi-network)
      * [1.6.1 Nguyên nhân gây ra lỗi ERR_CONNECTION_REFUSED](#161-nguyên-nhân-gây-ra-lỗi-err_connection_refused)
      * [1.6.2 Nguyên nhân gây ra lỗi ERR_CONNECTION_RESET](#162-nguyên-nhân-gây-ra-lỗi-err_connection_reset)
      * [1.6.3 Nguyên nhân gây ra lỗi ERR_CONNECTION_ABORTED](#163-nguyên-nhân-gây-ra-lỗi-err_connection_aborted)
      * [1.6.4 Cấu hình firewall trên Ubuntu để cho phép truy cập MinIO](#164-cấu-hình-firewall-trên-ubuntu-để-cho-phép-truy-cập-minio)
      * [1.6.5 Cấu hình port binding cho Docker container](#165-cấu-hình-port-binding-cho-docker-container)
      * [1.6.2 Nguyên nhân gây ra lỗi ERR_CONNECTION_RESET](#162-nguyên-nhân-gây-ra-lỗi-err_connection_reset-1)
      * [1.6.3 Nguyên nhân gây ra lỗi ERR_CONNECTION_ABORTED](#163-nguyên-nhân-gây-ra-lỗi-err_connection_aborted-1)
      * [1.6.4 Cấu hình firewall trên Ubuntu để cho phép truy cập MinIO](#164-cấu-hình-firewall-trên-ubuntu-để-cho-phép-truy-cập-minio-1)
      * [1.6.5 Cấu hình port binding cho Docker container](#165-cấu-hình-port-binding-cho-docker-container-1)
      * [1.6.6 Cấu hình reverse proxy với Nginx cho MinIO](#166-cấu-hình-reverse-proxy-với-nginx-cho-minio)
      * [1.6.4 Cấu hình firewall trên Ubuntu để cho phép truy cập MinIO](#164-cấu-hình-firewall-trên-ubuntu-để-cho-phép-truy-cập-minio-2)
      * [1.6.5 Cấu hình port binding cho Docker container](#165-cấu-hình-port-binding-cho-docker-container-2)
      * [1.6.6 Cấu hình reverse proxy với Nginx cho MinIO](#166-cấu-hình-reverse-proxy-với-nginx-cho-minio-1)
      * [1.6.7 Xử lý lỗi timeout khi upload file lớn](#167-xử-lý-lỗi-timeout-khi-upload-file-lớn)
      * [1.6.6 Cấu hình reverse proxy với Nginx cho MinIO](#166-cấu-hình-reverse-proxy-với-nginx-cho-minio-2)
      * [1.6.7 Xử lý lỗi timeout khi upload file lớn](#167-xử-lý-lỗi-timeout-khi-upload-file-lớn-1)
    * [1.7 Kiểm Tra Cấu Hình MinIO](#17-kiểm-tra-cấu-hình-minio)
  * [Phần 2: API Upload và Presigned Upload URL](#phần-2-api-upload-và-presigned-upload-url)
    * [2.1 Tổng Quan về Upload trong MinIO](#21-tổng-quan-về-upload-trong-minio)
    * [2.2 Cấu Hình MinIO Java SDK](#22-cấu-hình-minio-java-sdk)
    * [2.3 Tạo Presigned Upload URL Bằng Java](#23-tạo-presigned-upload-url-bằng-java)
    * [2.4 Sử Dụng Presigned Upload URL Trong TypeScript](#24-sử-dụng-presigned-upload-url-trong-typescript)
    * [2.5 Triển Khai Multipart Upload Hoàn Chỉnh](#25-triển-khai-multipart-upload-hoàn-chỉnh)
  * [Phần 3: API Download và Presigned Download URL](#phần-3-api-download-và-presigned-download-url)
    * [3.1 Tổng Quan về Download trong MinIO](#31-tổng-quan-về-download-trong-minio)
    * [3.2 Tạo Presigned Download URL Bằng Java](#32-tạo-presigned-download-url-bằng-java)
    * [3.3 Sử Dụng Presigned Download URL Trong TypeScript](#33-sử-dụng-presigned-download-url-trong-typescript)
    * [3.4 Triển Khai Chunked Download Hoàn Chỉnh](#34-triển-khai-chunked-download-hoàn-chỉnh)
  * [Phần 4: API Stream Upload và Download](#phần-4-api-stream-upload-và-download)
    * [4.1 Tổng Quan về Streaming trong MinIO](#41-tổng-quan-về-streaming-trong-minio)
    * [4.2 Stream Upload Bằng Java](#42-stream-upload-bằng-java)
    * [4.3 Stream Upload Từ TypeScript Client](#43-stream-upload-từ-typescript-client)
    * [4.4 Stream Download Bằng Java](#44-stream-download-bằng-java)
    * [4.5 Stream Download Từ TypeScript Client](#45-stream-download-từ-typescript-client)
  * [Phần 5: Mở Rộng và Scale MinIO](#phần-5-mở-rộng-và-scale-minio)
    * [5.1 Tổng Quan về Kiến Trúc Phân Tán của MinIO](#51-tổng-quan-về-kiến-trúc-phân-tán-của-minio)
    * [5.2 Scale MinIO Với Nhiều Ổ Cứng (Giả Lập)](#52-scale-minio-với-nhiều-ổ-cứng-giả-lập)
    * [5.3 Scale MinIO Với Nhiều Server Song Song](#53-scale-minio-với-nhiều-server-song-song)
    * [5.4 Giám Sát và Vận Hành MinIO Cluster](#54-giám-sát-và-vận-hành-minio-cluster)
  * [Phụ Lục](#phụ-lục)
    * [A. Tham Khảo Nhanh MinIO Client (mc) Commands](#a-tham-khảo-nhanh-minio-client-mc-commands)
    * [B. Danh Sách Các Lỗi Thường Gặp và Cách Khắc Phục](#b-danh-sách-các-lỗi-thường-gặp-và-cách-khắc-phục)
    * [C. Checklist Bảo Mật Cho MinIO Production](#c-checklist-bảo-mật-cho-minio-production)
    * [D. So Sánh Hiệu Năng Các Cấu Hình MinIO Khác Nhau](#d-so-sánh-hiệu-năng-các-cấu-hình-minio-khác-nhau)
    * [E. Tài Liệu Tham Khảo và Nguồn Học Thêm](#e-tài-liệu-tham-khảo-và-nguồn-học-thêm)
<!-- TOC -->
## Phần 1: Thiết Lập và Cấu Hình MinIO Server

### 1.1 Giới Thiệu Tổng Quan về MinIO
#### 1.1.1 MinIO là gì và tại sao nên sử dụng MinIO

**MinIO là gì?**

MinIO là một hệ thống lưu trữ đối tượng (Object Storage) mã nguồn mở, hiệu năng cao, được thiết kế để tương thích hoàn toàn với Amazon S3 API. MinIO được viết bằng ngôn ngữ Go, cho phép triển khai trên nhiều nền tảng khác nhau từ laptop đến data center quy mô lớn.

**Đặc điểm nổi bật của MinIO:**

| Đặc điểm | Mô tả |
|----------|-------|
| **S3 Compatible** | Tương thích 100% với Amazon S3 API, cho phép sử dụng các SDK và tool có sẵn của S3 |
| **High Performance** | Đạt tốc độ đọc/ghi lên đến 183 GB/s và 171 GB/s trên phần cứng tiêu chuẩn |
| **Lightweight** | Binary file chỉ khoảng 60MB, khởi động nhanh, tiêu thụ ít tài nguyên |
| **Cloud Native** | Thiết kế cho Kubernetes và container, hỗ trợ horizontal scaling |
| **Open Source** | Mã nguồn mở theo giấy phép GNU AGPLv3 |

**Tại sao nên sử dụng MinIO?**

```
┌─────────────────────────────────────────────────────────────┐
│                    LÝ DO SỬ DỤNG MINIO                      │
├─────────────────────────────────────────────────────────────┤
│  1. Chi phí thấp                                            │
│     - Miễn phí cho phiên bản Community                      │
│     - Không phụ thuộc vào cloud vendor                      │
│     - Tận dụng phần cứng có sẵn                            │
│                                                             │
│  2. Dễ triển khai                                           │
│     - Single binary, không dependencies phức tạp            │
│     - Chạy được trên Docker, Kubernetes, bare metal         │
│     - Cấu hình đơn giản qua biến môi trường                │
│                                                             │
│  3. Tương thích S3                                          │
│     - Migration dễ dàng từ/đến AWS S3                       │
│     - Sử dụng được ecosystem S3 phong phú                   │
│     - Không bị vendor lock-in                               │
│                                                             │
│  4. Hiệu năng cao                                           │
│     - Tối ưu cho SSD và NVMe                               │
│     - Parallel upload/download                              │
│     - Erasure coding hiệu quả                              │
└─────────────────────────────────────────────────────────────┘
```

**So sánh Object Storage với File Storage và Block Storage:**

```
┌────────────────┬─────────────────┬─────────────────┬─────────────────┐
│    Tiêu chí    │  File Storage   │  Block Storage  │ Object Storage  │
├────────────────┼─────────────────┼─────────────────┼─────────────────┤
│ Cấu trúc       │ Hierarchical    │ Fixed-size      │ Flat namespace  │
│                │ (thư mục/file)  │ blocks          │ (bucket/object) │
├────────────────┼─────────────────┼─────────────────┼─────────────────┤
│ Truy cập       │ NFS, SMB, CIFS  │ iSCSI, FC       │ HTTP REST API   │
├────────────────┼─────────────────┼─────────────────┼─────────────────┤
│ Metadata       │ Giới hạn        │ Không có        │ Tùy chỉnh,      │
│                │ (name, size...) │                 │ không giới hạn  │
├────────────────┼─────────────────┼─────────────────┼─────────────────┤
│ Scale          │ Khó scale       │ Cần SAN         │ Dễ scale        │
│                │ horizontally    │                 │ horizontally    │
├────────────────┼─────────────────┼─────────────────┼─────────────────┤
│ Use case       │ Shared folders, │ Databases,      │ Media files,    │
│                │ home dirs       │ VMs             │ backups, logs   │
└────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

---

#### 1.1.2 Kiến trúc của MinIO và các thành phần chính

**Kiến trúc tổng quan MinIO:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           MINIO ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐             │
│    │   Client    │     │   Client    │     │   Client    │             │
│    │ (S3 SDK)    │     │ (Browser)   │     │ (mc CLI)    │             │
│    └──────┬──────┘     └──────┬──────┘     └──────┬──────┘             │
│           │                   │                   │                     │
│           └───────────────────┼───────────────────┘                     │
│                               ▼                                         │
│                    ┌─────────────────────┐                              │
│                    │   Load Balancer     │  (Optional)                  │
│                    │   (Nginx/HAProxy)   │                              │
│                    └──────────┬──────────┘                              │
│                               │                                         │
│           ┌───────────────────┼───────────────────┐                     │
│           ▼                   ▼                   ▼                     │
│    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐             │
│    │   MinIO     │     │   MinIO     │     │   MinIO     │             │
│    │   Node 1    │◄───►│   Node 2    │◄───►│   Node 3    │             │
│    │  :9000      │     │  :9000      │     │  :9000      │             │
│    └──────┬──────┘     └──────┬──────┘     └──────┬──────┘             │
│           │                   │                   │                     │
│    ┌──────┴──────┐     ┌──────┴──────┐     ┌──────┴──────┐             │
│    │ Drive 1 │ 2 │     │ Drive 1 │ 2 │     │ Drive 1 │ 2 │             │
│    └─────────────┘     └─────────────┘     └─────────────┘             │
│                                                                         │
│                    ┌─────────────────────┐                              │
│                    │   MinIO Console     │                              │
│                    │      :9001          │                              │
│                    └─────────────────────┘                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Các thành phần chính của MinIO:**

**1. MinIO Server**
```
┌─────────────────────────────────────────────────────────────┐
│                      MINIO SERVER                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    S3 API Layer                      │   │
│  │  - PUT/GET/DELETE Object                            │   │
│  │  - Multipart Upload                                  │   │
│  │  - Presigned URLs                                    │   │
│  │  - Bucket Operations                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  Storage Engine                      │   │
│  │  - Erasure Coding                                    │   │
│  │  - Bitrot Protection                                 │   │
│  │  - Data Sharding                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Disk Layer                         │   │
│  │  - XL Storage Format                                 │   │
│  │  - Drive Management                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**2. MinIO Console (Web UI)**

MinIO Console là giao diện web quản trị, chạy trên port 9001 (mặc định), cung cấp:
- Dashboard giám sát real-time
- Quản lý Buckets và Objects
- Quản lý Users và Policies
- Cấu hình Server và Notifications

**3. MinIO Client (mc)**

```bash
# mc là CLI tool để tương tác với MinIO
mc alias set myminio http://localhost:9000 minioadmin minioadmin

# Các lệnh cơ bản
mc ls myminio/                    # List buckets
mc mb myminio/mybucket            # Make bucket
mc cp file.txt myminio/mybucket/  # Copy file
mc rm myminio/mybucket/file.txt   # Remove file
```

**4. Cấu trúc dữ liệu trong MinIO:**

```
┌─────────────────────────────────────────────────────────────┐
│                    MINIO DATA HIERARCHY                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  MinIO Server                                               │
│       │                                                     │
│       ├── Bucket: "images"                                  │
│       │       │                                             │
│       │       ├── Object: "photo1.jpg"                      │
│       │       │       ├── Data (binary content)             │
│       │       │       └── Metadata (key-value pairs)        │
│       │       │             ├── Content-Type: image/jpeg    │
│       │       │             ├── Content-Length: 1024000     │
│       │       │             └── x-amz-meta-author: john     │
│       │       │                                             │
│       │       ├── Object: "photos/2024/photo2.png"          │
│       │       │       └── (prefix simulates folders)        │
│       │       │                                             │
│       │       └── Object: "photo3.gif"                      │
│       │                                                     │
│       ├── Bucket: "documents"                               │
│       │       ├── Object: "report.pdf"                      │
│       │       └── Object: "data.csv"                        │
│       │                                                     │
│       └── Bucket: "backups"                                 │
│               └── Object: "db-2024-01-01.sql.gz"           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**5. Erasure Coding trong MinIO:**

```
┌─────────────────────────────────────────────────────────────┐
│                    ERASURE CODING                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Original Object (100MB)                                    │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Erasure Coding Algorithm                │   │
│  │                    (Reed-Solomon)                    │   │
│  └─────────────────────────────────────────────────────┘   │
│       │                                                     │
│       ▼                                                     │
│  Split into N data shards + M parity shards                │
│  (Default: 8 data + 8 parity = 16 total)                   │
│                                                             │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐  │
│  │ D1 │ │ D2 │ │ D3 │ │ D4 │ │ D5 │ │ D6 │ │ D7 │ │ D8 │  │
│  └──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘  │
│     │      │      │      │      │      │      │      │     │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐  │
│  │ P1 │ │ P2 │ │ P3 │ │ P4 │ │ P5 │ │ P6 │ │ P7 │ │ P8 │  │
│  └──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘  │
│     │      │      │      │      │      │      │      │     │
│     ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼     │
│  ┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐ │
│  │Drv 1││Drv 2││Drv 3││Drv 4││Drv 5││Drv 6││Drv 7││Drv 8│ │
│  └─────┘└─────┘└─────┘└─────┘└─────┘└─────┘└─────┘└─────┘ │
│                                                             │
│  → Có thể mất tối đa 8 drives mà vẫn recovery được data    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

#### 1.1.3 So sánh MinIO với các giải pháp lưu trữ đối tượng khác

**Bảng so sánh chi tiết:**

```
┌────────────────┬─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│    Tiêu chí    │    MinIO    │   AWS S3    │ Google GCS  │ Azure Blob  │    Ceph     │
├────────────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│ Loại           │ Self-hosted │ Cloud       │ Cloud       │ Cloud       │ Self-hosted │
│                │ / Cloud     │ Service     │ Service     │ Service     │             │
├────────────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│ S3 Compatible  │ ✓ 100%      │ ✓ Native    │ ✓ Partial   │ ✓ Partial   │ ✓ Via RGW   │
├────────────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│ License        │ AGPLv3 /    │ Proprietary │ Proprietary │ Proprietary │ LGPL        │
│                │ Commercial  │             │             │             │             │
├────────────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│ Chi phí        │ Free /      │ Pay-per-use │ Pay-per-use │ Pay-per-use │ Free        │
│                │ Support fee │             │             │             │             │
├────────────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│ Triển khai     │ Rất đơn     │ Không cần   │ Không cần   │ Không cần   │ Phức tạp    │
│                │ giản        │             │             │             │             │
├────────────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│ Performance    │ Rất cao     │ Cao         │ Cao         │ Cao         │ Trung bình  │
├────────────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│ Kubernetes     │ ✓ Native    │ ✓ Via SDK   │ ✓ Via SDK   │ ✓ Via SDK   │ ✓ Rook      │
│ Support        │             │             │             │             │             │
├────────────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│ Data Location  │ On-premise  │ AWS Region  │ GCP Region  │ Azure       │ On-premise  │
│ Control        │ / Any       │             │             │ Region      │ / Any       │
├────────────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│ Vendor Lock-in │ Không       │ Cao         │ Cao         │ Cao         │ Không       │
└────────────────┴─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
```

**So sánh chi tiết MinIO vs Ceph:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MinIO vs Ceph                                   │
├────────────────────────────────┬────────────────────────────────────────┤
│            MinIO               │                Ceph                    │
├────────────────────────────────┼────────────────────────────────────────┤
│ • Single binary (~60MB)        │ • Multiple daemons (MON, OSD, MDS,    │
│                                │   RGW)                                 │
├────────────────────────────────┼────────────────────────────────────────┤
│ • Cài đặt trong vài phút       │ • Cài đặt phức tạp, cần nhiều giờ     │
├────────────────────────────────┼────────────────────────────────────────┤
│ • Chỉ Object Storage           │ • Object + Block + File Storage       │
├────────────────────────────────┼────────────────────────────────────────┤
│ • RAM: ~128MB minimum          │ • RAM: ~4GB per OSD recommended       │
├────────────────────────────────┼────────────────────────────────────────┤
│ • Tối ưu cho S3 workloads      │ • Đa dụng nhưng phức tạp hơn          │
├────────────────────────────────┼────────────────────────────────────────┤
│ • Horizontal scaling đơn giản  │ • Horizontal scaling phức tạp hơn     │
└────────────────────────────────┴────────────────────────────────────────┘
```

**So sánh chi phí (ước tính cho 10TB/tháng):**

```
┌─────────────────────────────────────────────────────────────┐
│              CHI PHÍ ƯỚC TÍNH 10TB/THÁNG                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  AWS S3 Standard:                                           │
│  ├── Storage: $0.023/GB × 10,000GB = $230                  │
│  ├── PUT requests (1M): $5                                  │
│  ├── GET requests (10M): $4                                 │
│  └── Data transfer out (1TB): $90                          │
│      TOTAL: ~$329/month                                     │
│                                                             │
│  MinIO (Self-hosted):                                       │
│  ├── Server: $100/month (cloud VM) hoặc $0 (on-premise)    │
│  ├── Storage: Phụ thuộc disk cost                          │
│  ├── Bandwidth: Phụ thuộc provider                         │
│  └── Support (optional): $0 - custom                       │
│      TOTAL: ~$100-200/month                                 │
│                                                             │
│  → Tiết kiệm 40-70% so với cloud providers                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

#### 1.1.4 Các trường hợp sử dụng phổ biến của MinIO

**1. Lưu trữ Media và Content Delivery:**

```
┌─────────────────────────────────────────────────────────────┐
│              MEDIA STORAGE USE CASE                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐    Upload     ┌─────────┐                     │
│  │  User   │──────────────►│ Backend │                     │
│  └─────────┘               │  Server │                     │
│                            └────┬────┘                     │
│                                 │                           │
│                    Presigned URL│                           │
│                                 ▼                           │
│                          ┌───────────┐                      │
│                          │   MinIO   │                      │
│                          │  Cluster  │                      │
│                          └─────┬─────┘                      │
│                                │                            │
│                     ┌──────────┼──────────┐                │
│                     ▼          ▼          ▼                │
│               ┌─────────┐┌─────────┐┌─────────┐            │
│               │ Images  ││ Videos  ││  Audio  │            │
│               │ Bucket  ││ Bucket  ││ Bucket  │            │
│               └─────────┘└─────────┘└─────────┘            │
│                                                             │
│  Ứng dụng:                                                  │
│  • Website lưu trữ ảnh user upload                         │
│  • Video streaming platform                                 │
│  • Podcast hosting                                          │
│  • E-commerce product images                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**2. Backup và Disaster Recovery:**

```
┌─────────────────────────────────────────────────────────────┐
│              BACKUP & DR USE CASE                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │  Production  │         │   Backup     │                 │
│  │   Database   │────────►│   MinIO      │                 │
│  └──────────────┘  Daily  └──────┬───────┘                 │
│                    Backup        │                          │
│  ┌──────────────┐                │ Replication              │
│  │  Application │                ▼                          │
│  │    Logs      │────────►┌──────────────┐                 │
│  └──────────────┘         │   DR Site    │                 │
│                           │   MinIO      │                 │
│  ┌──────────────┐         └──────────────┘                 │
│  │   VM/Server  │                                          │
│  │   Snapshots  │─────────────────┘                        │
│  └──────────────┘                                          │
│                                                             │
│  Features sử dụng:                                          │
│  • Versioning để giữ nhiều version backup                  │
│  • Lifecycle rules để tự động xóa backup cũ               │
│  • Cross-site replication cho DR                           │
│  • Object Lock cho immutable backups                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**3. Data Lake và Analytics:**

```
┌─────────────────────────────────────────────────────────────┐
│              DATA LAKE USE CASE                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Data Sources                      Analytics Tools          │
│  ┌─────────┐                       ┌─────────────┐         │
│  │   IoT   │───┐               ┌──►│   Spark     │         │
│  │ Devices │   │               │   └─────────────┘         │
│  └─────────┘   │               │                           │
│                │   ┌───────┐   │   ┌─────────────┐         │
│  ┌─────────┐   │   │       │   ├──►│   Presto    │         │
│  │  Logs   │───┼──►│ MinIO │───┤   └─────────────┘         │
│  │ Streams │   │   │       │   │                           │
│  └─────────┘   │   └───────┘   │   ┌─────────────┐         │
│                │               ├──►│   Trino     │         │
│  ┌─────────┐   │               │   └─────────────┘         │
│  │  APIs   │───┘               │                           │
│  │  Data   │                   │   ┌─────────────┐         │
│  └─────────┘                   └──►│   Hadoop    │         │
│                                    └─────────────┘         │
│                                                             │
│  Data Formats hỗ trợ:                                       │
│  • Parquet, ORC, Avro                                       │
│  • JSON, CSV                                                │
│  • Delta Lake, Apache Iceberg                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**4. Machine Learning và AI:**

```
┌─────────────────────────────────────────────────────────────┐
│              ML/AI USE CASE                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │                    ML Pipeline                      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐           │
│  │ Training │     │  Model   │     │Inference │           │
│  │   Data   │────►│ Training │────►│  Deploy  │           │
│  └────┬─────┘     └────┬─────┘     └────┬─────┘           │
│       │                │                │                  │
│       │                │                │                  │
│       ▼                ▼                ▼                  │
│  ┌─────────────────────────────────────────────────┐      │
│  │                    MinIO                         │      │
│  ├──────────┬──────────────┬───────────────────────┤      │
│  │ Raw Data │ Model        │ Inference Results     │      │
│  │ Bucket   │ Artifacts    │ Bucket                │      │
│  │          │ Bucket       │                       │      │
│  └──────────┴──────────────┴───────────────────────┘      │
│                                                             │
│  Tích hợp với:                                              │
│  • TensorFlow, PyTorch                                      │
│  • MLflow, Kubeflow                                         │
│  • Jupyter Notebooks                                        │
│  • NVIDIA GPU Cloud                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**5. File Sharing Application (Use case của project này):**

```
┌─────────────────────────────────────────────────────────────┐
│              FILE SHARING APPLICATION                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│    ┌─────────────────────────────────────────────┐         │
│    │           TypeScript Client                 │         │
│    │  • React/Vue/Angular Frontend               │         │
│    │  • File upload với presigned URL            │         │
│    │  • File download với presigned URL          │         │
│    │  • Progress tracking                        │         │
│    └─────────────────────┬───────────────────────┘         │
│                          │                                  │
│                          │ REST API                         │
│                          ▼                                  │
│    ┌─────────────────────────────────────────────┐         │
│    │            Java Backend                     │         │
│    │  • Spring Boot                              │         │
│    │  • MinIO Java SDK                           │         │
│    │  • Generate presigned URLs                  │         │
│    │  • User authentication                      │         │
│    │  • Access control                           │         │
│    └─────────────────────┬───────────────────────┘         │
│                          │                                  │
│                          │ S3 API                           │
│                          ▼                                  │
│    ┌─────────────────────────────────────────────┐         │
│    │              MinIO Server                   │         │
│    │  • Object storage                           │         │
│    │  • Bucket per user/organization             │         │
│    │  • Versioning                               │         │
│    │  • Lifecycle policies                       │         │
│    └─────────────────────────────────────────────┘         │
│                                                             │
│  Features:                                                  │
│  • Upload files lên đến GB với multipart upload            │
│  • Download files với resume support                        │
│  • Share files qua presigned URLs                          │
│  • Folder organization với object prefixes                  │
│  • File versioning                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Tổng kết các use cases phổ biến:**

| Use Case | Bucket Strategy | Key Features |
|----------|-----------------|--------------|
| Media Storage | Bucket per content type | Presigned URLs, CDN integration |
| Backup/DR | Bucket per source system | Versioning, Lifecycle, Replication |
| Data Lake | Bucket per data domain | S3 Select, Parquet support |
| ML/AI | Bucket per pipeline stage | Large file support, High throughput |
| File Sharing | Bucket per user/org | Presigned URLs, Access policies |
| Log Storage | Bucket per application | Lifecycle rules, Search integration |

// ...existing code...

---

### 1.2 Cài Đặt MinIO Bằng Docker

#### 1.2.1 Yêu cầu hệ thống và chuẩn bị môi trường Docker

**Yêu cầu phần cứng tối thiểu:**

```
┌─────────────────────────────────────────────────────────────┐
│              YÊU CẦU PHẦN CỨNG CHO MINIO                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Development/Testing:                                       │
│  ├── CPU: 2 cores                                          │
│  ├── RAM: 2GB minimum (4GB recommended)                    │
│  ├── Disk: 10GB+ (SSD recommended)                         │
│  └── Network: 100Mbps                                      │
│                                                             │
│  Production (Single Node):                                  │
│  ├── CPU: 4+ cores                                         │
│  ├── RAM: 8GB minimum (16GB recommended)                   │
│  ├── Disk: NVMe SSD recommended                            │
│  └── Network: 1Gbps+                                       │
│                                                             │
│  Production (Distributed):                                  │
│  ├── CPU: 8+ cores per node                                │
│  ├── RAM: 32GB+ per node                                   │
│  ├── Disk: Multiple NVMe SSDs per node                     │
│  └── Network: 10Gbps+ between nodes                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Yêu cầu phần mềm:**

| Phần mềm | Phiên bản tối thiểu | Ghi chú |
|----------|---------------------|---------|
| Docker Engine | 20.10+ | Khuyến nghị bản mới nhất |
| Docker Compose | 2.0+ | Đi kèm Docker Desktop |
| Windows | Windows 10/11 Pro hoặc Enterprise | Cần WSL2 |
| macOS | macOS 10.15+ | Docker Desktop for Mac |
| Linux | Kernel 4.0+ | Native Docker support |

**Cài đặt Docker trên Windows:**

```powershell
# Bước 1: Kiểm tra WSL2 đã được cài đặt chưa
wsl --list --verbose

# Bước 2: Nếu chưa có WSL2, cài đặt
wsl --install

# Bước 3: Tải Docker Desktop từ https://www.docker.com/products/docker-desktop

# Bước 4: Sau khi cài đặt, kiểm tra Docker
docker --version
docker compose version
```

**Cài đặt Docker trên Ubuntu:**

```bash
# Bước 1: Cập nhật package index
sudo apt-get update

# Bước 2: Cài đặt các dependencies
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Bước 3: Thêm Docker GPG key
sudo mkdir -m 0755 -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Bước 4: Thêm Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Bước 5: Cài đặt Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Bước 6: Thêm user vào docker group (không cần sudo)
sudo usermod -aG docker $USER
newgrp docker

# Bước 7: Kiểm tra Docker
docker --version
docker compose version
```

**Kiểm tra Docker đã sẵn sàng:**

```bash
# Kiểm tra Docker daemon đang chạy
docker info

# Chạy container test
docker run hello-world

# Kiểm tra có thể pull image từ Docker Hub
docker pull minio/minio:latest
```

---

#### 1.2.2 Tạo Docker Compose file cho MinIO

**Cấu trúc thư mục project:**

```
minio-project/
├── docker-compose.yml          # Docker Compose configuration
├── .env                        # Environment variables
├── data/                       # MinIO data directory
│   └── minio/                  # Mounted volume for MinIO
├── config/                     # Configuration files
│   └── cors.json              # CORS configuration
└── scripts/                    # Utility scripts
    └── init-bucket.sh         # Script khởi tạo bucket
```

**Docker Compose cơ bản (Single Node):**

```yaml
# filepath: docker-compose.yml
version: '3.8'

services:
  minio:
    image: minio/minio:latest
    container_name: minio
    ports:
      - "9000:9000"   # MinIO API port
      - "9001:9001"   # MinIO Console port
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-minioadmin}
    volumes:
      - ./data/minio:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 30s
      timeout: 20s
      retries: 3
    restart: unless-stopped
```

**Docker Compose nâng cao (với nhiều tính năng):**

```yaml
# filepath: docker-compose.yml
version: '3.8'

services:
  minio:
    image: minio/minio:RELEASE.2024-01-01T00-00-00Z
    container_name: minio-server
    hostname: minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      # Credentials
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
      
      # Server configuration
      MINIO_BROWSER: "on"
      MINIO_BROWSER_REDIRECT_URL: ${MINIO_BROWSER_REDIRECT_URL:-http://localhost:9001}
      
      # Region (optional, for S3 compatibility)
      MINIO_REGION_NAME: ${MINIO_REGION:-us-east-1}
      
      # Logging
      MINIO_LOGGER_WEBHOOK_ENABLE: "off"
      
      # Prometheus metrics
      MINIO_PROMETHEUS_AUTH_TYPE: "public"
    volumes:
      - minio-data:/data
      - ./config:/root/.minio
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3
      start_period: 10s
    restart: unless-stopped
    networks:
      - minio-network
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '0.5'
          memory: 512M

  # MinIO Client container để quản lý
  mc:
    image: minio/mc:latest
    container_name: minio-mc
    depends_on:
      minio:
        condition: service_healthy
    entrypoint: >
      /bin/sh -c "
      mc alias set myminio http://minio:9000 ${MINIO_ROOT_USER} ${MINIO_ROOT_PASSWORD};
      mc admin info myminio;
      exit 0;
      "
    networks:
      - minio-network

volumes:
  minio-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ./data/minio

networks:
  minio-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

**Docker Compose cho Multi-Node (Distributed Mode):**

```yaml
# filepath: docker-compose-distributed.yml
version: '3.8'

# Distributed MinIO với 4 nodes, mỗi node 1 drive
# Minimum: 4 drives cho erasure coding

x-minio-common: &minio-common
  image: minio/minio:latest
  command: server --console-address ":9001" http://minio{1...4}/data
  environment:
    MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minioadmin}
    MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-minioadmin}
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
    interval: 30s
    timeout: 20s
    retries: 3

services:
  minio1:
    <<: *minio-common
    container_name: minio1
    hostname: minio1
    volumes:
      - minio1-data:/data
    ports:
      - "9001:9000"
      - "9011:9001"
    networks:
      - minio-distributed

  minio2:
    <<: *minio-common
    container_name: minio2
    hostname: minio2
    volumes:
      - minio2-data:/data
    ports:
      - "9002:9000"
      - "9012:9001"
    networks:
      - minio-distributed

  minio3:
    <<: *minio-common
    container_name: minio3
    hostname: minio3
    volumes:
      - minio3-data:/data
    ports:
      - "9003:9000"
      - "9013:9001"
    networks:
      - minio-distributed

  minio4:
    <<: *minio-common
    container_name: minio4
    hostname: minio4
    volumes:
      - minio4-data:/data
    ports:
      - "9004:9000"
      - "9014:9001"
    networks:
      - minio-distributed

  # Nginx Load Balancer
  nginx:
    image: nginx:alpine
    container_name: minio-nginx
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - ./config/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - minio1
      - minio2
      - minio3
      - minio4
    networks:
      - minio-distributed

volumes:
  minio1-data:
  minio2-data:
  minio3-data:
  minio4-data:

networks:
  minio-distributed:
    driver: bridge
```

---

#### 1.2.3 Cấu hình biến môi trường cho MinIO container

**File .env cơ bản:**

```bash
# filepath: .env

# ==============================================
# MinIO Server Configuration
# ==============================================

# Root credentials (QUAN TRỌNG: Đổi trong production!)
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123456

# Server settings
MINIO_REGION=us-east-1
MINIO_BROWSER=on

# Console settings
MINIO_BROWSER_REDIRECT_URL=http://localhost:9001

# ==============================================
# Optional Settings
# ==============================================

# Domain configuration (for virtual-host style URLs)
# MINIO_DOMAIN=minio.local

# TLS Configuration
# MINIO_CERTS_DIR=/root/.minio/certs

# Rate limiting
# MINIO_API_REQUESTS_MAX=1000
# MINIO_API_REQUESTS_DEADLINE=10s
```

**File .env cho Production:**

```bash
# filepath: .env.production

# ==============================================
# MinIO Production Configuration
# ==============================================

# Root credentials (Sử dụng strong password!)
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=YourVeryStrongPassword!@#$%^&*()

# Region
MINIO_REGION=ap-southeast-1

# Browser/Console
MINIO_BROWSER=on
MINIO_BROWSER_REDIRECT_URL=https://minio-console.yourdomain.com

# Domain (required for virtual-host style)
MINIO_DOMAIN=s3.yourdomain.com

# TLS
MINIO_CERTS_DIR=/root/.minio/certs

# API Rate Limiting
MINIO_API_REQUESTS_MAX=10000
MINIO_API_REQUESTS_DEADLINE=30s

# Healing
MINIO_HEAL_DISK_CHECK_INTERVAL=1m

# Compression
MINIO_COMPRESSION_ENABLE=on
MINIO_COMPRESSION_EXTENSIONS=.txt,.log,.csv,.json,.xml
MINIO_COMPRESSION_MIME_TYPES=text/*,application/json,application/xml

# Scanner
MINIO_SCANNER_DELAY=10s
MINIO_SCANNER_MAX_WAIT=15s

# Metrics
MINIO_PROMETHEUS_AUTH_TYPE=public
MINIO_PROMETHEUS_URL=http://prometheus:9090
```

**Danh sách các biến môi trường quan trọng:**

```
┌────────────────────────────────┬─────────────────────────────────────────────┐
│         Biến môi trường        │                   Mô tả                     │
├────────────────────────────────┼─────────────────────────────────────────────┤
│ MINIO_ROOT_USER                │ Username của root user                      │
├────────────────────────────────┼─────────────────────────────────────────────┤
│ MINIO_ROOT_PASSWORD            │ Password của root user (min 8 ký tự)        │
├────────────────────────────────┼─────────────────────────────────────────────┤
│ MINIO_REGION                   │ Region name cho S3 compatibility            │
├────────────────────────────────┼─────────────────────────────────────────────┤
│ MINIO_BROWSER                  │ Bật/tắt MinIO Console (on/off)              │
├────────────────────────────────┼─────────────────────────────────────────────┤
│ MINIO_DOMAIN                   │ Domain cho virtual-host style URLs          │
├────────────────────────────────┼─────────────────────────────────────────────┤
│ MINIO_CERTS_DIR                │ Thư mục chứa TLS certificates               │
├────────────────────────────────┼─────────────────────────────────────────────┤
│ MINIO_COMPRESSION_ENABLE       │ Bật compression cho objects                 │
├────────────────────────────────┼─────────────────────────────────────────────┤
│ MINIO_PROMETHEUS_AUTH_TYPE     │ Kiểu auth cho metrics (public/jwt)          │
├────────────────────────────────┼─────────────────────────────────────────────┤
│ MINIO_IDENTITY_LDAP_*          │ Các biến cấu hình LDAP                      │
├────────────────────────────────┼─────────────────────────────────────────────┤
│ MINIO_IDENTITY_OPENID_*        │ Các biến cấu hình OpenID Connect            │
└────────────────────────────────┴─────────────────────────────────────────────┘
```

**Lưu ý bảo mật với biến môi trường:**

```bash
# KHÔNG BAO GIỜ commit file .env vào git
# Thêm vào .gitignore
echo ".env" >> .gitignore
echo ".env.*" >> .gitignore

# Sử dụng Docker secrets trong production (Swarm mode)
# docker-compose.yml với secrets:
```

```yaml
# filepath: docker-compose-secrets.yml
version: '3.8'

services:
  minio:
    image: minio/minio:latest
    secrets:
      - minio_root_user
      - minio_root_password
    environment:
      MINIO_ROOT_USER_FILE: /run/secrets/minio_root_user
      MINIO_ROOT_PASSWORD_FILE: /run/secrets/minio_root_password
    # ...other config

secrets:
  minio_root_user:
    file: ./secrets/root_user.txt
  minio_root_password:
    file: ./secrets/root_password.txt
```

---

#### 1.2.4 Cấu hình volume mapping để lưu trữ dữ liệu persistent

**Các loại volume trong Docker:**

```
┌─────────────────────────────────────────────────────────────┐
│                 DOCKER VOLUME TYPES                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Named Volumes (Recommended for MinIO)                   │
│     ┌─────────────────────────────────────────────┐        │
│     │ volumes:                                    │        │
│     │   minio-data:                               │        │
│     │     driver: local                           │        │
│     └─────────────────────────────────────────────┘        │
│     → Docker quản lý, data ở /var/lib/docker/volumes       │
│                                                             │
│  2. Bind Mounts (Good for development)                      │
│     ┌─────────────────────────────────────────────┐        │
│     │ volumes:                                    │        │
│     │   - ./data/minio:/data                      │        │
│     └─────────────────────────────────────────────┘        │
│     → Map trực tiếp folder host vào container              │
│                                                             │
│  3. tmpfs Mounts (RAM-based, không persistent)             │
│     ┌─────────────────────────────────────────────┐        │
│     │ tmpfs:                                      │        │
│     │   - /tmp                                    │        │
│     └─────────────────────────────────────────────┘        │
│     → Lưu trên RAM, mất khi container stop                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Cấu hình Named Volume:**

```yaml
# filepath: docker-compose.yml
version: '3.8'

services:
  minio:
    image: minio/minio:latest
    volumes:
      # Named volume cho data
      - minio-data:/data
    command: server /data --console-address ":9001"
    # ...other config

volumes:
  minio-data:
    driver: local
    # Không cần driver_opts cho named volume đơn giản
```

**Cấu hình Bind Mount:**

```yaml
# filepath: docker-compose.yml
version: '3.8'

services:
  minio:
    image: minio/minio:latest
    volumes:
      # Bind mount - cần tạo folder trước
      - ./data/minio:/data:rw
      # Mount config folder
      - ./config:/root/.minio:rw
    command: server /data --console-address ":9001"
```

**Cấu hình Named Volume với custom location:**

```yaml
# filepath: docker-compose.yml
version: '3.8'

services:
  minio:
    image: minio/minio:latest
    volumes:
      - minio-data:/data
    command: server /data --console-address ":9001"

volumes:
  minio-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /mnt/ssd/minio-data  # Custom path trên host
```

**Cấu hình Multiple Volumes (cho distributed mode giả lập):**

```yaml
# filepath: docker-compose-multi-volume.yml
version: '3.8'

services:
  minio:
    image: minio/minio:latest
    volumes:
      - minio-data1:/data1
      - minio-data2:/data2
      - minio-data3:/data3
      - minio-data4:/data4
    command: server /data{1...4} --console-address ":9001"
    # ...other config

volumes:
  minio-data1:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ./data/disk1
  minio-data2:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ./data/disk2
  minio-data3:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ./data/disk3
  minio-data4:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ./data/disk4
```

**Script khởi tạo thư mục data:**

```bash
#!/bin/bash
# filepath: scripts/init-data-dirs.sh

# Tạo thư mục data cho single node
mkdir -p ./data/minio

# Tạo thư mục data cho multi-volume
for i in {1..4}; do
    mkdir -p ./data/disk$i
done

# Đặt quyền phù hợp (quan trọng trên Linux)
# MinIO chạy với UID 1000 trong container
sudo chown -R 1000:1000 ./data/

# Kiểm tra
ls -la ./data/
```

**Backup và Restore Volume:**

```bash
# Backup named volume
docker run --rm \
    -v minio-data:/data \
    -v $(pwd)/backup:/backup \
    alpine tar czf /backup/minio-backup-$(date +%Y%m%d).tar.gz -C /data .

# Restore named volume
docker run --rm \
    -v minio-data:/data \
    -v $(pwd)/backup:/backup \
    alpine sh -c "cd /data && tar xzf /backup/minio-backup-20240101.tar.gz"

# Backup bind mount (đơn giản hơn)
tar czf minio-backup-$(date +%Y%m%d).tar.gz ./data/minio/
```

---

#### 1.2.5 Cấu hình network cho MinIO container

**Các loại Docker network:**

```
┌─────────────────────────────────────────────────────────────┐
│                  DOCKER NETWORK TYPES                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. bridge (default)                                        │
│     → Isolated network, containers giao tiếp qua IP        │
│     → Cần port mapping để truy cập từ host                 │
│                                                             │
│  2. host                                                    │
│     → Container dùng network stack của host                │
│     → Không cần port mapping, performance tốt hơn          │
│     → Không hoạt động trên Docker Desktop (Windows/Mac)    │
│                                                             │
│  3. none                                                    │
│     → Không có network, container isolated hoàn toàn       │
│                                                             │
│  4. overlay                                                 │
│     → Multi-host networking cho Docker Swarm               │
│                                                             │
│  5. macvlan                                                 │
│     → Gán MAC address riêng, container như physical device │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Cấu hình Bridge Network (Recommended):**

```yaml
# filepath: docker-compose.yml
version: '3.8'

services:
  minio:
    image: minio/minio:latest
    container_name: minio
    ports:
      - "9000:9000"   # API port
      - "9001:9001"   # Console port
    networks:
      - minio-network
    # ...other config

  # Application backend có thể kết nối qua network name
  backend:
    image: your-backend:latest
    networks:
      - minio-network
    environment:
      MINIO_ENDPOINT: minio:9000  # Dùng container name
    depends_on:
      - minio

networks:
  minio-network:
    driver: bridge
    ipam:
      driver: default
      config:
        - subnet: 172.28.0.0/16
          gateway: 172.28.0.1
```

**Cấu hình với Static IP:**

```yaml
# filepath: docker-compose.yml
version: '3.8'

services:
  minio:
    image: minio/minio:latest
    container_name: minio
    ports:
      - "9000:9000"
      - "9001:9001"
    networks:
      minio-network:
        ipv4_address: 172.28.0.10
    # ...other config

networks:
  minio-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16
```

**Cấu hình Host Network (Linux only):**

```yaml
# filepath: docker-compose-host.yml
version: '3.8'

services:
  minio:
    image: minio/minio:latest
    container_name: minio
    network_mode: host  # Dùng host network
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - ./data/minio:/data
    command: server /data --console-address ":9001" --address ":9000"
    # Không cần ports mapping khi dùng host network
```

**Cấu hình cho Distributed MinIO:**

```yaml
# filepath: docker-compose-distributed-network.yml
version: '3.8'

services:
  minio1:
    image: minio/minio:latest
    hostname: minio1
    networks:
      minio-distributed:
        aliases:
          - minio1.local
    # ...config

  minio2:
    image: minio/minio:latest
    hostname: minio2
    networks:
      minio-distributed:
        aliases:
          - minio2.local
    # ...config

networks:
  minio-distributed:
    driver: bridge
    driver_opts:
      com.docker.network.driver.mtu: 9000  # Jumbo frames
    ipam:
      config:
        - subnet: 172.30.0.0/16
```

**Cấu hình DNS và Hostname:**

```yaml
# filepath: docker-compose.yml
version: '3.8'

services:
  minio:
    image: minio/minio:latest
    container_name: minio
    hostname: minio.local
    domainname: minio.local
    dns:
      - 8.8.8.8
      - 8.8.4.4
    dns_search:
      - local
    extra_hosts:
      - "host.docker.internal:host-gateway"  # Truy cập host từ container
    networks:
      - minio-network
    # ...other config
```

**Kiểm tra network:**

```bash
# Liệt kê các network
docker network ls

# Xem chi tiết network
docker network inspect minio-network

# Test kết nối từ container khác
docker run --rm --network minio-network alpine ping minio

# Test kết nối MinIO API
docker run --rm --network minio-network curlimages/curl \
    curl -I http://minio:9000/minio/health/live
```

---

#### 1.2.6 Khởi động và kiểm tra trạng thái MinIO container

**Khởi động MinIO:**

```bash
# Khởi động với docker-compose
docker compose up -d

# Xem logs khi khởi động
docker compose up -d && docker compose logs -f minio

# Khởi động và rebuild nếu có thay đổi
docker compose up -d --build

# Khởi động với file .env cụ thể
docker compose --env-file .env.production up -d
```

**Các lệnh quản lý container:**

```bash
# Xem trạng thái containers
docker compose ps

# Output mẫu:
# NAME      IMAGE              COMMAND                  SERVICE   STATUS          PORTS
# minio     minio/minio:latest "minio server /data …"  minio     Up 2 minutes    0.0.0.0:9000-9001->9000-9001/tcp

# Xem logs
docker compose logs minio
docker compose logs -f minio          # Follow mode
docker compose logs --tail 100 minio  # 100 dòng cuối

# Stop containers
docker compose stop

# Start containers đã stop
docker compose start

# Restart containers
docker compose restart

# Stop và remove containers
docker compose down

# Stop, remove containers và volumes
docker compose down -v
```

**Kiểm tra health của MinIO:**

```bash
# Kiểm tra container health status
docker inspect --format='{{.State.Health.Status}}' minio

# Kiểm tra health endpoint bằng curl
curl -f http://localhost:9000/minio/health/live
# Response: OK (nếu healthy)

curl -f http://localhost:9000/minio/health/ready
# Response: OK (nếu ready to serve)

# Kiểm tra cluster health (cho distributed mode)
curl http://localhost:9000/minio/health/cluster
```

**Script kiểm tra tự động:**

```bash
#!/bin/bash
# filepath: scripts/check-minio-health.sh

MINIO_ENDPOINT="http://localhost:9000"
MAX_RETRIES=30
RETRY_INTERVAL=2

echo "Waiting for MinIO to be ready..."

for i in $(seq 1 $MAX_RETRIES); do
    if curl -sf "${MINIO_ENDPOINT}/minio/health/live" > /dev/null 2>&1; then
        echo "✓ MinIO is live!"
        
        if curl -sf "${MINIO_ENDPOINT}/minio/health/ready" > /dev/null 2>&1; then
            echo "✓ MinIO is ready!"
            exit 0
        fi
    fi
    
    echo "Attempt $i/$MAX_RETRIES - MinIO not ready yet..."
    sleep $RETRY_INTERVAL
done

echo "✗ MinIO failed to start within expected time"
exit 1
```

**Kiểm tra với MinIO Client (mc):**

```bash
# Cài đặt mc (nếu chưa có)
# Windows (PowerShell)
Invoke-WebRequest -Uri "https://dl.min.io/client/mc/release/windows-amd64/mc.exe" -OutFile "mc.exe"

# Linux
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/

# macOS
brew install minio/stable/mc

# Cấu hình alias
mc alias set myminio http://localhost:9000 minioadmin minioadmin

# Kiểm tra kết nối
mc admin info myminio

# Output mẫu:
# ●  localhost:9000
#    Uptime: 2 hours
#    Version: 2024-01-01T00-00-00Z
#    Network: 1/1 OK
#    Drives: 1/1 OK
#    Pool: 1
```

**Kiểm tra logs chi tiết:**

```bash
# Xem logs với timestamp
docker compose logs -t minio

# Xem logs từ thời điểm cụ thể
docker compose logs --since "2024-01-01T00:00:00" minio

# Export logs ra file
docker compose logs minio > minio-logs.txt

# Xem logs realtime với grep
docker compose logs -f minio | grep -i error
```

---

#### 1.2.7 Truy cập MinIO Console qua giao diện web

**Truy cập MinIO Console:**

```
┌─────────────────────────────────────────────────────────────┐
│              MINIO CONSOLE ACCESS                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  URL: http://localhost:9001                                 │
│                                                             │
│  Login:                                                     │
│  ├── Username: minioadmin (MINIO_ROOT_USER)                │
│  └── Password: minioadmin (MINIO_ROOT_PASSWORD)            │
│                                                             │
│  Nếu chạy trên remote server:                              │
│  URL: http://<server-ip>:9001                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Giao diện MinIO Console:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  MinIO Console                                              [User] [⚙] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐  ┌─────────────────────────────────────────────────┐  │
│  │             │  │                                                 │  │
│  │  Dashboard  │  │  Server Status: Online ●                        │  │
│  │             │  │                                                 │  │
│  │  Buckets    │  │  ┌─────────────────────────────────────────┐   │  │
│  │             │  │  │         Storage Usage                   │   │  │
│  │  Access     │  │  │  ████████░░░░░░░░░░░░░░░  35%          │   │  │
│  │  Keys       │  │  │  Used: 35GB / 100GB                    │   │  │
│  │             │  │  └─────────────────────────────────────────┘   │  │
│  │  Users      │  │                                                 │  │
│  │             │  │  ┌─────────────────┐ ┌─────────────────┐       │  │
│  │  Groups     │  │  │ Objects: 1,234  │ │ Buckets: 5      │       │  │
│  │             │  │  └─────────────────┘ └─────────────────┘       │  │
│  │  Policies   │  │                                                 │  │
│  │             │  │  Recent Activity:                               │  │
│  │  Settings   │  │  • Upload: report.pdf to documents             │  │
│  │             │  │  • Download: image.png from images             │  │
│  │  Logs       │  │  • Created bucket: backups                     │  │
│  │             │  │                                                 │  │
│  └─────────────┘  └─────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Các chức năng chính của Console:**

**1. Quản lý Buckets:**

```
Buckets → Create Bucket
┌─────────────────────────────────────────────────────────────┐
│  Create Bucket                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Bucket Name: [my-bucket________________]                   │
│                                                             │
│  Features:                                                  │
│  ☑ Versioning                                              │
│  ☐ Object Locking                                          │
│  ☑ Quota                                                   │
│     └── Hard Quota: [100] GB                               │
│                                                             │
│  [Cancel]                              [Create Bucket]      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**2. Quản lý Objects:**

```bash
# Các thao tác với objects trong Console:
# - Upload files/folders
# - Download files
# - Preview (images, text, JSON)
# - Share (generate presigned URL)
# - Delete
# - View metadata
# - Set tags
```

**3. Quản lý Access Keys:**

```
Access Keys → Create Access Key
┌─────────────────────────────────────────────────────────────┐
│  Create Access Key                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Access Key: [auto-generated or custom_____________]        │
│  Secret Key: [auto-generated or custom_____________]        │
│                                                             │
│  Policy:                                                    │
│  ○ readwrite                                                │
│  ○ readonly                                                 │
│  ○ writeonly                                                │
│  ● Custom Policy                                            │
│     ┌─────────────────────────────────────────────────┐    │
│     │ {                                               │    │
│     │   "Version": "2012-10-17",                      │    │
│     │   "Statement": [...]                            │    │
│     │ }                                               │    │
│     └─────────────────────────────────────────────────┘    │
│                                                             │
│  Expiry: ○ No expiry  ○ Expires on [____________]          │
│                                                             │
│  [Cancel]                              [Create]             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**4. Monitoring và Metrics:**

```
Dashboard → Metrics
┌─────────────────────────────────────────────────────────────┐
│  Server Metrics                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  API Requests (last 24h)                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │     ╭──╮                                            │   │
│  │    ╭╯  ╰╮   ╭─╮                                     │   │
│  │  ──╯    ╰───╯ ╰────────────────────────────────     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ GET: 45,231 │ │ PUT: 12,456 │ │ DELETE: 234 │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
│                                                             │
│  Network I/O                                                │
│  ├── Inbound:  125 MB/s                                    │
│  └── Outbound: 89 MB/s                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Cấu hình Console URL cho production:**

```yaml
# filepath: docker-compose.yml
services:
  minio:
    image: minio/minio:latest
    environment:
      # Redirect URL khi truy cập Console
      MINIO_BROWSER_REDIRECT_URL: https://console.minio.yourdomain.com
      
      # Hoặc disable Console trong production (chỉ API)
      # MINIO_BROWSER: "off"
```

**Nginx reverse proxy cho Console:**

```nginx
# filepath: config/nginx-console.conf
server {
    listen 80;
    server_name console.minio.local;

    # Allow special characters in headers
    ignore_invalid_headers off;
    # Allow any size file to be uploaded
    client_max_body_size 0;
    # Disable buffering
    proxy_buffering off;
    proxy_request_buffering off;

    location / {
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-NginX-Proxy true;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        proxy_connect_timeout 300;
        proxy_pass http://minio:9001;
    }
}
```

**Troubleshooting Console access:**

```bash
# Kiểm tra Console có chạy không
curl -I http://localhost:9001

# Kiểm tra Console logs
docker compose logs minio | grep -i console

# Kiểm tra port binding
docker port minio

# Kiểm tra firewall (Linux)
sudo ufw status
sudo ufw allow 9001/tcp

# Kiểm tra firewall (Windows)
netsh advfirewall firewall show rule name="MinIO Console"
```

// ...existing code...

---

### 1.3 Cài Đặt MinIO Trên Máy Ảo Ubuntu

#### 1.3.1 Yêu cầu hệ thống và chuẩn bị máy ảo Ubuntu

**Yêu cầu phần cứng:**

```
┌─────────────────────────────────────────────────────────────┐
│         YÊU CẦU PHẦN CỨNG CHO MINIO TRÊN UBUNTU            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Development/Testing:                                       │
│  ├── CPU: 2 vCPUs                                          │
│  ├── RAM: 2GB minimum (4GB recommended)                    │
│  ├── Disk: 20GB+ (SSD recommended)                         │
│  ├── Network: 1 NIC với static IP                          │
│  └── OS: Ubuntu 20.04 LTS / 22.04 LTS / 24.04 LTS         │
│                                                             │
│  Production (Single Node):                                  │
│  ├── CPU: 4+ vCPUs (8+ recommended)                        │
│  ├── RAM: 8GB minimum (16GB+ recommended)                  │
│  ├── Disk: Multiple NVMe SSDs                              │
│  ├── Network: 1Gbps+ NIC                                   │
│  └── OS: Ubuntu 22.04 LTS Server                           │
│                                                             │
│  Production (Distributed):                                  │
│  ├── CPU: 8+ vCPUs per node                                │
│  ├── RAM: 32GB+ per node                                   │
│  ├── Disk: 4+ NVMe SSDs per node (tối thiểu 4 drives)     │
│  ├── Network: 10Gbps+ between nodes                        │
│  └── Nodes: Minimum 4 nodes cho erasure coding            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Yêu cầu phần mềm:**

| Phần mềm | Phiên bản | Ghi chú |
|----------|-----------|---------|
| Ubuntu Server | 20.04 / 22.04 / 24.04 LTS | Khuyến nghị 22.04 LTS |
| Kernel | 5.4+ | Kiểm tra: `uname -r` |
| systemd | 245+ | Kiểm tra: `systemctl --version` |
| curl/wget | Latest | Để tải MinIO binary |
| XFS filesystem | Recommended | Hiệu năng tốt hơn ext4 |

**Tạo máy ảo Ubuntu (VirtualBox):**

```bash
# Cấu hình máy ảo đề xuất:
# - Name: minio-server
# - Type: Linux
# - Version: Ubuntu (64-bit)
# - Memory: 4096 MB
# - Hard disk: 50 GB (VDI, dynamically allocated)
# - Network: Bridged Adapter (để có IP trong mạng LAN)

# Sau khi cài Ubuntu Server, cập nhật hệ thống:
sudo apt update && sudo apt upgrade -y

# Cài đặt các package cần thiết
sudo apt install -y curl wget net-tools htop
```

**Tạo máy ảo Ubuntu (VMware):**

```bash
# Cấu hình máy ảo đề xuất:
# - Guest OS: Ubuntu 64-bit
# - CPUs: 2
# - Memory: 4 GB
# - Hard Disk: 50 GB
# - Network: NAT hoặc Bridged

# Cài đặt VMware Tools (optional nhưng recommended)
sudo apt install -y open-vm-tools
```

**Cấu hình network tĩnh (Static IP):**

```bash
# Kiểm tra tên network interface
ip a

# Chỉnh sửa file netplan (Ubuntu 18.04+)
sudo nano /etc/netplan/00-installer-config.yaml
```

```yaml
# filepath: /etc/netplan/00-installer-config.yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    enp0s3:  # Thay bằng tên interface của bạn
      addresses:
        - 192.168.1.100/24  # IP tĩnh cho MinIO server
      routes:
        - to: default
          via: 192.168.1.1  # Gateway
      nameservers:
        addresses:
          - 8.8.8.8
          - 8.8.4.4
```

```bash
# Áp dụng cấu hình
sudo netplan apply

# Kiểm tra IP
ip a
```

**Cấu hình hostname:**

```bash
# Đặt hostname
sudo hostnamectl set-hostname minio-server

# Thêm vào /etc/hosts
echo "192.168.1.100 minio-server" | sudo tee -a /etc/hosts

# Kiểm tra
hostname
```

**Kiểm tra hệ thống trước khi cài MinIO:**

```bash
#!/bin/bash
# filepath: scripts/check-system.sh

echo "=== System Check for MinIO ==="

# Kiểm tra OS
echo -e "\n[OS Information]"
cat /etc/os-release | grep -E "^(NAME|VERSION)="

# Kiểm tra Kernel
echo -e "\n[Kernel Version]"
uname -r

# Kiểm tra CPU
echo -e "\n[CPU Information]"
nproc
lscpu | grep "Model name"

# Kiểm tra RAM
echo -e "\n[Memory Information]"
free -h

# Kiểm tra Disk
echo -e "\n[Disk Information]"
df -h /

# Kiểm tra Network
echo -e "\n[Network Information]"
ip -4 addr show | grep inet

# Kiểm tra Time
echo -e "\n[Time Configuration]"
timedatectl status | grep -E "(Time zone|NTP)"

echo -e "\n=== Check Complete ==="
```

---

#### 1.3.2 Tải và cài đặt MinIO binary trên Ubuntu

**Tải MinIO Server binary:**

```bash
# Tạo thư mục tạm để download
cd /tmp

# Tải MinIO binary mới nhất cho Linux AMD64
wget https://dl.min.io/server/minio/release/linux-amd64/minio

# Hoặc dùng curl
curl -O https://dl.min.io/server/minio/release/linux-amd64/minio

# Kiểm tra file đã tải
ls -lh minio
# Output: -rw-rw-r-- 1 user user 98M Nov 29 10:00 minio
```

**Cài đặt MinIO binary:**

```bash
# Cấp quyền thực thi
chmod +x minio

# Di chuyển vào thư mục binary hệ thống
sudo mv minio /usr/local/bin/

# Kiểm tra cài đặt
minio --version
# Output: minio version RELEASE.2024-XX-XXTXX-XX-XXZ

# Kiểm tra help
minio --help
```

**Tải MinIO Client (mc) - Optional nhưng recommended:**

```bash
# Tải mc binary
cd /tmp
wget https://dl.min.io/client/mc/release/linux-amd64/mc

# Cấp quyền và cài đặt
chmod +x mc
sudo mv mc /usr/local/bin/

# Kiểm tra
mc --version
```

**Cài đặt từ DEB package (Alternative):**

```bash
# Tải DEB package
wget https://dl.min.io/server/minio/release/linux-amd64/archive/minio_20240101000000.0.0_amd64.deb

# Cài đặt
sudo dpkg -i minio_20240101000000.0.0_amd64.deb

# Nếu có dependency issues
sudo apt-get install -f
```

**Script cài đặt tự động:**

```bash
#!/bin/bash
# filepath: scripts/install-minio.sh

set -e

MINIO_VERSION="latest"  # Hoặc chỉ định version cụ thể
INSTALL_DIR="/usr/local/bin"

echo "=== Installing MinIO Server ==="

# Tải MinIO
echo "[1/4] Downloading MinIO..."
cd /tmp
wget -q https://dl.min.io/server/minio/release/linux-amd64/minio -O minio

# Cài đặt
echo "[2/4] Installing MinIO..."
chmod +x minio
sudo mv minio ${INSTALL_DIR}/

# Tải mc
echo "[3/4] Downloading MinIO Client (mc)..."
wget -q https://dl.min.io/client/mc/release/linux-amd64/mc -O mc
chmod +x mc
sudo mv mc ${INSTALL_DIR}/

# Kiểm tra
echo "[4/4] Verifying installation..."
minio --version
mc --version

echo ""
echo "=== Installation Complete ==="
echo "MinIO binary location: ${INSTALL_DIR}/minio"
echo "MinIO Client location: ${INSTALL_DIR}/mc"
```

---

#### 1.3.3 Tạo user và group riêng cho MinIO service

**Tại sao cần tạo user riêng:**

```
┌─────────────────────────────────────────────────────────────┐
│         LÝ DO TẠO USER RIÊNG CHO MINIO                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Bảo mật (Security)                                      │
│     - Nguyên tắc Least Privilege                           │
│     - Giới hạn quyền truy cập hệ thống                    │
│     - Nếu MinIO bị compromise, attacker bị giới hạn       │
│                                                             │
│  2. Quản lý quyền (Permission Management)                   │
│     - Dễ dàng quản lý quyền truy cập data directory        │
│     - Tách biệt với các service khác                       │
│                                                             │
│  3. Audit và Logging                                        │
│     - Dễ track các hoạt động của MinIO                     │
│     - Tách biệt log theo user                              │
│                                                             │
│  4. Resource Management                                     │
│     - Có thể set resource limits (ulimit)                  │
│     - Cgroup management                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Tạo group và user minio-user:**

```bash
# Tạo group minio-user
sudo groupadd -r minio-user

# Tạo user minio-user
# -r: system account
# -g: primary group
# -s: shell (nologin vì không cần login)
# -d: home directory
sudo useradd -r -g minio-user -s /sbin/nologin -d /var/lib/minio minio-user

# Kiểm tra user đã tạo
id minio-user
# Output: uid=999(minio-user) gid=999(minio-user) groups=999(minio-user)

# Kiểm tra trong /etc/passwd
grep minio-user /etc/passwd
# Output: minio-user:x:999:999::/var/lib/minio:/sbin/nologin
```

**Cấu hình quyền cho MinIO binary:**

```bash
# MinIO binary thuộc root nhưng có thể execute bởi tất cả
ls -l /usr/local/bin/minio
# Output: -rwxr-xr-x 1 root root 98M Nov 29 10:00 /usr/local/bin/minio

# Nếu cần, có thể set SUID để chạy với quyền owner (không khuyến nghị)
# sudo chmod u+s /usr/local/bin/minio
```

**Tạo thư mục home cho minio-user:**

```bash
# Tạo thư mục home
sudo mkdir -p /var/lib/minio

# Set ownership
sudo chown minio-user:minio-user /var/lib/minio

# Set permissions
sudo chmod 750 /var/lib/minio

# Kiểm tra
ls -la /var/lib/ | grep minio
# Output: drwxr-x--- 2 minio-user minio-user 4096 Nov 29 10:00 minio
```

**Script tạo user tự động:**

```bash
#!/bin/bash
# filepath: scripts/create-minio-user.sh

set -e

MINIO_USER="minio-user"
MINIO_GROUP="minio-user"
MINIO_HOME="/var/lib/minio"

echo "=== Creating MinIO User and Group ==="

# Kiểm tra group đã tồn tại chưa
if getent group ${MINIO_GROUP} > /dev/null 2>&1; then
    echo "Group ${MINIO_GROUP} already exists"
else
    echo "Creating group ${MINIO_GROUP}..."
    sudo groupadd -r ${MINIO_GROUP}
fi

# Kiểm tra user đã tồn tại chưa
if id ${MINIO_USER} > /dev/null 2>&1; then
    echo "User ${MINIO_USER} already exists"
else
    echo "Creating user ${MINIO_USER}..."
    sudo useradd -r -g ${MINIO_GROUP} -s /sbin/nologin -d ${MINIO_HOME} ${MINIO_USER}
fi

# Tạo home directory
echo "Creating home directory ${MINIO_HOME}..."
sudo mkdir -p ${MINIO_HOME}
sudo chown ${MINIO_USER}:${MINIO_GROUP} ${MINIO_HOME}
sudo chmod 750 ${MINIO_HOME}

# Verify
echo ""
echo "=== Verification ==="
id ${MINIO_USER}
ls -la ${MINIO_HOME}

echo ""
echo "=== User Creation Complete ==="
```

---

#### 1.3.4 Cấu hình thư mục lưu trữ dữ liệu MinIO

**Cấu trúc thư mục đề xuất:**

```
/
├── var/
│   └── lib/
│       └── minio/              # MINIO_HOME - cấu hình và metadata
│           ├── .minio.sys/     # System metadata (tự động tạo)
│           └── certs/          # TLS certificates (nếu có)
│
├── opt/
│   └── minio/                  # Application files
│       ├── bin/                # Binary (alternative location)
│       └── scripts/            # Utility scripts
│
├── srv/
│   └── minio/                  # Data storage
│       └── data/               # Object data
│           ├── bucket1/
│           ├── bucket2/
│           └── .minio.sys/     # Bucket metadata
│
└── etc/
    ├── default/
    │   └── minio               # Environment variables
    └── systemd/
        └── system/
            └── minio.service   # Systemd service file
```

**Tạo thư mục data storage:**

```bash
# Tạo thư mục chính cho data
sudo mkdir -p /srv/minio/data

# Set ownership cho minio-user
sudo chown -R minio-user:minio-user /srv/minio

# Set permissions
sudo chmod -R 750 /srv/minio

# Kiểm tra
ls -la /srv/minio/
```

**Cấu hình với nhiều disk (Distributed/Erasure Coding):**

```bash
# Giả sử có 4 disks mounted tại /mnt/disk1, /mnt/disk2, /mnt/disk3, /mnt/disk4

# Tạo thư mục data trên mỗi disk
for i in {1..4}; do
    sudo mkdir -p /mnt/disk${i}/minio/data
    sudo chown -R minio-user:minio-user /mnt/disk${i}/minio
    sudo chmod -R 750 /mnt/disk${i}/minio
done

# Kiểm tra
for i in {1..4}; do
    echo "=== Disk ${i} ==="
    ls -la /mnt/disk${i}/minio/
done
```

**Cấu hình filesystem (XFS recommended):**

```bash
# Kiểm tra disk hiện tại
lsblk

# Format disk với XFS (CẢNH BÁO: Xóa toàn bộ data!)
# sudo mkfs.xfs /dev/sdb

# Tạo mount point
sudo mkdir -p /mnt/disk1

# Mount disk
sudo mount /dev/sdb /mnt/disk1

# Thêm vào /etc/fstab để mount tự động khi boot
echo '/dev/sdb /mnt/disk1 xfs defaults,noatime 0 2' | sudo tee -a /etc/fstab

# Kiểm tra
df -h /mnt/disk1
```

**Cấu hình với LVM (Logical Volume Manager):**

```bash
# Tạo Physical Volume
sudo pvcreate /dev/sdb /dev/sdc

# Tạo Volume Group
sudo vgcreate minio-vg /dev/sdb /dev/sdc

# Tạo Logical Volume
sudo lvcreate -l 100%FREE -n minio-data minio-vg

# Format với XFS
sudo mkfs.xfs /dev/minio-vg/minio-data

# Mount
sudo mkdir -p /srv/minio/data
sudo mount /dev/minio-vg/minio-data /srv/minio/data

# Thêm vào fstab
echo '/dev/minio-vg/minio-data /srv/minio/data xfs defaults,noatime 0 2' | sudo tee -a /etc/fstab
```

**Script khởi tạo thư mục:**

```bash
#!/bin/bash
# filepath: scripts/init-minio-dirs.sh

set -e

MINIO_USER="minio-user"
MINIO_GROUP="minio-user"
DATA_DIR="/srv/minio/data"
CONFIG_DIR="/var/lib/minio"
CERTS_DIR="/var/lib/minio/certs"

echo "=== Initializing MinIO Directories ==="

# Tạo thư mục data
echo "[1/4] Creating data directory: ${DATA_DIR}"
sudo mkdir -p ${DATA_DIR}
sudo chown -R ${MINIO_USER}:${MINIO_GROUP} /srv/minio
sudo chmod -R 750 /srv/minio

# Tạo thư mục config
echo "[2/4] Creating config directory: ${CONFIG_DIR}"
sudo mkdir -p ${CONFIG_DIR}
sudo chown ${MINIO_USER}:${MINIO_GROUP} ${CONFIG_DIR}
sudo chmod 750 ${CONFIG_DIR}

# Tạo thư mục certs
echo "[3/4] Creating certs directory: ${CERTS_DIR}"
sudo mkdir -p ${CERTS_DIR}
sudo chown ${MINIO_USER}:${MINIO_GROUP} ${CERTS_DIR}
sudo chmod 700 ${CERTS_DIR}

# Kiểm tra
echo "[4/4] Verifying directories..."
echo ""
echo "Data directory:"
ls -la /srv/minio/
echo ""
echo "Config directory:"
ls -la /var/lib/minio/

echo ""
echo "=== Directory Initialization Complete ==="
```

---

#### 1.3.5 Tạo systemd service file cho MinIO

**Tạo file minio.service:**

```bash
sudo nano /etc/systemd/system/minio.service
```

```ini
# filepath: /etc/systemd/system/minio.service
[Unit]
Description=MinIO Object Storage Server
Documentation=https://min.io/docs/minio/linux/index.html
Wants=network-online.target
After=network-online.target
AssertFileIsExecutable=/usr/local/bin/minio

[Service]
# User và Group
User=minio-user
Group=minio-user

# Environment file
EnvironmentFile=-/etc/default/minio

# Working directory
WorkingDirectory=/var/lib/minio

# Command để start MinIO
# Single drive mode
ExecStart=/usr/local/bin/minio server $MINIO_OPTS $MINIO_VOLUMES

# Restart policy
Restart=on-failure
RestartSec=5

# Hardening
ProtectSystem=full
ProtectHome=true
NoNewPrivileges=true
PrivateTmp=true

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

# Timeout
TimeoutStartSec=0
TimeoutStopSec=120

# Logging
StandardOutput=journal
StandardError=inherit

# Send SIGTERM for graceful shutdown
KillSignal=SIGTERM
SendSIGKILL=no

[Install]
WantedBy=multi-user.target
```

**Service file cho Distributed Mode:**

```ini
# filepath: /etc/systemd/system/minio.service (Distributed)
[Unit]
Description=MinIO Distributed Object Storage
Documentation=https://min.io/docs/minio/linux/operations/install-deploy-manage/deploy-minio-multi-node-multi-drive.html
Wants=network-online.target
After=network-online.target
AssertFileIsExecutable=/usr/local/bin/minio

[Service]
User=minio-user
Group=minio-user

EnvironmentFile=-/etc/default/minio

WorkingDirectory=/var/lib/minio

# Distributed mode command
# Ví dụ: 4 nodes với mỗi node 4 drives
ExecStart=/usr/local/bin/minio server $MINIO_OPTS \
    http://minio{1...4}.example.com/mnt/disk{1...4}/minio/data

Restart=on-failure
RestartSec=5

ProtectSystem=full
ProtectHome=true
NoNewPrivileges=true
PrivateTmp=true

LimitNOFILE=65536
LimitNPROC=4096

TimeoutStartSec=0
TimeoutStopSec=120

StandardOutput=journal
StandardError=inherit

KillSignal=SIGTERM
SendSIGKILL=no

[Install]
WantedBy=multi-user.target
```

**Giải thích các directive trong service file:**

```
┌────────────────────────────┬─────────────────────────────────────────────┐
│         Directive          │                   Mô tả                     │
├────────────────────────────┼─────────────────────────────────────────────┤
│ [Unit] Section             │                                             │
├────────────────────────────┼─────────────────────────────────────────────┤
│ Description                │ Mô tả service                               │
│ Wants=network-online       │ Yêu cầu network available                   │
│ After=network-online       │ Start sau khi network ready                 │
│ AssertFileIsExecutable     │ Kiểm tra binary tồn tại và executable      │
├────────────────────────────┼─────────────────────────────────────────────┤
│ [Service] Section          │                                             │
├────────────────────────────┼─────────────────────────────────────────────┤
│ User/Group                 │ Chạy service với user/group này            │
│ EnvironmentFile            │ File chứa biến môi trường                  │
│ WorkingDirectory           │ Thư mục làm việc                           │
│ ExecStart                  │ Command để start service                    │
│ Restart=on-failure         │ Restart nếu exit code != 0                 │
│ RestartSec=5               │ Đợi 5s trước khi restart                   │
│ LimitNOFILE                │ Max số file descriptors                    │
│ LimitNPROC                 │ Max số processes                           │
├────────────────────────────┼─────────────────────────────────────────────┤
│ Security Hardening         │                                             │
├────────────────────────────┼─────────────────────────────────────────────┤
│ ProtectSystem=full         │ Mount /usr, /boot, /etc read-only          │
│ ProtectHome=true           │ Không truy cập /home                       │
│ NoNewPrivileges=true       │ Không thể gain thêm privileges             │
│ PrivateTmp=true            │ Private /tmp namespace                      │
├────────────────────────────┼─────────────────────────────────────────────┤
│ [Install] Section          │                                             │
├────────────────────────────┼─────────────────────────────────────────────┤
│ WantedBy=multi-user        │ Enable ở runlevel 3 (multi-user)           │
└────────────────────────────┴─────────────────────────────────────────────┘
```

**Reload systemd sau khi tạo/sửa service file:**

```bash
# Reload systemd daemon
sudo systemctl daemon-reload

# Kiểm tra service file syntax
sudo systemd-analyze verify minio.service

# Xem status (trước khi start)
sudo systemctl status minio
```

---

#### 1.3.6 Cấu hình biến môi trường trong file environment

**Tạo file environment:**

```bash
sudo nano /etc/default/minio
```

**File environment cơ bản:**

```bash
# filepath: /etc/default/minio

# ==============================================
# MinIO Server Configuration
# ==============================================

# Root credentials - QUAN TRỌNG: ĐỔI TRONG PRODUCTION!
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123456

# Volume/Data directory
# Single drive mode
MINIO_VOLUMES="/srv/minio/data"

# Server options
MINIO_OPTS="--console-address :9001"

# ==============================================
# Optional Settings
# ==============================================

# Region (for S3 compatibility)
# MINIO_REGION=us-east-1

# Browser/Console
# MINIO_BROWSER=on
```

**File environment cho Production:**

```bash
# filepath: /etc/default/minio

# ==============================================
# MinIO Production Configuration
# ==============================================

# Root credentials (Sử dụng strong password!)
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=YourVeryStr0ngP@ssw0rd!2024

# Data volumes
MINIO_VOLUMES="/srv/minio/data"

# Server options
MINIO_OPTS="--console-address :9001 --address :9000"

# Region
MINIO_REGION=ap-southeast-1

# Browser/Console
MINIO_BROWSER=on

# ==============================================
# Performance Tuning
# ==============================================

# API rate limiting
# MINIO_API_REQUESTS_MAX=10000
# MINIO_API_REQUESTS_DEADLINE=30s

# Compression
MINIO_COMPRESSION_ENABLE=on
MINIO_COMPRESSION_EXTENSIONS=.txt,.log,.csv,.json,.xml
MINIO_COMPRESSION_MIME_TYPES=text/*,application/json,application/xml

# Scanner (background tasks)
MINIO_SCANNER_DELAY=10s
MINIO_SCANNER_MAX_WAIT=15s

# ==============================================
# Metrics & Monitoring
# ==============================================

# Prometheus metrics
MINIO_PROMETHEUS_AUTH_TYPE=public
# MINIO_PROMETHEUS_URL=http://prometheus:9090

# ==============================================
# TLS Configuration (uncomment if using TLS)
# ==============================================

# MINIO_CERTS_DIR=/var/lib/minio/certs
```

**File environment cho Distributed Mode:**

```bash
# filepath: /etc/default/minio (Node 1)

# ==============================================
# MinIO Distributed Configuration - Node 1
# ==============================================

# Root credentials (PHẢI GIỐNG NHAU trên tất cả nodes)
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=YourVeryStr0ngP@ssw0rd!2024

# Distributed volumes (4 nodes x 4 drives)
# Format: http://{hostname}/path/to/data
MINIO_VOLUMES="http://minio{1...4}.example.com/mnt/disk{1...4}/minio/data"

# Server options
MINIO_OPTS="--console-address :9001 --address :9000"

# Region
MINIO_REGION=ap-southeast-1

# Browser (có thể disable trên worker nodes)
MINIO_BROWSER=on
```

**Bảo mật file environment:**

```bash
# Đặt permissions chặt chẽ (chỉ root đọc được)
sudo chmod 600 /etc/default/minio
sudo chown root:root /etc/default/minio

# Kiểm tra
ls -la /etc/default/minio
# Output: -rw------- 1 root root 1234 Nov 29 10:00 /etc/default/minio
```

**Danh sách biến môi trường quan trọng:**

```
┌────────────────────────────────┬─────────────────────────────────────────────┐
│         Biến môi trường        │                   Mô tả                     │
├────────────────────────────────┼─────────────────────────────────────────────┤
│ Bắt buộc                       │                                             │
├────────────────────────────────┼─────────────────────────────────────────────┤
│ MINIO_ROOT_USER                │ Username root (min 3 ký tự)                │
│ MINIO_ROOT_PASSWORD            │ Password root (min 8 ký tự)                │
│ MINIO_VOLUMES                  │ Path đến data directory/directories        │
├────────────────────────────────┼─────────────────────────────────────────────┤
│ Server Configuration           │                                             │
├────────────────────────────────┼─────────────────────────────────────────────┤
│ MINIO_OPTS                     │ Command line options                        │
│ MINIO_REGION                   │ Region name cho S3 compatibility            │
│ MINIO_BROWSER                  │ Bật/tắt Console (on/off)                   │
│ MINIO_DOMAIN                   │ Domain cho virtual-host style              │
├────────────────────────────────┼─────────────────────────────────────────────┤
│ TLS Configuration              │                                             │
├────────────────────────────────┼─────────────────────────────────────────────┤
│ MINIO_CERTS_DIR                │ Thư mục chứa certificates                  │
├────────────────────────────────┼─────────────────────────────────────────────┤
│ Performance                    │                                             │
├────────────────────────────────┼─────────────────────────────────────────────┤
│ MINIO_COMPRESSION_ENABLE       │ Bật compression (on/off)                   │
│ MINIO_API_REQUESTS_MAX         │ Max concurrent API requests                │
│ MINIO_SCANNER_DELAY            │ Delay giữa các scan operations             │
├────────────────────────────────┼─────────────────────────────────────────────┤
│ Monitoring                     │                                             │
├────────────────────────────────┼─────────────────────────────────────────────┤
│ MINIO_PROMETHEUS_AUTH_TYPE     │ Auth type cho metrics (public/jwt)         │
└────────────────────────────────┴─────────────────────────────────────────────┘
```

---

#### 1.3.7 Khởi động MinIO service và kiểm tra trạng thái

**Khởi động MinIO service:**

```bash
# Reload systemd (nếu vừa tạo/sửa service file)
sudo systemctl daemon-reload

# Start MinIO
sudo systemctl start minio

# Kiểm tra status
sudo systemctl status minio
```

**Output khi start thành công:**

```
● minio.service - MinIO Object Storage Server
     Loaded: loaded (/etc/systemd/system/minio.service; disabled; vendor preset: enabled)
     Active: active (running) since Fri 2024-11-29 10:00:00 UTC; 5s ago
       Docs: https://min.io/docs/minio/linux/index.html
   Main PID: 12345 (minio)
      Tasks: 10 (limit: 4915)
     Memory: 128.0M
        CPU: 1.234s
     CGroup: /system.slice/minio.service
             └─12345 /usr/local/bin/minio server --console-address :9001 /srv/minio/data

Nov 29 10:00:00 minio-server systemd[1]: Started MinIO Object Storage Server.
Nov 29 10:00:01 minio-server minio[12345]: MinIO Object Storage Server
Nov 29 10:00:01 minio-server minio[12345]: Copyright: 2015-2024 MinIO, Inc.
Nov 29 10:00:01 minio-server minio[12345]: License: GNU AGPLv3 <https://www.gnu.org/licenses/agpl-3.0.html>
Nov 29 10:00:01 minio-server minio[12345]: Version: RELEASE.2024-01-01T00-00-00Z
Nov 29 10:00:01 minio-server minio[12345]: Status: 1 Online, 0 Offline.
Nov 29 10:00:01 minio-server minio[12345]: API: http://192.168.1.100:9000
Nov 29 10:00:01 minio-server minio[12345]: Console: http://192.168.1.100:9001
```

**Các lệnh quản lý service:**

```bash
# Start service
sudo systemctl start minio

# Stop service
sudo systemctl stop minio

# Restart service
sudo systemctl restart minio

# Reload configuration (không restart)
sudo systemctl reload minio

# Xem status chi tiết
sudo systemctl status minio -l

# Xem logs
sudo journalctl -u minio

# Xem logs realtime
sudo journalctl -u minio -f

# Xem logs từ thời điểm cụ thể
sudo journalctl -u minio --since "2024-11-29 10:00:00"

# Xem 100 dòng cuối
sudo journalctl -u minio -n 100
```

**Kiểm tra health endpoints:**

```bash
# Kiểm tra MinIO live
curl http://localhost:9000/minio/health/live
# Response: OK

# Kiểm tra MinIO ready
curl http://localhost:9000/minio/health/ready
# Response: OK

# Kiểm tra với verbose output
curl -v http://localhost:9000/minio/health/live
```

**Kiểm tra với MinIO Client (mc):**

```bash
# Cấu hình alias
mc alias set myminio http://localhost:9000 minioadmin minioadmin123456

# Kiểm tra thông tin server
mc admin info myminio

# Output mẫu:
# ●  localhost:9000
#    Uptime: 5 minutes
#    Version: 2024-01-01T00-00-00Z
#    Network: 1/1 OK
#    Drives: 1/1 OK
#    Pool: 1

# Kiểm tra service status
mc admin service status myminio
```

**Script kiểm tra tự động:**

```bash
#!/bin/bash
# filepath: scripts/check-minio-service.sh

MINIO_ENDPOINT="http://localhost:9000"

echo "=== MinIO Service Health Check ==="

# Kiểm tra systemd service
echo -e "\n[1] Systemd Service Status:"
if systemctl is-active --quiet minio; then
    echo "✓ MinIO service is running"
else
    echo "✗ MinIO service is NOT running"
    exit 1
fi

# Kiểm tra port 9000
echo -e "\n[2] Port 9000 (API):"
if nc -z localhost 9000 2>/dev/null; then
    echo "✓ Port 9000 is open"
else
    echo "✗ Port 9000 is NOT open"
fi

# Kiểm tra port 9001
echo -e "\n[3] Port 9001 (Console):"
if nc -z localhost 9001 2>/dev/null; then
    echo "✓ Port 9001 is open"
else
    echo "✗ Port 9001 is NOT open"
fi

# Kiểm tra health endpoint
echo -e "\n[4] Health Endpoint:"
if curl -sf "${MINIO_ENDPOINT}/minio/health/live" > /dev/null; then
    echo "✓ MinIO is healthy"
else
    echo "✗ MinIO health check failed"
fi

# Kiểm tra ready endpoint
echo -e "\n[5] Ready Endpoint:"
if curl -sf "${MINIO_ENDPOINT}/minio/health/ready" > /dev/null; then
    echo "✓ MinIO is ready"
else
    echo "✗ MinIO is NOT ready"
fi

echo -e "\n=== Health Check Complete ==="
```

**Troubleshooting khi start thất bại:**

```bash
# Xem logs chi tiết
sudo journalctl -u minio -n 50 --no-pager

# Các lỗi thường gặp:

# 1. Permission denied
# → Kiểm tra ownership của data directory
sudo chown -R minio-user:minio-user /srv/minio/data

# 2. Address already in use
# → Kiểm tra process đang dùng port
sudo lsof -i :9000
sudo lsof -i :9001

# 3. Environment file not found
# → Kiểm tra file /etc/default/minio tồn tại
ls -la /etc/default/minio

# 4. Invalid credentials
# → Kiểm tra MINIO_ROOT_USER và MINIO_ROOT_PASSWORD
# → Password phải >= 8 ký tự

# 5. Directory not found
# → Kiểm tra MINIO_VOLUMES path tồn tại
ls -la /srv/minio/data
```

---

#### 1.3.8 Cấu hình MinIO tự động khởi động cùng hệ thống

**Enable service tự động start:**

```bash
# Enable MinIO service
sudo systemctl enable minio

# Output:
# Created symlink /etc/systemd/system/multi-user.target.wants/minio.service 
# → /etc/systemd/system/minio.service

# Kiểm tra đã enable
sudo systemctl is-enabled minio
# Output: enabled

# Xem list services enabled
sudo systemctl list-unit-files | grep minio
# Output: minio.service enabled enabled
```

**Disable service tự động start:**

```bash
# Disable (không tự động start khi boot)
sudo systemctl disable minio

# Kiểm tra
sudo systemctl is-enabled minio
# Output: disabled
```

**Cấu hình dependencies và ordering:**

```ini
# filepath: /etc/systemd/system/minio.service (phần [Unit])
[Unit]
Description=MinIO Object Storage Server
Documentation=https://min.io/docs/minio/linux/index.html

# Dependencies
Wants=network-online.target
After=network-online.target

# Nếu cần mount disk trước
After=local-fs.target
Requires=local-fs.target

# Nếu cần service khác (ví dụ: NTP)
After=chronyd.service
Wants=chronyd.service

# Fail nếu không có binary
AssertFileIsExecutable=/usr/local/bin/minio
AssertPathIsDirectory=/srv/minio/data
```

**Test auto-start bằng reboot:**

```bash
# Reboot hệ thống
sudo reboot

# Sau khi boot, kiểm tra service
sudo systemctl status minio

# Kiểm tra boot time của service
systemd-analyze blame | grep minio
```

**Cấu hình timeout khi shutdown:**

```ini
# filepath: /etc/systemd/system/minio.service (phần [Service])
[Service]
# ...existing config...

# Timeout khi stop (cho phép graceful shutdown)
TimeoutStopSec=120

# Signal để stop (SIGTERM cho graceful)
KillSignal=SIGTERM

# Không gửi SIGKILL
SendSIGKILL=no

# Đợi tối đa 120s cho process tự terminate
# Nếu không, systemd sẽ force kill
```

**Script setup hoàn chỉnh:**

```bash
#!/bin/bash
# filepath: scripts/setup-minio-autostart.sh

set -e

echo "=== Setting Up MinIO Auto-Start ==="

# Reload daemon
echo "[1/4] Reloading systemd daemon..."
sudo systemctl daemon-reload

# Enable service
echo "[2/4] Enabling MinIO service..."
sudo systemctl enable minio

# Start service
echo "[3/4] Starting MinIO service..."
sudo systemctl start minio

# Verify
echo "[4/4] Verifying setup..."
echo ""
echo "Service enabled: $(sudo systemctl is-enabled minio)"
echo "Service active: $(sudo systemctl is-active minio)"

# Show status
echo ""
echo "=== MinIO Service Status ==="
sudo systemctl status minio --no-pager

echo ""
echo "=== Setup Complete ==="
echo ""
echo "MinIO will automatically start on system boot."
echo ""
echo "Access:"
echo "  API:     http://$(hostname -I | awk '{print $1}'):9000"
echo "  Console: http://$(hostname -I | awk '{print $1}'):9001"
```

**Giám sát service với systemd:**

```bash
# Xem tất cả events của service
sudo journalctl -u minio --no-pager

# Xem restart count và failure info
systemctl show minio --property=NRestarts
systemctl show minio --property=ExecMainStartTimestamp
systemctl show minio --property=ActiveState

# Cấu hình notification khi service fail
# Thêm vào /etc/systemd/system/minio.service
```

```ini
# filepath: /etc/systemd/system/minio.service (notification)
[Service]
# ...existing config...

# Notification khi fail
OnFailure=notify-failure@%n.service

# Hoặc gửi email
# OnFailure=email-notification@%n.service
```

**Tổng kết các lệnh systemctl quan trọng:**

```
┌─────────────────────────────────┬─────────────────────────────────────────┐
│           Command               │               Mô tả                     │
├─────────────────────────────────┼─────────────────────────────────────────┤
│ systemctl start minio           │ Start MinIO service                     │
│ systemctl stop minio            │ Stop MinIO service                      │
│ systemctl restart minio         │ Restart MinIO service                   │
│ systemctl status minio          │ Xem status chi tiết                     │
│ systemctl enable minio          │ Enable auto-start khi boot              │
│ systemctl disable minio         │ Disable auto-start                      │
│ systemctl is-active minio       │ Kiểm tra service đang chạy không       │
│ systemctl is-enabled minio      │ Kiểm tra auto-start enabled không      │
│ systemctl daemon-reload         │ Reload systemd sau khi sửa service file │
│ journalctl -u minio             │ Xem logs của service                    │
│ journalctl -u minio -f          │ Follow logs realtime                    │
└─────────────────────────────────┴─────────────────────────────────────────┘
```

// ...existing code...

---

### 1.3 Cài Đặt MinIO Trên Máy Ảo Ubuntu

#### 1.3.1 Yêu cầu hệ thống và chuẩn bị máy ảo Ubuntu

**Yêu cầu phần cứng:**

```
┌─────────────────────────────────────────────────────────────┐
│         YÊU CẦU PHẦN CỨNG CHO MINIO TRÊN UBUNTU            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Development/Testing:                                       │
│  ├── CPU: 2 vCPUs                                          │
│  ├── RAM: 2GB minimum (4GB recommended)                    │
│  ├── Disk: 20GB+ (SSD recommended)                         │
│  ├── Network: 1 NIC với static IP                          │
│  └── OS: Ubuntu 20.04 LTS / 22.04 LTS / 24.04 LTS         │
│                                                             │
│  Production (Single Node):                                  │
│  ├── CPU: 4+ vCPUs (8+ recommended)                        │
│  ├── RAM: 8GB minimum (16GB+ recommended)                  │
│  ├── Disk: Multiple NVMe SSDs                              │
│  ├── Network: 1Gbps+ NIC                                   │
│  └── OS: Ubuntu 22.04 LTS Server                           │
│                                                             │
│  Production (Distributed):                                  │
│  ├── CPU: 8+ vCPUs per node                                │
│  ├── RAM: 32GB+ per node                                   │
│  ├── Disk: 4+ NVMe SSDs per node (tối thiểu 4 drives)     │
│  ├── Network: 10Gbps+ between nodes                        │
│  └── Nodes: Minimum 4 nodes cho erasure coding            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Yêu cầu phần mềm:**

| Phần mềm | Phiên bản | Ghi chú |
|----------|-----------|---------|
| Ubuntu Server | 20.04 / 22.04 / 24.04 LTS | Khuyến nghị 22.04 LTS |
| Kernel | 5.4+ | Kiểm tra: `uname -r` |
| systemd | 245+ | Kiểm tra: `systemctl --version` |
| curl/wget | Latest | Để tải MinIO binary |
| XFS filesystem | Recommended | Hiệu năng tốt hơn ext4 |

**Tạo máy ảo Ubuntu (VirtualBox):**

```bash
# Cấu hình máy ảo đề xuất:
# - Name: minio-server
# - Type: Linux
# - Version: Ubuntu (64-bit)
# - Memory: 4096 MB
# - Hard disk: 50 GB (VDI, dynamically allocated)
# - Network: Bridged Adapter (để có IP trong mạng LAN)

# Sau khi cài Ubuntu Server, cập nhật hệ thống:
sudo apt update && sudo apt upgrade -y

# Cài đặt các package cần thiết
sudo apt install -y curl wget net-tools htop
```

**Tạo máy ảo Ubuntu (VMware):**

```bash
# Cấu hình máy ảo đề xuất:
# - Guest OS: Ubuntu 64-bit
# - CPUs: 2
# - Memory: 4 GB
# - Hard Disk: 50 GB
# - Network: NAT hoặc Bridged

# Cài đặt VMware Tools (optional nhưng recommended)
sudo apt install -y open-vm-tools
```

**Cấu hình network tĩnh (Static IP):**

```bash
# Kiểm tra tên network interface
ip a

# Chỉnh sửa file netplan (Ubuntu 18.04+)
sudo nano /etc/netplan/00-installer-config.yaml
```

```yaml
# filepath: /etc/netplan/00-installer-config.yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    enp0s3:  # Thay bằng tên interface của bạn
      addresses:
        - 192.168.1.100/24  # IP tĩnh cho MinIO server
      routes:
        - to: default
          via: 192.168.1.1  # Gateway
      nameservers:
        addresses:
          - 8.8.8.8
          - 8.8.4.4
```

```bash
# Áp dụng cấu hình
sudo netplan apply

# Kiểm tra IP
ip a
```

**Cấu hình hostname:**

```bash
# Đặt hostname
sudo hostnamectl set-hostname minio-server

# Thêm vào /etc/hosts
echo "192.168.1.100 minio-server" | sudo tee -a /etc/hosts

# Kiểm tra
hostname
```

**Kiểm tra hệ thống trước khi cài MinIO:**

```bash
#!/bin/bash
# filepath: scripts/check-system.sh

echo "=== System Check for MinIO ==="

# Kiểm tra OS
echo -e "\n[OS Information]"
cat /etc/os-release | grep -E "^(NAME|VERSION)="

# Kiểm tra Kernel
echo -e "\n[Kernel Version]"
uname -r

# Kiểm tra CPU
echo -e "\n[CPU Information]"
nproc
lscpu | grep "Model name"

# Kiểm tra RAM
echo -e "\n[Memory Information]"
free -h

# Kiểm tra Disk
echo -e "\n[Disk Information]"
df -h /

# Kiểm tra Network
echo -e "\n[Network Information]"
ip -4 addr show | grep inet

# Kiểm tra Time
echo -e "\n[Time Configuration]"
timedatectl status | grep -E "(Time zone|NTP)"

echo -e "\n=== Check Complete ==="
```

---

#### 1.3.2 Tải và cài đặt MinIO binary trên Ubuntu

**Tải MinIO Server binary:**

```bash
# Tạo thư mục tạm để download
cd /tmp

# Tải MinIO binary mới nhất cho Linux AMD64
wget https://dl.min.io/server/minio/release/linux-amd64/minio

# Hoặc dùng curl
curl -O https://dl.min.io/server/minio/release/linux-amd64/minio

# Kiểm tra file đã tải
ls -lh minio
# Output: -rw-rw-r-- 1 user user 98M Nov 29 10:00 minio
```

**Cài đặt MinIO binary:**

```bash
# Cấp quyền thực thi
chmod +x minio

# Di chuyển vào thư mục binary hệ thống
sudo mv minio /usr/local/bin/

# Kiểm tra cài đặt
minio --version
# Output: minio version RELEASE.2024-XX-XXTXX-XX-XXZ

# Kiểm tra help
minio --help
```

**Tải MinIO Client (mc) - Optional nhưng recommended:**

```bash
# Tải mc binary
cd /tmp
wget https://dl.min.io/client/mc/release/linux-amd64/mc

# Cấp quyền và cài đặt
chmod +x mc
sudo mv mc /usr/local/bin/

# Kiểm tra
mc --version
```

**Cài đặt từ DEB package (Alternative):**

```bash
# Tải DEB package
wget https://dl.min.io/server/minio/release/linux-amd64/archive/minio_20240101000000.0.0_amd64.deb

# Cài đặt
sudo dpkg -i minio_20240101000000.0.0_amd64.deb

# Nếu có dependency issues
sudo apt-get install -f
```

**Script cài đặt tự động:**

```bash
#!/bin/bash
# filepath: scripts/install-minio.sh

set -e

MINIO_VERSION="latest"  # Hoặc chỉ định version cụ thể
INSTALL_DIR="/usr/local/bin"

echo "=== Installing MinIO Server ==="

# Tải MinIO
echo "[1/4] Downloading MinIO..."
cd /tmp
wget -q https://dl.min.io/server/minio/release/linux-amd64/minio -O minio

# Cài đặt
echo "[2/4] Installing MinIO..."
chmod +x minio
sudo mv minio ${INSTALL_DIR}/

# Tải mc
echo "[3/4] Downloading MinIO Client (mc)..."
wget -q https://dl.min.io/client/mc/release/linux-amd64/mc -O mc
chmod +x mc
sudo mv mc ${INSTALL_DIR}/

# Kiểm tra
echo "[4/4] Verifying installation..."
minio --version
mc --version

echo ""
echo "=== Installation Complete ==="
echo "MinIO binary location: ${INSTALL_DIR}/minio"
echo "MinIO Client location: ${INSTALL_DIR}/mc"
```

---

#### 1.3.3 Tạo user và group riêng cho MinIO service

**Tại sao cần tạo user riêng:**

```
┌─────────────────────────────────────────────────────────────┐
│         LÝ DO TẠO USER RIÊNG CHO MINIO                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Bảo mật (Security)                                      │
│     - Nguyên tắc Least Privilege                           │
│     - Giới hạn quyền truy cập hệ thống                    │
│     - Nếu MinIO bị compromise, attacker bị giới hạn       │
│                                                             │
│  2. Quản lý quyền (Permission Management)                   │
│     - Dễ dàng quản lý quyền truy cập data directory        │
│     - Tách biệt với các service khác                       │
│                                                             │
│  3. Audit và Logging                                        │
│     - Dễ track các hoạt động của MinIO                     │
│     - Tách biệt log theo user                              │
│                                                             │
│  4. Resource Management                                     │
│     - Có thể set resource limits (ulimit)                  │
│     - Cgroup management                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Tạo group và user minio-user:**

```bash
# Tạo group minio-user
sudo groupadd -r minio-user

# Tạo user minio-user
# -r: system account
# -g: primary group
# -s: shell (nologin vì không cần login)
# -d: home directory
sudo useradd -r -g minio-user -s /sbin/nologin -d /var/lib/minio minio-user

# Kiểm tra user đã tạo
id minio-user
# Output: uid=999(minio-user) gid=999(minio-user) groups=999(minio-user)

# Kiểm tra trong /etc/passwd
grep minio-user /etc/passwd
# Output: minio-user:x:999:999::/var/lib/minio:/sbin/nologin
```

**Cấu hình quyền cho MinIO binary:**

```bash
# MinIO binary thuộc root nhưng có thể execute bởi tất cả
ls -l /usr/local/bin/minio
# Output: -rwxr-xr-x 1 root root 98M Nov 29 10:00 /usr/local/bin/minio

# Nếu cần, có thể set SUID để chạy với quyền owner (không khuyến nghị)
# sudo chmod u+s /usr/local/bin/minio
```

**Tạo thư mục home cho minio-user:**

```bash
# Tạo thư mục home
sudo mkdir -p /var/lib/minio

# Set ownership
sudo chown minio-user:minio-user /var/lib/minio

# Set permissions
sudo chmod 750 /var/lib/minio

# Kiểm tra
ls -la /var/lib/ | grep minio
# Output: drwxr-x--- 2 minio-user minio-user 4096 Nov 29 10:00 minio
```

**Script tạo user tự động:**

```bash
#!/bin/bash
# filepath: scripts/create-minio-user.sh

set -e

MINIO_USER="minio-user"
MINIO_GROUP="minio-user"
MINIO_HOME="/var/lib/minio"

echo "=== Creating MinIO User and Group ==="

# Kiểm tra group đã tồn tại chưa
if getent group ${MINIO_GROUP} > /dev/null 2>&1; then
    echo "Group ${MINIO_GROUP} already exists"
else
    echo "Creating group ${MINIO_GROUP}..."
    sudo groupadd -r ${MINIO_GROUP}
fi

# Kiểm tra user đã tồn tại chưa
if id ${MINIO_USER} > /dev/null 2>&1; then
    echo "User ${MINIO_USER} already exists"
else
    echo "Creating user ${MINIO_USER}..."
    sudo useradd -r -g ${MINIO_GROUP} -s /sbin/nologin -d ${MINIO_HOME} ${MINIO_USER}
fi

# Tạo home directory
echo "Creating home directory ${MINIO_HOME}..."
sudo mkdir -p ${MINIO_HOME}
sudo chown ${MINIO_USER}:${MINIO_GROUP} ${MINIO_HOME}
sudo chmod 750 ${MINIO_HOME}

# Verify
echo ""
echo "=== Verification ==="
id ${MINIO_USER}
ls -la ${MINIO_HOME}

echo ""
echo "=== User Creation Complete ==="
```

---

#### 1.3.4 Cấu hình thư mục lưu trữ dữ liệu MinIO

**Cấu trúc thư mục đề xuất:**

```
/
├── var/
│   └── lib/
│       └── minio/              # MINIO_HOME - cấu hình và metadata
│           ├── .minio.sys/     # System metadata (tự động tạo)
│           └── certs/          # TLS certificates (nếu có)
│
├── opt/
│   └── minio/                  # Application files
│       ├── bin/                # Binary (alternative location)
│       └── scripts/            # Utility scripts
│
├── srv/
│   └── minio/                  # Data storage
│       └── data/               # Object data
│           ├── bucket1/
│           ├── bucket2/
│           └── .minio.sys/     # Bucket metadata
│
└── etc/
    ├── default/
    │   └── minio               # Environment variables
    └── systemd/
        └── system/
            └── minio.service   # Systemd service file
```

**Tạo thư mục data storage:**

```bash
# Tạo thư mục chính cho data
sudo mkdir -p /srv/minio/data

# Set ownership cho minio-user
sudo chown -R minio-user:minio-user /srv/minio

# Set permissions
sudo chmod -R 750 /srv/minio

# Kiểm tra
ls -la /srv/minio/
```

**Cấu hình với nhiều disk (Distributed/Erasure Coding):**

```bash
# Giả sử có 4 disks mounted tại /mnt/disk1, /mnt/disk2, /mnt/disk3, /mnt/disk4

# Tạo thư mục data trên mỗi disk
for i in {1..4}; do
    sudo mkdir -p /mnt/disk${i}/minio/data
    sudo chown -R minio-user:minio-user /mnt/disk${i}/minio
    sudo chmod -R 750 /mnt/disk${i}/minio
done

# Kiểm tra
for i in {1..4}; do
    echo "=== Disk ${i} ==="
    ls -la /mnt/disk${i}/minio/
done
```

**Cấu hình filesystem (XFS recommended):**

```bash
# Kiểm tra disk hiện tại
lsblk

# Format disk với XFS (CẢNH BÁO: Xóa toàn bộ data!)
# sudo mkfs.xfs /dev/sdb

# Tạo mount point
sudo mkdir -p /mnt/disk1

# Mount disk
sudo mount /dev/sdb /mnt/disk1

# Thêm vào /etc/fstab để mount tự động khi boot
echo '/dev/sdb /mnt/disk1 xfs defaults,noatime 0 2' | sudo tee -a /etc/fstab

# Kiểm tra
df -h /mnt/disk1
```

**Cấu hình với LVM (Logical Volume Manager):**

```bash
# Tạo Physical Volume
sudo pvcreate /dev/sdb /dev/sdc

# Tạo Volume Group
sudo vgcreate minio-vg /dev/sdb /dev/sdc

# Tạo Logical Volume
sudo lvcreate -l 100%FREE -n minio-data minio-vg

# Format với XFS
sudo mkfs.xfs /dev/minio-vg/minio-data

# Mount
sudo mkdir -p /srv/minio/data
sudo mount /dev/minio-vg/minio-data /srv/minio/data

# Thêm vào fstab
echo '/dev/minio-vg/minio-data /srv/minio/data xfs defaults,noatime 0 2' | sudo tee -a /etc/fstab
```

**Script khởi tạo thư mục:**

```bash
#!/bin/bash
# filepath: scripts/init-minio-dirs.sh

set -e

MINIO_USER="minio-user"
MINIO_GROUP="minio-user"
DATA_DIR="/srv/minio/data"
CONFIG_DIR="/var/lib/minio"
CERTS_DIR="/var/lib/minio/certs"

echo "=== Initializing MinIO Directories ==="

# Tạo thư mục data
echo "[1/4] Creating data directory: ${DATA_DIR}"
sudo mkdir -p ${DATA_DIR}
sudo chown -R ${MINIO_USER}:${MINIO_GROUP} /srv/minio
sudo chmod -R 750 /srv/minio

# Tạo thư mục config
echo "[2/4] Creating config directory: ${CONFIG_DIR}"
sudo mkdir -p ${CONFIG_DIR}
sudo chown ${MINIO_USER}:${MINIO_GROUP} ${CONFIG_DIR}
sudo chmod 750 ${CONFIG_DIR}

# Tạo thư mục certs
echo "[3/4] Creating certs directory: ${CERTS_DIR}"
sudo mkdir -p ${CERTS_DIR}
sudo chown ${MINIO_USER}:${MINIO_GROUP} ${CERTS_DIR}
sudo chmod 700 ${CERTS_DIR}

# Kiểm tra
echo "[4/4] Verifying directories..."
echo ""
echo "Data directory:"
ls -la /srv/minio/
echo ""
echo "Config directory:"
ls -la /var/lib/minio/

echo ""
echo "=== Directory Initialization Complete ==="
```

---

#### 1.3.5 Tạo systemd service file cho MinIO

**Tạo file minio.service:**

```bash
sudo nano /etc/systemd/system/minio.service
```

```ini
# filepath: /etc/systemd/system/minio.service
[Unit]
Description=MinIO Object Storage Server
Documentation=https://min.io/docs/minio/linux/index.html
Wants=network-online.target
After=network-online.target
AssertFileIsExecutable=/usr/local/bin/minio

[Service]
# User và Group
User=minio-user
Group=minio-user

# Environment file
EnvironmentFile=-/etc/default/minio

# Working directory
WorkingDirectory=/var/lib/minio

# Command để start MinIO
# Single drive mode
ExecStart=/usr/local/bin/minio server $MINIO_OPTS $MINIO_VOLUMES

# Restart policy
Restart=on-failure
RestartSec=5

# Hardening
ProtectSystem=full
ProtectHome=true
NoNewPrivileges=true
PrivateTmp=true

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

# Timeout
TimeoutStartSec=0
TimeoutStopSec=120

# Logging
StandardOutput=journal
StandardError=inherit

# Send SIGTERM for graceful shutdown
KillSignal=SIGTERM
SendSIGKILL=no

[Install]
WantedBy=multi-user.target
```

**Service file cho Distributed Mode:**

```ini
# filepath: /etc/systemd/system/minio.service (Distributed)
[Unit]
Description=MinIO Distributed Object Storage
Documentation=https://min.io/docs/minio/linux/operations/install-deploy-manage/deploy-minio-multi-node-multi-drive.html
Wants=network-online.target
After=network-online.target
AssertFileIsExecutable=/usr/local/bin/minio

[Service]
User=minio-user
Group=minio-user

EnvironmentFile=-/etc/default/minio

WorkingDirectory=/var/lib/minio

# Distributed mode command
# Ví dụ: 4 nodes với mỗi node 4 drives
ExecStart=/usr/local/bin/minio server $MINIO_OPTS \
    http://minio{1...4}.example.com/mnt/disk{1...4}/minio/data

Restart=on-failure
RestartSec=5

ProtectSystem=full
ProtectHome=true
NoNewPrivileges=true
PrivateTmp=true

LimitNOFILE=65536
LimitNPROC=4096

TimeoutStartSec=0
TimeoutStopSec=120

StandardOutput=journal
StandardError=inherit

KillSignal=SIGTERM
SendSIGKILL=no

[Install]
WantedBy=multi-user.target
```

**Giải thích các directive trong service file:**

```
┌────────────────────────────┬─────────────────────────────────────────────┐
│         Directive          │                   Mô tả                     │
├────────────────────────────┼─────────────────────────────────────────────┤
│ [Unit] Section             │                                             │
├────────────────────────────┼─────────────────────────────────────────────┤
│ Description                │ Mô tả service                               │
│ Wants=network-online       │ Yêu cầu network available                   │
│ After=network-online       │ Start sau khi network ready                 │
│ AssertFileIsExecutable     │ Kiểm tra binary tồn tại và executable      │
├────────────────────────────┼─────────────────────────────────────────────┤
│ [Service] Section          │                                             │
├────────────────────────────┼─────────────────────────────────────────────┤
│ User/Group                 │ Chạy service với user/group này            │
│ EnvironmentFile            │ File chứa biến môi trường                  │
│ WorkingDirectory           │ Thư mục làm việc                           │
│ ExecStart                  │ Command để start service                    │
│ Restart=on-failure         │ Restart nếu exit code != 0                 │
│ RestartSec=5               │ Đợi 5s trước khi restart                   │
│ LimitNOFILE                │ Max số file descriptors                    │
│ LimitNPROC                 │ Max số processes                           │
├────────────────────────────┼─────────────────────────────────────────────┤
│ Security Hardening         │                                             │
├────────────────────────────┼─────────────────────────────────────────────┤
│ ProtectSystem=full         │ Mount /usr, /boot, /etc read-only          │
│ ProtectHome=true           │ Không truy cập /home                       │
│ NoNewPrivileges=true       │ Không thể gain thêm privileges             │
│ PrivateTmp=true            │ Private /tmp namespace                      │
├────────────────────────────┼─────────────────────────────────────────────┤
│ [Install] Section          │                                             │
├────────────────────────────┼─────────────────────────────────────────────┤
│ WantedBy=multi-user        │ Enable ở runlevel 3 (multi-user)           │
└────────────────────────────┴─────────────────────────────────────────────┘
```

**Reload systemd sau khi tạo/sửa service file:**

```bash
# Reload systemd daemon
sudo systemctl daemon-reload

# Kiểm tra service file syntax
sudo systemd-analyze verify minio.service

# Xem status (trước khi start)
sudo systemctl status minio
```

---

#### 1.3.6 Cấu hình biến môi trường trong file environment

**Tạo file environment:**

```bash
sudo nano /etc/default/minio
```

**File environment cơ bản:**

```bash
# filepath: /etc/default/minio

# ==============================================
# MinIO Server Configuration
# ==============================================

# Root credentials - QUAN TRỌNG: ĐỔI TRONG PRODUCTION!
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123456

# Volume/Data directory
# Single drive mode
MINIO_VOLUMES="/srv/minio/data"

# Server options
MINIO_OPTS="--console-address :9001"

# ==============================================
# Optional Settings
# ==============================================

# Region (for S3 compatibility)
# MINIO_REGION=us-east-1

# Browser/Console
# MINIO_BROWSER=on
```

**File environment cho Production:**

```bash
# filepath: /etc/default/minio

# ==============================================
# MinIO Production Configuration
# ==============================================

# Root credentials (Sử dụng strong password!)
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=YourVeryStr0ngP@ssw0rd!2024

# Data volumes
MINIO_VOLUMES="/srv/minio/data"

# Server options
MINIO_OPTS="--console-address :9001 --address :9000"

# Region
MINIO_REGION=ap-southeast-1

# Browser/Console
MINIO_BROWSER=on

# ==============================================
# Performance Tuning
# ==============================================

# API rate limiting
# MINIO_API_REQUESTS_MAX=10000
# MINIO_API_REQUESTS_DEADLINE=30s

# Compression
MINIO_COMPRESSION_ENABLE=on
MINIO_COMPRESSION_EXTENSIONS=.txt,.log,.csv,.json,.xml
MINIO_COMPRESSION_MIME_TYPES=text/*,application/json,application/xml

# Scanner (background tasks)
MINIO_SCANNER_DELAY=10s
MINIO_SCANNER_MAX_WAIT=15s

# ==============================================
# Metrics & Monitoring
# ==============================================

# Prometheus metrics
MINIO_PROMETHEUS_AUTH_TYPE=public
# MINIO_PROMETHEUS_URL=http://prometheus:9090

# ==============================================
# TLS Configuration (uncomment if using TLS)
# ==============================================

# MINIO_CERTS_DIR=/var/lib/minio/certs
```

**File environment cho Distributed Mode:**

```bash
# filepath: /etc/default/minio (Node 1)

# ==============================================
# MinIO Distributed Configuration - Node 1
# ==============================================

# Root credentials (PHẢI GIỐNG NHAU trên tất cả nodes)
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=YourVeryStr0ngP@ssw0rd!2024

# Distributed volumes (4 nodes x 4 drives)
# Format: http://{hostname}/path/to/data
MINIO_VOLUMES="http://minio{1...4}.example.com/mnt/disk{1...4}/minio/data"

# Server options
MINIO_OPTS="--console-address :9001 --address :9000"

# Region
MINIO_REGION=ap-southeast-1

# Browser (có thể disable trên worker nodes)
MINIO_BROWSER=on
```

**Bảo mật file environment:**

```bash
# Đặt permissions chặt chẽ (chỉ root đọc được)
sudo chmod 600 /etc/default/minio
sudo chown root:root /etc/default/minio

# Kiểm tra
ls -la /etc/default/minio
# Output: -rw------- 1 root root 1234 Nov 29 10:00 /etc/default/minio
```

**Danh sách biến môi trường quan trọng:**

```
┌────────────────────────────────┬─────────────────────────────────────────────┐
│         Biến môi trường        │                   Mô tả                     │
├────────────────────────────────┼─────────────────────────────────────────────┤
│ Bắt buộc                       │                                             │
├────────────────────────────────┼─────────────────────────────────────────────┤
│ MINIO_ROOT_USER                │ Username root (min 3 ký tự)                │
│ MINIO_ROOT_PASSWORD            │ Password root (min 8 ký tự)                │
│ MINIO_VOLUMES                  │ Path đến data directory/directories        │
├────────────────────────────────┼─────────────────────────────────────────────┤
│ Server Configuration           │                                             │
├────────────────────────────────┼─────────────────────────────────────────────┤
│ MINIO_OPTS                     │ Command line options                        │
│ MINIO_REGION                   │ Region name cho S3 compatibility            │
│ MINIO_BROWSER                  │ Bật/tắt Console (on/off)                   │
│ MINIO_DOMAIN                   │ Domain cho virtual-host style              │
├────────────────────────────────┼─────────────────────────────────────────────┤
│ TLS Configuration              │                                             │
├────────────────────────────────┼─────────────────────────────────────────────┤
│ MINIO_CERTS_DIR                │ Thư mục chứa certificates                  │
├────────────────────────────────┼─────────────────────────────────────────────┤
│ Performance                    │                                             │
├────────────────────────────────┼─────────────────────────────────────────────┤
│ MINIO_COMPRESSION_ENABLE       │ Bật compression (on/off)                   │
│ MINIO_API_REQUESTS_MAX         │ Max concurrent API requests                │
│ MINIO_SCANNER_DELAY            │ Delay giữa các scan operations             │
├────────────────────────────────┼─────────────────────────────────────────────┤
│ Monitoring                     │                                             │
├────────────────────────────────┼─────────────────────────────────────────────┤
│ MINIO_PROMETHEUS_AUTH_TYPE     │ Auth type cho metrics (public/jwt)         │
└────────────────────────────────┴─────────────────────────────────────────────┘
```

---

#### 1.3.7 Khởi động MinIO service và kiểm tra trạng thái

**Khởi động MinIO service:**

```bash
# Reload systemd (nếu vừa tạo/sửa service file)
sudo systemctl daemon-reload

# Start MinIO
sudo systemctl start minio

# Kiểm tra status
sudo systemctl status minio
```

**Output khi start thành công:**

```
● minio.service - MinIO Object Storage Server
     Loaded: loaded (/etc/systemd/system/minio.service; disabled; vendor preset: enabled)
     Active: active (running) since Fri 2024-11-29 10:00:00 UTC; 5s ago
       Docs: https://min.io/docs/minio/linux/index.html
   Main PID: 12345 (minio)
      Tasks: 10 (limit: 4915)
     Memory: 128.0M
        CPU: 1.234s
     CGroup: /system.slice/minio.service
             └─12345 /usr/local/bin/minio server --console-address :9001 /srv/minio/data

Nov 29 10:00:00 minio-server systemd[1]: Started MinIO Object Storage Server.
Nov 29 10:00:01 minio-server minio[12345]: MinIO Object Storage Server
Nov 29 10:00:01 minio-server minio[12345]: Copyright: 2015-2024 MinIO, Inc.
Nov 29 10:00:01 minio-server minio[12345]: License: GNU AGPLv3 <https://www.gnu.org/licenses/agpl-3.0.html>
Nov 29 10:00:01 minio-server minio[12345]: Version: RELEASE.2024-01-01T00-00-00Z
Nov 29 10:00:01 minio-server minio[12345]: Status: 1 Online, 0 Offline.
Nov 29 10:00:01 minio-server minio[12345]: API: http://192.168.1.100:9000
Nov 29 10:00:01 minio-server minio[12345]: Console: http://192.168.1.100:9001
```

**Các lệnh quản lý service:**

```bash
# Start service
sudo systemctl start minio

# Stop service
sudo systemctl stop minio

# Restart service
sudo systemctl restart minio

# Reload configuration (không restart)
sudo systemctl reload minio

# Xem status chi tiết
sudo systemctl status minio -l

# Xem logs
sudo journalctl -u minio

# Xem logs realtime
sudo journalctl -u minio -f

# Xem logs từ thời điểm cụ thể
sudo journalctl -u minio --since "2024-11-29 10:00:00"

# Xem 100 dòng cuối
sudo journalctl -u minio -n 100
```

**Kiểm tra health endpoints:**

```bash
# Kiểm tra MinIO live
curl http://localhost:9000/minio/health/live
# Response: OK

# Kiểm tra MinIO ready
curl http://localhost:9000/minio/health/ready
# Response: OK

# Kiểm tra với verbose output
curl -v http://localhost:9000/minio/health/live
```

**Kiểm tra với MinIO Client (mc):**

```bash
# Cấu hình alias
mc alias set myminio http://localhost:9000 minioadmin minioadmin123456

# Kiểm tra thông tin server
mc admin info myminio

# Output mẫu:
# ●  localhost:9000
#    Uptime: 5 minutes
#    Version: 2024-01-01T00-00-00Z
#    Network: 1/1 OK
#    Drives: 1/1 OK
#    Pool: 1

# Kiểm tra service status
mc admin service status myminio
```

**Script kiểm tra tự động:**

```bash
#!/bin/bash
# filepath: scripts/check-minio-service.sh

MINIO_ENDPOINT="http://localhost:9000"

echo "=== MinIO Service Health Check ==="

# Kiểm tra systemd service
echo -e "\n[1] Systemd Service Status:"
if systemctl is-active --quiet minio; then
    echo "✓ MinIO service is running"
else
    echo "✗ MinIO service is NOT running"
    exit 1
fi

# Kiểm tra port 9000
echo -e "\n[2] Port 9000 (API):"
if nc -z localhost 9000 2>/dev/null; then
    echo "✓ Port 9000 is open"
else
    echo "✗ Port 9000 is NOT open"
fi

# Kiểm tra port 9001
echo -e "\n[3] Port 9001 (Console):"
if nc -z localhost 9001 2>/dev/null; then
    echo "✓ Port 9001 is open"
else
    echo "✗ Port 9001 is NOT open"
fi

# Kiểm tra health endpoint
echo -e "\n[4] Health Endpoint:"
if curl -sf "${MINIO_ENDPOINT}/minio/health/live" > /dev/null; then
    echo "✓ MinIO is healthy"
else
    echo "✗ MinIO health check failed"
fi

# Kiểm tra ready endpoint
echo -e "\n[5] Ready Endpoint:"
if curl -sf "${MINIO_ENDPOINT}/minio/health/ready" > /dev/null; then
    echo "✓ MinIO is ready"
else
    echo "✗ MinIO is NOT ready"
fi

echo -e "\n=== Health Check Complete ==="
```

**Troubleshooting khi start thất bại:**

```bash
# Xem logs chi tiết
sudo journalctl -u minio -n 50 --no-pager

# Các lỗi thường gặp:

# 1. Permission denied
# → Kiểm tra ownership của data directory
sudo chown -R minio-user:minio-user /srv/minio/data

# 2. Address already in use
# → Kiểm tra process đang dùng port
sudo lsof -i :9000
sudo lsof -i :9001

# 3. Environment file not found
# → Kiểm tra file /etc/default/minio tồn tại
ls -la /etc/default/minio

# 4. Invalid credentials
# → Kiểm tra MINIO_ROOT_USER và MINIO_ROOT_PASSWORD
# → Password phải >= 8 ký tự

# 5. Directory not found
# → Kiểm tra MINIO_VOLUMES path tồn tại
ls -la /srv/minio/data
```

---

#### 1.3.8 Cấu hình MinIO tự động khởi động cùng hệ thống

**Enable service tự động start:**

```bash
# Enable MinIO service
sudo systemctl enable minio

# Output:
# Created symlink /etc/systemd/system/multi-user.target.wants/minio.service 
# → /etc/systemd/system/minio.service

# Kiểm tra đã enable
sudo systemctl is-enabled minio
# Output: enabled

# Xem list services enabled
sudo systemctl list-unit-files | grep minio
# Output: minio.service enabled enabled
```

**Disable service tự động start:**

```bash
# Disable (không tự động start khi boot)
sudo systemctl disable minio

# Kiểm tra
sudo systemctl is-enabled minio
# Output: disabled
```

**Cấu hình dependencies và ordering:**

```ini
# filepath: /etc/systemd/system/minio.service (phần [Unit])
[Unit]
Description=MinIO Object Storage Server
Documentation=https://min.io/docs/minio/linux/index.html

# Dependencies
Wants=network-online.target
After=network-online.target

# Nếu cần mount disk trước
After=local-fs.target
Requires=local-fs.target

# Nếu cần service khác (ví dụ: NTP)
After=chronyd.service
Wants=chronyd.service

# Fail nếu không có binary
AssertFileIsExecutable=/usr/local/bin/minio
AssertPathIsDirectory=/srv/minio/data
```

**Test auto-start bằng reboot:**

```bash
# Reboot hệ thống
sudo reboot

# Sau khi boot, kiểm tra service
sudo systemctl status minio

# Kiểm tra boot time của service
systemd-analyze blame | grep minio
```

**Cấu hình timeout khi shutdown:**

```ini
# filepath: /etc/systemd/system/minio.service (phần [Service])
[Service]
# ...existing config...

# Timeout khi stop (cho phép graceful shutdown)
TimeoutStopSec=120

# Signal để stop (SIGTERM cho graceful)
KillSignal=SIGTERM

# Không gửi SIGKILL
SendSIGKILL=no

# Đợi tối đa 120s cho process tự terminate
# Nếu không, systemd sẽ force kill
```

**Script setup hoàn chỉnh:**

```bash
#!/bin/bash
# filepath: scripts/setup-minio-autostart.sh

set -e

echo "=== Setting Up MinIO Auto-Start ==="

# Reload daemon
echo "[1/4] Reloading systemd daemon..."
sudo systemctl daemon-reload

# Enable service
echo "[2/4] Enabling MinIO service..."
sudo systemctl enable minio

# Start service
echo "[3/4] Starting MinIO service..."
sudo systemctl start minio

# Verify
echo "[4/4] Verifying setup..."
echo ""
echo "Service enabled: $(sudo systemctl is-enabled minio)"
echo "Service active: $(sudo systemctl is-active minio)"

# Show status
echo ""
echo "=== MinIO Service Status ==="
sudo systemctl status minio --no-pager

echo ""
echo "=== Setup Complete ==="
echo ""
echo "MinIO will automatically start on system boot."
echo ""
echo "Access:"
echo "  API:     http://$(hostname -I | awk '{print $1}'):9000"
echo "  Console: http://$(hostname -I | awk '{print $1}'):9001"
```

**Giám sát service với systemd:**

```bash
# Xem tất cả events của service
sudo journalctl -u minio --no-pager

# Xem restart count và failure info
systemctl show minio --property=NRestarts
systemctl show minio --property=ExecMainStartTimestamp
systemctl show minio --property=ActiveState

# Cấu hình notification khi service fail
# Thêm vào /etc/systemd/system/minio.service
```

```ini
# filepath: /etc/systemd/system/minio.service (notification)
[Service]
# ...existing config...

# Notification khi fail
OnFailure=notify-failure@%n.service

# Hoặc gửi email
# OnFailure=email-notification@%n.service
```

**Tổng kết các lệnh systemctl quan trọng:**

```
┌─────────────────────────────────┬─────────────────────────────────────────┐
│           Command               │               Mô tả                     │
├─────────────────────────────────┼─────────────────────────────────────────┤
│ systemctl start minio           │ Start MinIO service                     │
│ systemctl stop minio            │ Stop MinIO service                      │
│ systemctl restart minio         │ Restart MinIO service                   │
│ systemctl status minio          │ Xem status chi tiết                     │
│ systemctl enable minio          │ Enable auto-start khi boot              │
│ systemctl disable minio         │ Disable auto-start                      │
│ systemctl is-active minio       │ Kiểm tra service đang chạy không       │
│ systemctl is-enabled minio      │ Kiểm tra auto-start enabled không      │
│ systemctl daemon-reload         │ Reload systemd sau khi sửa service file │
│ journalctl -u minio             │ Xem logs của service                    │
│ journalctl -u minio -f          │ Follow logs realtime                    │
└─────────────────────────────────┴─────────────────────────────────────────┘
```

// ...existing code...

---

### 1.5 Cấu Hình Khắc Phục Lỗi CORS

#### 1.5.1 Nguyên nhân gây ra lỗi CORS khi truy cập MinIO từ browser

**CORS là gì? - Giải thích cho người mới bắt đầu**

CORS (Cross-Origin Resource Sharing) là một cơ chế bảo mật được tích hợp sẵn trong tất cả các trình duyệt web hiện đại. Để hiểu CORS, trước tiên chúng ta cần hiểu khái niệm "Origin".

**Origin (Nguồn gốc) là gì?**

Origin được xác định bởi 3 thành phần:
- **Protocol** (giao thức): http hoặc https
- **Domain** (tên miền): localhost, example.com, v.v.
- **Port** (cổng): 80, 443, 3000, v.v.

```
┌─────────────────────────────────────────────────────────────┐
│                    CẤU TRÚC CỦA ORIGIN                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  URL: https://myapp.com:3000/path/to/page                   │
│       ├─────┘└──────────┘└───┘└───────────┘                │
│       │         │         │        │                        │
│       │         │         │        └── Path (không thuộc    │
│       │         │         │            Origin)              │
│       │         │         │                                 │
│       │         │         └── Port: 3000                    │
│       │         │                                           │
│       │         └── Domain: myapp.com                       │
│       │                                                     │
│       └── Protocol: https                                   │
│                                                             │
│  Origin = https://myapp.com:3000                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Ví dụ về Same-Origin và Cross-Origin:**

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    SAME-ORIGIN vs CROSS-ORIGIN                             │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Giả sử trang web của bạn đang chạy tại: http://localhost:3000             │
│                                                                            │
│  ┌─────────────────────────────────────┬──────────────┬─────────────────┐  │
│  │           URL đích                  │    Loại      │     Lý do       │  │
│  ├─────────────────────────────────────┼──────────────┼─────────────────┤  │
│  │ http://localhost:3000/api/data      │ Same-Origin  │ Giống hoàn toàn │  │
│  ├─────────────────────────────────────┼──────────────┼─────────────────┤  │
│  │ http://localhost:9000/bucket/file   │ Cross-Origin │ Port khác (9000)│  │
│  ├─────────────────────────────────────┼──────────────┼─────────────────┤  │
│  │ https://localhost:3000/api/data     │ Cross-Origin │ Protocol khác   │  │
│  ├─────────────────────────────────────┼──────────────┼─────────────────┤  │
│  │ http://192.168.1.100:9000/file      │ Cross-Origin │ Domain khác     │  │
│  ├─────────────────────────────────────┼──────────────┼─────────────────┤  │
│  │ http://minio.example.com:9000/file  │ Cross-Origin │ Domain khác     │  │
│  └─────────────────────────────────────┴──────────────┴─────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

**Same-Origin Policy (Chính sách cùng nguồn gốc)**

Same-Origin Policy là một quy tắc bảo mật cơ bản:

> **Nguyên tắc:** Một trang web chỉ có thể đọc dữ liệu từ một nguồn khác nếu nguồn đó có cùng Origin với trang web đang chạy.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SAME-ORIGIN POLICY HOẠT ĐỘNG NHƯ THẾ NÀO                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TRƯỜNG HỢP 1: Same-Origin (ĐƯỢC PHÉP)                                     │
│  ─────────────────────────────────────                                      │
│                                                                             │
│  ┌──────────────────┐         Request          ┌──────────────────┐        │
│  │    Browser       │─────────────────────────►│     Server       │        │
│  │                  │                          │                  │        │
│  │ http://app:3000  │                          │ http://app:3000  │        │
│  │                  │◄─────────────────────────│                  │        │
│  └──────────────────┘         Response         └──────────────────┘        │
│                               ✓ OK                                          │
│                                                                             │
│                                                                             │
│  TRƯỜNG HỢP 2: Cross-Origin KHÔNG CÓ CORS (BỊ CHẶN)                        │
│  ─────────────────────────────────────────────────                          │
│                                                                             │
│  ┌──────────────────┐         Request          ┌──────────────────┐        │
│  │    Browser       │─────────────────────────►│     MinIO        │        │
│  │                  │                          │                  │        │
│  │ http://app:3000  │                          │ http://minio:9000│        │
│  │                  │◄ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │                  │        │
│  └──────────────────┘         Response         └──────────────────┘        │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 🚫 Browser CHẶN response vì:                                        │  │
│  │    - Response không có header Access-Control-Allow-Origin           │  │
│  │    - JavaScript KHÔNG THỂ đọc được response                         │  │
│  │    - Console hiển thị lỗi CORS                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│                                                                             │
│  TRƯỜNG HỢP 3: Cross-Origin CÓ CORS (ĐƯỢC PHÉP)                            │
│  ───────────────────────────────────────────────                            │
│                                                                             │
│  ┌──────────────────┐         Request          ┌──────────────────┐        │
│  │    Browser       │─────────────────────────►│  MinIO (có CORS) │        │
│  │                  │  Origin: http://app:3000 │                  │        │
│  │ http://app:3000  │                          │ http://minio:9000│        │
│  │                  │◄─────────────────────────│                  │        │
│  └──────────────────┘         Response         └──────────────────┘        │
│         │              + Access-Control-Allow-Origin: http://app:3000      │
│         ▼                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ ✓ Browser CHO PHÉP vì:                                              │  │
│  │    - Response có header Access-Control-Allow-Origin phù hợp         │  │
│  │    - JavaScript CÓ THỂ đọc được response                            │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Tại sao trình duyệt cần Same-Origin Policy?**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│          TẠI SAO SAME-ORIGIN POLICY QUAN TRỌNG CHO BẢO MẬT?                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  KỊCH BẢN TẤN CÔNG NẾU KHÔNG CÓ SAME-ORIGIN POLICY:                        │
│                                                                             │
│  1. Bạn đăng nhập vào ngân hàng: https://mybank.com                        │
│     → Browser lưu cookie xác thực của bạn                                  │
│                                                                             │
│  2. Bạn vô tình truy cập trang web độc hại: https://evil.com               │
│                                                                             │
│  3. Trang evil.com chạy JavaScript:                                        │
│     ┌────────────────────────────────────────────────────────────────┐     │
│     │ // Nếu không có Same-Origin Policy, code này sẽ hoạt động!    │     │
│     │ fetch('https://mybank.com/api/transfer', {                     │     │
│     │   method: 'POST',                                              │     │
│     │   credentials: 'include', // Gửi kèm cookie của mybank        │     │
│     │   body: JSON.stringify({                                       │     │
│     │     to: 'hacker_account',                                      │     │
│     │     amount: 1000000                                            │     │
│     │   })                                                           │     │
│     │ }).then(response => response.json())                           │     │
│     │   .then(data => {                                              │     │
│     │     // Đọc được response chứa thông tin tài khoản!            │     │
│     │     sendToHacker(data);                                        │     │
│     │   });                                                          │     │
│     └────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│  VỚI SAME-ORIGIN POLICY:                                                   │
│  → Browser CHẶN JavaScript của evil.com đọc response từ mybank.com        │
│  → Thông tin tài khoản được bảo vệ                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Lỗi CORS trong ngữ cảnh MinIO**

Khi bạn xây dựng ứng dụng file sharing với:
- **Frontend** chạy tại: `http://localhost:3000`
- **MinIO** chạy tại: `http://localhost:9000`

Đây là Cross-Origin vì port khác nhau (3000 ≠ 9000).

**Các trường hợp gây lỗi CORS với MinIO:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              CÁC TRƯỜNG HỢP LỖI CORS VỚI MINIO                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TRƯỜNG HỢP 1: Upload trực tiếp từ browser                                 │
│  ─────────────────────────────────────────                                  │
│                                                                             │
│  ┌─────────────┐   PUT http://minio:9000/bucket/file   ┌─────────────┐     │
│  │  Frontend   │────────────────────────────────────────►│    MinIO    │     │
│  │ :3000       │                                        │    :9000    │     │
│  └─────────────┘                                        └─────────────┘     │
│         │                                                                   │
│         ▼                                                                   │
│  🚫 CORS Error: "No 'Access-Control-Allow-Origin' header"                  │
│                                                                             │
│                                                                             │
│  TRƯỜNG HỢP 2: Download với presigned URL từ browser                       │
│  ───────────────────────────────────────────────────                        │
│                                                                             │
│  ┌─────────────┐  GET http://minio:9000/bucket/file?X-Amz-...  ┌────────┐  │
│  │  Frontend   │────────────────────────────────────────────────►│ MinIO  │  │
│  │ :3000       │                                                │ :9000  │  │
│  └─────────────┘                                                └────────┘  │
│         │                                                                   │
│         ▼                                                                   │
│  🚫 CORS Error nếu muốn đọc response headers hoặc nội dung                 │
│                                                                             │
│                                                                             │
│  TRƯỜNG HỢP 3: Preflight request bị reject                                 │
│  ─────────────────────────────────────────                                  │
│                                                                             │
│  Khi sử dụng custom headers hoặc methods như PUT, DELETE:                  │
│                                                                             │
│  ┌─────────────┐      OPTIONS (Preflight)          ┌─────────────┐         │
│  │  Frontend   │──────────────────────────────────►│    MinIO    │         │
│  │ :3000       │                                   │    :9000    │         │
│  │             │◄─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│             │         │
│  └─────────────┘   Response thiếu CORS headers     └─────────────┘         │
│         │                                                                   │
│         ▼                                                                   │
│  🚫 CORS Error: Preflight request blocked                                  │
│  → Browser KHÔNG gửi request thực sự (PUT, DELETE)                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Preflight Request là gì?**

Preflight là một request "thăm dò" mà browser tự động gửi TRƯỚC request thực sự, để hỏi server: "Tôi có được phép gửi request này không?"

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PREFLIGHT REQUEST CHI TIẾT                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Browser tự động gửi Preflight khi request có:                             │
│  ──────────────────────────────────────────────                             │
│  • HTTP methods: PUT, DELETE, PATCH (không phải GET, POST, HEAD)           │
│  • Custom headers: Authorization, X-Custom-Header, ...                     │
│  • Content-Type khác: application/json (không phải form-data/text)         │
│                                                                             │
│                                                                             │
│  LUỒNG PREFLIGHT:                                                          │
│  ────────────────                                                           │
│                                                                             │
│  [1] JavaScript code:                                                       │
│      fetch('http://minio:9000/bucket/file', {                              │
│        method: 'PUT',                                                       │
│        headers: { 'Content-Type': 'image/png' },                           │
│        body: fileData                                                       │
│      });                                                                    │
│                                                                             │
│  [2] Browser gửi PREFLIGHT trước:                                          │
│      ┌────────────────────────────────────────────────────────────────┐    │
│      │ OPTIONS /bucket/file HTTP/1.1                                  │    │
│      │ Host: minio:9000                                               │    │
│      │ Origin: http://localhost:3000                                  │    │
│      │ Access-Control-Request-Method: PUT                             │    │
│      │ Access-Control-Request-Headers: content-type                   │    │
│      └────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  [3] Server cần trả về CORS headers:                                       │
│      ┌────────────────────────────────────────────────────────────────┐    │
│      │ HTTP/1.1 200 OK                                                │    │
│      │ Access-Control-Allow-Origin: http://localhost:3000             │    │
│      │ Access-Control-Allow-Methods: GET, PUT, POST, DELETE           │    │
│      │ Access-Control-Allow-Headers: content-type                     │    │
│      │ Access-Control-Max-Age: 86400                                  │    │
│      └────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  [4] Nếu Preflight OK → Browser gửi request thực sự (PUT)                  │
│      Nếu Preflight FAIL → Browser CHẶN, không gửi request thực sự          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Lỗi CORS thường gặp trong Console:**

```javascript
// Lỗi 1: Thiếu Allow-Origin header
Access to fetch at 'http://localhost:9000/mybucket/file.jpg' from origin 
'http://localhost:3000' has been blocked by CORS policy: No 
'Access-Control-Allow-Origin' header is present on the requested resource.

// Lỗi 2: Origin không được phép
Access to fetch at 'http://localhost:9000/mybucket/file.jpg' from origin 
'http://localhost:3000' has been blocked by CORS policy: The 
'Access-Control-Allow-Origin' header has a value 'http://example.com' 
that is not equal to the supplied origin.

// Lỗi 3: Preflight failed
Access to fetch at 'http://localhost:9000/mybucket/file.jpg' from origin 
'http://localhost:3000' has been blocked by CORS policy: Response to 
preflight request doesn't pass access control check: No 
'Access-Control-Allow-Origin' header is present on the requested resource.

// Lỗi 4: Method không được phép
Access to fetch at 'http://localhost:9000/mybucket/file.jpg' from origin 
'http://localhost:3000' has been blocked by CORS policy: Method PUT is 
not allowed by Access-Control-Allow-Methods in preflight response.
```

---

#### 1.5.2 Cấu hình CORS cho MinIO bằng MinIO Client (mc)

**Cài đặt MinIO Client (mc)**

MinIO Client (mc) là công cụ command-line chính thức để quản lý MinIO server.

```bash
# ===============================================
# CÀI ĐẶT MC TRÊN WINDOWS
# ===============================================

# Cách 1: Tải trực tiếp binary
# Truy cập: https://dl.min.io/client/mc/release/windows-amd64/mc.exe
# Đặt vào thư mục trong PATH, ví dụ: C:\Windows\System32\

# Cách 2: Dùng PowerShell
Invoke-WebRequest -Uri "https://dl.min.io/client/mc/release/windows-amd64/mc.exe" `
    -OutFile "$env:USERPROFILE\mc.exe"

# Thêm vào PATH (PowerShell as Admin)
$env:PATH += ";$env:USERPROFILE"

# Kiểm tra cài đặt
mc --version
# Output: mc version RELEASE.2024-XX-XX...


# ===============================================
# CÀI ĐẶT MC TRÊN LINUX/macOS
# ===============================================

# Linux AMD64
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/

# macOS (Intel)
brew install minio/stable/mc

# macOS (Apple Silicon)
brew install minio/stable/mc

# Kiểm tra
mc --version
```

**Cấu hình alias để kết nối với MinIO server**

Alias là một "shortcut" để mc có thể kết nối với MinIO server mà không cần gõ lại endpoint và credentials mỗi lần.

```bash
# ===============================================
# TẠO ALIAS CHO MINIO SERVER
# ===============================================

# Cú pháp:
# mc alias set <ALIAS_NAME> <ENDPOINT_URL> <ACCESS_KEY> <SECRET_KEY>

# Ví dụ 1: MinIO local với Docker
mc alias set myminio http://localhost:9000 minioadmin minioadmin

# Ví dụ 2: MinIO trên server với credentials khác
mc alias set production http://192.168.1.100:9000 admin MySecretPassword123

# Ví dụ 3: MinIO với HTTPS
mc alias set secureminio https://minio.example.com myadmin MyStr0ngP@ssw0rd


# ===============================================
# KIỂM TRA ALIAS ĐÃ TẠO
# ===============================================

# Liệt kê tất cả aliases
mc alias list

# Output:
# myminio
#   URL       : http://localhost:9000
#   AccessKey : minioadmin
#   SecretKey : minioadmin
#   API       : S3v4
#   Path      : auto

# Kiểm tra kết nối đến MinIO
mc admin info myminio

# Output (nếu kết nối thành công):
#   ●  localhost:9000
#      Uptime: 2 hours
#      Version: 2024-01-01T00-00-00Z
#      Network: 1/1 OK
#      Drives: 1/1 OK


# ===============================================
# XÓA ALIAS
# ===============================================

mc alias remove myminio
```

**Hiểu về cấu trúc lệnh mc**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CẤU TRÚC LỆNH MC                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  mc <command> <alias>/<bucket>/<object> [options]                          │
│     │          │       │         │         │                                │
│     │          │       │         │         └── Tùy chọn bổ sung            │
│     │          │       │         │                                          │
│     │          │       │         └── Object key (tên file)                 │
│     │          │       │                                                    │
│     │          │       └── Bucket name                                      │
│     │          │                                                            │
│     │          └── Alias đã cấu hình                                       │
│     │                                                                       │
│     └── Lệnh: ls, cp, rm, mb, rb, admin, anonymous, ...                    │
│                                                                             │
│                                                                             │
│  VÍ DỤ:                                                                    │
│  ──────                                                                     │
│                                                                             │
│  mc ls myminio/                         # List tất cả buckets              │
│  mc ls myminio/mybucket/                # List objects trong bucket        │
│  mc mb myminio/newbucket                # Tạo bucket mới                   │
│  mc cp file.txt myminio/mybucket/       # Upload file                      │
│  mc rm myminio/mybucket/file.txt        # Xóa file                         │
│  mc anonymous set public myminio/public # Set bucket public                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Cấu hình CORS với mc - Các lệnh cơ bản**

```bash
# ===============================================
# LỆNH QUẢN LÝ CORS TRONG MC
# ===============================================

# Xem CORS hiện tại của bucket
mc anonymous get-json myminio/mybucket

# Cấu hình CORS cho bucket
# Sử dụng lệnh mc admin config hoặc tạo file JSON

# Cách 1: Set CORS từ file JSON
mc cors set myminio/mybucket cors-config.json

# Cách 2: Xem CORS config hiện tại
mc cors get myminio/mybucket

# Cách 3: Xóa CORS config
mc cors remove myminio/mybucket
```

**Lưu ý quan trọng về CORS trong MinIO:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LƯU Ý VỀ CORS TRONG MINIO                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. CORS được cấu hình ở mức BUCKET, không phải server                     │
│     → Mỗi bucket có thể có cấu hình CORS khác nhau                         │
│                                                                             │
│  2. CORS config được lưu trong metadata của bucket                         │
│     → Persistent, không mất khi restart MinIO                              │
│                                                                             │
│  3. Nếu không cấu hình CORS:                                               │
│     → MinIO sẽ KHÔNG gửi CORS headers trong response                       │
│     → Browser sẽ chặn mọi cross-origin request                             │
│                                                                             │
│  4. Wildcard (*) trong CORS:                                               │
│     → AllowedOrigins: "*" cho phép mọi origin (không an toàn cho prod)     │
│     → AllowedHeaders: "*" cho phép mọi headers                             │
│     → AllowedMethods: phải khai báo cụ thể (GET, PUT, DELETE, ...)         │
│                                                                             │
│  5. CORS không ảnh hưởng đến:                                              │
│     → Request từ server-to-server (không qua browser)                      │
│     → Request từ mc CLI tool                                               │
│     → Request từ backend Java/Python/Node.js                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

#### 1.5.3 Tạo file cấu hình CORS JSON với các header cần thiết

**Cấu trúc của CORS Configuration JSON**

MinIO sử dụng định dạng JSON tương thích với AWS S3 CORS configuration.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CẤU TRÚC CORS CONFIGURATION                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  {                                                                          │
│    "CORSRules": [              ← Mảng các rule, có thể có nhiều rule       │
│      {                                                                      │
│        "AllowedOrigins": [],   ← Các origin được phép                      │
│        "AllowedMethods": [],   ← Các HTTP methods được phép                │
│        "AllowedHeaders": [],   ← Các headers browser được phép gửi        │
│        "ExposeHeaders": [],    ← Các headers browser được phép đọc        │
│        "MaxAgeSeconds": 3000   ← Cache preflight response (giây)          │
│      }                                                                      │
│    ]                                                                        │
│  }                                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Giải thích chi tiết từng trường:**

**1. AllowedOrigins**

```json
// AllowedOrigins: Danh sách các origin được phép truy cập bucket

// Ví dụ 1: Cho phép một origin cụ thể
"AllowedOrigins": ["http://localhost:3000"]

// Ví dụ 2: Cho phép nhiều origins
"AllowedOrigins": [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://myapp.example.com"
]

// Ví dụ 3: Cho phép tất cả origins (KHÔNG khuyến nghị cho production)
"AllowedOrigins": ["*"]

// Ví dụ 4: Sử dụng wildcard subdomain
"AllowedOrigins": ["https://*.example.com"]
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ALLOWEDORIGINS - BEST PRACTICES                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ✓ Development:                                                            │
│    "AllowedOrigins": [                                                      │
│      "http://localhost:3000",    // React dev server                       │
│      "http://localhost:5173",    // Vite dev server                        │
│      "http://127.0.0.1:3000"     // Alternative localhost                  │
│    ]                                                                        │
│                                                                             │
│  ✓ Production:                                                             │
│    "AllowedOrigins": [                                                      │
│      "https://myapp.com",        // Chỉ HTTPS                              │
│      "https://www.myapp.com"     // Với www prefix                         │
│    ]                                                                        │
│                                                                             │
│  ✗ TRÁNH trong Production:                                                 │
│    "AllowedOrigins": ["*"]       // Cho phép tất cả - Không an toàn!       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**2. AllowedMethods**

```json
// AllowedMethods: Các HTTP methods được phép sử dụng

// Chỉ đọc (download)
"AllowedMethods": ["GET", "HEAD"]

// Đọc và ghi (upload + download)
"AllowedMethods": ["GET", "PUT", "POST", "HEAD"]

// Full access (bao gồm xóa)
"AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"]
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ALLOWEDMETHODS - GIẢI THÍCH                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  METHOD     │  MỤC ĐÍCH TRONG MINIO                                        │
│  ───────────┼─────────────────────────────────────────────────────────────  │
│  GET        │  Download object, lấy metadata                               │
│  HEAD       │  Lấy metadata mà không download nội dung                     │
│  PUT        │  Upload object (single part)                                 │
│  POST       │  Multipart upload operations, presigned POST                 │
│  DELETE     │  Xóa object                                                  │
│                                                                             │
│  ⚠️ Không hỗ trợ: PATCH, OPTIONS (OPTIONS tự động xử lý bởi CORS)           │
│                                                                             │
│  KHUYẾN NGHỊ:                                                              │
│  ────────────                                                               │
│  • File sharing app:    ["GET", "PUT", "POST", "DELETE", "HEAD"]           │
│  • Public read bucket:  ["GET", "HEAD"]                                    │
│  • Upload-only bucket:  ["PUT", "POST", "HEAD"]                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**3. AllowedHeaders**

```json
// AllowedHeaders: Headers mà browser được phép gửi trong request

// Cơ bản - cho upload đơn giản
"AllowedHeaders": [
  "Content-Type",
  "Content-Length"
]

// Đầy đủ - cho presigned URLs và multipart upload
"AllowedHeaders": [
  "Authorization",
  "Content-Type",
  "Content-Length",
  "Content-MD5",
  "X-Amz-*",
  "x-amz-*"
]

// Cho phép tất cả headers (tiện lợi nhưng kém an toàn hơn)
"AllowedHeaders": ["*"]
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ALLOWEDHEADERS - GIẢI THÍCH                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  HEADER            │  MỤC ĐÍCH                                              │
│  ──────────────────┼──────────────────────────────────────────────────────  │
│  Content-Type      │  MIME type của file (image/png, video/mp4, ...)       │
│  Content-Length    │  Kích thước file                                      │
│  Content-MD5       │  Checksum để verify integrity                         │
│  Authorization     │  AWS Signature cho authenticated requests             │
│  X-Amz-*           │  Các headers đặc biệt của S3/MinIO                    │
│                    │  - X-Amz-Date: Timestamp của request                  │
│                    │  - X-Amz-Content-Sha256: SHA256 của body             │
│                    │  - X-Amz-Meta-*: Custom metadata                     │
│                                                                             │
│  QUAN TRỌNG:                                                               │
│  ────────────                                                               │
│  • "X-Amz-*" cho phép tất cả headers bắt đầu bằng X-Amz-                   │
│  • Case-insensitive: "x-amz-*" = "X-Amz-*"                                 │
│  • Nếu thiếu header cần thiết → Browser sẽ báo lỗi CORS                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**4. ExposeHeaders**

```json
// ExposeHeaders: Headers trong response mà JavaScript được phép đọc
// Mặc định, browser chỉ cho phép JS đọc 6 "simple" headers:
// - Cache-Control, Content-Language, Content-Type, Expires, 
// - Last-Modified, Pragma

// Để JS đọc được headers khác, phải khai báo trong ExposeHeaders
"ExposeHeaders": [
  "ETag",
  "Content-Length", 
  "Content-Type",
  "x-amz-meta-*"
]
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EXPOSEHEADERS - GIẢI THÍCH                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TẠI SAO CẦN EXPOSEHEADERS?                                                │
│  ──────────────────────────────                                             │
│                                                                             │
│  Khi browser nhận response từ cross-origin request:                        │
│                                                                             │
│  HTTP/1.1 200 OK                                                           │
│  Content-Type: image/png                    ← JS đọc được (simple header)  │
│  Content-Length: 1024000                    ← JS đọc được (simple header)  │
│  ETag: "abc123def456"                       ← JS KHÔNG đọc được mặc định  │
│  X-Amz-Meta-Author: john                    ← JS KHÔNG đọc được mặc định  │
│  X-Amz-Request-Id: ABC123                   ← JS KHÔNG đọc được mặc định  │
│                                                                             │
│  Với ExposeHeaders: ["ETag", "x-amz-meta-*"]                               │
│  → JS có thể đọc ETag và các X-Amz-Meta-* headers                          │
│                                                                             │
│                                                                             │
│  HEADERS QUAN TRỌNG CẦN EXPOSE:                                            │
│  ────────────────────────────────                                           │
│  • ETag: Cần cho multipart upload (phải gửi lại khi complete)             │
│  • Content-Length: Để hiển thị progress download                           │
│  • X-Amz-Meta-*: Custom metadata của object                               │
│  • Accept-Ranges: Để biết server hỗ trợ range request                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**5. MaxAgeSeconds**

```json
// MaxAgeSeconds: Thời gian browser cache kết quả preflight request
// Đơn vị: giây

// Cache 1 giờ
"MaxAgeSeconds": 3600

// Cache 24 giờ (khuyến nghị cho production)
"MaxAgeSeconds": 86400

// Không cache (cho development/debugging)
"MaxAgeSeconds": 0
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MAXAGESECONDS - GIẢI THÍCH                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  KHÔNG CÓ CACHE (MaxAgeSeconds: 0):                                        │
│  ──────────────────────────────────                                         │
│                                                                             │
│  Request 1:  OPTIONS → Preflight → PUT → Upload                            │
│  Request 2:  OPTIONS → Preflight → PUT → Upload   (lại phải preflight!)   │
│  Request 3:  OPTIONS → Preflight → PUT → Upload   (lại phải preflight!)   │
│                                                                             │
│  → Mỗi request đều cần 2 round-trips → Chậm!                               │
│                                                                             │
│                                                                             │
│  CÓ CACHE (MaxAgeSeconds: 86400):                                          │
│  ────────────────────────────────                                           │
│                                                                             │
│  Request 1:  OPTIONS → Preflight → PUT → Upload                            │
│              (Browser cache preflight result)                               │
│  Request 2:  PUT → Upload   (không cần preflight - đã cache!)              │
│  Request 3:  PUT → Upload   (không cần preflight - đã cache!)              │
│  ...                                                                        │
│  (Sau 86400 giây - 24h)                                                    │
│  Request N:  OPTIONS → Preflight → PUT → Upload   (cache hết hạn)          │
│                                                                             │
│  → Chỉ 1 round-trip cho các request tiếp theo → Nhanh hơn!                │
│                                                                             │
│                                                                             │
│  KHUYẾN NGHỊ:                                                              │
│  ────────────                                                               │
│  • Development:  300 - 3600 (5 phút - 1 giờ)                               │
│  • Production:   86400 (24 giờ) hoặc cao hơn                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**File CORS Configuration hoàn chỉnh:**

```json
// filepath: cors-config.json
// Cấu hình CORS đầy đủ cho ứng dụng file sharing

{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
      ],
      "AllowedMethods": [
        "GET",
        "PUT",
        "POST",
        "DELETE",
        "HEAD"
      ],
      "AllowedHeaders": [
        "Authorization",
        "Content-Type",
        "Content-Length",
        "Content-MD5",
        "Cache-Control",
        "X-Amz-Content-Sha256",
        "X-Amz-Date",
        "X-Amz-User-Agent",
        "X-Amz-Meta-*",
        "x-amz-*"
      ],
      "ExposeHeaders": [
        "ETag",
        "Content-Length",
        "Content-Type",
        "Content-Range",
        "Accept-Ranges",
        "X-Amz-Meta-*"
      ],
      "MaxAgeSeconds": 86400
    }
  ]
}
```

**File CORS cho các môi trường khác nhau:**

```json
// filepath: cors-development.json
// Cấu hình cho môi trường Development - Linh hoạt hơn

{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["*"],
      "MaxAgeSeconds": 300
    }
  ]
}
```

```json
// filepath: cors-production.json
// Cấu hình cho môi trường Production - Chặt chẽ hơn

{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "https://myapp.example.com",
        "https://www.myapp.example.com"
      ],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": [
        "Authorization",
        "Content-Type",
        "Content-Length",
        "Content-MD5",
        "X-Amz-Content-Sha256",
        "X-Amz-Date",
        "X-Amz-User-Agent",
        "X-Amz-Meta-*"
      ],
      "ExposeHeaders": [
        "ETag",
        "Content-Length",
        "Content-Type",
        "Content-Range",
        "Accept-Ranges"
      ],
      "MaxAgeSeconds": 86400
    }
  ]
}
```

---

#### 1.5.4 Áp dụng cấu hình CORS cho bucket cụ thể

**Bước 1: Tạo bucket (nếu chưa có)**

```bash
# Kiểm tra bucket đã tồn tại chưa
mc ls myminio/

# Tạo bucket mới
mc mb myminio/mybucket

# Output: Bucket created successfully `myminio/mybucket`.

# Kiểm tra lại
mc ls myminio/
# Output: [2024-11-29 10:00:00 UTC]     0B mybucket/
```

**Bước 2: Tạo file CORS configuration**

```bash
# Tạo file cors-config.json với nội dung đã định nghĩa ở trên
# Windows (PowerShell):
@"
{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "http://localhost:3000",
        "http://localhost:5173"
      ],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": [
        "Authorization",
        "Content-Type",
        "Content-Length",
        "X-Amz-*"
      ],
      "ExposeHeaders": [
        "ETag",
        "Content-Length",
        "Content-Type"
      ],
      "MaxAgeSeconds": 86400
    }
  ]
}
"@ | Out-File -FilePath cors-config.json -Encoding UTF8

# Linux/macOS:
cat > cors-config.json << 'EOF'
{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "http://localhost:3000",
        "http://localhost:5173"
      ],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": [
        "Authorization",
        "Content-Type",
        "Content-Length",
        "X-Amz-*"
      ],
      "ExposeHeaders": [
        "ETag",
        "Content-Length",
        "Content-Type"
      ],
      "MaxAgeSeconds": 86400
    }
  ]
}
EOF
```

**Bước 3: Áp dụng CORS configuration**

```bash
# Cú pháp: mc anonymous set-json <FILE> <ALIAS>/<BUCKET>
# Hoặc sử dụng mc cors set (phiên bản mc mới hơn)

# Phương pháp 1: Sử dụng AWS CLI (nếu đã cài đặt)
aws s3api put-bucket-cors \
    --bucket mybucket \
    --cors-configuration file://cors-config.json \
    --endpoint-url http://localhost:9000

# Phương pháp 2: Sử dụng mc admin (cho phiên bản mc cũ)
# Một số phiên bản mc không có lệnh cors trực tiếp
# Cần sử dụng MinIO Console hoặc AWS CLI

# Phương pháp 3: Sử dụng MinIO Console Web UI
# 1. Truy cập http://localhost:9001
# 2. Đăng nhập với credentials
# 3. Chọn bucket "mybucket"
# 4. Vào tab "Settings" hoặc "Configuration"
# 5. Tìm mục "Access Rules" hoặc "CORS"
# 6. Paste JSON configuration
```

**Áp dụng CORS bằng AWS CLI (Khuyến nghị):**

```bash
# ===============================================
# CÀI ĐẶT AWS CLI
# ===============================================

# Windows (PowerShell as Admin):
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi

# Linux:
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# macOS:
brew install awscli

# Kiểm tra cài đặt
aws --version


# ===============================================
# CẤU HÌNH AWS CLI CHO MINIO
# ===============================================

# Tạo profile cho MinIO
aws configure --profile minio

# Nhập thông tin:
# AWS Access Key ID: minioadmin
# AWS Secret Access Key: minioadmin
# Default region name: us-east-1
# Default output format: json


# ===============================================
# ÁP DỤNG CORS
# ===============================================

# Đặt CORS configuration
aws s3api put-bucket-cors \
    --bucket mybucket \
    --cors-configuration file://cors-config.json \
    --endpoint-url http://localhost:9000 \
    --profile minio

# Output: (không có output nếu thành công)


# ===============================================
# KIỂM TRA CORS ĐÃ ÁP DỤNG
# ===============================================

aws s3api get-bucket-cors \
    --bucket mybucket \
    --endpoint-url http://localhost:9000 \
    --profile minio

# Output:
# {
#     "CORSRules": [
#         {
#             "AllowedOrigins": ["http://localhost:3000", "http://localhost:5173"],
#             "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
#             "AllowedHeaders": ["Authorization", "Content-Type", ...],
#             "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
#             "MaxAgeSeconds": 86400
#         }
#     ]
# }
```

**Áp dụng CORS bằng MinIO Console:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CẤU HÌNH CORS QUA MINIO CONSOLE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Bước 1: Truy cập MinIO Console                                            │
│  ─────────────────────────────                                              │
│  URL: http://localhost:9001                                                 │
│  Username: minioadmin                                                       │
│  Password: minioadmin                                                       │
│                                                                             │
│                                                                             │
│  Bước 2: Chọn Bucket                                                       │
│  ──────────────────                                                         │
│  Menu: Buckets → mybucket → Settings                                       │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  MinIO Console                                        [Admin] [Logout] │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │ ┌───────────┐                                                         │ │
│  │ │ Buckets   │  mybucket                                              │ │
│  │ │ > mybucket│  ├─ Objects                                            │ │
│  │ │           │  ├─ Settings  ← Click vào đây                          │ │
│  │ │ Users     │  └─ Events                                             │ │
│  │ │ Groups    │                                                         │ │
│  │ └───────────┘                                                         │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│                                                                             │
│  Bước 3: Cấu hình Access Rules / CORS                                     │
│  ─────────────────────────────────────                                      │
│  Tìm mục "Access Rules" hoặc "CORS Configuration"                          │
│  Paste JSON configuration vào text area                                     │
│  Click "Save" hoặc "Update"                                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Áp dụng CORS bằng Java SDK:**

```java
// filepath: src/main/java/com/example/minio/CorsConfiguration.java

import io.minio.MinioClient;
import io.minio.SetBucketCorsConfigurationArgs;
import io.minio.messages.*;

import java.util.Arrays;
import java.util.List;

public class CorsConfiguration {
    
    public static void main(String[] args) {
        try {
            // Khởi tạo MinIO Client
            MinioClient minioClient = MinioClient.builder()
                    .endpoint("http://localhost:9000")
                    .credentials("minioadmin", "minioadmin")
                    .build();
            
            // Tạo CORS Rule
            CorsRule corsRule = new CorsRule(
                // AllowedHeaders
                Arrays.asList(
                    "Authorization",
                    "Content-Type",
                    "Content-Length",
                    "X-Amz-*"
                ),
                // AllowedMethods
                Arrays.asList(
                    CorsRule.Method.GET,
                    CorsRule.Method.PUT,
                    CorsRule.Method.POST,
                    CorsRule.Method.DELETE,
                    CorsRule.Method.HEAD
                ),
                // AllowedOrigins
                Arrays.asList(
                    "http://localhost:3000",
                    "http://localhost:5173"
                ),
                // ExposeHeaders
                Arrays.asList(
                    "ETag",
                    "Content-Length",
                    "Content-Type"
                ),
                // MaxAgeSeconds
                86400,
                // ID (optional)
                "CORSRule1"
            );
            
            // Tạo CORS Configuration
            CorsConfiguration corsConfig = new CorsConfiguration(
                Arrays.asList(corsRule)
            );
            
            // Áp dụng CORS cho bucket
            minioClient.setBucketCorsConfiguration(
                SetBucketCorsConfigurationArgs.builder()
                    .bucket("mybucket")
                    .config(corsConfig)
                    .build()
            );
            
            System.out.println("CORS configuration applied successfully!");
            
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
```

**Script tự động áp dụng CORS cho nhiều buckets:**

```bash
#!/bin/bash
# filepath: scripts/apply-cors.sh

# Cấu hình
MINIO_ENDPOINT="http://localhost:9000"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
CORS_FILE="cors-config.json"

# Danh sách buckets cần áp dụng CORS
BUCKETS=(
    "mybucket"
    "uploads"
    "documents"
    "images"
)

echo "=== Applying CORS Configuration ==="
echo "Endpoint: ${MINIO_ENDPOINT}"
echo "CORS File: ${CORS_FILE}"
echo ""

# Kiểm tra file CORS tồn tại
if [ ! -f "${CORS_FILE}" ]; then
    echo "Error: CORS file not found: ${CORS_FILE}"
    exit 1
fi

# Áp dụng CORS cho từng bucket
for bucket in "${BUCKETS[@]}"; do
    echo "Applying CORS to bucket: ${bucket}..."
    
    aws s3api put-bucket-cors \
        --bucket "${bucket}" \
        --cors-configuration "file://${CORS_FILE}" \
        --endpoint-url "${MINIO_ENDPOINT}" \
        --profile minio \
        2>&1
    
    if [ $? -eq 0 ]; then
        echo "✓ CORS applied successfully to ${bucket}"
    else
        echo "✗ Failed to apply CORS to ${bucket}"
    fi
done

echo ""
echo "=== CORS Application Complete ==="
```

---

#### 1.5.5 Kiểm tra cấu hình CORS đã được áp dụng thành công

**Phương pháp 1: Sử dụng AWS CLI**

```bash
# Lấy CORS configuration hiện tại của bucket
aws s3api get-bucket-cors \
    --bucket mybucket \
    --endpoint-url http://localhost:9000 \
    --profile minio

# Output thành công:
# {
#     "CORSRules": [
#         {
#             "AllowedOrigins": ["http://localhost:3000", "http://localhost:5173"],
#             "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
#             "AllowedHeaders": ["Authorization", "Content-Type", "X-Amz-*"],
#             "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
#             "MaxAgeSeconds": 86400
#         }
#     ]
# }

# Nếu chưa cấu hình CORS:
# An error occurred (NoSuchCORSConfiguration) when calling the GetBucketCors 
# operation: The CORS configuration does not exist
```

**Phương pháp 2: Sử dụng curl để test Preflight**

```bash
# ===============================================
# TEST PREFLIGHT REQUEST (OPTIONS)
# ===============================================

# Gửi preflight request giả lập từ browser
curl -v -X OPTIONS \
    -H "Origin: http://localhost:3000" \
    -H "Access-Control-Request-Method: PUT" \
    -H "Access-Control-Request-Headers: Content-Type, Authorization" \
    "http://localhost:9000/mybucket/test.txt"

# Response Headers khi CORS được cấu hình đúng:
# 
# < HTTP/1.1 200 OK
# < Access-Control-Allow-Origin: http://localhost:3000
# < Access-Control-Allow-Methods: GET, PUT, POST, DELETE, HEAD
# < Access-Control-Allow-Headers: Authorization, Content-Type, X-Amz-*
# < Access-Control-Expose-Headers: ETag, Content-Length, Content-Type
# < Access-Control-Max-Age: 86400
# < Vary: Origin
# < Date: Fri, 29 Nov 2024 10:00:00 GMT
# < Content-Length: 0


# Response khi CHƯA cấu hình CORS:
# 
# < HTTP/1.1 403 Forbidden
# (Không có Access-Control-* headers)
```

**Phương pháp 3: Sử dụng curl để test GET request**

```bash
# ===============================================
# TEST GET REQUEST VỚI ORIGIN HEADER
# ===============================================

# Upload một file test trước
echo "Hello World" > test.txt
aws s3 cp test.txt s3://mybucket/test.txt \
    --endpoint-url http://localhost:9000 \
    --profile minio

# Test GET request với Origin header
curl -v -X GET \
    -H "Origin: http://localhost:3000" \
    "http://localhost:9000/mybucket/test.txt"

# Response Headers khi CORS OK:
# 
# < HTTP/1.1 200 OK
# < Access// filepath: e:\DaiCuongBK\Project3\FileSharing\client\minio.md
// ...existing code...

---

### 1.5 Cấu Hình Khắc Phục Lỗi CORS

#### 1.5.1 Nguyên nhân gây ra lỗi CORS khi truy cập MinIO từ browser

**CORS là gì? - Giải thích cho người mới bắt đầu**

CORS (Cross-Origin Resource Sharing) là một cơ chế bảo mật được tích hợp sẵn trong tất cả các trình duyệt web hiện đại. Để hiểu CORS, trước tiên chúng ta cần hiểu khái niệm "Origin".

**Origin (Nguồn gốc) là gì?**

Origin được xác định bởi 3 thành phần:
- **Protocol** (giao thức): http hoặc https
- **Domain** (tên miền): localhost, example.com, v.v.
- **Port** (cổng): 80, 443, 3000, v.v.

```
┌─────────────────────────────────────────────────────────────┐
│                    CẤU TRÚC CỦA ORIGIN                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  URL: https://myapp.com:3000/path/to/page                   │
│       ├─────┘└──────────┘└───┘└───────────┘                │
│       │         │         │        │                        │
│       │         │         │        └── Path (không thuộc    │
│       │         │         │            Origin)              │
│       │         │         │                                 │
│       │         │         └── Port: 3000                    │
│       │         │                                           │
│       │         └── Domain: myapp.com                       │
│       │                                                     │
│       └── Protocol: https                                   │
│                                                             │
│  Origin = https://myapp.com:3000                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Ví dụ về Same-Origin và Cross-Origin:**

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    SAME-ORIGIN vs CROSS-ORIGIN                             │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Giả sử trang web của bạn đang chạy tại: http://localhost:3000             │
│                                                                            │
│  ┌─────────────────────────────────────┬──────────────┬─────────────────┐  │
│  │           URL đích                  │    Loại      │     Lý do       │  │
│  ├─────────────────────────────────────┼──────────────┼─────────────────┤  │
│  │ http://localhost:3000/api/data      │ Same-Origin  │ Giống hoàn toàn │  │
│  ├─────────────────────────────────────┼──────────────┼─────────────────┤  │
│  │ http://localhost:9000/bucket/file   │ Cross-Origin │ Port khác (9000)│  │
│  ├─────────────────────────────────────┼──────────────┼─────────────────┤  │
│  │ https://localhost:3000/api/data     │ Cross-Origin │ Protocol khác   │  │
│  ├─────────────────────────────────────┼──────────────┼─────────────────┤  │
│  │ http://192.168.1.100:9000/file      │ Cross-Origin │ Domain khác     │  │
│  ├─────────────────────────────────────┼──────────────┼─────────────────┤  │
│  │ http://minio.example.com:9000/file  │ Cross-Origin │ Domain khác     │  │
│  └─────────────────────────────────────┴──────────────┴─────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

**Same-Origin Policy (Chính sách cùng nguồn gốc)**

Same-Origin Policy là một quy tắc bảo mật cơ bản:

> **Nguyên tắc:** Một trang web chỉ có thể đọc dữ liệu từ một nguồn khác nếu nguồn đó có cùng Origin với trang web đang chạy.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SAME-ORIGIN POLICY HOẠT ĐỘNG NHƯ THẾ NÀO                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TRƯỜNG HỢP 1: Same-Origin (ĐƯỢC PHÉP)                                     │
│  ─────────────────────────────────────                                      │
│                                                                             │
│  ┌──────────────────┐         Request          ┌──────────────────┐        │
│  │    Browser       │─────────────────────────►│     Server       │        │
│  │                  │                          │                  │        │
│  │ http://app:3000  │                          │ http://app:3000  │        │
│  │                  │◄─────────────────────────│                  │        │
│  └──────────────────┘         Response         └──────────────────┘        │
│                               ✓ OK                                          │
│                                                                             │
│                                                                             │
│  TRƯỜNG HỢP 2: Cross-Origin KHÔNG CÓ CORS (BỊ CHẶN)                        │
│  ─────────────────────────────────────────────────                          │
│                                                                             │
│  ┌──────────────────┐         Request          ┌──────────────────┐        │
│  │    Browser       │─────────────────────────►│     MinIO        │        │
│  │                  │                          │                  │        │
│  │ http://app:3000  │                          │ http://minio:9000│        │
│  │                  │◄ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │                  │        │
│  └──────────────────┘         Response         └──────────────────┘        │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 🚫 Browser CHẶN response vì:                                        │  │
│  │    - Response không có header Access-Control-Allow-Origin           │  │
│  │    - JavaScript KHÔNG THỂ đọc được response                         │  │
│  │    - Console hiển thị lỗi CORS                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│                                                                             │
│  TRƯỜNG HỢP 3: Cross-Origin CÓ CORS (ĐƯỢC PHÉP)                            │
│  ───────────────────────────────────────────────                            │
│                                                                             │
│  ┌──────────────────┐         Request          ┌──────────────────┐        │
│  │    Browser       │─────────────────────────►│  MinIO (có CORS) │        │
│  │                  │  Origin: http://app:3000 │                  │        │
│  │ http://app:3000  │                          │ http://minio:9000│        │
│  │                  │◄─────────────────────────│                  │        │
│  └──────────────────┘         Response         └──────────────────┘        │
│         │              + Access-Control-Allow-Origin: http://app:3000      │
│         ▼                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ ✓ Browser CHO PHÉP vì:                                              │  │
│  │    - Response có header Access-Control-Allow-Origin phù hợp         │  │
│  │    - JavaScript CÓ THỂ đọc được response                            │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Tại sao trình duyệt cần Same-Origin Policy?**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│          TẠI SAO SAME-ORIGIN POLICY QUAN TRỌNG CHO BẢO MẬT?                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  KỊCH BẢN TẤN CÔNG NẾU KHÔNG CÓ SAME-ORIGIN POLICY:                        │
│                                                                             │
│  1. Bạn đăng nhập vào ngân hàng: https://mybank.com                        │
│     → Browser lưu cookie xác thực của bạn                                  │
│                                                                             │
│  2. Bạn vô tình truy cập trang web độc hại: https://evil.com               │
│                                                                             │
│  3. Trang evil.com chạy JavaScript:                                        │
│     ┌────────────────────────────────────────────────────────────────┐     │
│     │ // Nếu không có Same-Origin Policy, code này sẽ hoạt động!    │     │
│     │ fetch('https://mybank.com/api/transfer', {                     │     │
│     │   method: 'POST',                                              │     │
│     │   credentials: 'include', // Gửi kèm cookie của mybank        │     │
│     │   body: JSON.stringify({                                       │     │
│     │     to: 'hacker_account',                                      │     │
│     │     amount: 1000000                                            │     │
│     │   })                                                           │     │
│     │ }).then(response => response.json())                           │     │
│     │   .then(data => {                                              │     │
│     │     // Đọc được response chứa thông tin tài khoản!            │     │
│     │     sendToHacker(data);                                        │     │
│     │   });                                                          │     │
│     └────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│  VỚI SAME-ORIGIN POLICY:                                                   │
│  → Browser CHẶN JavaScript của evil.com đọc response từ mybank.com        │
│  → Thông tin tài khoản được bảo vệ                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Lỗi CORS trong ngữ cảnh MinIO**

Khi bạn xây dựng ứng dụng file sharing với:
- **Frontend** chạy tại: `http://localhost:3000`
- **MinIO** chạy tại: `http://localhost:9000`

Đây là Cross-Origin vì port khác nhau (3000 ≠ 9000).

**Các trường hợp gây lỗi CORS với MinIO:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              CÁC TRƯỜNG HỢP LỖI CORS VỚI MINIO                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TRƯỜNG HỢP 1: Upload trực tiếp từ browser                                 │
│  ─────────────────────────────────────────                                  │
│                                                                             │
│  ┌─────────────┐   PUT http://minio:9000/bucket/file   ┌─────────────┐     │
│  │  Frontend   │────────────────────────────────────────►│    MinIO    │     │
│  │ :3000       │                                        │    :9000    │     │
│  └─────────────┘                                        └─────────────┘     │
│         │                                                                   │
│         ▼                                                                   │
│  🚫 CORS Error: "No 'Access-Control-Allow-Origin' header"                  │
│                                                                             │
│                                                                             │
│  TRƯỜNG HỢP 2: Download với presigned URL từ browser                       │
│  ───────────────────────────────────────────────────                        │
│                                                                             │
│  ┌─────────────┐  GET http://minio:9000/bucket/file?X-Amz-...  ┌────────┐  │
│  │  Frontend   │────────────────────────────────────────────────►│ MinIO  │  │
│  │ :3000       │                                                │ :9000  │  │
│  └─────────────┘                                                └────────┘  │
│         │                                                                   │
│         ▼                                                                   │
│  🚫 CORS Error nếu muốn đọc response headers hoặc nội dung                 │
│                                                                             │
│                                                                             │
│  TRƯỜNG HỢP 3: Preflight request bị reject                                 │
│  ─────────────────────────────────────────                                  │
│                                                                             │
│  Khi sử dụng custom headers hoặc methods như PUT, DELETE:                  │
│                                                                             │
│  ┌─────────────┐      OPTIONS (Preflight)          ┌─────────────┐         │
│  │  Frontend   │──────────────────────────────────►│    MinIO    │         │
│  │ :3000       │                                   │    :9000    │         │
│  │             │◄─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│             │         │
│  └─────────────┘   Response thiếu CORS headers     └─────────────┘         │
│         │                                                                   │
│         ▼                                                                   │
│  🚫 CORS Error: Preflight request blocked                                  │
│  → Browser KHÔNG gửi request thực sự (PUT, DELETE)                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Preflight Request là gì?**

Preflight là một request "thăm dò" mà browser tự động gửi TRƯỚC request thực sự, để hỏi server: "Tôi có được phép gửi request này không?"

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PREFLIGHT REQUEST CHI TIẾT                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Browser tự động gửi Preflight khi request có:                             │
│  ──────────────────────────────────────────────                             │
│  • HTTP methods: PUT, DELETE, PATCH (không phải GET, POST, HEAD)           │
│  • Custom headers: Authorization, X-Custom-Header, ...                     │
│  • Content-Type khác: application/json (không phải form-data/text)         │
│                                                                             │
│                                                                             │
│  LUỒNG PREFLIGHT:                                                          │
│  ────────────────                                                           │
│                                                                             │
│  [1] JavaScript code:                                                       │
│      fetch('http://minio:9000/bucket/file', {                              │
│        method: 'PUT',                                                       │
│        headers: { 'Content-Type': 'image/png' },                           │
│        body: fileData                                                       │
│      });                                                                    │
│                                                                             │
│  [2] Browser gửi PREFLIGHT trước:                                          │
│      ┌────────────────────────────────────────────────────────────────┐    │
│      │ OPTIONS /bucket/file HTTP/1.1                                  │    │
│      │ Host: minio:9000                                               │    │
│      │ Origin: http://localhost:3000                                  │    │
│      │ Access-Control-Request-Method: PUT                             │    │
│      │ Access-Control-Request-Headers: content-type                   │    │
│      └────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  [3] Server cần trả về CORS headers:                                       │
│      ┌────────────────────────────────────────────────────────────────┐    │
│      │ HTTP/1.1 200 OK                                                │    │
│      │ Access-Control-Allow-Origin: http://localhost:3000             │    │
│      │ Access-Control-Allow-Methods: GET, PUT, POST, DELETE           │    │
│      │ Access-Control-Allow-Headers: content-type                     │    │
│      │ Access-Control-Max-Age: 86400                                  │    │
│      └────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  [4] Nếu Preflight OK → Browser gửi request thực sự (PUT)                  │
│      Nếu Preflight FAIL → Browser CHẶN, không gửi request thực sự          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Lỗi CORS thường gặp trong Console:**

```javascript
// Lỗi 1: Thiếu Allow-Origin header
Access to fetch at 'http://localhost:9000/mybucket/file.jpg' from origin 
'http://localhost:3000' has been blocked by CORS policy: No 
'Access-Control-Allow-Origin' header is present on the requested resource.

// Lỗi 2: Origin không được phép
Access to fetch at 'http://localhost:9000/mybucket/file.jpg' from origin 
'http://localhost:3000' has been blocked by CORS policy: The 
'Access-Control-Allow-Origin' header has a value 'http://example.com' 
that is not equal to the supplied origin.

// Lỗi 3: Preflight failed
Access to fetch at 'http://localhost:9000/mybucket/file.jpg' from origin 
'http://localhost:3000' has been blocked by CORS policy: Response to 
preflight request doesn't pass access control check: No 
'Access-Control-Allow-Origin' header is present on the requested resource.

// Lỗi 4: Method không được phép
Access to fetch at 'http://localhost:9000/mybucket/file.jpg' from origin 
'http://localhost:3000' has been blocked by CORS policy: Method PUT is 
not allowed by Access-Control-Allow-Methods in preflight response.
```

---

#### 1.5.2 Cấu hình CORS cho MinIO bằng MinIO Client (mc)

**Cài đặt MinIO Client (mc)**

MinIO Client (mc) là công cụ command-line chính thức để quản lý MinIO server.

```bash
# ===============================================
# CÀI ĐẶT MC TRÊN WINDOWS
# ===============================================

# Cách 1: Tải trực tiếp binary
# Truy cập: https://dl.min.io/client/mc/release/windows-amd64/mc.exe
# Đặt vào thư mục trong PATH, ví dụ: C:\Windows\System32\

# Cách 2: Dùng PowerShell
Invoke-WebRequest -Uri "https://dl.min.io/client/mc/release/windows-amd64/mc.exe" `
    -OutFile "$env:USERPROFILE\mc.exe"

# Thêm vào PATH (PowerShell as Admin)
$env:PATH += ";$env:USERPROFILE"

# Kiểm tra cài đặt
mc --version
# Output: mc version RELEASE.2024-XX-XX...


# ===============================================
# CÀI ĐẶT MC TRÊN LINUX/macOS
# ===============================================

# Linux AMD64
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/

# macOS (Intel)
brew install minio/stable/mc

# macOS (Apple Silicon)
brew install minio/stable/mc

# Kiểm tra
mc --version
```

**Cấu hình alias để kết nối với MinIO server**

Alias là một "shortcut" để mc có thể kết nối với MinIO server mà không cần gõ lại endpoint và credentials mỗi lần.

```bash
# ===============================================
# TẠO ALIAS CHO MINIO SERVER
# ===============================================

# Cú pháp:
# mc alias set <ALIAS_NAME> <ENDPOINT_URL> <ACCESS_KEY> <SECRET_KEY>

# Ví dụ 1: MinIO local với Docker
mc alias set myminio http://localhost:9000 minioadmin minioadmin

# Ví dụ 2: MinIO trên server với credentials khác
mc alias set production http://192.168.1.100:9000 admin MySecretPassword123

# Ví dụ 3: MinIO với HTTPS
mc alias set secureminio https://minio.example.com myadmin MyStr0ngP@ssw0rd


# ===============================================
# KIỂM TRA ALIAS ĐÃ TẠO
# ===============================================

# Liệt kê tất cả aliases
mc alias list

# Output:
# myminio
#   URL       : http://localhost:9000
#   AccessKey : minioadmin
#   SecretKey : minioadmin
#   API       : S3v4
#   Path      : auto

# Kiểm tra kết nối đến MinIO
mc admin info myminio

# Output (nếu kết nối thành công):
#   ●  localhost:9000
#      Uptime: 2 hours
#      Version: 2024-01-01T00-00-00Z
#      Network: 1/1 OK
#      Drives: 1/1 OK


# ===============================================
# XÓA ALIAS
# ===============================================

mc alias remove myminio
```

**Hiểu về cấu trúc lệnh mc**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CẤU TRÚC LỆNH MC                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  mc <command> <alias>/<bucket>/<object> [options]                          │
│     │          │       │         │         │                                │
│     │          │       │         │         └── Tùy chọn bổ sung            │
│     │          │       │         │                                          │
│     │          │       │         └── Object key (tên file)                 │
│     │          │       │                                                    │
│     │          │       └── Bucket name                                      │
│     │          │                                                            │
│     │          └── Alias đã cấu hình                                       │
│     │                                                                       │
│     └── Lệnh: ls, cp, rm, mb, rb, admin, anonymous, ...                    │
│                                                                             │
│                                                                             │
│  VÍ DỤ:                                                                    │
│  ──────                                                                     │
│                                                                             │
│  mc ls myminio/                         # List tất cả buckets              │
│  mc ls myminio/mybucket/                # List objects trong bucket        │
│  mc mb myminio/newbucket                # Tạo bucket mới                   │
│  mc cp file.txt myminio/mybucket/       # Upload file                      │
│  mc rm myminio/mybucket/file.txt        # Xóa file                         │
│  mc anonymous set public myminio/public # Set bucket public                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Cấu hình CORS với mc - Các lệnh cơ bản**

```bash
# ===============================================
# LỆNH QUẢN LÝ CORS TRONG MC
# ===============================================

# Xem CORS hiện tại của bucket
mc anonymous get-json myminio/mybucket

# Cấu hình CORS cho bucket
# Sử dụng lệnh mc admin config hoặc tạo file JSON

# Cách 1: Set CORS từ file JSON
mc cors set myminio/mybucket cors-config.json

# Cách 2: Xem CORS config hiện tại
mc cors get myminio/mybucket

# Cách 3: Xóa CORS config
mc cors remove myminio/mybucket
```

**Lưu ý quan trọng về CORS trong MinIO:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LƯU Ý VỀ CORS TRONG MINIO                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. CORS được cấu hình ở mức BUCKET, không phải server                     │
│     → Mỗi bucket có thể có cấu hình CORS khác nhau                         │
│                                                                             │
│  2. CORS config được lưu trong metadata của bucket                         │
│     → Persistent, không mất khi restart MinIO                              │
│                                                                             │
│  3. Nếu không cấu hình CORS:                                               │
│     → MinIO sẽ KHÔNG gửi CORS headers trong response                       │
│     → Browser sẽ chặn mọi cross-origin request                             │
│                                                                             │
│  4. Wildcard (*) trong CORS:                                               │
│     → AllowedOrigins: "*" cho phép mọi origin (không an toàn cho prod)     │
│     → AllowedHeaders: "*" cho phép mọi headers                             │
│     → AllowedMethods: phải khai báo cụ thể (GET, PUT, DELETE, ...)         │
│                                                                             │
│  5. CORS không ảnh hưởng đến:                                              │
│     → Request từ server-to-server (không qua browser)                      │
│     → Request từ mc CLI tool                                               │
│     → Request từ backend Java/Python/Node.js                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

#### 1.5.3 Tạo file cấu hình CORS JSON với các header cần thiết

**Cấu trúc của CORS Configuration JSON**

MinIO sử dụng định dạng JSON tương thích với AWS S3 CORS configuration.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CẤU TRÚC CORS CONFIGURATION                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  {                                                                          │
│    "CORSRules": [              ← Mảng các rule, có thể có nhiều rule       │
│      {                                                                      │
│        "AllowedOrigins": [],   ← Các origin được phép                      │
│        "AllowedMethods": [],   ← Các HTTP methods được phép                │
│        "AllowedHeaders": [],   ← Các headers browser được phép gửi        │
│        "ExposeHeaders": [],    ← Các headers browser được phép đọc        │
│        "MaxAgeSeconds": 3000   ← Cache preflight response (giây)          │
│      }                                                                      │
│    ]                                                                        │
│  }                                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Giải thích chi tiết từng trường:**

**1. AllowedOrigins**

```json
// AllowedOrigins: Danh sách các origin được phép truy cập bucket

// Ví dụ 1: Cho phép một origin cụ thể
"AllowedOrigins": ["http://localhost:3000"]

// Ví dụ 2: Cho phép nhiều origins
"AllowedOrigins": [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://myapp.example.com"
]

// Ví dụ 3: Cho phép tất cả origins (KHÔNG khuyến nghị cho production)
"AllowedOrigins": ["*"]

// Ví dụ 4: Sử dụng wildcard subdomain
"AllowedOrigins": ["https://*.example.com"]
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ALLOWEDORIGINS - BEST PRACTICES                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ✓ Development:                                                            │
│    "AllowedOrigins": [                                                      │
│      "http://localhost:3000",    // React dev server                       │
│      "http://localhost:5173",    // Vite dev server                        │
│      "http://127.0.0.1:3000"     // Alternative localhost                  │
│    ]                                                                        │
│                                                                             │
│  ✓ Production:                                                             │
│    "AllowedOrigins": [                                                      │
│      "https://myapp.com",        // Chỉ HTTPS                              │
│      "https://www.myapp.com"     // Với www prefix                         │
│    ]                                                                        │
│                                                                             │
│  ✗ TRÁNH trong Production:                                                 │
│    "AllowedOrigins": ["*"]       // Cho phép tất cả - Không an toàn!       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**2. AllowedMethods**

```json
// AllowedMethods: Các HTTP methods được phép sử dụng

// Chỉ đọc (download)
"AllowedMethods": ["GET", "HEAD"]

// Đọc và ghi (upload + download)
"AllowedMethods": ["GET", "PUT", "POST", "HEAD"]

// Full access (bao gồm xóa)
"AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"]
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ALLOWEDMETHODS - GIẢI THÍCH                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  METHOD     │  MỤC ĐÍCH TRONG MINIO                                        │
│  ───────────┼─────────────────────────────────────────────────────────────  │
│  GET        │  Download object, lấy metadata                               │
│  HEAD       │  Lấy metadata mà không download nội dung                     │
│  PUT        │  Upload object (single part)                                 │
│  POST       │  Multipart upload operations, presigned POST                 │
│  DELETE     │  Xóa object                                                  │
│                                                                             │
│  ⚠️ Không hỗ trợ: PATCH, OPTIONS (OPTIONS tự động xử lý bởi CORS)           │
│                                                                             │
│  KHUYẾN NGHỊ:                                                              │
│  ────────────                                                               │
│  • File sharing app:    ["GET", "PUT", "POST", "DELETE", "HEAD"]           │
│  • Public read bucket:  ["GET", "HEAD"]                                    │
│  • Upload-only bucket:  ["PUT", "POST", "HEAD"]                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**3. AllowedHeaders**

```json
// AllowedHeaders: Headers mà browser được phép gửi trong request

// Cơ bản - cho upload đơn giản
"AllowedHeaders": [
  "Content-Type",
  "Content-Length"
]

// Đầy đủ - cho presigned URLs và multipart upload
"AllowedHeaders": [
  "Authorization",
  "Content-Type",
  "Content-Length",
  "Content-MD5",
  "X-Amz-*",
  "x-amz-*"
]

// Cho phép tất cả headers (tiện lợi nhưng kém an toàn hơn)
"AllowedHeaders": ["*"]
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ALLOWEDHEADERS - GIẢI THÍCH                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  HEADER            │  MỤC ĐÍCH                                              │
│  ──────────────────┼──────────────────────────────────────────────────────  │
│  Content-Type      │  MIME type của file (image/png, video/mp4, ...)       │
│  Content-Length    │  Kích thước file                                      │
│  Content-MD5       │  Checksum để verify integrity                         │
│  Authorization     │  AWS Signature cho authenticated requests             │
│  X-Amz-*           │  Các headers đặc biệt của S3/MinIO                    │
│                    │  - X-Amz-Date: Timestamp của request                  │
│                    │  - X-Amz-Content-Sha256: SHA256 của body             │
│                    │  - X-Amz-Meta-*: Custom metadata                     │
│                                                                             │
│  QUAN TRỌNG:                                                               │
│  ────────────                                                               │
│  • "X-Amz-*" cho phép tất cả headers bắt đầu bằng X-Amz-                   │
│  • Case-insensitive: "x-amz-*" = "X-Amz-*"                                 │
│  • Nếu thiếu header cần thiết → Browser sẽ báo lỗi CORS                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**4. ExposeHeaders**

```json
// ExposeHeaders: Headers trong response mà JavaScript được phép đọc
// Mặc định, browser chỉ cho phép JS đọc 6 "simple" headers:
// - Cache-Control, Content-Language, Content-Type, Expires, 
// - Last-Modified, Pragma

// Để JS đọc được headers khác, phải khai báo trong ExposeHeaders
"ExposeHeaders": [
  "ETag",
  "Content-Length", 
  "Content-Type",
  "x-amz-meta-*"
]
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EXPOSEHEADERS - GIẢI THÍCH                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TẠI SAO CẦN EXPOSEHEADERS?                                                │
│  ──────────────────────────────                                             │
│                                                                             │
│  Khi browser nhận response từ cross-origin request:                        │
│                                                                             │
│  HTTP/1.1 200 OK                                                           │
│  Content-Type: image/png                    ← JS đọc được (simple header)  │
│  Content-Length: 1024000                    ← JS đọc được (simple header)  │
│  ETag: "abc123def456"                       ← JS KHÔNG đọc được mặc định  │
│  X-Amz-Meta-Author: john                    ← JS KHÔNG đọc được mặc định  │
│  X-Amz-Request-Id: ABC123                   ← JS KHÔNG đọc được mặc định  │
│                                                                             │
│  Với ExposeHeaders: ["ETag", "x-amz-meta-*"]                               │
│  → JS có thể đọc ETag và các X-Amz-Meta-* headers                          │
│                                                                             │
│                                                                             │
│  HEADERS QUAN TRỌNG CẦN EXPOSE:                                            │
│  ────────────────────────────────                                           │
│  • ETag: Cần cho multipart upload (phải gửi lại khi complete)             │
│  • Content-Length: Để hiển thị progress download                           │
│  • X-Amz-Meta-*: Custom metadata của object                               │
│  • Accept-Ranges: Để biết server hỗ trợ range request                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**5. MaxAgeSeconds**

```json
// MaxAgeSeconds: Thời gian browser cache kết quả preflight request
// Đơn vị: giây

// Cache 1 giờ
"MaxAgeSeconds": 3600

// Cache 24 giờ (khuyến nghị cho production)
"MaxAgeSeconds": 86400

// Không cache (cho development/debugging)
"MaxAgeSeconds": 0
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MAXAGESECONDS - GIẢI THÍCH                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  KHÔNG CÓ CACHE (MaxAgeSeconds: 0):                                        │
│  ──────────────────────────────────                                         │
│                                                                             │
│  Request 1:  OPTIONS → Preflight → PUT → Upload                            │
│  Request 2:  OPTIONS → Preflight → PUT → Upload   (lại phải preflight!)   │
│  Request 3:  OPTIONS → Preflight → PUT → Upload   (lại phải preflight!)   │
│                                                                             │
│  → Mỗi request đều cần 2 round-trips → Chậm!                               │
│                                                                             │
│                                                                             │
│  CÓ CACHE (MaxAgeSeconds: 86400):                                          │
│  ────────────────────────────────                                           │
│                                                                             │
│  Request 1:  OPTIONS → Preflight → PUT → Upload                            │
│              (Browser cache preflight result)                               │
│  Request 2:  PUT → Upload   (không cần preflight - đã cache!)              │
│  Request 3:  PUT → Upload   (không cần preflight - đã cache!)              │
│  ...                                                                        │
│  (Sau 86400 giây - 24h)                                                    │
│  Request N:  OPTIONS → Preflight → PUT → Upload   (cache hết hạn)          │
│                                                                             │
│  → Chỉ 1 round-trip cho các request tiếp theo → Nhanh hơn!                │
│                                                                             │
│                                                                             │
│  KHUYẾN NGHỊ:                                                              │
│  ────────────                                                               │
│  • Development:  300 - 3600 (5 phút - 1 giờ)                               │
│  • Production:   86400 (24 giờ) hoặc cao hơn                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**File CORS Configuration hoàn chỉnh:**

```json
// filepath: cors-config.json
// Cấu hình CORS đầy đủ cho ứng dụng file sharing

{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
      ],
      "AllowedMethods": [
        "GET",
        "PUT",
        "POST",
        "DELETE",
        "HEAD"
      ],
      "AllowedHeaders": [
        "Authorization",
        "Content-Type",
        "Content-Length",
        "Content-MD5",
        "Cache-Control",
        "X-Amz-Content-Sha256",
        "X-Amz-Date",
        "X-Amz-User-Agent",
        "X-Amz-Meta-*",
        "x-amz-*"
      ],
      "ExposeHeaders": [
        "ETag",
        "Content-Length",
        "Content-Type",
        "Content-Range",
        "Accept-Ranges",
        "X-Amz-Meta-*"
      ],
      "MaxAgeSeconds": 86400
    }
  ]
}
```

**File CORS cho các môi trường khác nhau:**

```json
// filepath: cors-development.json
// Cấu hình cho môi trường Development - Linh hoạt hơn

{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["*"],
      "MaxAgeSeconds": 300
    }
  ]
}
```

```json
// filepath: cors-production.json
// Cấu hình cho môi trường Production - Chặt chẽ hơn

{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "https://myapp.example.com",
        "https://www.myapp.example.com"
      ],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": [
        "Authorization",
        "Content-Type",
        "Content-Length",
        "Content-MD5",
        "X-Amz-Content-Sha256",
        "X-Amz-Date",
        "X-Amz-User-Agent",
        "X-Amz-Meta-*"
      ],
      "ExposeHeaders": [
        "ETag",
        "Content-Length",
        "Content-Type",
        "Content-Range",
        "Accept-Ranges"
      ],
      "MaxAgeSeconds": 86400
    }
  ]
}
```

// ...existing code...

---

#### 1.5.4 Áp dụng cấu hình CORS cho bucket cụ thể

**Bước 1: Tạo bucket (nếu chưa có)**

```bash
# Kiểm tra bucket đã tồn tại chưa
mc ls myminio/

# Tạo bucket mới
mc mb myminio/mybucket

# Output: Bucket created successfully `myminio/mybucket`.

# Kiểm tra lại
mc ls myminio/
# Output: [2024-11-29 10:00:00 UTC]     0B mybucket/
```

**Bước 2: Tạo file CORS configuration**

```bash
# Tạo file cors-config.json với nội dung đã định nghĩa ở trên
# Windows (PowerShell):
@"
{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "http://localhost:3000",
        "http://localhost:5173"
      ],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": [
        "Authorization",
        "Content-Type",
        "Content-Length",
        "X-Amz-*"
      ],
      "ExposeHeaders": [
        "ETag",
        "Content-Length",
        "Content-Type"
      ],
      "MaxAgeSeconds": 86400
    }
  ]
}
"@ | Out-File -FilePath cors-config.json -Encoding UTF8

# Linux/macOS:
cat > cors-config.json << 'EOF'
{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "http://localhost:3000",
        "http://localhost:5173"
      ],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": [
        "Authorization",
        "Content-Type",
        "Content-Length",
        "X-Amz-*"
      ],
      "ExposeHeaders": [
        "ETag",
        "Content-Length",
        "Content-Type"
      ],
      "MaxAgeSeconds": 86400
    }
  ]
}
EOF
```

**Bước 3: Áp dụng CORS configuration bằng AWS CLI (Khuyến nghị)**

AWS CLI là cách đáng tin cậy nhất để cấu hình CORS cho MinIO vì MinIO hoàn toàn tương thích với S3 API.

```bash
# ===============================================
# CÀI ĐẶT AWS CLI
# ===============================================

# Windows (PowerShell as Admin):
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi

# Linux:
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# macOS:
brew install awscli

# Kiểm tra cài đặt
aws --version


# ===============================================
# CẤU HÌNH AWS CLI CHO MINIO
# ===============================================

# Tạo profile cho MinIO
aws configure --profile minio

# Nhập thông tin khi được hỏi:
# AWS Access Key ID: minioadmin
# AWS Secret Access Key: minioadmin
# Default region name: us-east-1
# Default output format: json

# Hoặc cấu hình trực tiếp bằng environment variables:
export AWS_ACCESS_KEY_ID=minioadmin
export AWS_SECRET_ACCESS_KEY=minioadmin
export AWS_DEFAULT_REGION=us-east-1


# ===============================================
# ÁP DỤNG CORS CHO BUCKET
# ===============================================

# Đặt CORS configuration
aws s3api put-bucket-cors \
    --bucket mybucket \
    --cors-configuration file://cors-config.json \
    --endpoint-url http://localhost:9000 \
    --profile minio

# Nếu thành công: Không có output (silent success)
# Nếu lỗi: Hiển thị error message
```

**Giải thích chi tiết lệnh put-bucket-cors:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    GIẢI THÍCH LỆNH PUT-BUCKET-CORS                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  aws s3api put-bucket-cors \                                               │
│      --bucket mybucket \              ← Tên bucket cần cấu hình            │
│      --cors-configuration file://cors-config.json \  ← File JSON config   │
│      --endpoint-url http://localhost:9000 \  ← MinIO endpoint (không S3)  │
│      --profile minio                  ← AWS CLI profile đã cấu hình        │
│                                                                             │
│  Lưu ý quan trọng:                                                         │
│  ────────────────                                                           │
│  • --endpoint-url: BẮT BUỘC khi dùng MinIO (không phải AWS S3 thật)       │
│  • file:// prefix: Đọc config từ file local                                │
│  • Có thể dùng JSON string thay vì file:                                   │
│    --cors-configuration '{"CORSRules":[...]}'                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Bước 4: Áp dụng CORS qua MinIO Console (Phương pháp GUI)**

Nếu bạn thích giao diện đồ họa, có thể sử dụng MinIO Console:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CẤU HÌNH CORS QUA MINIO CONSOLE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Bước 1: Truy cập MinIO Console                                            │
│  ─────────────────────────────                                              │
│  URL: http://localhost:9001                                                 │
│  Username: minioadmin                                                       │
│  Password: minioadmin                                                       │
│                                                                             │
│                                                                             │
│  Bước 2: Navigate đến Bucket Settings                                      │
│  ────────────────────────────────────                                       │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  MinIO Console                                        [Admin] [Logout] │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │ ┌───────────┐                                                         │ │
│  │ │ Buckets   │  mybucket                                              │ │
│  │ │ > mybucket│  ├─ Objects                                            │ │
│  │ │           │  ├─ Settings  ← Click vào đây                          │ │
│  │ │ Users     │  │   ├─ Access Rules                                   │ │
│  │ │ Groups    │  │   ├─ Lifecycle                                      │ │
│  │ │ Policies  │  │   └─ Replication                                    │ │
│  │ └───────────┘  └─ Events                                             │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│                                                                             │
│  Bước 3: Thêm Access Rule cho CORS                                        │
│  ──────────────────────────────────                                         │
│  - Click "Add Access Rule" hoặc "Edit Access Policy"                       │
│  - Một số phiên bản MinIO Console có tab "CORS Configuration" riêng        │
│  - Paste JSON configuration vào editor                                     │
│  - Click "Save" hoặc "Update"                                              │
│                                                                             │
│  Lưu ý: Giao diện có thể khác nhau tùy phiên bản MinIO                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Bước 5: Áp dụng CORS bằng Java SDK (Cho ứng dụng)**

Nếu cần cấu hình CORS programmatically từ ứng dụng Java:

```java
// filepath: src/main/java/com/example/minio/CorsConfigurator.java

import io.minio.MinioClient;
import io.minio.SetBucketCorsArgs;
import io.minio.messages.*;

import java.util.Arrays;
import java.util.LinkedList;
import java.util.List;

public class CorsConfigurator {
    
    private final MinioClient minioClient;
    
    public CorsConfigurator(String endpoint, String accessKey, String secretKey) {
        this.minioClient = MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .build();
    }
    
    /**
     * Cấu hình CORS cho bucket
     * 
     * @param bucketName Tên bucket cần cấu hình
     * @param allowedOrigins Danh sách origins được phép
     */
    public void configureCors(String bucketName, List<String> allowedOrigins) {
        try {
            // Tạo CORS Rule
            CorsRule corsRule = new CorsRule(
                // ID của rule (optional)
                "CORSRule1",
                // AllowedHeaders
                Arrays.asList(
                    "Authorization",
                    "Content-Type",
                    "Content-Length",
                    "Content-MD5",
                    "X-Amz-*",
                    "x-amz-*"
                ),
                // AllowedMethods - chuyển đổi từ enum
                Arrays.asList(
                    CorsRule.Method.GET,
                    CorsRule.Method.PUT,
                    CorsRule.Method.POST,
                    CorsRule.Method.DELETE,
                    CorsRule.Method.HEAD
                ),
                // AllowedOrigins
                allowedOrigins,
                // ExposeHeaders
                Arrays.asList(
                    "ETag",
                    "Content-Length",
                    "Content-Type",
                    "Content-Range",
                    "Accept-Ranges",
                    "X-Amz-Meta-*"
                ),
                // MaxAgeSeconds
                86400
            );
            
            // Tạo danh sách rules (có thể có nhiều rule)
            List<CorsRule> corsRules = new LinkedList<>();
            corsRules.add(corsRule);
            
            // Tạo CORS Configuration
            CorsConfigurationInfo corsConfig = new CorsConfigurationInfo(corsRules);
            
            // Áp dụng CORS cho bucket
            minioClient.setBucketCors(
                SetBucketCorsArgs.builder()
                    .bucket(bucketName)
                    .config(corsConfig)
                    .build()
            );
            
            System.out.println("✓ CORS configuration applied successfully to bucket: " + bucketName);
            
        } catch (Exception e) {
            System.err.println("✗ Error applying CORS configuration: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Main method để test
     */
    public static void main(String[] args) {
        // Cấu hình MinIO connection
        String endpoint = "http://localhost:9000";
        String accessKey = "minioadmin";
        String secretKey = "minioadmin";
        String bucketName = "mybucket";
        
        // Origins cho development
        List<String> allowedOrigins = Arrays.asList(
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173"
        );
        
        // Áp dụng CORS
        CorsConfigurator configurator = new CorsConfigurator(endpoint, accessKey, secretKey);
        configurator.configureCors(bucketName, allowedOrigins);
    }
}
```

**Script tự động áp dụng CORS cho nhiều buckets:**

```bash
#!/bin/bash
# filepath: scripts/apply-cors-all-buckets.sh

# Cấu hình
MINIO_ENDPOINT="http://localhost:9000"
CORS_FILE="cors-config.json"
AWS_PROFILE="minio"

echo "=============================================="
echo "   CORS Configuration Script for MinIO"
echo "=============================================="
echo ""
echo "Endpoint: ${MINIO_ENDPOINT}"
echo "CORS File: ${CORS_FILE}"
echo "AWS Profile: ${AWS_PROFILE}"
echo ""

# Kiểm tra file CORS tồn tại
if [ ! -f "${CORS_FILE}" ]; then
    echo "❌ Error: CORS file not found: ${CORS_FILE}"
    exit 1
fi

# Kiểm tra kết nối đến MinIO
echo "Checking MinIO connection..."
if ! aws s3 ls --endpoint-url ${MINIO_ENDPOINT} --profile ${AWS_PROFILE} > /dev/null 2>&1; then
    echo "❌ Error: Cannot connect to MinIO at ${MINIO_ENDPOINT}"
    echo "   Please check:"
    echo "   - MinIO server is running"
    echo "   - AWS CLI profile '${AWS_PROFILE}' is configured correctly"
    exit 1
fi
echo "✓ MinIO connection OK"
echo ""

# Lấy danh sách tất cả buckets
echo "Fetching bucket list..."
BUCKETS=$(aws s3api list-buckets \
    --endpoint-url ${MINIO_ENDPOINT} \
    --profile ${AWS_PROFILE} \
    --query 'Buckets[].Name' \
    --output text)

if [ -z "${BUCKETS}" ]; then
    echo "⚠ No buckets found. Create a bucket first."
    exit 0
fi

echo "Found buckets: ${BUCKETS}"
echo ""

# Áp dụng CORS cho từng bucket
echo "Applying CORS configuration..."
echo "----------------------------------------------"

SUCCESS_COUNT=0
FAIL_COUNT=0

for bucket in ${BUCKETS}; do
    echo -n "  ${bucket}: "
    
    if aws s3api put-bucket-cors \
        --bucket "${bucket}" \
        --cors-configuration "file://${CORS_FILE}" \
        --endpoint-url "${MINIO_ENDPOINT}" \
        --profile "${AWS_PROFILE}" 2>/dev/null; then
        echo "✓ OK"
        ((SUCCESS_COUNT++))
    else
        echo "✗ FAILED"
        ((FAIL_COUNT++))
    fi
done

echo "----------------------------------------------"
echo ""
echo "Summary:"
echo "  ✓ Success: ${SUCCESS_COUNT}"
echo "  ✗ Failed:  ${FAIL_COUNT}"
echo ""
echo "=============================================="
```

---

#### 1.5.5 Kiểm tra cấu hình CORS đã được áp dụng thành công

Sau khi áp dụng CORS, rất quan trọng để kiểm tra xem cấu hình đã hoạt động đúng chưa. Dưới đây là các phương pháp kiểm tra từ đơn giản đến chi tiết.

**Phương pháp 1: Kiểm tra bằng AWS CLI**

```bash
# ===============================================
# LẤY CORS CONFIGURATION HIỆN TẠI
# ===============================================

aws s3api get-bucket-cors \
    --bucket mybucket \
    --endpoint-url http://localhost:9000 \
    --profile minio

# OUTPUT KHI CORS ĐÃ CẤU HÌNH:
# {
#     "CORSRules": [
#         {
#             "AllowedHeaders": [
#                 "Authorization",
#                 "Content-Type",
#                 "Content-Length",
#                 "X-Amz-*"
#             ],
#             "AllowedMethods": [
#                 "GET",
#                 "PUT",
#                 "POST",
#                 "DELETE",
#                 "HEAD"
#             ],
#             "AllowedOrigins": [
#                 "http://localhost:3000",
#                 "http://localhost:5173"
#             ],
#             "ExposeHeaders": [
#                 "ETag",
#                 "Content-Length",
#                 "Content-Type"
#             ],
#             "MaxAgeSeconds": 86400
#         }
#     ]
# }

# OUTPUT KHI CHƯA CẤU HÌNH CORS:
# An error occurred (NoSuchCORSConfiguration) when calling the 
# GetBucketCors operation: The CORS configuration does not exist
```

**Phương pháp 2: Test Preflight Request bằng curl**

Đây là cách kiểm tra chính xác nhất vì nó mô phỏng hành vi thực tế của browser.

```bash
# ===============================================
# TEST PREFLIGHT REQUEST (OPTIONS)
# ===============================================

# Mô phỏng preflight request từ browser
curl -v -X OPTIONS \
    -H "Origin: http://localhost:3000" \
    -H "Access-Control-Request-Method: PUT" \
    -H "Access-Control-Request-Headers: Content-Type, Authorization" \
    "http://localhost:9000/mybucket/testfile.txt" \
    2>&1 | grep -E "^(<|>)"

# GIẢI THÍCH:
# -v                              : Verbose output (hiển thị headers)
# -X OPTIONS                      : HTTP method OPTIONS (preflight)
# -H "Origin: ..."                : Giả lập origin của browser
# -H "Access-Control-Request-*"   : Headers preflight yêu cầu
# 2>&1 | grep -E "^(<|>)"         : Lọc chỉ hiển thị request/response headers
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              KẾT QUẢ PREFLIGHT KHI CORS ĐƯỢC CẤU HÌNH ĐÚNG                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  > OPTIONS /mybucket/testfile.txt HTTP/1.1                                 │
│  > Host: localhost:9000                                                     │
│  > Origin: http://localhost:3000                                           │
│  > Access-Control-Request-Method: PUT                                      │
│  > Access-Control-Request-Headers: Content-Type, Authorization             │
│  >                                                                          │
│  < HTTP/1.1 200 OK                          ← Status 200 = OK              │
│  < Access-Control-Allow-Origin: http://localhost:3000   ← Matched origin   │
│  < Access-Control-Allow-Methods: GET, PUT, POST, DELETE, HEAD              │
│  < Access-Control-Allow-Headers: Authorization, Content-Type, X-Amz-*      │
│  < Access-Control-Expose-Headers: ETag, Content-Length, Content-Type       │
│  < Access-Control-Max-Age: 86400            ← Cache 24 hours               │
│  < Vary: Origin, Access-Control-Request-Method                             │
│  < Content-Length: 0                                                        │
│  <                                                                          │
│                                                                             │
│  ✓ TẤT CẢ CÁC HEADER CORS ĐÚNG → CORS HOẠT ĐỘNG!                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              KẾT QUẢ PREFLIGHT KHI CORS CHƯA CẤU HÌNH                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  > OPTIONS /mybucket/testfile.txt HTTP/1.1                                 │
│  > Host: localhost:9000                                                     │
│  > Origin: http://localhost:3000                                           │
│  >                                                                          │
│  < HTTP/1.1 403 Forbidden                   ← Status 403 = Blocked         │
│  < Content-Type: application/xml                                           │
│  <                                                                          │
│  (KHÔNG CÓ Access-Control-* headers)                                       │
│                                                                             │
│  ✗ THIẾU CORS HEADERS → BROWSER SẼ CHẶN REQUEST!                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Phương pháp 3: Test Actual Request bằng curl**

```bash
# ===============================================
# TEST GET REQUEST VỚI ORIGIN HEADER
# ===============================================

# Bước 1: Upload một file test trước (nếu chưa có)
echo "Hello CORS Test" > /tmp/testfile.txt
aws s3 cp /tmp/testfile.txt s3://mybucket/testfile.txt \
    --endpoint-url http://localhost:9000 \
    --profile minio

# Bước 2: Test GET request với Origin header
curl -v -X GET \
    -H "Origin: http://localhost:3000" \
    "http://localhost:9000/mybucket/testfile.txt" \
    2>&1 | grep -E "^(<|>|Hello)"

# KẾT QUẢ MONG ĐỢI:
# > GET /mybucket/testfile.txt HTTP/1.1
# > Host: localhost:9000
# > Origin: http://localhost:3000
# >
# < HTTP/1.1 200 OK
# < Access-Control-Allow-Origin: http://localhost:3000
# < Access-Control-Expose-Headers: ETag, Content-Length, Content-Type
# < Content-Type: text/plain
# < Content-Length: 16
# <
# Hello CORS Test


# ===============================================
# TEST PUT REQUEST (Upload) VỚI ORIGIN HEADER
# ===============================================

curl -v -X PUT \
    -H "Origin: http://localhost:3000" \
    -H "Content-Type: text/plain" \
    -d "Test upload content" \
    "http://localhost:9000/mybucket/uploaded-test.txt" \
    2>&1 | grep -E "^(<|>)"

# LƯU Ý: PUT request sẽ cần authentication
# Nếu bucket không public, cần presigned URL hoặc credentials
```

**Phương pháp 4: Test từ Browser Developer Console**

Đây là cách kiểm tra thực tế nhất vì dùng chính browser:

```javascript
// Mở Browser Developer Console (F12) trên một trang web đang chạy ở localhost:3000
// Paste và chạy code sau:

// Test 1: Preflight với fetch
async function testCORS() {
    console.log('=== CORS Test Started ===');
    
    try {
        // Test GET request
        console.log('\n[1] Testing GET request...');
        const getResponse = await fetch('http://localhost:9000/mybucket/testfile.txt', {
            method: 'GET',
            headers: {
                'Content-Type': 'text/plain'
            }
        });
        console.log('GET Status:', getResponse.status);
        console.log('GET Headers:', Object.fromEntries(getResponse.headers.entries()));
        console.log('✓ GET request succeeded!');
        
    } catch (error) {
        console.error('✗ GET request failed:', error.message);
    }
    
    try {
        // Test OPTIONS (preflight) - thực tế browser tự gửi khi cần
        // Nhưng có thể test trực tiếp
        console.log('\n[2] Testing PUT request (will trigger preflight)...');
        const putResponse = await fetch('http://localhost:9000/mybucket/browser-test.txt', {
            method: 'PUT',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: 'Test from browser'
        });
        console.log('PUT Status:', putResponse.status);
        console.log('✓ PUT request succeeded!');
        
    } catch (error) {
        console.error('✗ PUT request failed:', error.message);
        console.log('  This might be expected if bucket requires authentication');
    }
    
    console.log('\n=== CORS Test Completed ===');
}

testCORS();
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              KẾT QUẢ TRONG BROWSER CONSOLE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  KHI CORS HOẠT ĐỘNG ĐÚNG:                                                  │
│  ─────────────────────────                                                  │
│                                                                             │
│  === CORS Test Started ===                                                  │
│                                                                             │
│  [1] Testing GET request...                                                 │
│  GET Status: 200                                                            │
│  GET Headers: {                                                             │
│    "access-control-allow-origin": "http://localhost:3000",                 │
│    "access-control-expose-headers": "ETag, Content-Length, Content-Type",  │
│    "content-type": "text/plain",                                           │
│    "content-length": "16"                                                   │
│  }                                                                          │
│  ✓ GET request succeeded!                                                  │
│                                                                             │
│  === CORS Test Completed ===                                                │
│                                                                             │
│                                                                             │
│  KHI CORS KHÔNG HOẠT ĐỘNG:                                                 │
│  ─────────────────────────                                                  │
│                                                                             │
│  === CORS Test Started ===                                                  │
│                                                                             │
│  [1] Testing GET request...                                                 │
│  ✗ GET request failed: Failed to fetch                                     │
│                                                                             │
│  (Và trong Console sẽ có lỗi đỏ:)                                          │
│  Access to fetch at 'http://localhost:9000/mybucket/testfile.txt'          │
│  from origin 'http://localhost:3000' has been blocked by CORS policy:      │
│  No 'Access-Control-Allow-Origin' header is present on the requested       │
│  resource.                                                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Phương pháp 5: Script kiểm tra tự động**

```bash
#!/bin/bash
# filepath: scripts/verify-cors.sh

# Cấu hình
MINIO_ENDPOINT="http://localhost:9000"
BUCKET="mybucket"
TEST_OBJECT="cors-test-object.txt"
TEST_ORIGINS=(
    "http://localhost:3000"
    "http://localhost:5173"
    "http://127.0.0.1:3000"
)

echo "=============================================="
echo "   CORS Verification Script"
echo "=============================================="
echo ""
echo "MinIO Endpoint: ${MINIO_ENDPOINT}"
echo "Bucket: ${BUCKET}"
echo ""

# Tạo test object nếu chưa có
echo "Creating test object..."
echo "CORS Test Content" | aws s3 cp - "s3://${BUCKET}/${TEST_OBJECT}" \
    --endpoint-url ${MINIO_ENDPOINT} \
    --profile minio 2>/dev/null

echo ""
echo "Testing CORS for each origin:"
echo "----------------------------------------------"

for origin in "${TEST_ORIGINS[@]}"; do
    echo ""
    echo "Origin: ${origin}"
    echo "  Testing preflight (OPTIONS)..."
    
    # Test preflight
    PREFLIGHT_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        -X OPTIONS \
        -H "Origin: ${origin}" \
        -H "Access-Control-Request-Method: PUT" \
        -H "Access-Control-Request-Headers: Content-Type" \
        "${MINIO_ENDPOINT}/${BUCKET}/${TEST_OBJECT}")
    
    if [ "${PREFLIGHT_RESPONSE}" = "200" ]; then
        echo "    ✓ Preflight: OK (HTTP ${PREFLIGHT_RESPONSE})"
    else
        echo "    ✗ Preflight: FAILED (HTTP ${PREFLIGHT_RESPONSE})"
    fi
    
    # Test actual request
    echo "  Testing GET request..."
    
    CORS_HEADER=$(curl -s -I \
        -H "Origin: ${origin}" \
        "${MINIO_ENDPOINT}/${BUCKET}/${TEST_OBJECT}" \
        | grep -i "access-control-allow-origin" \
        | tr -d '\r')
    
    if [ -n "${CORS_HEADER}" ]; then
        echo "    ✓ GET: OK"
        echo "    ${CORS_HEADER}"
    else
        echo "    ✗ GET: No CORS headers in response"
    fi
done

echo ""
echo "----------------------------------------------"
echo ""

# Kiểm tra CORS config hiện tại
echo "Current CORS Configuration:"
echo "----------------------------------------------"
aws s3api get-bucket-cors \
    --bucket ${BUCKET} \
    --endpoint-url ${MINIO_ENDPOINT} \
    --profile minio 2>&1

echo ""
echo "=============================================="
echo "Verification complete!"
echo "=============================================="
```

**Phương pháp 6: Kiểm tra trong Network Tab của Browser**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              KIỂM TRA CORS TRONG BROWSER NETWORK TAB                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Bước 1: Mở Developer Tools (F12)                                          │
│  Bước 2: Chọn tab "Network"                                                │
│  Bước 3: Thực hiện request đến MinIO từ ứng dụng                          │
│  Bước 4: Tìm request trong danh sách                                       │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  Network                                              [Preserve log]  │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │  Name          Method   Status  Type    Size    Time                  │ │
│  │  ─────────────────────────────────────────────────────────────────────│ │
│  │  testfile.txt  OPTIONS  200     preflight 0B     15ms   ← Preflight  │ │
│  │  testfile.txt  GET      200     text      123B   45ms   ← Actual     │ │
│  │                                                                       │ │
│  │  Click vào request để xem chi tiết:                                  │ │
│  │                                                                       │ │
│  │  Headers  Preview  Response  Timing                                  │ │
│  │  ───────────────────────────────────────────────────────────────────│ │
│  │                                                                       │ │
│  │  General:                                                            │ │
│  │    Request URL: http://localhost:9000/mybucket/testfile.txt         │ │
│  │    Request Method: GET                                               │ │
│  │    Status Code: 200 OK                                               │ │
│  │                                                                       │ │
│  │  Response Headers:                                                   │ │
│  │    Access-Control-Allow-Origin: http://localhost:3000    ← ✓ OK     │ │
│  │    Access-Control-Expose-Headers: ETag, Content-Length   ← ✓ OK     │ │
│  │    Content-Type: text/plain                                         │ │
│  │    ETag: "abc123..."                                                │ │
│  │                                                                       │ │
│  │  Request Headers:                                                    │ │
│  │    Origin: http://localhost:3000                                    │ │
│  │    Accept: */*                                                       │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  Nếu CORS lỗi:                                                             │
│  - Request sẽ có status "(failed)" hoặc "(blocked)"                       │
│  - Response Headers sẽ không có Access-Control-* headers                  │
│  - Console sẽ hiển thị CORS error message màu đỏ                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

#### 1.5.6 Xử lý lỗi CORS với các HTTP method đặc biệt (PUT, DELETE)

**Tại sao PUT và DELETE cần xử lý đặc biệt?**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              TẠI SAO PUT VÀ DELETE CẦN PREFLIGHT?                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Browser phân loại HTTP requests thành 2 loại:                             │
│                                                                             │
│  1. SIMPLE REQUESTS (Không cần Preflight):                                 │
│     ───────────────────────────────────────                                 │
│     • Methods: GET, HEAD, POST (với một số điều kiện)                      │
│     • Headers: Chỉ Accept, Accept-Language, Content-Language,              │
│                Content-Type (với giá trị đơn giản)                         │
│     • Content-Type: text/plain, multipart/form-data,                       │
│                     application/x-www-form-urlencoded                      │
│                                                                             │
│  2. PREFLIGHTED REQUESTS (Cần Preflight):                                  │
│     ──────────────────────────────────────                                  │
│     • Methods: PUT, DELETE, PATCH, CONNECT, OPTIONS, TRACE                 │
│     • Custom headers: Authorization, X-Custom-Header, ...                  │
│     • Content-Type: application/json, application/xml, ...                 │
│                                                                             │
│                                                                             │
│  TRONG NGỮ CẢNH MINIO:                                                     │
│  ─────────────────────                                                      │
│                                                                             │
│  • UPLOAD file     → PUT method      → CẦN PREFLIGHT                       │
│  • DELETE file     → DELETE method   → CẦN PREFLIGHT                       │
│  • Multipart init  → POST + headers  → CẦN PREFLIGHT                       │
│  • Download        → GET method      → KHÔNG CẦN PREFLIGHT (thường)        │
│                                                                             │
│                                                                             │
│  VẤN ĐỀ THƯỜNG GẶP:                                                        │
│  ─────────────────                                                          │
│                                                                             │
│  1. CORS config thiếu PUT/DELETE trong AllowedMethods                      │
│  2. Preflight response thiếu required headers                              │
│  3. AllowedHeaders không bao gồm headers cần thiết                        │
│  4. MaxAgeSeconds = 0 → Preflight mỗi request → Chậm và dễ lỗi           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Lỗi 1: "Method PUT/DELETE is not allowed"**

```javascript
// LỖI TRONG BROWSER CONSOLE:
// Access to fetch at 'http://localhost:9000/mybucket/file.txt' from origin 
// 'http://localhost:3000' has been blocked by CORS policy: Method PUT is 
// not allowed by Access-Control-Allow-Methods in preflight response.
```

**Nguyên nhân và cách khắc phục:**

```json
// ❌ CORS config SAI - thiếu PUT và DELETE:
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000"],
      "AllowedMethods": ["GET", "HEAD"],  // ← Chỉ có GET và HEAD!
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["*"]
    }
  ]
}

// ✓ CORS config ĐÚNG - có đầy đủ methods:
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],  // ← Đủ methods
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["*"],
      "MaxAgeSeconds": 86400
    }
  ]
}
```

**Lỗi 2: "Request header field X is not allowed"**

```javascript
// LỖI TRONG BROWSER CONSOLE:
// Access to fetch at 'http://localhost:9000/mybucket/file.txt' from origin 
// 'http://localhost:3000' has been blocked by CORS policy: Request header 
// field content-type is not allowed by Access-Control-Allow-Headers in 
// preflight response.
```

**Nguyên nhân và cách khắc phục:**

```json
// ❌ CORS config SAI - AllowedHeaders quá hạn chế:
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["Accept"],  // ← Thiếu Content-Type, Authorization, etc.
      "ExposeHeaders": ["*"]
    }
  ]
}

// ✓ CORS config ĐÚNG cho file upload:
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": [
        "Accept",
        "Authorization",
        "Content-Type",
        "Content-Length",
        "Content-MD5",
        "Content-Disposition",
        "Cache-Control",
        "X-Amz-*",
        "x-amz-*"
      ],
      "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
      "MaxAgeSeconds": 86400
    }
  ]
}

// Hoặc đơn giản hơn (cho development):
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],  // ← Cho phép tất cả headers
      "ExposeHeaders": ["*"],
      "MaxAgeSeconds": 86400
    }
  ]
}
```

**Lỗi 3: "ETag header is not accessible"**

Khi thực hiện multipart upload, bạn cần đọc ETag từ response của mỗi part để gửi lại khi complete upload.

```javascript
// LỖI: Không đọc được ETag
const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: chunk
});

const etag = response.headers.get('ETag');
console.log(etag); // null - không đọc được!
```

**Nguyên nhân và cách khắc phục:**

```json
// ❌ CORS config SAI - thiếu ETag trong ExposeHeaders:
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["Content-Length"]  // ← Thiếu ETag!
    }
  ]
}

// ✓ CORS config ĐÚNG:
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": [
        "ETag",                // ← Cần cho multipart upload
        "Content-Length",
        "Content-Type",
        "Content-Range",
        "Accept-Ranges",
        "X-Amz-Meta-*"         // ← Custom metadata
      ],
      "MaxAgeSeconds": 86400
    }
  ]
}
```

**Lỗi 4: Upload với Presigned URL bị block**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              VẤN ĐỀ VỚI PRESIGNED URL VÀ CORS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Presigned URL chứa signature trong query string:                          │
│  http://localhost:9000/mybucket/file.txt                                   │
│    ?X-Amz-Algorithm=AWS4-HMAC-SHA256                                       │
│    &X-Amz-Credential=minioadmin%2F20241129%2Fus-east-1%2Fs3%2Faws4_request │
│    &X-Amz-Date=20241129T100000Z                                            │
│    &X-Amz-Expires=3600                                                     │
│    &X-Amz-SignedHeaders=host                                               │
│    &X-Amz-Signature=abc123...                                              │
│                                                                             │
│  KHI UPLOAD:                                                               │
│  ──────────                                                                 │
│  Browser vẫn gửi Origin header và cần CORS được cấu hình đúng.            │
│  Presigned URL CHỈ xác thực quyền truy cập, KHÔNG bypass CORS.            │
│                                                                             │
│                                                                             │
│  LƯU Ý QUAN TRỌNG:                                                         │
│  ─────────────────                                                          │
│                                                                             │
│  1. Presigned URL thường yêu cầu Content-Type header match                 │
│     → AllowedHeaders phải có Content-Type                                  │
│                                                                             │
│  2. Nếu presigned URL có X-Amz-Meta-* headers                             │
│     → AllowedHeaders phải có X-Amz-Meta-* hoặc "*"                        │
│                                                                             │
│  3. Browser có thể thêm headers tự động (Accept, etc.)                     │
│     → AllowedHeaders nên cho phép các headers phổ biến                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Code TypeScript upload với presigned URL và xử lý CORS:**

```typescript
// filepath: src/utils/uploadWithPresignedUrl.ts

interface UploadResult {
    success: boolean;
    etag?: string;
    error?: string;
}

/**
 * Upload file đến MinIO sử dụng presigned URL
 * Xử lý CORS headers đúng cách
 */
async function uploadWithPresignedUrl(
    presignedUrl: string,
    file: File,
    onProgress?: (progress: number) => void
): Promise<UploadResult> {
    try {
        // Kiểm tra file
        if (!file) {
            throw new Error('No file provided');
        }
        
        console.log(`Uploading: ${file.name} (${file.size} bytes)`);
        console.log(`Content-Type: ${file.type}`);
        
        // Tạo XMLHttpRequest để track progress
        // (fetch API không hỗ trợ upload progress)
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            // Event handlers
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable && onProgress) {
                    const progress = Math.round((event.loaded / event.total) * 100);
                    onProgress(progress);
                }
            };
            
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    // Lấy ETag từ response header
                    // Cần CORS ExposeHeaders có 'ETag'
                    const etag = xhr.getResponseHeader('ETag');
                    
                    console.log('Upload successful!');
                    console.log('Response status:', xhr.status);
                    console.log('ETag:', etag);
                    
                    resolve({
                        success: true,
                        etag: etag || undefined
                    });
                } else {
                    // Xử lý HTTP errors
                    console.error('Upload failed with status:', xhr.status);
                    console.error('Response:', xhr.responseText);
                    
                    resolve({
                        success: false,
                        error: `HTTP ${xhr.status}: ${xhr.statusText}`
                    });
                }
            };
            
            xhr.onerror = () => {
                // Lỗi này thường là do CORS
                console.error('Upload error - likely CORS issue');
                console.error('Check browser console for CORS error details');
                
                resolve({
                    success: false,
                    error: 'Network error - possibly CORS blocked'
                });
            };
            
            xhr.onabort = () => {
                resolve({
                    success: false,
                    error: 'Upload aborted'
                });
            };
            
            // Open connection
            xhr.open('PUT', presignedUrl);
            
            // Set Content-Type header
            // QUAN TRỌNG: Phải match với Content-Type trong presigned URL (nếu có)
            if (file.type) {
                xhr.setRequestHeader('Content-Type', file.type);
            }
            
            // KHÔNG set các headers sau (browser tự thêm hoặc presigned URL đã có):
            // - Authorization (presigned URL đã có signature)
            // - Content-Length (browser tự tính)
            // - Host (browser tự thêm)
            
            // Send file
            xhr.send(file);
        });
        
    } catch (error) {
        console.error('Upload exception:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// Sử dụng với fetch API (không có progress)
async function uploadWithFetch(
    presignedUrl: string,
    file: File
): Promise<UploadResult> {
    try {
        const response = await fetch(presignedUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type || 'application/octet-stream'
            }
            // KHÔNG thêm mode: 'no-cors' - sẽ làm response bị opaque
        });
        
        if (response.ok) {
            const etag = response.headers.get('ETag');
            return {
                success: true,
                etag: etag || undefined
            };
        } else {
            const errorText = await response.text();
            return {
                success: false,
                error: `HTTP ${response.status}: ${errorText}`
            };
        }
        
    } catch (error) {
        // CORS error sẽ throw TypeError
        if (error instanceof TypeError) {
            console.error('Fetch failed - likely CORS error');
            return {
                success: false,
                error: 'CORS error - check MinIO CORS configuration'
            };
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

export { uploadWithPresignedUrl, uploadWithFetch };
```

**Code TypeScript delete với CORS:**

```typescript
// filepath: src/utils/deleteWithPresignedUrl.ts

interface DeleteResult {
    success: boolean;
    error?: string;
}

/**
 * Delete object từ MinIO sử dụng presigned URL
 * DELETE method cần CORS được cấu hình với AllowedMethods: ["DELETE"]
 */
async function deleteWithPresignedUrl(presignedUrl: string): Promise<DeleteResult> {
    try {
        console.log('Deleting object with presigned URL...');
        
        const response = await fetch(presignedUrl, {
            method: 'DELETE'
            // Không cần headers cho DELETE request đơn giản
        });
        
        // MinIO trả về 204 No Content khi delete thành công
        if (response.status === 204 || response.ok) {
            console.log('Delete successful!');
            return { success: true };
        } else {
            const errorText = await response.text();
            console.error('Delete failed:', response.status, errorText);
            return {
                success: false,
                error: `HTTP ${response.status}: ${errorText}`
            };
        }
        
    } catch (error) {
        // CORS error khi DELETE không được phép
        if (error instanceof TypeError) {
            console.error('Delete failed - CORS error');
            console.error('Make sure CORS AllowedMethods includes DELETE');
            return {
                success: false,
                error: 'CORS error - DELETE method not allowed'
            };
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

export { deleteWithPresignedUrl };
```

**CORS Configuration hoàn chỉnh cho File Sharing Application:**

```json
// filepath: cors-config-complete.json
// Cấu hình CORS đầy đủ cho ứng dụng file sharing
// Hỗ trợ: Upload, Download, Delete, Multipart Upload

{
  "CORSRules": [
    {
      "ID": "FileShareAppCORS",
      "AllowedOrigins": [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
      ],
      "AllowedMethods": [
        "GET",
        "PUT",
        "POST",
        "DELETE",
        "HEAD"
      ],
      "AllowedHeaders": [
        "Accept",
        "Accept-Encoding",
        "Accept-Language",
        "Authorization",
        "Cache-Control",
        "Content-Disposition",
        "Content-Encoding",
        "Content-Language",
        "Content-Length",
        "Content-MD5",
        "Content-Range",
        "Content-Type",
        "Expires",
        "If-Match",
        "If-Modified-Since",
        "If-None-Match",
        "If-Unmodified-Since",
        "Origin",
        "Range",
        "X-Amz-Acl",
        "X-Amz-Content-Sha256",
        "X-Amz-Date",
        "X-Amz-Grant-Full-Control",
        "X-Amz-Grant-Read",
        "X-Amz-Grant-Read-Acp",
        "X-Amz-Grant-Write",
        "X-Amz-Grant-Write-Acp",
        "X-Amz-Meta-*",
        "X-Amz-Request-Payer",
        "X-Amz-Server-Side-Encryption",
        "X-Amz-Server-Side-Encryption-Aws-Kms-Key-Id",
        "X-Amz-Server-Side-Encryption-Context",
        "X-Amz-Storage-Class",
        "X-Amz-User-Agent",
        "X-Amz-Website-Redirect-Location",
        "x-amz-*"
      ],
      "ExposeHeaders": [
        "Accept-Ranges",
        "Content-Disposition",
        "Content-Encoding",
        "Content-Length",
        "Content-Range",
        "Content-Type",
        "ETag",
        "Last-Modified",
        "X-Amz-Delete-Marker",
        "X-Amz-Meta-*",
        "X-Amz-Request-Id",
        "X-Amz-Server-Side-Encryption",
        "X-Amz-Version-Id"
      ],
      "MaxAgeSeconds": 86400
    }
  ]
}
```

**Troubleshooting Checklist:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              CORS TROUBLESHOOTING CHECKLIST                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  □ 1. Kiểm tra CORS đã được áp dụng cho bucket                            │
│       aws s3api get-bucket-cors --bucket mybucket \                        │
│           --endpoint-url http://localhost:9000 --profile minio             │
│                                                                             │
│  □ 2. Kiểm tra origin trong AllowedOrigins                                 │
│       - Có đúng protocol? (http vs https)                                  │
│       - Có đúng port? (:3000 vs :5173)                                     │
│       - Có trailing slash không? (không nên có)                            │
│                                                                             │
│  □ 3. Kiểm tra method trong AllowedMethods                                 │
│       - Upload: cần PUT                                                    │
│       - Delete: cần DELETE                                                 │
│       - Multipart: cần POST                                                │
│                                                                             │
│  □ 4. Kiểm tra headers trong AllowedHeaders                                │
│       - Content-Type (bắt buộc cho upload)                                 │
│       - Authorization (nếu không dùng presigned URL)                       │
│       - X-Amz-* (cho S3 operations)                                        │
│                                                                             │
│  □ 5. Kiểm tra ExposeHeaders                                               │
│       - ETag (bắt buộc cho multipart upload)                              │
│       - Content-Length (cho progress tracking)                            │
│                                                                             │
│  □ 6. Test preflight với curl                                              │
│       curl -v -X OPTIONS \                                                 │
│           -H "Origin: http://localhost:3000" \                             │
│           -H "Access-Control-Request-Method: PUT" \                        │
│           http://localhost:9000/mybucket/test.txt                          │
│                                                                             │
│  □ 7. Xem Network tab trong browser DevTools                               │
│       - Tìm request OPTIONS (preflight)                                    │
│       - Kiểm tra response headers                                          │
│                                                                             │
│  □ 8. Clear browser cache và retry                                         │
│       - CORS preflight được cache theo MaxAgeSeconds                       │
│       - Sau khi sửa config, cần clear cache                                │
│                                                                             │
│  □ 9. Kiểm tra không có lỗi JavaScript khác                               │
│       - CORS error có thể che giấu lỗi thực sự khác                       │
│                                                                             │
│  □ 10. Thử với AllowedOrigins: ["*"] để test                               │
│        - Nếu hoạt động → vấn đề ở origin configuration                    │
│        - Nhớ đổi lại cho production!                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```


// ...existing code...

---

### 1.6 Cấu Hình Khắc Phục Lỗi Network

#### 1.6.1 Nguyên nhân gây ra lỗi ERR_CONNECTION_REFUSED

**ERR_CONNECTION_REFUSED là gì?**

Lỗi `ERR_CONNECTION_REFUSED` xảy ra khi browser hoặc client cố gắng kết nối đến một server, nhưng server **từ chối kết nối**. Đây là một trong những lỗi network phổ biến nhất khi làm việc với MinIO.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              ERR_CONNECTION_REFUSED - GIẢI THÍCH CHI TIẾT                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  LUỒNG KẾT NỐI BÌNH THƯỜNG (TCP 3-Way Handshake):                         │
│  ─────────────────────────────────────────────────                          │
│                                                                             │
│  ┌──────────┐                                        ┌──────────┐          │
│  │  Client  │                                        │  Server  │          │
│  │ (Browser)│                                        │ (MinIO)  │          │
│  └────┬─────┘                                        └────┬─────┘          │
│       │                                                   │                │
│       │──────────────── SYN (Xin kết nối) ───────────────►│                │
│       │                                                   │                │
│       │◄─────────────── SYN-ACK (Đồng ý) ─────────────────│                │
│       │                                                   │                │
│       │──────────────── ACK (Xác nhận) ──────────────────►│                │
│       │                                                   │                │
│       │              ═══ KẾT NỐI THÀNH CÔNG ═══           │                │
│                                                                             │
│                                                                             │
│  KHI XẢY RA ERR_CONNECTION_REFUSED:                                        │
│  ──────────────────────────────────                                         │
│                                                                             │
│  ┌──────────┐                                        ┌──────────┐          │
│  │  Client  │                                        │  Server  │          │
│  │ (Browser)│                                        │ (MinIO)  │          │
│  └────┬─────┘                                        └────┬─────┘          │
│       │                                                   │                │
│       │──────────────── SYN (Xin kết nối) ───────────────►│                │
│       │                                                   │                │
│       │◄─────────────── RST (Từ chối!) ───────────────────│                │
│       │                                                   │                │
│       │   🚫 ERR_CONNECTION_REFUSED                       │                │
│                                                                             │
│  Server gửi RST (Reset) thay vì SYN-ACK vì:                                │
│  • Không có service nào đang lắng nghe trên port đó                       │
│  • Firewall chặn và từ chối kết nối                                       │
│  • Server đã bind nhưng chưa accept connections                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Các nguyên nhân cụ thể gây ra ERR_CONNECTION_REFUSED:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              NGUYÊN NHÂN ERR_CONNECTION_REFUSED VỚI MINIO                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. MINIO SERVER CHƯA CHẠY                                                 │
│  ────────────────────────────                                               │
│     • Container Docker chưa start                                          │
│     • systemd service chưa enable/start                                    │
│     • MinIO process bị crash                                               │
│                                                                             │
│  2. MINIO ĐANG CHẠY TRÊN PORT KHÁC                                        │
│  ─────────────────────────────────                                          │
│     • Cấu hình port khác với port bạn đang truy cập                       │
│     • API port (9000) khác với Console port (9001)                        │
│     • Custom port được cấu hình trong docker-compose.yml                  │
│                                                                             │
│  3. MINIO CHỈ BIND VÀO LOCALHOST                                          │
│  ────────────────────────────────                                           │
│     • MinIO chỉ lắng nghe trên 127.0.0.1                                  │
│     • Không thể truy cập từ máy khác hoặc container khác                  │
│     • Cần bind vào 0.0.0.0 để lắng nghe mọi interface                     │
│                                                                             │
│  4. FIREWALL ĐANG CHẶN PORT                                               │
│  ──────────────────────────────                                             │
│     • ufw (Ubuntu firewall) chặn port 9000/9001                           │
│     • Windows Firewall chặn inbound connections                           │
│     • Security group (cloud) không cho phép traffic                       │
│                                                                             │
│  5. DOCKER NETWORK ISSUES                                                  │
│  ─────────────────────────────                                              │
│     • Container không được publish port ra host                           │
│     • Port conflict với service khác                                      │
│     • Docker network không cho phép traffic từ bên ngoài                  │
│                                                                             │
│  6. SAI ĐỊA CHỈ HOST/IP                                                   │
│  ────────────────────────                                                   │
│     • Dùng localhost khi MinIO ở máy khác                                 │
│     • IP address đã thay đổi (DHCP)                                       │
│     • DNS không resolve đúng                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Cách chẩn đoán ERR_CONNECTION_REFUSED:**

```bash
# ===============================================
# BƯỚC 1: Kiểm tra MinIO có đang chạy không
# ===============================================

# Nếu dùng Docker:
docker ps | grep minio
# Nếu không thấy output → MinIO container chưa chạy

docker compose ps
# Kiểm tra status của minio service

# Nếu dùng systemd (Ubuntu):
sudo systemctl status minio
# Nếu status không phải "active (running)" → MinIO chưa chạy


# ===============================================
# BƯỚC 2: Kiểm tra port đang được sử dụng
# ===============================================

# Linux/macOS:
sudo netstat -tlnp | grep 9000
# Hoặc:
sudo ss -tlnp | grep 9000
# Hoặc:
sudo lsof -i :9000

# Output mong đợi (MinIO đang chạy):
# tcp    0    0 0.0.0.0:9000    0.0.0.0:*    LISTEN    12345/minio

# Nếu không có output → Không có gì lắng nghe trên port 9000


# Windows (PowerShell):
netstat -ano | findstr :9000
# Hoặc:
Get-NetTCPConnection -LocalPort 9000


# ===============================================
# BƯỚC 3: Kiểm tra kết nối từ local
# ===============================================

# Test kết nối TCP đến port
nc -zv localhost 9000
# Output thành công: Connection to localhost 9000 port [tcp/*] succeeded!
# Output thất bại: Connection refused

# Hoặc dùng telnet:
telnet localhost 9000

# Hoặc dùng curl:
curl -v http://localhost:9000/minio/health/live
# Connection refused → MinIO không chạy hoặc port sai


# ===============================================
# BƯỚC 4: Kiểm tra MinIO logs
# ===============================================

# Docker:
docker compose logs minio | tail -50
docker logs minio --tail 50

# Systemd:
sudo journalctl -u minio -n 50 --no-pager

# Tìm các error messages:
docker compose logs minio | grep -i error
docker compose logs minio | grep -i "bind"
docker compose logs minio | grep -i "listen"
```

**Các cách khắc phục ERR_CONNECTION_REFUSED:**

```bash
# ===============================================
# KHẮC PHỤC 1: Start MinIO nếu chưa chạy
# ===============================================

# Docker:
docker compose up -d
docker compose start minio

# Systemd:
sudo systemctl start minio
sudo systemctl enable minio  # Để tự động start khi boot


# ===============================================
# KHẮC PHỤC 2: Kiểm tra và sửa port configuration
# ===============================================

# Kiểm tra docker-compose.yml
cat docker-compose.yml | grep -A 5 "ports:"

# Đảm bảo port mapping đúng:
# ports:
#   - "9000:9000"   # Host:Container
#   - "9001:9001"


# ===============================================
# KHẮC PHỤC 3: Bind vào tất cả interfaces
# ===============================================

# Trong MinIO command, thêm --address:
command: server /data --console-address ":9001" --address ":9000"

# ":9000" có nghĩa bind vào 0.0.0.0:9000 (tất cả interfaces)
# "127.0.0.1:9000" chỉ bind vào localhost


# ===============================================
# KHẮC PHỤC 4: Mở firewall port
# ===============================================

# Ubuntu (ufw):
sudo ufw allow 9000/tcp
sudo ufw allow 9001/tcp
sudo ufw status

# CentOS/RHEL (firewalld):
sudo firewall-cmd --permanent --add-port=9000/tcp
sudo firewall-cmd --permanent --add-port=9001/tcp
sudo firewall-cmd --reload

# Windows (PowerShell as Admin):
New-NetFirewallRule -DisplayName "MinIO API" -Direction Inbound -Port 9000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "MinIO Console" -Direction Inbound -Port 9001 -Protocol TCP -Action Allow


# ===============================================
# KHẮC PHỤC 5: Giải quyết port conflict
# ===============================================

# Tìm process đang dùng port 9000:
sudo lsof -i :9000
# Hoặc:
sudo fuser -v 9000/tcp

# Kill process đang chiếm port (cẩn thận!):
sudo kill -9 <PID>

# Hoặc đổi MinIO sang port khác:
# docker-compose.yml:
ports:
  - "9002:9000"   # Dùng port 9002 trên host
  - "9003:9001"
```

**Script chẩn đoán tự động:**

```bash
#!/bin/bash
# filepath: scripts/diagnose-connection-refused.sh

MINIO_HOST=${1:-localhost}
MINIO_PORT=${2:-9000}
CONSOLE_PORT=${3:-9001}

echo "=============================================="
echo "   ERR_CONNECTION_REFUSED Diagnostic Tool"
echo "=============================================="
echo ""
echo "Target: ${MINIO_HOST}:${MINIO_PORT}"
echo ""

# Check 1: DNS resolution
echo "[1] Checking DNS resolution..."
if host ${MINIO_HOST} > /dev/null 2>&1 || [ "${MINIO_HOST}" = "localhost" ] || [[ "${MINIO_HOST}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "    ✓ Host resolution OK"
else
    echo "    ✗ Cannot resolve hostname: ${MINIO_HOST}"
    exit 1
fi

# Check 2: Port listening (local only)
echo ""
echo "[2] Checking if port ${MINIO_PORT} is listening..."
if [ "${MINIO_HOST}" = "localhost" ] || [ "${MINIO_HOST}" = "127.0.0.1" ]; then
    if ss -tln | grep -q ":${MINIO_PORT} "; then
        echo "    ✓ Port ${MINIO_PORT} is listening"
        LISTENING_PROCESS=$(sudo lsof -i :${MINIO_PORT} 2>/dev/null | grep LISTEN | awk '{print $1, $2}' | head -1)
        echo "    Process: ${LISTENING_PROCESS:-unknown}"
    else
        echo "    ✗ Nothing listening on port ${MINIO_PORT}"
        echo ""
        echo "    Suggestions:"
        echo "    - Start MinIO: docker compose up -d"
        echo "    - Or: sudo systemctl start minio"
    fi
else
    echo "    (Skipped - cannot check remote host)"
fi

# Check 3: TCP connection test
echo ""
echo "[3] Testing TCP connection to ${MINIO_HOST}:${MINIO_PORT}..."
if nc -zw3 ${MINIO_HOST} ${MINIO_PORT} 2>/dev/null; then
    echo "    ✓ TCP connection successful"
else
    echo "    ✗ TCP connection failed (Connection refused or timeout)"
fi

# Check 4: HTTP health check
echo ""
echo "[4] Testing MinIO health endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://${MINIO_HOST}:${MINIO_PORT}/minio/health/live" 2>/dev/null)
if [ "${HTTP_CODE}" = "200" ]; then
    echo "    ✓ MinIO API is responding (HTTP ${HTTP_CODE})"
elif [ "${HTTP_CODE}" = "000" ]; then
    echo "    ✗ Cannot connect to MinIO API"
else
    echo "    ⚠ MinIO responded with HTTP ${HTTP_CODE}"
fi

# Check 5: Console port
echo ""
echo "[5] Testing MinIO Console on port ${CONSOLE_PORT}..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://${MINIO_HOST}:${CONSOLE_PORT}" 2>/dev/null)
if [ "${HTTP_CODE}" = "200" ] || [ "${HTTP_CODE}" = "302" ]; then
    echo "    ✓ MinIO Console is responding (HTTP ${HTTP_CODE})"
elif [ "${HTTP_CODE}" = "000" ]; then
    echo "    ✗ Cannot connect to MinIO Console"
else
    echo "    ⚠ Console responded with HTTP ${HTTP_CODE}"
fi

# Check 6: Docker status (if applicable)
echo ""
echo "[6] Checking Docker containers..."
if command -v docker &> /dev/null; then
    MINIO_CONTAINER=$(docker ps --filter "name=minio" --format "{{.Names}}: {{.Status}}" 2>/dev/null)
    if [ -n "${MINIO_CONTAINER}" ]; then
        echo "    ✓ MinIO container found: ${MINIO_CONTAINER}"
    else
        echo "    ⚠ No running MinIO container found"
        STOPPED=$(docker ps -a --filter "name=minio" --filter "status=exited" --format "{{.Names}}: {{.Status}}" 2>/dev/null)
        if [ -n "${STOPPED}" ]; then
            echo "    Found stopped container: ${STOPPED}"
        fi
    fi
else
    echo "    (Docker not installed)"
fi

# Check 7: Firewall status
echo ""
echo "[7] Checking firewall..."
if command -v ufw &> /dev/null; then
    UFW_STATUS=$(sudo ufw status 2>/dev/null | head -1)
    echo "    UFW: ${UFW_STATUS}"
    
    UFW_9000=$(sudo ufw status 2>/dev/null | grep "9000")
    if [ -n "${UFW_9000}" ]; then
        echo "    Port 9000 rule: ${UFW_9000}"
    else
        echo "    ⚠ No explicit rule for port 9000"
    fi
fi

echo ""
echo "=============================================="
echo "Diagnostic complete!"
echo "=============================================="
```

---

#### 1.6.2 Nguyên nhân gây ra lỗi ERR_CONNECTION_RESET

**ERR_CONNECTION_RESET là gì?**

Lỗi `ERR_CONNECTION_RESET` xảy ra khi kết nối TCP đã được thiết lập, nhưng sau đó bị **đột ngột đóng** bởi server (hoặc một thiết bị mạng trung gian). Khác với CONNECTION_REFUSED, lỗi này xảy ra **sau khi** kết nối đã được thiết lập.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              ERR_CONNECTION_RESET - GIẢI THÍCH CHI TIẾT                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  LUỒNG KẾT NỐI BÌNH THƯỜNG:                                               │
│  ───────────────────────────                                                │
│                                                                             │
│  ┌──────────┐                                        ┌──────────┐          │
│  │  Client  │                                        │  Server  │          │
│  └────┬─────┘                                        └────┬─────┘          │
│       │                                                   │                │
│       │════════════ Kết nối TCP đã thiết lập ════════════│                │
│       │                                                   │                │
│       │──────────────── HTTP Request ────────────────────►│                │
│       │                                                   │                │
│       │◄─────────────── HTTP Response ────────────────────│                │
│       │                                                   │                │
│       │──────────────── FIN (Đóng kết nối) ──────────────►│                │
│       │◄─────────────── FIN-ACK ──────────────────────────│                │
│       │                                                   │                │
│       │              ═══ KẾT NỐI ĐÓNG BÌNH THƯỜNG ═══     │                │
│                                                                             │
│                                                                             │
│  KHI XẢY RA ERR_CONNECTION_RESET:                                          │
│  ──────────────────────────────────                                         │
│                                                                             │
│  ┌──────────┐                                        ┌──────────┐          │
│  │  Client  │                                        │  Server  │          │
│  └────┬─────┘                                        └────┬─────┘          │
│       │                                                   │                │
│       │════════════ Kết nối TCP đã thiết lập ════════════│                │
│       │                                                   │                │
│       │──────────────── HTTP Request ────────────────────►│                │
│       │                                                   │                │
│       │◄─────────────── RST (Reset đột ngột!) ────────────│                │
│       │                                                   │                │
│       │   🚫 ERR_CONNECTION_RESET                         │                │
│                                                                             │
│  Server gửi RST thay vì FIN vì:                                            │
│  • Server process bị crash/killed                                          │
│  • Server đóng socket đột ngột                                             │
│  • Firewall/IDS đóng kết nối                                               │
│  • Connection timeout ở server side                                        │
│  • Server từ chối vì lý do bảo mật                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Các nguyên nhân cụ thể gây ra ERR_CONNECTION_RESET với MinIO:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              NGUYÊN NHÂN ERR_CONNECTION_RESET VỚI MINIO                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. MINIO SERVER CRASH HOẶC RESTART                                        │
│  ─────────────────────────────────────                                      │
│     • MinIO process bị killed (OOM killer, manual kill)                   │
│     • MinIO đang restart                                                  │
│     • Container bị recreate                                               │
│     • Health check failed và orchestrator restart                         │
│                                                                             │
│  2. REQUEST QUÁ LỚN                                                        │
│  ──────────────────                                                         │
│     • Upload file vượt quá limit cho phép                                 │
│     • Request body quá lớn cho cấu hình server                           │
│     • Multipart upload với part size không hợp lệ                        │
│                                                                             │
│  3. TIMEOUT Ở SERVER SIDE                                                  │
│  ─────────────────────────────                                              │
│     • Keep-alive timeout                                                  │
│     • Read/Write timeout                                                  │
│     • Request processing timeout                                          │
│                                                                             │
│  4. FIREWALL/IDS ĐÓNG KẾT NỐI                                             │
│  ────────────────────────────────                                           │
│     • Deep packet inspection phát hiện "anomaly"                         │
│     • Connection timeout của firewall                                     │
│     • Rate limiting triggered                                             │
│                                                                             │
│  5. REVERSE PROXY ISSUES                                                   │
│  ───────────────────────────                                                │
│     • Nginx upstream timeout                                              │
│     • Proxy buffer overflow                                               │
│     • Backend health check failed                                         │
│                                                                             │
│  6. TLS/SSL HANDSHAKE FAILURE                                              │
│  ─────────────────────────────                                              │
│     • Certificate verification failed                                     │
│     • TLS version mismatch                                                │
│     • Cipher suite negotiation failed                                     │
│                                                                             │
│  7. RESOURCE EXHAUSTION                                                    │
│  ────────────────────────                                                   │
│     • Too many open files (ulimit)                                        │
│     • Memory exhaustion                                                   │
│     • Disk full                                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Cách chẩn đoán ERR_CONNECTION_RESET:**

```bash
# ===============================================
# BƯỚC 1: Kiểm tra MinIO logs ngay khi lỗi xảy ra
# ===============================================

# Docker:
docker compose logs minio --tail 100 | grep -i -E "(error|reset|abort|crash|kill)"

# Systemd:
sudo journalctl -u minio -n 100 --no-pager | grep -i -E "(error|reset|abort)"

# Tìm các signals:
docker compose logs minio | grep -i -E "(SIGTERM|SIGKILL|SIGSEGV|OOM)"


# ===============================================
# BƯỚC 2: Kiểm tra tài nguyên hệ thống
# ===============================================

# Kiểm tra memory:
free -h
docker stats minio --no-stream

# Kiểm tra disk space:
df -h

# Kiểm tra file descriptors:
cat /proc/$(pgrep minio)/limits | grep "Max open files"
ls /proc/$(pgrep minio)/fd | wc -l

# Kiểm tra OOM events:
dmesg | grep -i "oom\|killed"


# ===============================================
# BƯỚC 3: Kiểm tra timeout configurations
# ===============================================

# Kiểm tra MinIO timeout settings
docker compose exec minio env | grep -i timeout

# Kiểm tra kernel TCP settings:
sysctl net.ipv4.tcp_keepalive_time
sysctl net.ipv4.tcp_keepalive_probes
sysctl net.ipv4.tcp_keepalive_intvl


# ===============================================
# BƯỚC 4: Capture network traffic để debug
# ===============================================

# Capture traffic trên port 9000:
sudo tcpdump -i any port 9000 -w minio_traffic.pcap

# Trong một terminal khác, thực hiện request gây lỗi
# Sau đó analyze với Wireshark:
# - Tìm các packet với flag RST
# - Xem sequence của events


# ===============================================
# BƯỚC 5: Test với timeout dài hơn
# ===============================================

# Test với curl và timeout dài:
curl -v --connect-timeout 30 --max-time 300 \
    http://localhost:9000/minio/health/live

# Nếu vẫn bị reset, vấn đề không phải timeout
```

**Các cách khắc phục ERR_CONNECTION_RESET:**

```bash
# ===============================================
# KHẮC PHỤC 1: Tăng resource limits cho MinIO
# ===============================================

# Docker Compose - thêm resource limits:
```

```yaml
# filepath: docker-compose.yml
services:
  minio:
    image: minio/minio:latest
    # ...existing config...
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 8G
        reservations:
          cpus: '1'
          memory: 2G
    ulimits:
      nofile:
        soft: 65536
        hard: 65536
      nproc:
        soft: 65536
        hard: 65536
```

```bash
# Systemd - thêm limits vào service file:
```

```ini
# filepath: /etc/systemd/system/minio.service
[Service]
# ...existing config...

LimitNOFILE=65536
LimitNPROC=65536
LimitCORE=infinity
MemoryLimit=8G
```

```bash
# ===============================================
# KHẮC PHỤC 2: Cấu hình timeout phù hợp
# ===============================================

# Kernel TCP keepalive settings:
sudo sysctl -w net.ipv4.tcp_keepalive_time=60
sudo sysctl -w net.ipv4.tcp_keepalive_probes=3
sudo sysctl -w net.ipv4.tcp_keepalive_intvl=10

# Để persistent qua reboot, thêm vào /etc/sysctl.conf:
echo "net.ipv4.tcp_keepalive_time = 60" | sudo tee -a /etc/sysctl.conf
echo "net.ipv4.tcp_keepalive_probes = 3" | sudo tee -a /etc/sysctl.conf
echo "net.ipv4.tcp_keepalive_intvl = 10" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p


# ===============================================
# KHẮC PHỤC 3: Cấu hình Nginx proxy đúng cách
# ===============================================
```

```nginx
# filepath: /etc/nginx/conf.d/minio.conf
upstream minio_backend {
    server minio:9000;
    keepalive 32;  # Connection pooling
}

server {
    listen 80;
    server_name minio.example.com;

    # Tắt buffering cho upload lớn
    proxy_buffering off;
    proxy_request_buffering off;

    # Tăng timeout
    proxy_connect_timeout 300;
    proxy_send_timeout 300;
    proxy_read_timeout 300;
    send_timeout 300;

    # Không giới hạn body size
    client_max_body_size 0;

    # Keep-alive settings
    proxy_http_version 1.1;
    proxy_set_header Connection "";

    location / {
        proxy_pass http://minio_backend;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# ===============================================
# KHẮC PHỤC 4: Xử lý OOM (Out of Memory)
# ===============================================

# Kiểm tra OOM killer:
dmesg | grep -i "out of memory"
dmesg | grep -i "killed process"

# Nếu MinIO bị OOM killed:
# 1. Tăng memory cho server
# 2. Giảm số concurrent connections
# 3. Cấu hình memory limits cho MinIO

# Environment variable để giới hạn memory usage:
# MINIO_API_REQUESTS_MAX - Giới hạn số concurrent requests
```

---

#### 1.6.3 Nguyên nhân gây ra lỗi ERR_CONNECTION_ABORTED

**ERR_CONNECTION_ABORTED là gì?**

Lỗi `ERR_CONNECTION_ABORTED` xảy ra khi kết nối bị **hủy bỏ** trong quá trình truyền dữ liệu, thường do **phía client** hoặc do một sự kiện bất thường trên đường truyền.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              ERR_CONNECTION_ABORTED - GIẢI THÍCH CHI TIẾT                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SO SÁNH 3 LOẠI LỖI CONNECTION:                                            │
│  ─────────────────────────────────                                          │
│                                                                             │
│  ERR_CONNECTION_REFUSED:                                                   │
│  • Kết nối bị TỪ CHỐI ngay từ đầu                                         │
│  • Server không accept connection                                          │
│  • Không có handshake TCP thành công                                       │
│                                                                             │
│  ERR_CONNECTION_RESET:                                                     │
│  • Kết nối đã thiết lập nhưng bị server NGẮT ĐỘT NGỘT                    │
│  • Server gửi RST packet                                                   │
│  • Thường do server crash hoặc đóng socket                                │
│                                                                             │
│  ERR_CONNECTION_ABORTED:                                                   │
│  • Kết nối bị HỦY GIỮA CHỪNG trong quá trình truyền                       │
│  • Có thể do client hoặc thiết bị mạng trung gian                         │
│  • Dữ liệu đang được gửi/nhận bị gián đoạn                                │
│                                                                             │
│                                                                             │
│  TIMELINE KHI XẢY RA ERR_CONNECTION_ABORTED:                               │
│  ─────────────────────────────────────────────                              │
│                                                                             │
│  ┌──────────┐         ┌──────────┐         ┌──────────┐                   │
│  │  Client  │         │ Network  │         │  MinIO   │                   │
│  └────┬─────┘         └────┬─────┘         └────┬─────┘                   │
│       │                    │                    │                          │
│       │═══ TCP Connection Established ══════════│                          │
│       │                    │                    │                          │
│       │─── HTTP Request (Upload Start) ────────►│                          │
│       │                    │                    │                          │
│       │─── Data chunk 1 ───────────────────────►│                          │
│       │                    │                    │                          │
│       │─── Data chunk 2 ───────────────────────►│                          │
│       │                    │                    │                          │
│       │    ╳ ABORT!        │                    │                          │
│       │    (User cancel,   │                    │                          │
│       │     Tab close,     │                    │                          │
│       │     Network drop)  │                    │                          │
│       │                    │                    │                          │
│       │    🚫 ERR_CONNECTION_ABORTED            │                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Các nguyên nhân gây ra ERR_CONNECTION_ABORTED:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              NGUYÊN NHÂN ERR_CONNECTION_ABORTED VỚI MINIO                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. USER ACTIONS (Hành động của người dùng)                                │
│  ──────────────────────────────────────────                                 │
│     • User nhấn Cancel trong khi upload                                   │
│     • User đóng tab/browser trong khi request đang xử lý                  │
│     • User navigate sang trang khác                                       │
│     • JavaScript code gọi abort() trên XMLHttpRequest                     │
│                                                                             │
│  2. NETWORK INSTABILITY (Mạng không ổn định)                               │
│  ──────────────────────────────────────────────                             │
│     • WiFi bị disconnect                                                  │
│     • Mobile network chuyển từ 4G sang WiFi                              │
│     • VPN connection drop                                                 │
│     • ISP issues                                                          │
│                                                                             │
│  3. TIMEOUT ISSUES                                                         │
│  ──────────────────                                                         │
│     • Browser timeout (thường 5-30 phút cho upload)                       │
│     • fetch API timeout                                                   │
│     • XMLHttpRequest timeout                                              │
│                                                                             │
│  4. RESOURCE CONSTRAINTS ON CLIENT                                         │
│  ─────────────────────────────────                                          │
│     • Browser out of memory                                               │
│     • JavaScript heap overflow                                            │
│     • Too many concurrent connections                                     │
│                                                                             │
│  5. ANTIVIRUS/SECURITY SOFTWARE                                            │
│  ─────────────────────────────────                                          │
│     • Antivirus scanning uploads và timeout                              │
│     • Security software blocking connections                              │
│     • Corporate proxy issues                                              │
│                                                                             │
│  6. BROWSER EXTENSIONS                                                     │
│  ────────────────────────                                                   │
│     • Ad blockers blocking requests                                       │
│     • Privacy extensions interfering                                      │
│     • Proxy extensions failing                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Cách chẩn đoán ERR_CONNECTION_ABORTED:**

```javascript
// filepath: src/utils/diagnoseAborted.ts

/**
 * Wrapper để diagnose connection aborted errors
 */
async function fetchWithDiagnostics(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const controller = new AbortController();
    const startTime = Date.now();
    
    // Thêm event listeners để track abort
    controller.signal.addEventListener('abort', () => {
        const duration = Date.now() - startTime;
        console.log(`[ABORT] Request aborted after ${duration}ms`);
        console.log(`[ABORT] Reason:`, controller.signal.reason);
    });
    
    try {
        console.log(`[START] Fetching: ${url}`);
        
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        
        const duration = Date.now() - startTime;
        console.log(`[SUCCESS] Completed in ${duration}ms`);
        
        return response;
        
    } catch (error) {
        const duration = Date.now() - startTime;
        
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                console.error(`[ABORTED] After ${duration}ms`);
                console.error(`[ABORTED] Possible causes:`);
                console.error(`  - User cancelled the request`);
                console.error(`  - Network disconnected`);
                console.error(`  - Timeout exceeded`);
                console.error(`  - Browser/tab closed`);
            } else if (error.message.includes('network')) {
                console.error(`[NETWORK ERROR] After ${duration}ms`);
                console.error(`[NETWORK ERROR] Message: ${error.message}`);
            } else {
                console.error(`[ERROR] ${error.name}: ${error.message}`);
            }
        }
        
        throw error;
    }
}

/**
 * Upload với retry và abort handling
 */
async function uploadWithAbortHandling(
    presignedUrl: string,
    file: File,
    onProgress?: (progress: number) => void,
    onAbort?: () => void
): Promise<{ success: boolean; error?: string }> {
    const controller = new AbortController();
    
    // Lưu controller để có thể abort từ bên ngoài
    (window as any).__uploadController = controller;
    
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && onProgress) {
                onProgress((e.loaded / e.total) * 100);
            }
        };
        
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve({ success: true });
            } else {
                resolve({ 
                    success: false, 
                    error: `HTTP ${xhr.status}: ${xhr.statusText}` 
                });
            }
        };
        
        xhr.onerror = () => {
            console.error('[XHR ERROR] Network error occurred');
            resolve({ 
                success: false, 
                error: 'Network error - connection may have been aborted' 
            });
        };
        
        xhr.onabort = () => {
            console.log('[XHR ABORT] Request was aborted');
            if (onAbort) onAbort();
            resolve({ 
                success: false, 
                error: 'Upload was cancelled' 
            });
        };
        
        xhr.ontimeout = () => {
            console.error('[XHR TIMEOUT] Request timed out');
            resolve({ 
                success: false, 
                error: 'Upload timed out' 
            });
        };
        
        // Lắng nghe page unload để warn user
        const beforeUnloadHandler = (e: BeforeUnloadEvent) => {
            if (xhr.readyState !== XMLHttpRequest.DONE) {
                e.preventDefault();
                e.returnValue = 'Upload is in progress. Are you sure you want to leave?';
                return e.returnValue;
            }
        };
        window.addEventListener('beforeunload', beforeUnloadHandler);
        
        // Cleanup on complete
        xhr.onloadend = () => {
            window.removeEventListener('beforeunload', beforeUnloadHandler);
            delete (window as any).__uploadController;
        };
        
        xhr.open('PUT', presignedUrl);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.timeout = 30 * 60 * 1000; // 30 minutes timeout
        xhr.send(file);
    });
}

// Hàm để user có thể cancel upload
function cancelUpload() {
    const controller = (window as any).__uploadController;
    if (controller) {
        controller.abort();
        console.log('[MANUAL ABORT] Upload cancelled by user');
    }
}

export { fetchWithDiagnostics, uploadWithAbortHandling, cancelUpload };
```

**Các cách khắc phục ERR_CONNECTION_ABORTED:**

```typescript
// filepath: src/utils/robustUpload.ts

interface UploadConfig {
    maxRetries: number;
    retryDelay: number;
    chunkSize: number;
    timeout: number;
}

const DEFAULT_CONFIG: UploadConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    chunkSize: 5 * 1024 * 1024, // 5MB chunks
    timeout: 30 * 60 * 1000 // 30 minutes
};

/**
 * Upload với retry logic để handle connection aborted
 */
async function robustUpload(
    getPresignedUrl: () => Promise<string>,
    file: File,
    config: Partial<UploadConfig> = {}
): Promise<{ success: boolean; error?: string }> {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    
    for (let attempt = 1; attempt <= cfg.maxRetries; attempt++) {
        console.log(`[ATTEMPT ${attempt}/${cfg.maxRetries}] Starting upload...`);
        
        try {
            // Lấy presigned URL mới cho mỗi attempt
            // (URL cũ có thể expired)
            const presignedUrl = await getPresignedUrl();
            
            const result = await uploadWithTimeout(presignedUrl, file, cfg.timeout);
            
            if (result.success) {
                console.log(`[SUCCESS] Upload completed on attempt ${attempt}`);
                return result;
            }
            
            // Nếu lỗi nhưng không phải connection aborted, không retry
            if (result.error && !isRetryableError(result.error)) {
                console.log(`[FAIL] Non-retryable error: ${result.error}`);
                return result;
            }
            
        } catch (error) {
            console.error(`[ATTEMPT ${attempt} FAILED]`, error);
        }
        
        // Wait before retry
        if (attempt < cfg.maxRetries) {
            const delay = cfg.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
            console.log(`[RETRY] Waiting ${delay}ms before retry...`);
            await sleep(delay);
        }
    }
    
    return {
        success: false,
        error: `Upload failed after ${cfg.maxRetries} attempts`
    };
}

function isRetryableError(error: string): boolean {
    const retryablePatterns = [
        'aborted',
        'abort',
        'network',
        'connection',
        'timeout',
        'reset',
        'ECONNRESET',
        'ETIMEDOUT'
    ];
    
    const lowerError = error.toLowerCase();
    return retryablePatterns.some(pattern => lowerError.includes(pattern));
}

async function uploadWithTimeout(
    url: string,
    file: File,
    timeout: number
): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve({ success: true });
            } else {
                resolve({ success: false, error: `HTTP ${xhr.status}` });
            }
        };
        
        xhr.onerror = () => {
            resolve({ success: false, error: 'Network error' });
        };
        
        xhr.onabort = () => {
            resolve({ success: false, error: 'Upload aborted' });
        };
        
        xhr.ontimeout = () => {
            resolve({ success: false, error: 'Upload timeout' });
        };
        
        xhr.open('PUT', url);
        xhr.timeout = timeout;
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.send(file);
    });
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export { robustUpload };
```

**Cấu hình để giảm Connection Aborted:**

```yaml
# filepath: docker-compose.yml
version: '3.8'

services:
  minio:
    image: minio/minio:latest
    # ...existing config...
    environment:
      # API timeout settings
      MINIO_API_REQUESTS_DEADLINE: "10m"
      MINIO_API_REQUESTS_MAX: 1600
      # ...other env vars...
    
    # Health check với timeout hợp lý
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3
      start_period: 30s
```

---

#### 1.6.4 Cấu hình firewall trên Ubuntu để cho phép truy cập MinIO

**Hiểu về UFW (Uncomplicated Firewall)**

UFW là firewall mặc định trên Ubuntu, cung cấp giao diện đơn giản để quản lý iptables rules.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              FIREWALL VÀ MINIO - TỔNG QUAN                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  LUỒNG TRAFFIC KHI CÓ FIREWALL:                                            │
│  ─────────────────────────────────                                          │
│                                                                             │
│  ┌──────────┐                                                               │
│  │  Client  │                                                               │
│  │ (Browser)│                                                               │
│  └────┬─────┘                                                               │
│       │                                                                     │
│       │ Request: http://server:9000/bucket/file                            │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        UBUNTU SERVER                                │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                      FIREWALL (UFW)                          │   │   │
│  │  │                                                              │   │   │
│  │  │  Rules:                                                      │   │   │
│  │  │  ├── Port 22 (SSH): ALLOW                                   │   │   │
│  │  │  ├── Port 80 (HTTP): ALLOW                                  │   │   │
│  │  │  ├── Port 443 (HTTPS): ALLOW                                │   │   │
│  │  │  ├── Port 9000 (MinIO API): ???                             │   │   │
│  │  │  └── Port 9001 (MinIO Console): ???                         │   │   │
│  │  │                                                              │   │   │
│  │  │  Default: DENY incoming                                      │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                           │                                         │   │
│  │                           ▼                                         │   │
│  │                    ┌─────────────┐                                  │   │
│  │                    │    MinIO    │                                  │   │
│  │                    │   :9000     │                                  │   │
│  │                    │   :9001     │                                  │   │
│  │                    └─────────────┘                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Nếu port 9000/9001 không được allow → ERR_CONNECTION_REFUSED              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Kiểm tra trạng thái firewall:**

```bash
# ===============================================
# KIỂM TRA TRẠNG THÁI UFW
# ===============================================

# Xem status và rules hiện tại
sudo ufw status verbose

# Output mẫu khi firewall active:
# Status: active
# Logging: on (low)
# Default: deny (incoming), allow (outgoing), deny (routed)
# New profiles: skip
#
# To                         Action      From
# --                         ------      ----
# 22/tcp                     ALLOW IN    Anywhere
# 80/tcp                     ALLOW IN    Anywhere
# 443/tcp                    ALLOW IN    Anywhere

# Nếu output là "Status: inactive" → Firewall không chạy

# Xem rules dạng numbered (để dễ delete)
sudo ufw status numbered

# Xem rules chi tiết
sudo ufw show raw
```

**Cấu hình UFW cho MinIO:**

```bash
# ===============================================
# CẤU HÌNH UFW CHO MINIO
# ===============================================

# Bước 1: Mở port MinIO API (9000)
sudo ufw allow 9000/tcp comment 'MinIO API'

# Bước 2: Mở port MinIO Console (9001)
sudo ufw allow 9001/tcp comment 'MinIO Console'

# Kiểm tra đã thêm thành công
sudo ufw status verbose | grep 900

# Output:
# 9000/tcp                   ALLOW IN    Anywhere                   # MinIO API
# 9001/tcp                   ALLOW IN    Anywhere                   # MinIO Console


# ===============================================
# CẤU HÌNH NÂNG CAO - GIỚI HẠN SOURCE IP
# ===============================================

# Chỉ cho phép từ mạng nội bộ (ví dụ: 192.168.1.0/24)
sudo ufw allow from 192.168.1.0/24 to any port 9000 proto tcp comment 'MinIO API - Internal'
sudo ufw allow from 192.168.1.0/24 to any port 9001 proto tcp comment 'MinIO Console - Internal'

# Chỉ cho phép từ IP cụ thể
sudo ufw allow from 10.0.0.100 to any port 9000 proto tcp comment 'MinIO API - Admin'

# Cho phép từ nhiều IPs (thêm nhiều rules)
sudo ufw allow from 192.168.1.10 to any port 9000,9001 proto tcp
sudo ufw allow from 192.168.1.20 to any port 9000,9001 proto tcp


# ===============================================
# ENABLE UFW (NẾU CHƯA BẬT)
# ===============================================

# CẢNH BÁO: Đảm bảo đã allow SSH trước khi enable!
sudo ufw allow ssh  # hoặc: sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable

# Xác nhận: "Firewall is active and enabled on system startup"


# ===============================================
# XÓA RULE NẾU CẦN
# ===============================================

# Liệt kê rules với số thứ tự
sudo ufw status numbered

# Xóa rule theo số thứ tự
sudo ufw delete 5  # Xóa rule số 5

# Hoặc xóa theo rule specification
sudo ufw delete allow 9000/tcp


# ===============================================
# RELOAD VÀ RESET
# ===============================================

# Reload rules (sau khi thay đổi)
sudo ufw reload

# Reset về mặc định (XÓA TẤT CẢ RULES!)
# sudo ufw reset
```

**Cấu hình UFW cho MinIO Distributed:**

```bash
# ===============================================
# CẤU HÌNH CHO MINIO DISTRIBUTED CLUSTER
# ===============================================

# Trong distributed mode, các MinIO nodes cần giao tiếp với nhau
# Cần mở thêm inter-node communication

# Giả sử có 4 nodes:
# - minio1: 192.168.1.101
# - minio2: 192.168.1.102
# - minio3: 192.168.1.103
# - minio4: 192.168.1.104

# Trên mỗi node, cho phép traffic từ các nodes khác:

# Node 1 (192.168.1.101):
sudo ufw allow from 192.168.1.102 to any port 9000 proto tcp comment 'MinIO Node 2'
sudo ufw allow from 192.168.1.103 to any port 9000 proto tcp comment 'MinIO Node 3'
sudo ufw allow from 192.168.1.104 to any port 9000 proto tcp comment 'MinIO Node 4'

# Lặp lại tương tự cho các nodes còn lại...

# Hoặc đơn giản hơn - cho phép cả subnet:
sudo ufw allow from 192.168.1.0/24 to any port 9000 proto tcp comment 'MinIO Cluster'
```

**Script cấu hình firewall tự động:**

```bash
#!/bin/bash
# filepath: scripts/configure-firewall.sh

# ===============================================
# MinIO Firewall Configuration Script
# ===============================================

set -e

# Cấu hình
MINIO_API_PORT=${1:-9000}
MINIO_CONSOLE_PORT=${2:-9001}
ALLOWED_NETWORKS=${3:-"0.0.0.0/0"}  # Mặc định: cho phép tất cả

echo "=============================================="
echo "   MinIO Firewall Configuration"
echo "=============================================="
echo ""
echo "API Port: ${MINIO_API_PORT}"
echo "Console Port: ${MINIO_CONSOLE_PORT}"
echo "Allowed Networks: ${ALLOWED_NETWORKS}"
echo ""

# Kiểm tra UFW đã cài đặt chưa
if ! command -v ufw &> /dev/null; then
    echo "Installing UFW..."
    sudo apt-get update
    sudo apt-get install -y ufw
fi

# Backup rules hiện tại
echo "[1/6] Backing up current rules..."
sudo cp /etc/ufw/user.rules /etc/ufw/user.rules.backup.$(date +%Y%m%d%H%M%S) 2>/dev/null || true

# Đảm bảo SSH được allow
echo "[2/6] Ensuring SSH is allowed..."
sudo ufw allow ssh

# Thêm rules cho MinIO
echo "[3/6] Adding MinIO API rule (port ${MINIO_API_PORT})..."
if [ "${ALLOWED_NETWORKS}" = "0.0.0.0/0" ]; then
    sudo ufw allow ${MINIO_API_PORT}/tcp comment 'MinIO API'
else
    IFS=',' read -ra NETWORKS <<< "${ALLOWED_NETWORKS}"
    for network in "${NETWORKS[@]}"; do
        sudo ufw allow from ${network} to any port ${MINIO_API_PORT} proto tcp comment "MinIO API - ${network}"
    done
fi

echo "[4/6] Adding MinIO Console rule (port ${MINIO_CONSOLE_PORT})..."
if [ "${ALLOWED_NETWORKS}" = "0.0.0.0/0" ]; then
    sudo ufw allow ${MINIO_CONSOLE_PORT}/tcp comment 'MinIO Console'
else
    IFS=',' read -ra NETWORKS <<< "${ALLOWED_NETWORKS}"
    for network in "${NETWORKS[@]}"; do
        sudo ufw allow from ${network} to any port ${MINIO_CONSOLE_PORT} proto tcp comment "MinIO Console - ${network}"
    done
fi

# Enable UFW nếu chưa bật
echo "[5/6] Enabling UFW..."
echo "y" | sudo ufw enable

# Hiển thị status
echo "[6/6] Final firewall status:"
echo ""
sudo ufw status verbose | grep -E "(Status|900)"

echo ""
echo "=============================================="
echo "Firewall configuration complete!"
echo ""
echo "Test connectivity:"
echo "  curl http://$(hostname -I | awk '{print $1}'):${MINIO_API_PORT}/minio/health/live"
echo "=============================================="
```

**Troubleshooting firewall issues:**

```bash
# ===============================================
# TROUBLESHOOTING FIREWALL
# ===============================================

# Kiểm tra xem firewall có block không
# Tạm thời disable để test:
sudo ufw disable

# Test lại kết nối
curl http://localhost:9000/minio/health/live

# Nếu hoạt động khi firewall tắt → vấn đề là firewall rules
# Bật lại firewall và kiểm tra rules:
sudo ufw enable
sudo ufw status verbose


# ===============================================
# XEM LOGS FIREWALL
# ===============================================

# Bật logging
sudo ufw logging on

# Xem blocked connections
sudo tail -f /var/log/ufw.log

# Filter chỉ xem port 9000
sudo tail -f /var/log/ufw.log | grep 9000


# ===============================================
# KIỂM TRA BẰNG IPTABLES (UNDERLYING)
# ===============================================

# Xem tất cả iptables rules
sudo iptables -L -n -v

# Xem rules cho port 9000
sudo iptables -L -n -v | grep 9000

# Xem NAT rules (cho Docker)
sudo iptables -t nat -L -n -v
```

---

#### 1.6.5 Cấu hình port binding cho Docker container

**Hiểu về Docker Port Binding**

Khi chạy MinIO trong Docker container, cần phải "publish" port từ container ra host để có thể truy cập từ bên ngoài.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              DOCKER PORT BINDING - TỔNG QUAN                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  KHÔNG CÓ PORT BINDING:                                                    │
│  ─────────────────────────                                                  │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                         HOST                                       │    │
│  │                                                                    │    │
│  │    Request → ??? → KHÔNG KẾT NỐI ĐƯỢC                             │    │
│  │                                                                    │    │
│  │    ┌────────────────────────────────────────────────────────┐     │    │
│  │    │              DOCKER CONTAINER                          │     │    │
│  │    │                                                        │     │    │
│  │    │    ┌─────────────────┐                                 │     │    │
│  │    │    │     MinIO       │ Lắng nghe port 9000             │     │    │// filepath: e:\DaiCuongBK\Project3\FileSharing\client\minio.md
// ...existing code...

---

### 1.6 Cấu Hình Khắc Phục Lỗi Network

#### 1.6.1 Nguyên nhân gây ra lỗi ERR_CONNECTION_REFUSED

**ERR_CONNECTION_REFUSED là gì?**

Lỗi `ERR_CONNECTION_REFUSED` xảy ra khi browser hoặc client cố gắng kết nối đến một server, nhưng server **từ chối kết nối**. Đây là một trong những lỗi network phổ biến nhất khi làm việc với MinIO.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              ERR_CONNECTION_REFUSED - GIẢI THÍCH CHI TIẾT                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  LUỒNG KẾT NỐI BÌNH THƯỜNG (TCP 3-Way Handshake):                         │
│  ─────────────────────────────────────────────────                          │
│                                                                             │
│  ┌──────────┐                                        ┌──────────┐          │
│  │  Client  │                                        │  Server  │          │
│  │ (Browser)│                                        │ (MinIO)  │          │
│  └────┬─────┘                                        └────┬─────┘          │
│       │                                                   │                │
│       │──────────────── SYN (Xin kết nối) ───────────────►│                │
│       │                                                   │                │
│       │◄─────────────── SYN-ACK (Đồng ý) ─────────────────│                │
│       │                                                   │                │
│       │──────────────── ACK (Xác nhận) ──────────────────►│                │
│       │                                                   │                │
│       │              ═══ KẾT NỐI THÀNH CÔNG ═══           │                │
│                                                                             │
│                                                                             │
│  KHI XẢY RA ERR_CONNECTION_REFUSED:                                        │
│  ──────────────────────────────────                                         │
│                                                                             │
│  ┌──────────┐                                        ┌──────────┐          │
│  │  Client  │                                        │  Server  │          │
│  │ (Browser)│                                        │ (MinIO)  │          │
│  └────┬─────┘                                        └────┬─────┘          │
│       │                                                   │                │
│       │──────────────── SYN (Xin kết nối) ───────────────►│                │
│       │                                                   │                │
│       │◄─────────────── RST (Từ chối!) ───────────────────│                │
│       │                                                   │                │
│       │   🚫 ERR_CONNECTION_REFUSED                       │                │
│                                                                             │
│  Server gửi RST (Reset) thay vì SYN-ACK vì:                                │
│  • Không có service nào đang lắng nghe trên port đó                       │
│  • Firewall chặn và từ chối kết nối                                       │
│  • Server đã bind nhưng chưa accept connections                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Các nguyên nhân cụ thể gây ra ERR_CONNECTION_REFUSED:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              NGUYÊN NHÂN ERR_CONNECTION_REFUSED VỚI MINIO                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. MINIO SERVER CHƯA CHẠY                                                 │
│  ────────────────────────────                                               │
│     • Container Docker chưa start                                          │
│     • systemd service chưa enable/start                                    │
│     • MinIO process bị crash                                               │
│                                                                             │
│  2. MINIO ĐANG CHẠY TRÊN PORT KHÁC                                        │
│  ─────────────────────────────────                                          │
│     • Cấu hình port khác với port bạn đang truy cập                       │
│     • API port (9000) khác với Console port (9001)                        │
│     • Custom port được cấu hình trong docker-compose.yml                  │
│                                                                             │
│  3. MINIO CHỈ BIND VÀO LOCALHOST                                          │
│  ────────────────────────────────                                           │
│     • MinIO chỉ lắng nghe trên 127.0.0.1                                  │
│     • Không thể truy cập từ máy khác hoặc container khác                  │
│     • Cần bind vào 0.0.0.0 để lắng nghe mọi interface                     │
│                                                                             │
│  4. FIREWALL ĐANG CHẶN PORT                                               │
│  ──────────────────────────────                                             │
│     • ufw (Ubuntu firewall) chặn port 9000/9001                           │
│     • Windows Firewall chặn inbound connections                           │
│     • Security group (cloud) không cho phép traffic                       │
│                                                                             │
│  5. DOCKER NETWORK ISSUES                                                  │
│  ─────────────────────────────                                              │
│     • Container không được publish port ra host                           │
│     • Port conflict với service khác                                      │
│     • Docker network không cho phép traffic từ bên ngoài                  │
│                                                                             │
│  6. SAI ĐỊA CHỈ HOST/IP                                                   │
│  ────────────────────────                                                   │
│     • Dùng localhost khi MinIO ở máy khác                                 │
│     • IP address đã thay đổi (DHCP)                                       │
│     • DNS không resolve đúng                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Cách chẩn đoán ERR_CONNECTION_REFUSED:**

```bash
# ===============================================
# BƯỚC 1: Kiểm tra MinIO có đang chạy không
# ===============================================

# Nếu dùng Docker:
docker ps | grep minio
# Nếu không thấy output → MinIO container chưa chạy

docker compose ps
# Kiểm tra status của minio service

# Nếu dùng systemd (Ubuntu):
sudo systemctl status minio
# Nếu status không phải "active (running)" → MinIO chưa chạy


# ===============================================
# BƯỚC 2: Kiểm tra port đang được sử dụng
# ===============================================

# Linux/macOS:
sudo netstat -tlnp | grep 9000
# Hoặc:
sudo ss -tlnp | grep 9000
# Hoặc:
sudo lsof -i :9000

# Output mong đợi (MinIO đang chạy):
# tcp    0    0 0.0.0.0:9000    0.0.0.0:*    LISTEN    12345/minio

# Nếu không có output → Không có gì lắng nghe trên port 9000


# Windows (PowerShell):
netstat -ano | findstr :9000
# Hoặc:
Get-NetTCPConnection -LocalPort 9000


# ===============================================
# BƯỚC 3: Kiểm tra kết nối từ local
# ===============================================

# Test kết nối TCP đến port
nc -zv localhost 9000
# Output thành công: Connection to localhost 9000 port [tcp/*] succeeded!
# Output thất bại: Connection refused

# Hoặc dùng telnet:
telnet localhost 9000

# Hoặc dùng curl:
curl -v http://localhost:9000/minio/health/live
# Connection refused → MinIO không chạy hoặc port sai


# ===============================================
# BƯỚC 4: Kiểm tra MinIO logs
# ===============================================

# Docker:
docker compose logs minio | tail -50
docker logs minio --tail 50

# Systemd:
sudo journalctl -u minio -n 50 --no-pager

# Tìm các error messages:
docker compose logs minio | grep -i error
docker compose logs minio | grep -i "bind"
docker compose logs minio | grep -i "listen"
```

**Các cách khắc phục ERR_CONNECTION_REFUSED:**

```bash
# ===============================================
# KHẮC PHỤC 1: Start MinIO nếu chưa chạy
# ===============================================

# Docker:
docker compose up -d
docker compose start minio

# Systemd:
sudo systemctl start minio
sudo systemctl enable minio  # Để tự động start khi boot


# ===============================================
# KHẮC PHỤC 2: Kiểm tra và sửa port configuration
# ===============================================

# Kiểm tra docker-compose.yml
cat docker-compose.yml | grep -A 5 "ports:"

# Đảm bảo port mapping đúng:
# ports:
#   - "9000:9000"   # Host:Container
#   - "9001:9001"


# ===============================================
# KHẮC PHỤC 3: Bind vào tất cả interfaces
# ===============================================

# Trong MinIO command, thêm --address:
command: server /data --console-address ":9001" --address ":9000"

# ":9000" có nghĩa bind vào 0.0.0.0:9000 (tất cả interfaces)
# "127.0.0.1:9000" chỉ bind vào localhost


# ===============================================
# KHẮC PHỤC 4: Mở firewall port
# ===============================================

# Ubuntu (ufw):
sudo ufw allow 9000/tcp
sudo ufw allow 9001/tcp
sudo ufw status

# CentOS/RHEL (firewalld):
sudo firewall-cmd --permanent --add-port=9000/tcp
sudo firewall-cmd --permanent --add-port=9001/tcp
sudo firewall-cmd --reload

# Windows (PowerShell as Admin):
New-NetFirewallRule -DisplayName "MinIO API" -Direction Inbound -Port 9000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "MinIO Console" -Direction Inbound -Port 9001 -Protocol TCP -Action Allow


# ===============================================
# KHẮC PHỤC 5: Giải quyết port conflict
# ===============================================

# Tìm process đang dùng port 9000:
sudo lsof -i :9000
# Hoặc:
sudo fuser -v 9000/tcp

# Kill process đang chiếm port (cẩn thận!):
sudo kill -9 <PID>

# Hoặc đổi MinIO sang port khác:
# docker-compose.yml:
ports:
  - "9002:9000"   # Dùng port 9002 trên host
  - "9003:9001"
```

**Script chẩn đoán tự động:**

```bash
#!/bin/bash
# filepath: scripts/diagnose-connection-refused.sh

MINIO_HOST=${1:-localhost}
MINIO_PORT=${2:-9000}
CONSOLE_PORT=${3:-9001}

echo "=============================================="
echo "   ERR_CONNECTION_REFUSED Diagnostic Tool"
echo "=============================================="
echo ""
echo "Target: ${MINIO_HOST}:${MINIO_PORT}"
echo ""

# Check 1: DNS resolution
echo "[1] Checking DNS resolution..."
if host ${MINIO_HOST} > /dev/null 2>&1 || [ "${MINIO_HOST}" = "localhost" ] || [[ "${MINIO_HOST}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "    ✓ Host resolution OK"
else
    echo "    ✗ Cannot resolve hostname: ${MINIO_HOST}"
    exit 1
fi

# Check 2: Port listening (local only)
echo ""
echo "[2] Checking if port ${MINIO_PORT} is listening..."
if [ "${MINIO_HOST}" = "localhost" ] || [ "${MINIO_HOST}" = "127.0.0.1" ]; then
    if ss -tln | grep -q ":${MINIO_PORT} "; then
        echo "    ✓ Port ${MINIO_PORT} is listening"
        LISTENING_PROCESS=$(sudo lsof -i :${MINIO_PORT} 2>/dev/null | grep LISTEN | awk '{print $1, $2}' | head -1)
        echo "    Process: ${LISTENING_PROCESS:-unknown}"
    else
        echo "    ✗ Nothing listening on port ${MINIO_PORT}"
        echo ""
        echo "    Suggestions:"
        echo "    - Start MinIO: docker compose up -d"
        echo "    - Or: sudo systemctl start minio"
    fi
else
    echo "    (Skipped - cannot check remote host)"
fi

# Check 3: TCP connection test
echo ""
echo "[3] Testing TCP connection to ${MINIO_HOST}:${MINIO_PORT}..."
if nc -zw3 ${MINIO_HOST} ${MINIO_PORT} 2>/dev/null; then
    echo "    ✓ TCP connection successful"
else
    echo "    ✗ TCP connection failed (Connection refused or timeout)"
fi

# Check 4: HTTP health check
echo ""
echo "[4] Testing MinIO health endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://${MINIO_HOST}:${MINIO_PORT}/minio/health/live" 2>/dev/null)
if [ "${HTTP_CODE}" = "200" ]; then
    echo "    ✓ MinIO API is responding (HTTP ${HTTP_CODE})"
elif [ "${HTTP_CODE}" = "000" ]; then
    echo "    ✗ Cannot connect to MinIO API"
else
    echo "    ⚠ MinIO responded with HTTP ${HTTP_CODE}"
fi

# Check 5: Console port
echo ""
echo "[5] Testing MinIO Console on port ${CONSOLE_PORT}..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://${MINIO_HOST}:${CONSOLE_PORT}" 2>/dev/null)
if [ "${HTTP_CODE}" = "200" ] || [ "${HTTP_CODE}" = "302" ]; then
    echo "    ✓ MinIO Console is responding (HTTP ${HTTP_CODE})"
elif [ "${HTTP_CODE}" = "000" ]; then
    echo "    ✗ Cannot connect to MinIO Console"
else
    echo "    ⚠ Console responded with HTTP ${HTTP_CODE}"
fi

# Check 6: Docker status (if applicable)
echo ""
echo "[6] Checking Docker containers..."
if command -v docker &> /dev/null; then
    MINIO_CONTAINER=$(docker ps --filter "name=minio" --format "{{.Names}}: {{.Status}}" 2>/dev/null)
    if [ -n "${MINIO_CONTAINER}" ]; then
        echo "    ✓ MinIO container found: ${MINIO_CONTAINER}"
    else
        echo "    ⚠ No running MinIO container found"
        STOPPED=$(docker ps -a --filter "name=minio" --filter "status=exited" --format "{{.Names}}: {{.Status}}" 2>/dev/null)
        if [ -n "${STOPPED}" ]; then
            echo "    Found stopped container: ${STOPPED}"
        fi
    fi
else
    echo "    (Docker not installed)"
fi

# Check 7: Firewall status
echo ""
echo "[7] Checking firewall..."
if command -v ufw &> /dev/null; then
    UFW_STATUS=$(sudo ufw status 2>/dev/null | head -1)
    echo "    UFW: ${UFW_STATUS}"
    
    UFW_9000=$(sudo ufw status 2>/dev/null | grep "9000")
    if [ -n "${UFW_9000}" ]; then
        echo "    Port 9000 rule: ${UFW_9000}"
    else
        echo "    ⚠ No explicit rule for port 9000"
    fi
fi

echo ""
echo "=============================================="
echo "Diagnostic complete!"
echo "=============================================="
```

---

#### 1.6.2 Nguyên nhân gây ra lỗi ERR_CONNECTION_RESET

**ERR_CONNECTION_RESET là gì?**

Lỗi `ERR_CONNECTION_RESET` xảy ra khi kết nối TCP đã được thiết lập, nhưng sau đó bị **đột ngột đóng** bởi server (hoặc một thiết bị mạng trung gian). Khác với CONNECTION_REFUSED, lỗi này xảy ra **sau khi** kết nối đã được thiết lập.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              ERR_CONNECTION_RESET - GIẢI THÍCH CHI TIẾT                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  LUỒNG KẾT NỐI BÌNH THƯỜNG:                                               │
│  ───────────────────────────                                                │
│                                                                             │
│  ┌──────────┐                                        ┌──────────┐          │
│  │  Client  │                                        │  Server  │          │
│  └────┬─────┘                                        └────┬─────┘          │
│       │                                                   │                │
│       │════════════ Kết nối TCP đã thiết lập ════════════│                │
│       │                                                   │                │
│       │──────────────── HTTP Request ────────────────────►│                │
│       │                                                   │                │
│       │◄─────────────── HTTP Response ────────────────────│                │
│       │                                                   │                │
│       │──────────────── FIN (Đóng kết nối) ──────────────►│                │
│       │◄─────────────── FIN-ACK ──────────────────────────│                │
│       │                                                   │                │
│       │              ═══ KẾT NỐI ĐÓNG BÌNH THƯỜNG ═══     │                │
│                                                                             │
│                                                                             │
│  KHI XẢY RA ERR_CONNECTION_RESET:                                          │
│  ──────────────────────────────────                                         │
│                                                                             │
│  ┌──────────┐                                        ┌──────────┐          │
│  │  Client  │                                        │  Server  │          │
│  └────┬─────┘                                        └────┬─────┘          │
│       │                                                   │                │
│       │════════════ Kết nối TCP đã thiết lập ════════════│                │
│       │                                                   │                │
│       │──────────────── HTTP Request ────────────────────►│                │
│       │                                                   │                │
│       │◄─────────────── RST (Reset đột ngột!) ────────────│                │
│       │                                                   │                │
│       │   🚫 ERR_CONNECTION_RESET                         │                │
│                                                                             │
│  Server gửi RST thay vì FIN vì:                                            │
│  • Server process bị crash/killed                                          │
│  • Server đóng socket đột ngột                                             │
│  • Firewall/IDS đóng kết nối                                               │
│  • Connection timeout ở server side                                        │
│  • Server từ chối vì lý do bảo mật                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Các nguyên nhân cụ thể gây ra ERR_CONNECTION_RESET với MinIO:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              NGUYÊN NHÂN ERR_CONNECTION_RESET VỚI MINIO                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. MINIO SERVER CRASH HOẶC RESTART                                        │
│  ─────────────────────────────────────                                      │
│     • MinIO process bị killed (OOM killer, manual kill)                   │
│     • MinIO đang restart                                                  │
│     • Container bị recreate                                               │
│     • Health check failed và orchestrator restart                         │
│                                                                             │
│  2. REQUEST QUÁ LỚN                                                        │
│  ──────────────────                                                         │
│     • Upload file vượt quá limit cho phép                                 │
│     • Request body quá lớn cho cấu hình server                           │
│     • Multipart upload với part size không hợp lệ                        │
│                                                                             │
│  3. TIMEOUT Ở SERVER SIDE                                                  │
│  ─────────────────────────────                                              │
│     • Keep-alive timeout                                                  │
│     • Read/Write timeout                                                  │
│     • Request processing timeout                                          │
│                                                                             │
│  4. FIREWALL/IDS ĐÓNG KẾT NỐI                                             │
│  ────────────────────────────────                                           │
│     • Deep packet inspection phát hiện "anomaly"                         │
│     • Connection timeout của firewall                                     │
│     • Rate limiting triggered                                             │
│                                                                             │
│  5. REVERSE PROXY ISSUES                                                   │
│  ───────────────────────────                                                │
│     • Nginx upstream timeout                                              │
│     • Proxy buffer overflow                                               │
│     • Backend health check failed                                         │
│                                                                             │
│  6. TLS/SSL HANDSHAKE FAILURE                                              │
│  ─────────────────────────────                                              │
│     • Certificate verification failed                                     │
│     • TLS version mismatch                                                │
│     • Cipher suite negotiation failed                                     │
│                                                                             │
│  7. RESOURCE EXHAUSTION                                                    │
│  ────────────────────────                                                   │
│     • Too many open files (ulimit)                                        │
│     • Memory exhaustion                                                   │
│     • Disk full                                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Cách chẩn đoán ERR_CONNECTION_RESET:**

```bash
# ===============================================
# BƯỚC 1: Kiểm tra MinIO logs ngay khi lỗi xảy ra
# ===============================================

# Docker:
docker compose logs minio --tail 100 | grep -i -E "(error|reset|abort|crash|kill)"

# Systemd:
sudo journalctl -u minio -n 100 --no-pager | grep -i -E "(error|reset|abort)"

# Tìm các signals:
docker compose logs minio | grep -i -E "(SIGTERM|SIGKILL|SIGSEGV|OOM)"


# ===============================================
# BƯỚC 2: Kiểm tra tài nguyên hệ thống
# ===============================================

# Kiểm tra memory:
free -h
docker stats minio --no-stream

# Kiểm tra disk space:
df -h

# Kiểm tra file descriptors:
cat /proc/$(pgrep minio)/limits | grep "Max open files"
ls /proc/$(pgrep minio)/fd | wc -l

# Kiểm tra OOM events:
dmesg | grep -i "oom\|killed"


# ===============================================
# BƯỚC 3: Kiểm tra timeout configurations
# ===============================================

# Kiểm tra MinIO timeout settings
docker compose exec minio env | grep -i timeout

# Kiểm tra kernel TCP settings:
sysctl net.ipv4.tcp_keepalive_time
sysctl net.ipv4.tcp_keepalive_probes
sysctl net.ipv4.tcp_keepalive_intvl


# ===============================================
# BƯỚC 4: Capture network traffic để debug
# ===============================================

# Capture traffic trên port 9000:
sudo tcpdump -i any port 9000 -w minio_traffic.pcap

# Trong một terminal khác, thực hiện request gây lỗi
# Sau đó analyze với Wireshark:
# - Tìm các packet với flag RST
# - Xem sequence của events


# ===============================================
# BƯỚC 5: Test với timeout dài hơn
# ===============================================

# Test với curl và timeout dài:
curl -v --connect-timeout 30 --max-time 300 \
    http://localhost:9000/minio/health/live

# Nếu vẫn bị reset, vấn đề không phải timeout
```

**Các cách khắc phục ERR_CONNECTION_RESET:**

```bash
# ===============================================
# KHẮC PHỤC 1: Tăng resource limits cho MinIO
# ===============================================

# Docker Compose - thêm resource limits:
```

```yaml
# filepath: docker-compose.yml
services:
  minio:
    image: minio/minio:latest
    # ...existing config...
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 8G
        reservations:
          cpus: '1'
          memory: 2G
    ulimits:
      nofile:
        soft: 65536
        hard: 65536
      nproc:
        soft: 65536
        hard: 65536
```

```bash
# Systemd - thêm limits vào service file:
```

```ini
# filepath: /etc/systemd/system/minio.service
[Service]
# ...existing config...

LimitNOFILE=65536
LimitNPROC=65536
LimitCORE=infinity
MemoryLimit=8G
```

```bash
# ===============================================
# KHẮC PHỤC 2: Cấu hình timeout phù hợp
# ===============================================

# Kernel TCP keepalive settings:
sudo sysctl -w net.ipv4.tcp_keepalive_time=60
sudo sysctl -w net.ipv4.tcp_keepalive_probes=3
sudo sysctl -w net.ipv4.tcp_keepalive_intvl=10

# Để persistent qua reboot, thêm vào /etc/sysctl.conf:
echo "net.ipv4.tcp_keepalive_time = 60" | sudo tee -a /etc/sysctl.conf
echo "net.ipv4.tcp_keepalive_probes = 3" | sudo tee -a /etc/sysctl.conf
echo "net.ipv4.tcp_keepalive_intvl = 10" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p


# ===============================================
# KHẮC PHỤC 3: Cấu hình Nginx proxy đúng cách
# ===============================================
```

```nginx
# filepath: /etc/nginx/conf.d/minio.conf
upstream minio_backend {
    server minio:9000;
    keepalive 32;  # Connection pooling
}

server {
    listen 80;
    server_name minio.example.com;

    # Tắt buffering cho upload lớn
    proxy_buffering off;
    proxy_request_buffering off;

    # Tăng timeout
    proxy_connect_timeout 300;
    proxy_send_timeout 300;
    proxy_read_timeout 300;
    send_timeout 300;

    # Không giới hạn body size
    client_max_body_size 0;

    # Keep-alive settings
    proxy_http_version 1.1;
    proxy_set_header Connection "";

    location / {
        proxy_pass http://minio_backend;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# ===============================================
# KHẮC PHỤC 4: Xử lý OOM (Out of Memory)
# ===============================================

# Kiểm tra OOM killer:
dmesg | grep -i "out of memory"
dmesg | grep -i "killed process"

# Nếu MinIO bị OOM killed:
# 1. Tăng memory cho server
# 2. Giảm số concurrent connections
# 3. Cấu hình memory limits cho MinIO

# Environment variable để giới hạn memory usage:
# MINIO_API_REQUESTS_MAX - Giới hạn số concurrent requests
```

// ...existing code...

---

#### 1.6.3 Nguyên nhân gây ra lỗi ERR_CONNECTION_ABORTED

**ERR_CONNECTION_ABORTED là gì?**

Lỗi `ERR_CONNECTION_ABORTED` xảy ra khi kết nối bị **hủy bỏ** trong quá trình truyền dữ liệu, thường do **phía client** hoặc do một sự kiện bất thường trên đường truyền. Đây là lỗi khác biệt với CONNECTION_REFUSED (từ chối ngay từ đầu) và CONNECTION_RESET (server đóng đột ngột).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              SO SÁNH 3 LOẠI LỖI CONNECTION                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ERR_CONNECTION_REFUSED:                                                   │
│  ─────────────────────────                                                  │
│  • Kết nối bị TỪ CHỐI ngay từ đầu                                         │
│  • Server không accept connection                                          │
│  • Không có handshake TCP thành công                                       │
│  • Nguyên nhân: Server không chạy, port sai, firewall block               │
│                                                                             │
│  ERR_CONNECTION_RESET:                                                     │
│  ─────────────────────────                                                  │
│  • Kết nối đã thiết lập nhưng bị server NGẮT ĐỘT NGỘT                    │
│  • Server gửi RST packet                                                   │
│  • Nguyên nhân: Server crash, timeout, request quá lớn                    │
│                                                                             │
│  ERR_CONNECTION_ABORTED:                                                   │
│  ─────────────────────────                                                  │
│  • Kết nối bị HỦY GIỮA CHỪNG trong quá trình truyền                       │
│  • Thường do CLIENT hoặc thiết bị mạng trung gian                         │
│  • Nguyên nhân: User cancel, network drop, browser close                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Timeline khi xảy ra ERR_CONNECTION_ABORTED:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              ERR_CONNECTION_ABORTED - TIMELINE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐         ┌──────────┐         ┌──────────┐                   │
│  │  Client  │         │ Network  │         │  MinIO   │                   │
│  │ (Browser)│         │          │         │  Server  │                   │
│  └────┬─────┘         └────┬─────┘         └────┬─────┘                   │
│       │                    │                    │                          │
│       │══════ TCP Connection Established ═══════│                          │
│       │                    │                    │                          │
│       │── HTTP Request (Upload Start) ─────────►│                          │
│       │                    │                    │                          │
│       │── Data chunk 1 ───────────────────────►│  ✓ Received              │
│       │                    │                    │                          │
│       │── Data chunk 2 ───────────────────────►│  ✓ Received              │
│       │                    │                    │                          │
│       │── Data chunk 3 ────┼───────────────────►│  ✓ Received              │
│       │                    │                    │                          │
│       │    ╳ ABORT!        │                    │                          │
│       │    ┌────────────────────────────────┐   │                          │
│       │    │ Possible causes:               │   │                          │
│       │    │ • User clicked "Cancel"        │   │                          │
│       │    │ • User closed browser tab      │   │                          │
│       │    │ • WiFi disconnected            │   │                          │
│       │    │ • JavaScript called abort()    │   │                          │
│       │    │ • Browser timeout exceeded     │   │                          │
│       │    └────────────────────────────────┘   │                          │
│       │                    │                    │                          │
│       │    🚫 ERR_CONNECTION_ABORTED            │                          │
│       │                    │                    │                          │
│       │                    │                    │ (Incomplete upload,      │
│       │                    │                    │  partial data on server) │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Các nguyên nhân chi tiết gây ra ERR_CONNECTION_ABORTED:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              NGUYÊN NHÂN ERR_CONNECTION_ABORTED                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. USER ACTIONS (Hành động người dùng)                                    │
│  ─────────────────────────────────────                                      │
│     • User nhấn nút "Cancel" trong khi upload/download                    │
│     • User đóng tab browser khi request đang xử lý                        │
│     • User navigate sang trang khác (gây abort request)                   │
│     • User refresh trang trong khi đang upload                            │
│     • JavaScript code gọi AbortController.abort()                         │
│     • XMLHttpRequest.abort() được gọi                                     │
│                                                                             │
│  2. NETWORK INSTABILITY (Mạng không ổn định)                               │
│  ───────────────────────────────────────────                                │
│     • WiFi bị ngắt kết nối đột ngột                                       │
│     • Chuyển từ WiFi sang Mobile Data (hoặc ngược lại)                   │
│     • VPN connection bị drop                                               │
│     • ISP network issues                                                   │
│     • Router/modem restart                                                 │
│     • Cable network unplugged                                              │
│                                                                             │
│  3. TIMEOUT ISSUES                                                         │
│  ──────────────────                                                         │
│     • Browser có timeout mặc định cho requests (thường 5-30 phút)         │
│     • fetch API timeout (nếu được cấu hình)                               │
│     • XMLHttpRequest.timeout triggered                                    │
│     • Server không response trong thời gian chờ                           │
│                                                                             │
│  4. RESOURCE CONSTRAINTS ON CLIENT                                         │
│  ─────────────────────────────────                                          │
│     • Browser hết memory khi xử lý file lớn                               │
│     • JavaScript heap overflow                                             │
│     • Quá nhiều concurrent connections                                     │
│     • Tab bị suspend do low memory (mobile browsers)                      │
│                                                                             │
│  5. ANTIVIRUS/SECURITY SOFTWARE                                            │
│  ─────────────────────────────────                                          │
│     • Antivirus scan file đang upload và timeout                         │
│     • Security software block connection                                   │
│     • Corporate proxy terminate long-running connections                  │
│     • DLP (Data Loss Prevention) software intercept                       │
│                                                                             │
│  6. BROWSER EXTENSIONS                                                     │
│  ────────────────────────                                                   │
│     • Ad blockers blocking requests (nếu match pattern)                   │
│     • Privacy extensions interfering với connections                      │
│     • Proxy extensions failing                                             │
│     • Download managers hijacking requests                                │
│                                                                             │
│  7. OPERATING SYSTEM EVENTS                                                │
│  ─────────────────────────────                                              │
│     • Computer going to sleep/hibernate                                   │
│     • Network adapter disabled                                            │
│     • System shutdown/restart initiated                                   │
│     • Power saving mode affecting network                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Cách chẩn đoán ERR_CONNECTION_ABORTED:**

```javascript
// filepath: src/utils/diagnoseAborted.ts

/**
 * Wrapper để diagnose và log connection aborted errors
 * Giúp xác định nguyên nhân gây ra abort
 */

interface DiagnosticInfo {
    url: string;
    startTime: number;
    abortTime?: number;
    duration?: number;
    reason?: string;
    networkInfo?: {
        type: string;
        downlink: number;
        rtt: number;
    };
}

class ConnectionDiagnostics {
    private diagnostics: Map<string, DiagnosticInfo> = new Map();
    
    /**
     * Bắt đầu tracking một request
     */
    startTracking(requestId: string, url: string): void {
        const info: DiagnosticInfo = {
            url,
            startTime: Date.now(),
        };
        
        // Thu thập network info nếu có
        if ('connection' in navigator) {
            const conn = (navigator as any).connection;
            info.networkInfo = {
                type: conn.effectiveType || 'unknown',
                downlink: conn.downlink || 0,
                rtt: conn.rtt || 0
            };
        }
        
        this.diagnostics.set(requestId, info);
        console.log(`[TRACK START] ${requestId}: ${url}`);
    }
    
    /**
     * Ghi nhận khi request bị abort
     */
    recordAbort(requestId: string, reason?: string): void {
        const info = this.diagnostics.get(requestId);
        if (info) {
            info.abortTime = Date.now();
            info.duration = info.abortTime - info.startTime;
            info.reason = reason;
            
            console.log(`[ABORT RECORDED] ${requestId}`);
            console.log(`  Duration before abort: ${info.duration}ms`);
            console.log(`  Reason: ${reason || 'unknown'}`);
            console.log(`  Network type: ${info.networkInfo?.type}`);
            
            // Phân tích nguyên nhân có thể
            this.analyzeAbortCause(info);
        }
    }
    
    /**
     * Phân tích nguyên nhân abort
     */
    private analyzeAbortCause(info: DiagnosticInfo): void {
        console.log('\n[ANALYSIS] Possible causes:');
        
        // Nếu abort rất nhanh (< 100ms) - có thể là user action ngay lập tức
        if (info.duration && info.duration < 100) {
            console.log('  - Very quick abort - likely immediate user cancel');
        }
        
        // Nếu abort sau thời gian dài - có thể là timeout
        if (info.duration && info.duration > 30000) {
            console.log('  - Long duration before abort - possible timeout');
        }
        
        // Network type analysis
        if (info.networkInfo) {
            if (info.networkInfo.type === 'slow-2g' || info.networkInfo.type === '2g') {
                console.log('  - Slow network connection detected');
            }
            if (info.networkInfo.rtt > 500) {
                console.log('  - High latency network (RTT > 500ms)');
            }
        }
        
        // Check visibility state
        if (document.hidden) {
            console.log('  - Page was hidden when abort occurred');
        }
    }
}

// Singleton instance
const diagnostics = new ConnectionDiagnostics();

/**
 * Upload với tracking và abort handling
 */
async function uploadWithAbortTracking(
    presignedUrl: string,
    file: File,
    options: {
        onProgress?: (progress: number) => void;
        onAbort?: () => void;
        signal?: AbortSignal;
    } = {}
): Promise<{ success: boolean; error?: string; aborted?: boolean }> {
    const requestId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    diagnostics.startTracking(requestId, presignedUrl);
    
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        
        // Progress tracking
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && options.onProgress) {
                const progress = (e.loaded / e.total) * 100;
                options.onProgress(progress);
            }
        };
        
        // Success handler
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                console.log(`[SUCCESS] ${requestId}`);
                resolve({ success: true });
            } else {
                resolve({ 
                    success: false, 
                    error: `HTTP ${xhr.status}: ${xhr.statusText}` 
                });
            }
        };
        
        // Error handler (network errors)
        xhr.onerror = () => {
            console.error(`[NETWORK ERROR] ${requestId}`);
            diagnostics.recordAbort(requestId, 'Network error');
            resolve({ 
                success: false, 
                error: 'Network error - connection may have been lost' 
            });
        };
        
        // Abort handler
        xhr.onabort = () => {
            console.log(`[ABORTED] ${requestId}`);
            diagnostics.recordAbort(requestId, 'Request aborted');
            
            if (options.onAbort) {
                options.onAbort();
            }
            
            resolve({ 
                success: false, 
                error: 'Upload was cancelled',
                aborted: true
            });
        };
        
        // Timeout handler
        xhr.ontimeout = () => {
            console.error(`[TIMEOUT] ${requestId}`);
            diagnostics.recordAbort(requestId, 'Timeout');
            resolve({ 
                success: false, 
                error: 'Upload timed out' 
            });
        };
        
        // Handle external abort signal
        if (options.signal) {
            options.signal.addEventListener('abort', () => {
                xhr.abort();
            });
        }
        
        // Lắng nghe page unload để warn user
        const beforeUnloadHandler = (e: BeforeUnloadEvent) => {
            if (xhr.readyState !== XMLHttpRequest.DONE && xhr.readyState !== XMLHttpRequest.UNSENT) {
                diagnostics.recordAbort(requestId, 'Page unload');
                e.preventDefault();
                e.returnValue = 'Upload is in progress. Are you sure you want to leave?';
                return e.returnValue;
            }
        };
        window.addEventListener('beforeunload', beforeUnloadHandler);
        
        // Lắng nghe visibility change (tab hidden)
        const visibilityHandler = () => {
            if (document.hidden) {
                console.log(`[WARNING] ${requestId}: Tab hidden while uploading`);
            }
        };
        document.addEventListener('visibilitychange', visibilityHandler);
        
        // Lắng nghe network changes
        const networkHandler = () => {
            const conn = (navigator as any).connection;
            if (conn) {
                console.log(`[NETWORK CHANGE] ${requestId}: ${conn.effectiveType}`);
                if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') {
                    console.warn(`[WARNING] Slow network detected during upload`);
                }
            }
        };
        if ('connection' in navigator) {
            (navigator as any).connection.addEventListener('change', networkHandler);
        }
        
        // Cleanup function
        xhr.onloadend = () => {
            window.removeEventListener('beforeunload', beforeUnloadHandler);
            document.removeEventListener('visibilitychange', visibilityHandler);
            if ('connection' in navigator) {
                (navigator as any).connection.removeEventListener('change', networkHandler);
            }
        };
        
        // Start upload
        xhr.open('PUT', presignedUrl);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.timeout = 30 * 60 * 1000; // 30 minutes
        xhr.send(file);
    });
}

export { uploadWithAbortTracking, diagnostics };
```

**Cách khắc phục và xử lý ERR_CONNECTION_ABORTED:**

```typescript
// filepath: src/utils/robustUploadWithRetry.ts

interface UploadConfig {
    maxRetries: number;
    retryDelay: number;
    exponentialBackoff: boolean;
    timeout: number;
    onProgress?: (progress: number) => void;
    onRetry?: (attempt: number, error: string) => void;
}

const DEFAULT_CONFIG: UploadConfig = {
    maxRetries: 3,
    retryDelay: 2000,
    exponentialBackoff: true,
    timeout: 30 * 60 * 1000 // 30 minutes
};

/**
 * Upload với automatic retry khi connection aborted
 */
async function uploadWithAutoRetry(
    getPresignedUrl: () => Promise<string>,
    file: File,
    config: Partial<UploadConfig> = {}
): Promise<{ success: boolean; error?: string; attempts: number }> {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    let lastError = '';
    
    for (let attempt = 1; attempt <= cfg.maxRetries; attempt++) {
        console.log(`\n[UPLOAD ATTEMPT ${attempt}/${cfg.maxRetries}]`);
        console.log(`  File: ${file.name} (${formatBytes(file.size)})`);
        
        try {
            // Lấy presigned URL mới cho mỗi attempt
            // (URL cũ có thể đã expire)
            const presignedUrl = await getPresignedUrl();
            
            const result = await performUpload(presignedUrl, file, cfg);
            
            if (result.success) {
                console.log(`[SUCCESS] Upload completed on attempt ${attempt}`);
                return { success: true, attempts: attempt };
            }
            
            lastError = result.error || 'Unknown error';
            
            // Kiểm tra có nên retry không
            if (!shouldRetry(lastError)) {
                console.log(`[NO RETRY] Error is not retryable: ${lastError}`);
                return { success: false, error: lastError, attempts: attempt };
            }
            
        } catch (error) {
            lastError = error instanceof Error ? error.message : 'Unknown error';
            console.error(`[ATTEMPT ${attempt} FAILED]`, lastError);
        }
        
        // Wait before retry
        if (attempt < cfg.maxRetries) {
            const delay = cfg.exponentialBackoff 
                ? cfg.retryDelay * Math.pow(2, attempt - 1)
                : cfg.retryDelay;
            
            console.log(`[WAITING] ${delay}ms before retry...`);
            
            if (cfg.onRetry) {
                cfg.onRetry(attempt, lastError);
            }
            
            await sleep(delay);
        }
    }
    
    return {
        success: false,
        error: `Upload failed after ${cfg.maxRetries} attempts. Last error: ${lastError}`,
        attempts: cfg.maxRetries
    };
}

/**
 * Kiểm tra error có nên retry không
 */
function shouldRetry(error: string): boolean {
    const retryablePatterns = [
        'aborted',
        'abort',
        'cancelled',
        'cancel',
        'network',
        'connection',
        'timeout',
        'timed out',
        'ECONNRESET',
        'ECONNABORTED',
        'ETIMEDOUT',
        'ENETUNREACH',
        'EHOSTUNREACH',
        'failed to fetch'
    ];
    
    const lowerError = error.toLowerCase();
    return retryablePatterns.some(pattern => lowerError.includes(pattern.toLowerCase()));
}

/**
 * Thực hiện upload thực tế
 */
function performUpload(
    url: string,
    file: File,
    config: UploadConfig
): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        let lastProgress = 0;
        
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const progress = (e.loaded / e.total) * 100;
                if (progress - lastProgress >= 1 || progress === 100) {
                    lastProgress = progress;
                    if (config.onProgress) {
                        config.onProgress(progress);
                    }
                }
            }
        };
        
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve({ success: true });
            } else {
                resolve({ success: false, error: `HTTP ${xhr.status}: ${xhr.statusText}` });
            }
        };
        
        xhr.onerror = () => {
            resolve({ success: false, error: 'Network error - connection aborted' });
        };
        
        xhr.onabort = () => {
            resolve({ success: false, error: 'Upload was aborted' });
        };
        
        xhr.ontimeout = () => {
            resolve({ success: false, error: 'Upload timed out' });
        };
        
        xhr.open('PUT', url);
        xhr.timeout = config.timeout;
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.send(file);
    });
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export { uploadWithAutoRetry };
```

**Prevent abort khi user navigate away:**

```typescript
// filepath: src/hooks/useUploadProtection.ts

import { useEffect, useRef, useCallback } from 'react';

interface UploadProtectionOptions {
    message?: string;
    onAttemptLeave?: () => void;
}

/**
 * React hook để protect user khỏi việc vô tình close/navigate
 * trong khi upload đang diễn ra
 */
function useUploadProtection(
    isUploading: boolean,
    options: UploadProtectionOptions = {}
) {
    const {
        message = 'Upload is in progress. If you leave, your upload will be cancelled.',
        onAttemptLeave
    } = options;
    
    const isUploadingRef = useRef(isUploading);
    isUploadingRef.current = isUploading;
    
    const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
        if (isUploadingRef.current) {
            if (onAttemptLeave) {
                onAttemptLeave();
            }
            e.preventDefault();
            e.returnValue = message;
            return message;
        }
    }, [message, onAttemptLeave]);
    
    useEffect(() => {
        if (isUploading) {
            window.addEventListener('beforeunload', handleBeforeUnload);
            
            // Cho React Router / Next.js
            const handlePopState = (e: PopStateEvent) => {
                if (isUploadingRef.current) {
                    const confirm = window.confirm(message);
                    if (!confirm) {
                        // Prevent navigation
                        window.history.pushState(null, '', window.location.href);
                    }
                }
            };
            window.addEventListener('popstate', handlePopState);
            
            return () => {
                window.removeEventListener('beforeunload', handleBeforeUnload);
                window.removeEventListener('popstate', handlePopState);
            };
        }
    }, [isUploading, handleBeforeUnload, message]);
}

export { useUploadProtection };
```

---

#### 1.6.4 Cấu hình firewall trên Ubuntu để cho phép truy cập MinIO

**Tổng quan về Firewall và MinIO:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              FIREWALL VÀ MINIO - KIẾN TRÚC                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  LUỒNG TRAFFIC KHI CÓ FIREWALL:                                            │
│  ─────────────────────────────────                                          │
│                                                                             │
│  ┌──────────────┐                                                           │
│  │   Internet   │                                                           │
│  │  /Clients    │                                                           │
│  └──────┬───────┘                                                           │
│         │                                                                   │
│         │ Request: http://server:9000/bucket/file                          │
│         │ Request: http://server:9001 (Console)                            │
│         ▼                                                                   │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │                        UBUNTU SERVER                              │     │
│  │  ┌─────────────────────────────────────────────────────────────┐ │     │
│  │  │                      FIREWALL (UFW)                         │ │     │
│  │  │                                                             │ │     │
│  │  │  ┌─────────────────────────────────────────────────────┐   │ │     │
│  │  │  │                 INCOMING RULES                      │   │ │     │
│  │  │  │                                                     │   │ │     │
│  │  │  │  Port 22  (SSH)         : ALLOW from 0.0.0.0/0     │   │ │     │
│  │  │  │  Port 80  (HTTP)        : ALLOW from 0.0.0.0/0     │   │ │     │
│  │  │  │  Port 443 (HTTPS)       : ALLOW from 0.0.0.0/0     │   │ │     │
│  │  │  │  Port 9000 (MinIO API)  : ??? (cần cấu hình)       │   │ │     │
│  │  │  │  Port 9001 (MinIO UI)   : ??? (cần cấu hình)       │   │ │     │
│  │  │  │                                                     │   │ │     │
│  │  │  │  Default incoming: DENY                             │   │ │     │
│  │  │  │  Default outgoing: ALLOW                            │   │ │     │
│  │  │  └─────────────────────────────────────────────────────┘   │ │     │
│  │  │                                                             │ │     │
│  │  │  Traffic ──►  ✓ ALLOW  ──►  Đến application               │ │     │
│  │  │              ✗ DENY   ──►  Bị drop (không response)       │ │     │
│  │  └─────────────────────────────────────────────────────────────┘ │     │
│  │                               │                                   │     │
│  │                               ▼                                   │     │
│  │                    ┌───────────────────────┐                     │     │
│  │                    │        MinIO          │                     │     │
│  │                    │  API: 0.0.0.0:9000    │                     │     │
│  │                    │  Console: 0.0.0.0:9001│                     │     │
│  │                    └───────────────────────┘                     │     │
│  └───────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│  Nếu port 9000/9001 không được ALLOW:                                      │
│  → Client nhận được ERR_CONNECTION_REFUSED hoặc timeout                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Hiểu về UFW (Uncomplicated Firewall):**

UFW là firewall frontend mặc định trên Ubuntu, cung cấp interface đơn giản để quản lý iptables rules phía dưới.

```bash
# ===============================================
# KIẾN THỨC CƠ BẢN VỀ UFW
# ===============================================

# UFW hoạt động với 2 loại rules chính:
# 1. INCOMING: Traffic đi VÀO server
# 2. OUTGOING: Traffic đi RA từ server

# Default policies:
# - incoming: deny (chặn mọi traffic vào)
# - outgoing: allow (cho phép mọi traffic ra)

# Rule priority: Rules được đánh số, rule có số nhỏ được xử lý trước

# Rule syntax:
# ufw [allow|deny|reject|limit] [in|out] [on INTERFACE] [proto PROTOCOL] 
#     [from ADDRESS [port PORT]] [to ADDRESS [port PORT]]
```

**Kiểm tra trạng thái firewall hiện tại:**

```bash
# ===============================================
# BƯỚC 1: KIỂM TRA TRẠNG THÁI UFW
# ===============================================

# Xem status tổng quan
sudo ufw status

# Output khi INACTIVE:
# Status: inactive

# Output khi ACTIVE:
# Status: active
# 
# To                         Action      From
# --                         ------      ----
# 22/tcp                     ALLOW       Anywhere
# 80/tcp                     ALLOW       Anywhere


# Xem status với chi tiết hơn
sudo ufw status verbose

# Output:
# Status: active
# Logging: on (low)
# Default: deny (incoming), allow (outgoing), deny (routed)
# New profiles: skip
#
# To                         Action      From
# --                         ------      ----
# 22/tcp                     ALLOW IN    Anywhere


# Xem rules với số thứ tự (để dễ delete)
sudo ufw status numbered

# Output:
#      To                         Action      From
#      --                         ------      ----
# [ 1] 22/tcp                     ALLOW IN    Anywhere
# [ 2] 80/tcp                     ALLOW IN    Anywhere
# [ 3] 22/tcp (v6)                ALLOW IN    Anywhere (v6)


# Xem cấu hình chi tiết (iptables underlying)
sudo ufw show raw
sudo ufw show added
```

**Cấu hình UFW cho MinIO - Cơ bản:**

```bash
# ===============================================
# CẤU HÌNH UFW CHO MINIO - CƠ BẢN
# ===============================================

# Đảm bảo SSH được allow trước khi enable UFW!
# (Tránh bị lock out khỏi server)
sudo ufw allow ssh
# Hoặc:
sudo ufw allow 22/tcp


# Mở port MinIO API (9000)
sudo ufw allow 9000/tcp comment 'MinIO S3 API'

# Mở port MinIO Console (9001)
sudo ufw allow 9001/tcp comment 'MinIO Web Console'


# Kiểm tra rules đã thêm
sudo ufw status verbose | grep -E "900[01]"

# Output:
# 9000/tcp                   ALLOW IN    Anywhere                   # MinIO S3 API
# 9001/tcp                   ALLOW IN    Anywhere                   # MinIO Web Console


# Enable firewall (nếu chưa enable)
sudo ufw enable

# Confirm: "Firewall is active and enabled on system startup"


# Kiểm tra lại status
sudo ufw status
```

**Cấu hình UFW cho MinIO - Nâng cao (Giới hạn source IP):**

```bash
# ===============================================
# CẤU HÌNH UFW CHO MINIO - NÂNG CAO
# ===============================================

# Chỉ cho phép từ mạng nội bộ (ví dụ: 192.168.1.0/24)
sudo ufw allow from 192.168.1.0/24 to any port 9000 proto tcp comment 'MinIO API - Internal LAN'
sudo ufw allow from 192.168.1.0/24 to any port 9001 proto tcp comment 'MinIO Console - Internal LAN'


# Chỉ cho phép từ một IP cụ thể (Admin machine)
sudo ufw allow from 10.0.0.50 to any port 9001 proto tcp comment 'MinIO Console - Admin only'


# Cho phép từ nhiều IPs/networks (thêm nhiều rules)
sudo ufw allow from 192.168.1.0/24 to any port 9000 proto tcp
sudo ufw allow from 10.10.0.0/16 to any port 9000 proto tcp
sudo ufw allow from 172.16.0.100 to any port 9000 proto tcp


# Cho phép từ một network interface cụ thể
# (Hữu ích khi server có nhiều NIC)
sudo ufw allow in on eth1 to any port 9000 proto tcp comment 'MinIO API - Private NIC'


# Rate limiting để chống brute-force hoặc DDoS đơn giản
# (Limit: 6 connections trong 30 giây từ một IP)
sudo ufw limit 9000/tcp comment 'MinIO API - Rate limited'


# Cấu hình logging cho MinIO ports
sudo ufw logging on
sudo ufw logging medium  # Hoặc: low, high, full
```

**Cấu hình UFW cho MinIO Distributed Cluster:**

```bash
# ===============================================
# UFW CHO MINIO DISTRIBUTED (MULTI-NODE)
# ===============================================

# Trong distributed mode, các MinIO nodes cần giao tiếp với nhau
# qua port 9000 cho data replication và healing

# Giả sử cluster có 4 nodes:
# - Node 1: 192.168.1.101
# - Node 2: 192.168.1.102
# - Node 3: 192.168.1.103
# - Node 4: 192.168.1.104

# Trên Node 1 (192.168.1.101), cho phép traffic từ các nodes khác:
sudo ufw allow from 192.168.1.102 to any port 9000 proto tcp comment 'MinIO Node 2'
sudo ufw allow from 192.168.1.103 to any port 9000 proto tcp comment 'MinIO Node 3'
sudo ufw allow from 192.168.1.104 to any port 9000 proto tcp comment 'MinIO Node 4'

# Nếu console chỉ cần truy cập từ một node (load balancer sẽ route):
sudo ufw allow from 192.168.1.100 to any port 9001 proto tcp comment 'MinIO Console - LB only'

# Hoặc đơn giản hơn - cho phép cả subnet của cluster:
sudo ufw allow from 192.168.1.0/24 to any port 9000 proto tcp comment 'MinIO Cluster Internal'
sudo ufw allow from 192.168.1.0/24 to any port 9001 proto tcp comment 'MinIO Console Internal'

# Cho phép clients từ bên ngoài (thông qua load balancer hoặc direct):
sudo ufw allow from any to any port 9000 proto tcp comment 'MinIO API - Public'
```

**Script cấu hình firewall tự động:**

```bash
#!/bin/bash
# filepath: scripts/configure-firewall-minio.sh

set -e

# ===============================================
# CONFIGURATION
# ===============================================
MINIO_API_PORT=${MINIO_API_PORT:-9000}
MINIO_CONSOLE_PORT=${MINIO_CONSOLE_PORT:-9001}
ALLOWED_NETWORKS=${ALLOWED_NETWORKS:-""}  # Empty = allow all
SSH_PORT=${SSH_PORT:-22}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=============================================="
echo "   MinIO Firewall Configuration Script"
echo -e "==============================================${NC}"
echo ""
echo "Configuration:"
echo "  - MinIO API Port: ${MINIO_API_PORT}"
echo "  - MinIO Console Port: ${MINIO_CONSOLE_PORT}"
echo "  - SSH Port: ${SSH_PORT}"
echo "  - Allowed Networks: ${ALLOWED_NETWORKS:-'Any (0.0.0.0/0)'}"
echo ""

# ===============================================
# PRE-CHECKS
# ===============================================

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    echo -e "${RED}[ERROR] This script must be run as root (sudo)${NC}"
    exit 1
fi

# Check if UFW is installed
if ! command -v ufw &> /dev/null; then
    echo -e "${YELLOW}[INFO] UFW not found. Installing...${NC}"
    apt-get update
    apt-get install -y ufw
fi

# ===============================================
# BACKUP CURRENT RULES
# ===============================================
echo -e "\n${YELLOW}[1/5] Backing up current UFW rules...${NC}"
BACKUP_DIR="/etc/ufw/backup"
mkdir -p ${BACKUP_DIR}
BACKUP_FILE="${BACKUP_DIR}/ufw-backup-$(date +%Y%m%d-%H%M%S).rules"

if ufw status | grep -q "Status: active"; then
    ufw status numbered > "${BACKUP_FILE}" 2>/dev/null || true
    echo "  Backup saved to: ${BACKUP_FILE}"
else
    echo "  UFW not active, no backup needed"
fi

# ===============================================
# ENSURE SSH IS ALLOWED (CRITICAL!)
# ===============================================
echo -e "\n${YELLOW}[2/5] Ensuring SSH access (port ${SSH_PORT})...${NC}"
ufw allow ${SSH_PORT}/tcp comment 'SSH Access'
echo -e "  ${GREEN}✓ SSH port ${SSH_PORT} allowed${NC}"

# ===============================================
# CONFIGURE MINIO RULES
# ===============================================
echo -e "\n${YELLOW}[3/5] Configuring MinIO firewall rules...${NC}"

if [ -z "${ALLOWED_NETWORKS}" ]; then
    # Allow from anywhere
    echo "  Adding rules for MinIO API (port ${MINIO_API_PORT}) - any source..."
    ufw allow ${MINIO_API_PORT}/tcp comment 'MinIO S3 API'
    
    echo "  Adding rules for MinIO Console (port ${MINIO_CONSOLE_PORT}) - any source..."
    ufw allow ${MINIO_CONSOLE_PORT}/tcp comment 'MinIO Web Console'
else
    # Allow from specific networks
    IFS=',' read -ra NETWORKS <<< "${ALLOWED_NETWORKS}"
    for network in "${NETWORKS[@]}"; do
        network=$(echo "$network" | xargs)  # Trim whitespace
        
        echo "  Adding rules for network: ${network}..."
        ufw allow from ${network} to any port ${MINIO_API_PORT} proto tcp comment "MinIO API - ${network}"
        ufw allow from ${network} to any port ${MINIO_CONSOLE_PORT} proto tcp comment "MinIO Console - ${network}"
    done
fi

echo -e "  ${GREEN}✓ MinIO rules added${NC}"

# ===============================================
# ENABLE UFW
# ===============================================
echo -e "\n${YELLOW}[4/5] Enabling UFW...${NC}"

# Check if already active
if ufw status | grep -q "Status: active"; then
    echo "  UFW already active, reloading..."
    ufw reload
else
    echo "  Enabling UFW..."
    echo "y" | ufw enable
fi

echo -e "  ${GREEN}✓ UFW enabled${NC}"

# ===============================================
# VERIFY CONFIGURATION
# ===============================================
echo -e "\n${YELLOW}[5/5] Verifying configuration...${NC}"
echo ""
echo "Current UFW Status:"
echo "-------------------"
ufw status verbose | head -20

echo ""
echo "MinIO-related rules:"
echo "--------------------"
ufw status | grep -E "900[01]" || echo "  (No MinIO rules found - check above)"

# ===============================================
# TEST CONNECTIVITY
# ===============================================
echo ""
echo -e "${YELLOW}Testing local connectivity...${NC}"

# Test MinIO API port
if nc -z localhost ${MINIO_API_PORT} 2>/dev/null; then
    echo -e "  ${GREEN}✓ Port ${MINIO_API_PORT} (MinIO API) is responding${NC}"
else
    echo -e "  ${RED}✗ Port ${MINIO_API_PORT} (MinIO API) is not responding${NC}"
    echo "    Make sure MinIO is running: docker compose ps"
fi

# Test MinIO Console port
if nc -z localhost ${MINIO_CONSOLE_PORT} 2>/dev/null; then
    echo -e "  ${GREEN}✓ Port ${MINIO_CONSOLE_PORT} (MinIO Console) is responding${NC}"
else
    echo -e "  ${RED}✗ Port ${MINIO_CONSOLE_PORT} (MinIO Console) is not responding${NC}"
    echo "    Make sure MinIO is running: docker compose ps"
fi

# ===============================================
# SUMMARY
# ===============================================
echo ""
echo -e "${GREEN}=============================================="
echo "   Configuration Complete!"
echo -e "==============================================${NC}"
echo ""
echo "Access MinIO:"
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "  API:     http://${SERVER_IP}:${MINIO_API_PORT}"
echo "  Console: http://${SERVER_IP}:${MINIO_CONSOLE_PORT}"
echo ""
echo "To check firewall status anytime:"
echo "  sudo ufw status verbose"
echo ""
echo "To view firewall logs:"
echo "  sudo tail -f /var/log/ufw.log"
echo ""
```

**Troubleshooting firewall issues:**

```bash
# ===============================================
# TROUBLESHOOTING FIREWALL
# ===============================================

# 1. Kiểm tra UFW có đang block không
# Tạm thời disable để test:
sudo ufw disable

# Test kết nối
curl -v http://localhost:9000/minio/health/live

# Nếu hoạt động khi firewall tắt → Vấn đề là firewall rules
# Bật lại và kiểm tra rules:
sudo ufw enable
sudo ufw status verbose


# 2. Xem logs để biết traffic bị block
sudo tail -f /var/log/ufw.log

# Filter chỉ xem traffic đến port 9000
sudo tail -f /var/log/ufw.log | grep "DPT=9000"

# Log format giải thích:
# [UFW BLOCK] IN=eth0 ... SRC=192.168.1.50 DST=192.168.1.100 ... DPT=9000
# → Traffic từ 192.168.1.50 đến port 9000 bị BLOCK


# 3. Debug với iptables trực tiếp
# Xem rules iptables (UFW tạo ra)
sudo iptables -L -n -v

# Xem rules cho port 9000 cụ thể
sudo iptables -L -n -v | grep 9000

# Xem chain ufw-user-input (nơi UFW rules được apply)
sudo iptables -L ufw-user-input -n -v


# 4. Reset UFW nếu cần (XÓA TẤT CẢ RULES!)
# CẢNH BÁO: Sẽ mất tất cả rules đã cấu hình
sudo ufw reset

# Sau đó cấu hình lại từ đầu
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
# ... thêm các rules khác


# 5. Kiểm tra từ máy khác
# Từ client machine, test kết nối:
nc -zv <server-ip> 9000
telnet <server-ip> 9000
curl -v http://<server-ip>:9000/minio/health/live
```

---

#### 1.6.5 Cấu hình port binding cho Docker container

**Hiểu về Docker Port Binding:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              DOCKER PORT BINDING - KHÁI NIỆM                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  DOCKER CONTAINER MẶCĐỊNH:                                                 │
│  ──────────────────────────                                                 │
│  • Container có network namespace riêng (isolated)                         │
│  • Processes trong container bind vào ports của container                  │
│  • KHÔNG tự động accessible từ host hoặc bên ngoài                        │
│                                                                             │
│                                                                             │
│  KHÔNG CÓ PORT BINDING (container isolated):                               │
│  ────────────────────────────────────────────                               │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                           HOST (Ubuntu)                              │  │
│  │                                                                      │  │
│  │    Port 9000: ??? (không ai lắng nghe)                              │  │
│  │                                                                      │  │
│  │    ┌────────────────────────────────────────────────────────────┐   │  │
│  │    │              DOCKER CONTAINER                              │   │  │
│  │    │                                                            │   │  │
│  │    │    MinIO đang lắng nghe 0.0.0.0:9000                      │   │  │
│  │    │    (Nhưng chỉ trong network namespace của container)       │   │  │
│  │    │                                                            │   │  │
│  │    └────────────────────────────────────────────────────────────┘   │  │
│  │                                                                      │  │
│  │    Client request đến HOST:9000 → FAILED (không có gì lắng nghe)   │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│                                                                             │
│  CÓ PORT BINDING (-p 9000:9000):                                           │
│  ─────────────────────────────────                                          │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                           HOST (Ubuntu)                              │  │
│  │                                                                      │  │
│  │    Port 9000: Docker proxy đang lắng nghe                           │  │
│  │         ↓                                                            │  │
│  │    ┌────────────────────────────────────────────────────────────┐   │  │
│  │    │              DOCKER CONTAINER                              │   │  │
│  │    │                                                            │   │  │
│  │    │    MinIO đang lắng nghe 0.0.0.0:9000  ← Traffic forwarded  │   │  │
│  │    │                                                            │   │  │
│  │    └────────────────────────────────────────────────────────────┘   │  │
│  │                                                                      │  │
│  │    Client request đến HOST:9000 → Docker proxy → Container:9000     │  │
│  │                                 → SUCCESS!                          │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Các kiểu port binding trong Docker:**

```yaml
# filepath: docker-compose.yml - Port Binding Examples

version: '3.8'

services:
  minio:
    image: minio/minio:latest
    
    # ===============================================
    # PORT BINDING SYNTAX:
    # ===============================================
    # Syntax: "HOST_PORT:CONTAINER_PORT"
    # Hoặc:   "HOST_IP:HOST_PORT:CONTAINER_PORT"
    # Hoặc:   "CONTAINER_PORT" (Docker chọn host port ngẫu nhiên)
    
    ports:
      # KIỂU 1: Bind tất cả interfaces (0.0.0.0)
      # Format: "HOST_PORT:CONTAINER_PORT"
      - "9000:9000"  # API
      - "9001:9001"  # Console
      # → Accessible từ: localhost, LAN IP, public IP
      
      # KIỂU 2: Chỉ bind localhost (127.0.0.1)
      # Format: "127.0.0.1:HOST_PORT:CONTAINER_PORT"
      # - "127.0.0.1:9000:9000"
      # - "127.0.0.1:9001:9001"
      # → Chỉ accessible từ localhost (máy host)
      # → An toàn hơn, thường dùng với reverse proxy
      
      # KIỂU 3: Bind vào một IP cụ thể của host
      # Format: "HOST_IP:HOST_PORT:CONTAINER_PORT"
      # - "192.168.1.100:9000:9000"
      # → Chỉ accessible qua IP đó
      
      # KIỂU 4: Host port khác container port
      # Format: "HOST_PORT:CONTAINER_PORT"
      # - "8080:9000"   # Access qua host:8080 → container:9000
      # - "8081:9001"
      # → Hữu ích khi port 9000 đã bị chiếm
      
      # KIỂU 5: Để Docker chọn host port ngẫu nhiên
      # Format: "CONTAINER_PORT"
      # - "9000"
      # → Docker sẽ chọn một port cao ngẫu nhiên (ví dụ: 49153)
      # → Kiểm tra: docker port minio
      
      # KIỂU 6: Range of ports
      # - "9000-9010:9000-9010"
      # → Map một dải ports
```

**Cấu hình Docker Compose cho MinIO với port binding đầy đủ:**

```yaml
# filepath: docker-compose.yml

version: '3.8'

services:
  minio:
    image: minio/minio:latest
    container_name: minio
    hostname: minio
    
    # ===============================================
    # PORT CONFIGURATION
    # ===============================================
    ports:
      # MinIO S3 API - accessible từ tất cả interfaces
      - "9000:9000"
      
      # MinIO Console - accessible từ tất cả interfaces  
      - "9001:9001"
    
    # ===============================================
    # ENVIRONMENT VARIABLES
    # ===============================================
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-minioadmin}
      
    # ===============================================
    # COMMAND
    # ===============================================
    # QUAN TRỌNG: MinIO phải bind vào 0.0.0.0 (tất cả interfaces)
    # để nhận traffic được forward từ Docker
    command: >
      server /data 
      --address ":9000"
      --console-address ":9001"
    
    # ===============================================
    # VOLUMES
    # ===============================================
    volumes:
      - minio-data:/data
    
    # ===============================================
    # HEALTH CHECK
    # ===============================================
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    
    # ===============================================
    # RESTART POLICY
    # ===============================================
    restart: unless-stopped

volumes:
  minio-data:
    driver: local
```

**Cấu hình cho Production với localhost binding + Nginx:**

```yaml
# filepath: docker-compose-production.yml

version: '3.8'

services:
  minio:
    image: minio/minio:latest
    container_name: minio
    
    # Chỉ bind vào localhost - Nginx sẽ proxy
    ports:
      - "127.0.0.1:9000:9000"
      - "127.0.0.1:9001:9001"
    
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
      # Quan trọng: Set URL cho console khi đằng sau proxy
      MINIO_BROWSER_REDIRECT_URL: https://console.minio.example.com
      
    command: server /data --address ":9000" --console-address ":9001"
    volumes:
      - minio-data:/data
    networks:
      - minio-internal
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: minio-nginx
    ports:
      # Public ports - accessible từ bên ngoài
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - minio
    networks:
      - minio-internal
    restart: unless-stopped

volumes:
  minio-data:

networks:
  minio-internal:
    driver: bridge
```

**Kiểm tra port binding:**

```bash
# ===============================================
# KIỂM TRA PORT BINDING
# ===============================================

# Xem các ports được publish của container
docker port minio

# Output mẫu:
# 9000/tcp -> 0.0.0.0:9000
# 9001/tcp -> 0.0.0.0:9001

# Hoặc với docker compose:
docker compose port minio 9000
# Output: 0.0.0.0:9000


# ===============================================
# KIỂM TRA AI ĐANG LẮNG NGHE PORT
# ===============================================

# Trên host, kiểm tra port 9000:
sudo ss -tlnp | grep 9000
# Output:
# LISTEN  0  4096  0.0.0.0:9000  0.0.0.0:*  users:(("docker-proxy",pid=12345,fd=4))

# Hoặc:
sudo netstat -tlnp | grep 9000

# Nếu bind vào localhost:
# LISTEN  0  4096  127.0.0.1:9000  0.0.0.0:*  users:(("docker-proxy",pid=12345,fd=4))


# ===============================================
# KIỂM TRA CONTAINER NETWORK
# ===============================================

# Xem network settings của container
docker inspect minio --format='{{json .NetworkSettings.Ports}}' | jq

# Output:
# {
#   "9000/tcp": [
#     {
#       "HostIp": "0.0.0.0",
#       "HostPort": "9000"
#     }
#   ],
#   "9001/tcp": [
#     {
#       "HostIp": "0.0.0.0",
#       "HostPort": "9001"
#     }
#   ]
# }


# ===============================================
# TEST CONNECTIVITY
# ===============================================

# Test từ localhost
curl http://localhost:9000/minio/health/live
curl http://127.0.0.1:9000/minio/health/live

# Test từ LAN IP (từ máy khác trong mạng)
curl http://192.168.1.100:9000/minio/health/live

# Test từ bên trong container
docker exec minio curl http://localhost:9000/minio/health/live
```

**Xử lý port conflict:**

```bash
# ===============================================
# XỬ LÝ PORT CONFLICT
# ===============================================

# Lỗi khi start: "port is already allocated"
# → Port 9000 đã được sử dụng bởi process khác

# Bước 1: Tìm process đang dùng port 9000
sudo lsof -i :9000
# Hoặc:
sudo ss -tlnp | grep 9000
# Hoặc:
sudo fuser -v 9000/tcp

# Output mẫu:
# COMMAND     PID USER   FD   TYPE  DEVICE SIZE/OFF NODE NAME
# java      12345 user   50u  IPv4  123456      0t0  TCP *:9000 (LISTEN)


# Bước 2: Quyết định action

# Option A: Kill process đang chiếm port (nếu không cần)
sudo kill -9 12345  # Thay 12345 bằng PID thực

# Option B: Đổi MinIO sang port khác
# Trong docker-compose.yml:
ports:
  - "9002:9000"   # MinIO API trên host port 9002
  - "9003:9001"   # MinIO Console trên host port 9003

# Option C: Stop container/service cũ đang dùng port
docker stop <old-container>
sudo systemctl stop <old-service>


# ===============================================
# SCRIPT KIỂM TRA PORT AVAILABILITY
# ===============================================
```

```bash
#!/bin/bash
# filepath: scripts/check-ports.sh

PORTS_TO_CHECK=(9000 9001)

echo "Checking port availability..."
echo ""

for port in "${PORTS_TO_CHECK[@]}"; do
    echo "Port ${port}:"
    
    if ss -tln | grep -q ":${port} "; then
        echo "  ✗ IN USE"
        
        # Tìm process
        PROCESS=$(sudo lsof -i :${port} 2>/dev/null | grep LISTEN | head -1)
        if [ -n "$PROCESS" ]; then
            echo "  Process: $PROCESS"
        fi
    else
        echo "  ✓ Available"
    fi
    echo ""
done
```

---

#### 1.6.6 Cấu hình reverse proxy với Nginx cho MinIO

**Tại sao cần Reverse Proxy cho MinIO?**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              TẠI SAO CẦN REVERSE PROXY CHO MINIO?                          │
├─────────────────────// filepath: e:\DaiCuongBK\Project3\FileSharing\client\minio.md
// ...existing code...

---

#### 1.6.3 Nguyên nhân gây ra lỗi ERR_CONNECTION_ABORTED

**ERR_CONNECTION_ABORTED là gì?**

Lỗi `ERR_CONNECTION_ABORTED` xảy ra khi kết nối bị **hủy bỏ** trong quá trình truyền dữ liệu, thường do **phía client** hoặc do một sự kiện bất thường trên đường truyền. Đây là lỗi khác biệt với CONNECTION_REFUSED (từ chối ngay từ đầu) và CONNECTION_RESET (server đóng đột ngột).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              SO SÁNH 3 LOẠI LỖI CONNECTION                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ERR_CONNECTION_REFUSED:                                                   │
│  ─────────────────────────                                                  │
│  • Kết nối bị TỪ CHỐI ngay từ đầu                                         │
│  • Server không accept connection                                          │
│  • Không có handshake TCP thành công                                       │
│  • Nguyên nhân: Server không chạy, port sai, firewall block               │
│                                                                             │
│  ERR_CONNECTION_RESET:                                                     │
│  ─────────────────────────                                                  │
│  • Kết nối đã thiết lập nhưng bị server NGẮT ĐỘT NGỘT                    │
│  • Server gửi RST packet                                                   │
│  • Nguyên nhân: Server crash, timeout, request quá lớn                    │
│                                                                             │
│  ERR_CONNECTION_ABORTED:                                                   │
│  ─────────────────────────                                                  │
│  • Kết nối bị HỦY GIỮA CHỪNG trong quá trình truyền                       │
│  • Thường do CLIENT hoặc thiết bị mạng trung gian                         │
│  • Nguyên nhân: User cancel, network drop, browser close                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Timeline khi xảy ra ERR_CONNECTION_ABORTED:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              ERR_CONNECTION_ABORTED - TIMELINE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐         ┌──────────┐         ┌──────────┐                   │
│  │  Client  │         │ Network  │         │  MinIO   │                   │
│  │ (Browser)│         │          │         │  Server  │                   │
│  └────┬─────┘         └────┬─────┘         └────┬─────┘                   │
│       │                    │                    │                          │
│       │══════ TCP Connection Established ═══════│                          │
│       │                    │                    │                          │
│       │── HTTP Request (Upload Start) ─────────►│                          │
│       │                    │                    │                          │
│       │── Data chunk 1 ───────────────────────►│  ✓ Received              │
│       │                    │                    │                          │
│       │── Data chunk 2 ───────────────────────►│  ✓ Received              │
│       │                    │                    │                          │
│       │── Data chunk 3 ────┼───────────────────►│  ✓ Received              │
│       │                    │                    │                          │
│       │    ╳ ABORT!        │                    │                          │
│       │    ┌────────────────────────────────┐   │                          │
│       │    │ Possible causes:               │   │                          │
│       │    │ • User clicked "Cancel"        │   │                          │
│       │    │ • User closed browser tab      │   │                          │
│       │    │ • WiFi disconnected            │   │                          │
│       │    │ • JavaScript called abort()    │   │                          │
│       │    │ • Browser timeout exceeded     │   │                          │
│       │    └────────────────────────────────┘   │                          │
│       │                    │                    │                          │
│       │    🚫 ERR_CONNECTION_ABORTED            │                          │
│       │                    │                    │                          │
│       │                    │                    │ (Incomplete upload,      │
│       │                    │                    │  partial data on server) │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Các nguyên nhân chi tiết gây ra ERR_CONNECTION_ABORTED:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              NGUYÊN NHÂN ERR_CONNECTION_ABORTED                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. USER ACTIONS (Hành động người dùng)                                    │
│  ─────────────────────────────────────                                      │
│     • User nhấn nút "Cancel" trong khi upload/download                    │
│     • User đóng tab browser khi request đang xử lý                        │
│     • User navigate sang trang khác (gây abort request)                   │
│     • User refresh trang trong khi đang upload                            │
│     • JavaScript code gọi AbortController.abort()                         │
│     • XMLHttpRequest.abort() được gọi                                     │
│                                                                             │
│  2. NETWORK INSTABILITY (Mạng không ổn định)                               │
│  ───────────────────────────────────────────                                │
│     • WiFi bị ngắt kết nối đột ngột                                       │
│     • Chuyển từ WiFi sang Mobile Data (hoặc ngược lại)                   │
│     • VPN connection bị drop                                               │
│     • ISP network issues                                                   │
│     • Router/modem restart                                                 │
│     • Cable network unplugged                                              │
│                                                                             │
│  3. TIMEOUT ISSUES                                                         │
│  ──────────────────                                                         │
│     • Browser có timeout mặc định cho requests (thường 5-30 phút)         │
│     • fetch API timeout (nếu được cấu hình)                               │
│     • XMLHttpRequest.timeout triggered                                    │
│     • Server không response trong thời gian chờ                           │
│                                                                             │
│  4. RESOURCE CONSTRAINTS ON CLIENT                                         │
│  ─────────────────────────────────                                          │
│     • Browser hết memory khi xử lý file lớn                               │
│     • JavaScript heap overflow                                             │
│     • Quá nhiều concurrent connections                                     │
│     • Tab bị suspend do low memory (mobile browsers)                      │
│                                                                             │
│  5. ANTIVIRUS/SECURITY SOFTWARE                                            │
│  ─────────────────────────────────                                          │
│     • Antivirus scan file đang upload và timeout                         │
│     • Security software block connection                                   │
│     • Corporate proxy terminate long-running connections                  │
│     • DLP (Data Loss Prevention) software intercept                       │
│                                                                             │
│  6. BROWSER EXTENSIONS                                                     │
│  ────────────────────────                                                   │
│     • Ad blockers blocking requests (nếu match pattern)                   │
│     • Privacy extensions interfering với connections                      │
│     • Proxy extensions failing                                             │
│     • Download managers hijacking requests                                │
│                                                                             │
│  7. OPERATING SYSTEM EVENTS                                                │
│  ─────────────────────────────                                              │
│     • Computer going to sleep/hibernate                                   │
│     • Network adapter disabled                                            │
│     • System shutdown/restart initiated                                   │
│     • Power saving mode affecting network                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Cách chẩn đoán ERR_CONNECTION_ABORTED:**

```javascript
// filepath: src/utils/diagnoseAborted.ts

/**
 * Wrapper để diagnose và log connection aborted errors
 * Giúp xác định nguyên nhân gây ra abort
 */

interface DiagnosticInfo {
    url: string;
    startTime: number;
    abortTime?: number;
    duration?: number;
    reason?: string;
    networkInfo?: {
        type: string;
        downlink: number;
        rtt: number;
    };
}

class ConnectionDiagnostics {
    private diagnostics: Map<string, DiagnosticInfo> = new Map();
    
    /**
     * Bắt đầu tracking một request
     */
    startTracking(requestId: string, url: string): void {
        const info: DiagnosticInfo = {
            url,
            startTime: Date.now(),
        };
        
        // Thu thập network info nếu có
        if ('connection' in navigator) {
            const conn = (navigator as any).connection;
            info.networkInfo = {
                type: conn.effectiveType || 'unknown',
                downlink: conn.downlink || 0,
                rtt: conn.rtt || 0
            };
        }
        
        this.diagnostics.set(requestId, info);
        console.log(`[TRACK START] ${requestId}: ${url}`);
    }
    
    /**
     * Ghi nhận khi request bị abort
     */
    recordAbort(requestId: string, reason?: string): void {
        const info = this.diagnostics.get(requestId);
        if (info) {
            info.abortTime = Date.now();
            info.duration = info.abortTime - info.startTime;
            info.reason = reason;
            
            console.log(`[ABORT RECORDED] ${requestId}`);
            console.log(`  Duration before abort: ${info.duration}ms`);
            console.log(`  Reason: ${reason || 'unknown'}`);
            console.log(`  Network type: ${info.networkInfo?.type}`);
            
            // Phân tích nguyên nhân có thể
            this.analyzeAbortCause(info);
        }
    }
    
    /**
     * Phân tích nguyên nhân abort
     */
    private analyzeAbortCause(info: DiagnosticInfo): void {
        console.log('\n[ANALYSIS] Possible causes:');
        
        // Nếu abort rất nhanh (< 100ms) - có thể là user action ngay lập tức
        if (info.duration && info.duration < 100) {
            console.log('  - Very quick abort - likely immediate user cancel');
        }
        
        // Nếu abort sau thời gian dài - có thể là timeout
        if (info.duration && info.duration > 30000) {
            console.log('  - Long duration before abort - possible timeout');
        }
        
        // Network type analysis
        if (info.networkInfo) {
            if (info.networkInfo.type === 'slow-2g' || info.networkInfo.type === '2g') {
                console.log('  - Slow network connection detected');
            }
            if (info.networkInfo.rtt > 500) {
                console.log('  - High latency network (RTT > 500ms)');
            }
        }
        
        // Check visibility state
        if (document.hidden) {
            console.log('  - Page was hidden when abort occurred');
        }
    }
}

// Singleton instance
const diagnostics = new ConnectionDiagnostics();

/**
 * Upload với tracking và abort handling
 */
async function uploadWithAbortTracking(
    presignedUrl: string,
    file: File,
    options: {
        onProgress?: (progress: number) => void;
        onAbort?: () => void;
        signal?: AbortSignal;
    } = {}
): Promise<{ success: boolean; error?: string; aborted?: boolean }> {
    const requestId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    diagnostics.startTracking(requestId, presignedUrl);
    
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        
        // Progress tracking
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && options.onProgress) {
                const progress = (e.loaded / e.total) * 100;
                options.onProgress(progress);
            }
        };
        
        // Success handler
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                console.log(`[SUCCESS] ${requestId}`);
                resolve({ success: true });
            } else {
                resolve({ 
                    success: false, 
                    error: `HTTP ${xhr.status}: ${xhr.statusText}` 
                });
            }
        };
        
        // Error handler (network errors)
        xhr.onerror = () => {
            console.error(`[NETWORK ERROR] ${requestId}`);
            diagnostics.recordAbort(requestId, 'Network error');
            resolve({ 
                success: false, 
                error: 'Network error - connection may have been lost' 
            });
        };
        
        // Abort handler
        xhr.onabort = () => {
            console.log(`[ABORTED] ${requestId}`);
            diagnostics.recordAbort(requestId, 'Request aborted');
            
            if (options.onAbort) {
                options.onAbort();
            }
            
            resolve({ 
                success: false, 
                error: 'Upload was cancelled',
                aborted: true
            });
        };
        
        // Timeout handler
        xhr.ontimeout = () => {
            console.error(`[TIMEOUT] ${requestId}`);
            diagnostics.recordAbort(requestId, 'Timeout');
            resolve({ 
                success: false, 
                error: 'Upload timed out' 
            });
        };
        
        // Handle external abort signal
        if (options.signal) {
            options.signal.addEventListener('abort', () => {
                xhr.abort();
            });
        }
        
        // Lắng nghe page unload để warn user
        const beforeUnloadHandler = (e: BeforeUnloadEvent) => {
            if (xhr.readyState !== XMLHttpRequest.DONE && xhr.readyState !== XMLHttpRequest.UNSENT) {
                diagnostics.recordAbort(requestId, 'Page unload');
                e.preventDefault();
                e.returnValue = 'Upload is in progress. Are you sure you want to leave?';
                return e.returnValue;
            }
        };
        window.addEventListener('beforeunload', beforeUnloadHandler);
        
        // Lắng nghe visibility change (tab hidden)
        const visibilityHandler = () => {
            if (document.hidden) {
                console.log(`[WARNING] ${requestId}: Tab hidden while uploading`);
            }
        };
        document.addEventListener('visibilitychange', visibilityHandler);
        
        // Lắng nghe network changes
        const networkHandler = () => {
            const conn = (navigator as any).connection;
            if (conn) {
                console.log(`[NETWORK CHANGE] ${requestId}: ${conn.effectiveType}`);
                if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') {
                    console.warn(`[WARNING] Slow network detected during upload`);
                }
            }
        };
        if ('connection' in navigator) {
            (navigator as any).connection.addEventListener('change', networkHandler);
        }
        
        // Cleanup function
        xhr.onloadend = () => {
            window.removeEventListener('beforeunload', beforeUnloadHandler);
            document.removeEventListener('visibilitychange', visibilityHandler);
            if ('connection' in navigator) {
                (navigator as any).connection.removeEventListener('change', networkHandler);
            }
        };
        
        // Start upload
        xhr.open('PUT', presignedUrl);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.timeout = 30 * 60 * 1000; // 30 minutes
        xhr.send(file);
    });
}

export { uploadWithAbortTracking, diagnostics };
```

**Cách khắc phục và xử lý ERR_CONNECTION_ABORTED:**

```typescript
// filepath: src/utils/robustUploadWithRetry.ts

interface UploadConfig {
    maxRetries: number;
    retryDelay: number;
    exponentialBackoff: boolean;
    timeout: number;
    onProgress?: (progress: number) => void;
    onRetry?: (attempt: number, error: string) => void;
}

const DEFAULT_CONFIG: UploadConfig = {
    maxRetries: 3,
    retryDelay: 2000,
    exponentialBackoff: true,
    timeout: 30 * 60 * 1000 // 30 minutes
};

/**
 * Upload với automatic retry khi connection aborted
 */
async function uploadWithAutoRetry(
    getPresignedUrl: () => Promise<string>,
    file: File,
    config: Partial<UploadConfig> = {}
): Promise<{ success: boolean; error?: string; attempts: number }> {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    let lastError = '';
    
    for (let attempt = 1; attempt <= cfg.maxRetries; attempt++) {
        console.log(`\n[UPLOAD ATTEMPT ${attempt}/${cfg.maxRetries}]`);
        console.log(`  File: ${file.name} (${formatBytes(file.size)})`);
        
        try {
            // Lấy presigned URL mới cho mỗi attempt
            // (URL cũ có thể đã expire)
            const presignedUrl = await getPresignedUrl();
            
            const result = await performUpload(presignedUrl, file, cfg);
            
            if (result.success) {
                console.log(`[SUCCESS] Upload completed on attempt ${attempt}`);
                return { success: true, attempts: attempt };
            }
            
            lastError = result.error || 'Unknown error';
            
            // Kiểm tra có nên retry không
            if (!shouldRetry(lastError)) {
                console.log(`[NO RETRY] Error is not retryable: ${lastError}`);
                return { success: false, error: lastError, attempts: attempt };
            }
            
        } catch (error) {
            lastError = error instanceof Error ? error.message : 'Unknown error';
            console.error(`[ATTEMPT ${attempt} FAILED]`, lastError);
        }
        
        // Wait before retry
        if (attempt < cfg.maxRetries) {
            const delay = cfg.exponentialBackoff 
                ? cfg.retryDelay * Math.pow(2, attempt - 1)
                : cfg.retryDelay;
            
            console.log(`[WAITING] ${delay}ms before retry...`);
            
            if (cfg.onRetry) {
                cfg.onRetry(attempt, lastError);
            }
            
            await sleep(delay);
        }
    }
    
    return {
        success: false,
        error: `Upload failed after ${cfg.maxRetries} attempts. Last error: ${lastError}`,
        attempts: cfg.maxRetries
    };
}

/**
 * Kiểm tra error có nên retry không
 */
function shouldRetry(error: string): boolean {
    const retryablePatterns = [
        'aborted',
        'abort',
        'cancelled',
        'cancel',
        'network',
        'connection',
        'timeout',
        'timed out',
        'ECONNRESET',
        'ECONNABORTED',
        'ETIMEDOUT',
        'ENETUNREACH',
        'EHOSTUNREACH',
        'failed to fetch'
    ];
    
    const lowerError = error.toLowerCase();
    return retryablePatterns.some(pattern => lowerError.includes(pattern.toLowerCase()));
}

/**
 * Thực hiện upload thực tế
 */
function performUpload(
    url: string,
    file: File,
    config: UploadConfig
): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        let lastProgress = 0;
        
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const progress = (e.loaded / e.total) * 100;
                if (progress - lastProgress >= 1 || progress === 100) {
                    lastProgress = progress;
                    if (config.onProgress) {
                        config.onProgress(progress);
                    }
                }
            }
        };
        
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve({ success: true });
            } else {
                resolve({ success: false, error: `HTTP ${xhr.status}: ${xhr.statusText}` });
            }
        };
        
        xhr.onerror = () => {
            resolve({ success: false, error: 'Network error - connection aborted' });
        };
        
        xhr.onabort = () => {
            resolve({ success: false, error: 'Upload was aborted' });
        };
        
        xhr.ontimeout = () => {
            resolve({ success: false, error: 'Upload timed out' });
        };
        
        xhr.open('PUT', url);
        xhr.timeout = config.timeout;
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.send(file);
    });
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export { uploadWithAutoRetry };
```

**Prevent abort khi user navigate away:**

```typescript
// filepath: src/hooks/useUploadProtection.ts

import { useEffect, useRef, useCallback } from 'react';

interface UploadProtectionOptions {
    message?: string;
    onAttemptLeave?: () => void;
}

/**
 * React hook để protect user khỏi việc vô tình close/navigate
 * trong khi upload đang diễn ra
 */
function useUploadProtection(
    isUploading: boolean,
    options: UploadProtectionOptions = {}
) {
    const {
        message = 'Upload is in progress. If you leave, your upload will be cancelled.',
        onAttemptLeave
    } = options;
    
    const isUploadingRef = useRef(isUploading);
    isUploadingRef.current = isUploading;
    
    const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
        if (isUploadingRef.current) {
            if (onAttemptLeave) {
                onAttemptLeave();
            }
            e.preventDefault();
            e.returnValue = message;
            return message;
        }
    }, [message, onAttemptLeave]);
    
    useEffect(() => {
        if (isUploading) {
            window.addEventListener('beforeunload', handleBeforeUnload);
            
            // Cho React Router / Next.js
            const handlePopState = (e: PopStateEvent) => {
                if (isUploadingRef.current) {
                    const confirm = window.confirm(message);
                    if (!confirm) {
                        // Prevent navigation
                        window.history.pushState(null, '', window.location.href);
                    }
                }
            };
            window.addEventListener('popstate', handlePopState);
            
            return () => {
                window.removeEventListener('beforeunload', handleBeforeUnload);
                window.removeEventListener('popstate', handlePopState);
            };
        }
    }, [isUploading, handleBeforeUnload, message]);
}

export { useUploadProtection };
```

---

#### 1.6.4 Cấu hình firewall trên Ubuntu để cho phép truy cập MinIO

**Tổng quan về Firewall và MinIO:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              FIREWALL VÀ MINIO - KIẾN TRÚC                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  LUỒNG TRAFFIC KHI CÓ FIREWALL:                                            │
│  ─────────────────────────────────                                          │
│                                                                             │
│  ┌──────────────┐                                                           │
│  │   Internet   │                                                           │
│  │  /Clients    │                                                           │
│  └──────┬───────┘                                                           │
│         │                                                                   │
│         │ Request: http://server:9000/bucket/file                          │
│         │ Request: http://server:9001 (Console)                            │
│         ▼                                                                   │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │                        UBUNTU SERVER                              │     │
│  │  ┌─────────────────────────────────────────────────────────────┐ │     │
│  │  │                      FIREWALL (UFW)                         │ │     │
│  │  │                                                             │ │     │
│  │  │  ┌─────────────────────────────────────────────────────┐   │ │     │
│  │  │  │                 INCOMING RULES                      │   │ │     │
│  │  │  │                                                     │   │ │     │
│  │  │  │  Port 22  (SSH)         : ALLOW from 0.0.0.0/0     │   │ │     │
│  │  │  │  Port 80  (HTTP)        : ALLOW from 0.0.0.0/0     │   │ │     │
│  │  │  │  Port 443 (HTTPS)       : ALLOW from 0.0.0.0/0     │   │ │     │
│  │  │  │  Port 9000 (MinIO API)  : ??? (cần cấu hình)       │   │ │     │
│  │  │  │  Port 9001 (MinIO UI)   : ??? (cần cấu hình)       │   │ │     │
│  │  │  │                                                     │   │ │     │
│  │  │  │  Default incoming: DENY                             │   │ │     │
│  │  │  │  Default outgoing: ALLOW                            │   │ │     │
│  │  │  └─────────────────────────────────────────────────────┘   │ │     │
│  │  │                                                             │ │     │
│  │  │  Traffic ──►  ✓ ALLOW  ──►  Đến application               │ │     │
│  │  │              ✗ DENY   ──►  Bị drop (không response)       │ │     │
│  │  └─────────────────────────────────────────────────────────────┘ │     │
│  │                               │                                   │     │
│  │                               ▼                                   │     │
│  │                    ┌───────────────────────┐                     │     │
│  │                    │        MinIO          │                     │     │
│  │                    │  API: 0.0.0.0:9000    │                     │     │
│  │                    │  Console: 0.0.0.0:9001│                     │     │
│  │                    └───────────────────────┘                     │     │
│  └───────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│  Nếu port 9000/9001 không được ALLOW:                                      │
│  → Client nhận được ERR_CONNECTION_REFUSED hoặc timeout                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Hiểu về UFW (Uncomplicated Firewall):**

UFW là firewall frontend mặc định trên Ubuntu, cung cấp interface đơn giản để quản lý iptables rules phía dưới.

```bash
# ===============================================
# KIẾN THỨC CƠ BẢN VỀ UFW
# ===============================================

# UFW hoạt động với 2 loại rules chính:
# 1. INCOMING: Traffic đi VÀO server
# 2. OUTGOING: Traffic đi RA từ server

# Default policies:
# - incoming: deny (chặn mọi traffic vào)
# - outgoing: allow (cho phép mọi traffic ra)

# Rule priority: Rules được đánh số, rule có số nhỏ được xử lý trước

# Rule syntax:
# ufw [allow|deny|reject|limit] [in|out] [on INTERFACE] [proto PROTOCOL] 
#     [from ADDRESS [port PORT]] [to ADDRESS [port PORT]]
```

**Kiểm tra trạng thái firewall hiện tại:**

```bash
# ===============================================
# BƯỚC 1: KIỂM TRA TRẠNG THÁI UFW
# ===============================================

# Xem status tổng quan
sudo ufw status

# Output khi INACTIVE:
# Status: inactive

# Output khi ACTIVE:
# Status: active
# 
# To                         Action      From
# --                         ------      ----
# 22/tcp                     ALLOW       Anywhere
# 80/tcp                     ALLOW       Anywhere


# Xem status với chi tiết hơn
sudo ufw status verbose

# Output:
# Status: active
# Logging: on (low)
# Default: deny (incoming), allow (outgoing), deny (routed)
# New profiles: skip
#
# To                         Action      From
# --                         ------      ----
# 22/tcp                     ALLOW IN    Anywhere


# Xem rules với số thứ tự (để dễ delete)
sudo ufw status numbered

# Output:
#      To                         Action      From
#      --                         ------      ----
# [ 1] 22/tcp                     ALLOW IN    Anywhere
# [ 2] 80/tcp                     ALLOW IN    Anywhere
# [ 3] 22/tcp (v6)                ALLOW IN    Anywhere (v6)


# Xem cấu hình chi tiết (iptables underlying)
sudo ufw show raw
sudo ufw show added
```

**Cấu hình UFW cho MinIO - Cơ bản:**

```bash
# ===============================================
# CẤU HÌNH UFW CHO MINIO - CƠ BẢN
# ===============================================

# Đảm bảo SSH được allow trước khi enable UFW!
# (Tránh bị lock out khỏi server)
sudo ufw allow ssh
# Hoặc:
sudo ufw allow 22/tcp


# Mở port MinIO API (9000)
sudo ufw allow 9000/tcp comment 'MinIO S3 API'

# Mở port MinIO Console (9001)
sudo ufw allow 9001/tcp comment 'MinIO Web Console'


# Kiểm tra rules đã thêm
sudo ufw status verbose | grep -E "900[01]"

# Output:
# 9000/tcp                   ALLOW IN    Anywhere                   # MinIO S3 API
# 9001/tcp                   ALLOW IN    Anywhere                   # MinIO Web Console


# Enable firewall (nếu chưa enable)
sudo ufw enable

# Confirm: "Firewall is active and enabled on system startup"


# Kiểm tra lại status
sudo ufw status
```

**Cấu hình UFW cho MinIO - Nâng cao (Giới hạn source IP):**

```bash
# ===============================================
# CẤU HÌNH UFW CHO MINIO - NÂNG CAO
# ===============================================

# Chỉ cho phép từ mạng nội bộ (ví dụ: 192.168.1.0/24)
sudo ufw allow from 192.168.1.0/24 to any port 9000 proto tcp comment 'MinIO API - Internal LAN'
sudo ufw allow from 192.168.1.0/24 to any port 9001 proto tcp comment 'MinIO Console - Internal LAN'


# Chỉ cho phép từ một IP cụ thể (Admin machine)
sudo ufw allow from 10.0.0.50 to any port 9001 proto tcp comment 'MinIO Console - Admin only'


# Cho phép từ nhiều IPs/networks (thêm nhiều rules)
sudo ufw allow from 192.168.1.0/24 to any port 9000 proto tcp
sudo ufw allow from 10.10.0.0/16 to any port 9000 proto tcp
sudo ufw allow from 172.16.0.100 to any port 9000 proto tcp


# Cho phép từ một network interface cụ thể
# (Hữu ích khi server có nhiều NIC)
sudo ufw allow in on eth1 to any port 9000 proto tcp comment 'MinIO API - Private NIC'


# Rate limiting để chống brute-force hoặc DDoS đơn giản
# (Limit: 6 connections trong 30 giây từ một IP)
sudo ufw limit 9000/tcp comment 'MinIO API - Rate limited'


# Cấu hình logging cho MinIO ports
sudo ufw logging on
sudo ufw logging medium  # Hoặc: low, high, full
```

**Cấu hình UFW cho MinIO Distributed Cluster:**

```bash
# ===============================================
# UFW CHO MINIO DISTRIBUTED (MULTI-NODE)
# ===============================================

# Trong distributed mode, các MinIO nodes cần giao tiếp với nhau
# qua port 9000 cho data replication và healing

# Giả sử cluster có 4 nodes:
# - Node 1: 192.168.1.101
# - Node 2: 192.168.1.102
# - Node 3: 192.168.1.103
# - Node 4: 192.168.1.104

# Trên Node 1 (192.168.1.101), cho phép traffic từ các nodes khác:
sudo ufw allow from 192.168.1.102 to any port 9000 proto tcp comment 'MinIO Node 2'
sudo ufw allow from 192.168.1.103 to any port 9000 proto tcp comment 'MinIO Node 3'
sudo ufw allow from 192.168.1.104 to any port 9000 proto tcp comment 'MinIO Node 4'

# Nếu console chỉ cần truy cập từ một node (load balancer sẽ route):
sudo ufw allow from 192.168.1.100 to any port 9001 proto tcp comment 'MinIO Console - LB only'

# Hoặc đơn giản hơn - cho phép cả subnet của cluster:
sudo ufw allow from 192.168.1.0/24 to any port 9000 proto tcp comment 'MinIO Cluster Internal'
sudo ufw allow from 192.168.1.0/24 to any port 9001 proto tcp comment 'MinIO Console Internal'

# Cho phép clients từ bên ngoài (thông qua load balancer hoặc direct):
sudo ufw allow from any to any port 9000 proto tcp comment 'MinIO API - Public'
```

**Script cấu hình firewall tự động:**

```bash
#!/bin/bash
# filepath: scripts/configure-firewall-minio.sh

set -e

# ===============================================
# CONFIGURATION
# ===============================================
MINIO_API_PORT=${MINIO_API_PORT:-9000}
MINIO_CONSOLE_PORT=${MINIO_CONSOLE_PORT:-9001}
ALLOWED_NETWORKS=${ALLOWED_NETWORKS:-""}  # Empty = allow all
SSH_PORT=${SSH_PORT:-22}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=============================================="
echo "   MinIO Firewall Configuration Script"
echo -e "==============================================${NC}"
echo ""
echo "Configuration:"
echo "  - MinIO API Port: ${MINIO_API_PORT}"
echo "  - MinIO Console Port: ${MINIO_CONSOLE_PORT}"
echo "  - SSH Port: ${SSH_PORT}"
echo "  - Allowed Networks: ${ALLOWED_NETWORKS:-'Any (0.0.0.0/0)'}"
echo ""

# ===============================================
# PRE-CHECKS
# ===============================================

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    echo -e "${RED}[ERROR] This script must be run as root (sudo)${NC}"
    exit 1
fi

# Check if UFW is installed
if ! command -v ufw &> /dev/null; then
    echo -e "${YELLOW}[INFO] UFW not found. Installing...${NC}"
    apt-get update
    apt-get install -y ufw
fi

# ===============================================
# BACKUP CURRENT RULES
# ===============================================
echo -e "\n${YELLOW}[1/5] Backing up current UFW rules...${NC}"
BACKUP_DIR="/etc/ufw/backup"
mkdir -p ${BACKUP_DIR}
BACKUP_FILE="${BACKUP_DIR}/ufw-backup-$(date +%Y%m%d-%H%M%S).rules"

if ufw status | grep -q "Status: active"; then
    ufw status numbered > "${BACKUP_FILE}" 2>/dev/null || true
    echo "  Backup saved to: ${BACKUP_FILE}"
else
    echo "  UFW not active, no backup needed"
fi

# ===============================================
# ENSURE SSH IS ALLOWED (CRITICAL!)
# ===============================================
echo -e "\n${YELLOW}[2/5] Ensuring SSH access (port ${SSH_PORT})...${NC}"
ufw allow ${SSH_PORT}/tcp comment 'SSH Access'
echo -e "  ${GREEN}✓ SSH port ${SSH_PORT} allowed${NC}"

# ===============================================
# CONFIGURE MINIO RULES
# ===============================================
echo -e "\n${YELLOW}[3/5] Configuring MinIO firewall rules...${NC}"

if [ -z "${ALLOWED_NETWORKS}" ]; then
    # Allow from anywhere
    echo "  Adding rules for MinIO API (port ${MINIO_API_PORT}) - any source..."
    ufw allow ${MINIO_API_PORT}/tcp comment 'MinIO S3 API'
    
    echo "  Adding rules for MinIO Console (port ${MINIO_CONSOLE_PORT}) - any source..."
    ufw allow ${MINIO_CONSOLE_PORT}/tcp comment 'MinIO Web Console'
else
    # Allow from specific networks
    IFS=',' read -ra NETWORKS <<< "${ALLOWED_NETWORKS}"
    for network in "${NETWORKS[@]}"; do
        network=$(echo "$network" | xargs)  # Trim whitespace
        
        echo "  Adding rules for network: ${network}..."
        ufw allow from ${network} to any port ${MINIO_API_PORT} proto tcp comment "MinIO API - ${network}"
        ufw allow from ${network} to any port ${MINIO_CONSOLE_PORT} proto tcp comment "MinIO Console - ${network}"
    done
fi

echo -e "  ${GREEN}✓ MinIO rules added${NC}"

# ===============================================
# ENABLE UFW
# ===============================================
echo -e "\n${YELLOW}[4/5] Enabling UFW...${NC}"

# Check if already active
if ufw status | grep -q "Status: active"; then
    echo "  UFW already active, reloading..."
    ufw reload
else
    echo "  Enabling UFW..."
    echo "y" | ufw enable
fi

echo -e "  ${GREEN}✓ UFW enabled${NC}"

# ===============================================
# VERIFY CONFIGURATION
# ===============================================
echo -e "\n${YELLOW}[5/5] Verifying configuration...${NC}"
echo ""
echo "Current UFW Status:"
echo "-------------------"
ufw status verbose | head -20

echo ""
echo "MinIO-related rules:"
echo "--------------------"
ufw status | grep -E "900[01]" || echo "  (No MinIO rules found - check above)"

# ===============================================
# TEST CONNECTIVITY
# ===============================================
echo ""
echo -e "${YELLOW}Testing local connectivity...${NC}"

# Test MinIO API port
if nc -z localhost ${MINIO_API_PORT} 2>/dev/null; then
    echo -e "  ${GREEN}✓ Port ${MINIO_API_PORT} (MinIO API) is responding${NC}"
else
    echo -e "  ${RED}✗ Port ${MINIO_API_PORT} (MinIO API) is not responding${NC}"
    echo "    Make sure MinIO is running: docker compose ps"
fi

# Test MinIO Console port
if nc -z localhost ${MINIO_CONSOLE_PORT} 2>/dev/null; then
    echo -e "  ${GREEN}✓ Port ${MINIO_CONSOLE_PORT} (MinIO Console) is responding${NC}"
else
    echo -e "  ${RED}✗ Port ${MINIO_CONSOLE_PORT} (MinIO Console) is not responding${NC}"
    echo "    Make sure MinIO is running: docker compose ps"
fi

# ===============================================
# SUMMARY
# ===============================================
echo ""
echo -e "${GREEN}=============================================="
echo "   Configuration Complete!"
echo -e "==============================================${NC}"
echo ""
echo "Access MinIO:"
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "  API:     http://${SERVER_IP}:${MINIO_API_PORT}"
echo "  Console: http://${SERVER_IP}:${MINIO_CONSOLE_PORT}"
echo ""
echo "To check firewall status anytime:"
echo "  sudo ufw status verbose"
echo ""
echo "To view firewall logs:"
echo "  sudo tail -f /var/log/ufw.log"
echo ""
```

**Troubleshooting firewall issues:**

```bash
# ===============================================
# TROUBLESHOOTING FIREWALL
# ===============================================

# 1. Kiểm tra UFW có đang block không
# Tạm thời disable để test:
sudo ufw disable

# Test kết nối
curl -v http://localhost:9000/minio/health/live

# Nếu hoạt động khi firewall tắt → Vấn đề là firewall rules
# Bật lại và kiểm tra rules:
sudo ufw enable
sudo ufw status verbose


# 2. Xem logs để biết traffic bị block
sudo tail -f /var/log/ufw.log

# Filter chỉ xem traffic đến port 9000
sudo tail -f /var/log/ufw.log | grep "DPT=9000"

# Log format giải thích:
# [UFW BLOCK] IN=eth0 ... SRC=192.168.1.50 DST=192.168.1.100 ... DPT=9000
# → Traffic từ 192.168.1.50 đến port 9000 bị BLOCK


# 3. Debug với iptables trực tiếp
# Xem rules iptables (UFW tạo ra)
sudo iptables -L -n -v

# Xem rules cho port 9000 cụ thể
sudo iptables -L -n -v | grep 9000

# Xem chain ufw-user-input (nơi UFW rules được apply)
sudo iptables -L ufw-user-input -n -v


# 4. Reset UFW nếu cần (XÓA TẤT CẢ RULES!)
# CẢNH BÁO: Sẽ mất tất cả rules đã cấu hình
sudo ufw reset

# Sau đó cấu hình lại từ đầu
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
# ... thêm các rules khác


# 5. Kiểm tra từ máy khác
# Từ client machine, test kết nối:
nc -zv <server-ip> 9000
telnet <server-ip> 9000
curl -v http://<server-ip>:9000/minio/health/live
```

// ...existing code...

---

#### 1.6.5 Cấu hình port binding cho Docker container

**Hiểu về Docker Port Binding:**

Docker containers mặc định chạy trong một network namespace riêng biệt, nghĩa là các ports bên trong container không tự động accessible từ bên ngoài. Port binding là cơ chế để "publish" ports từ container ra host.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              DOCKER PORT BINDING - KHÁI NIỆM CƠ BẢN                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  KHÔNG CÓ PORT BINDING:                                                    │
│  ─────────────────────────                                                  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                           HOST MACHINE                               │  │
│  │                                                                      │  │
│  │    Client request → localhost:9000 → ??? (không có gì lắng nghe)    │  │
│  │                                         → ERR_CONNECTION_REFUSED     │  │
│  │                                                                      │  │
│  │    ┌────────────────────────────────────────────────────────────┐   │  │
│  │    │              DOCKER CONTAINER (isolated network)           │   │  │
│  │    │                                                            │   │  │
│  │    │    ┌─────────────────┐                                     │   │  │
│  │    │    │     MinIO       │ ← Lắng nghe 0.0.0.0:9000            │   │  │
│  │    │    │   (port 9000)   │   nhưng CHỈ trong container network │   │  │
│  │    │    └─────────────────┘                                     │   │  │
│  │    │                                                            │   │  │
│  │    │    Container IP: 172.17.0.2:9000 (internal)               │   │  │
│  │    └────────────────────────────────────────────────────────────┘   │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│                                                                             │
│  CÓ PORT BINDING (-p 9000:9000):                                           │
│  ─────────────────────────────────                                          │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                           HOST MACHINE                               │  │
│  │                                                                      │  │
│  │    Client request → localhost:9000                                   │  │
│  │                          │                                           │  │
│  │                          ▼                                           │  │
│  │    ┌─────────────────────────────────────────────┐                  │  │
│  │    │         DOCKER PROXY (docker-proxy)         │                  │  │
│  │    │         Lắng nghe trên HOST:9000            │                  │  │
│  │    └─────────────────────┬───────────────────────┘                  │  │
│  │                          │ Forward traffic                          │  │
│  │                          ▼                                           │  │
│  │    ┌────────────────────────────────────────────────────────────┐   │  │
│  │    │              DOCKER CONTAINER                              │   │  │
│  │    │                                                            │   │  │
│  │    │    ┌─────────────────┐                                     │   │  │
│  │    │    │     MinIO       │ ← Nhận traffic được forward         │   │  │
│  │    │    │   (port 9000)   │                                     │   │  │
│  │    │    └─────────────────┘                                     │   │  │
│  │    └────────────────────────────────────────────────────────────┘   │  │
│  │                                                                      │  │
│  │    → Request thành công!                                            │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Các kiểu port binding trong Docker:**

```yaml
# filepath: docker-compose.yml - Port Binding Syntax Examples

version: '3.8'

services:
  minio:
    image: minio/minio:latest
    
    # ===============================================
    # CÁC KIỂU PORT BINDING
    # ===============================================
    # Syntax: "HOST_PORT:CONTAINER_PORT"
    # Hoặc:   "HOST_IP:HOST_PORT:CONTAINER_PORT"
    # Hoặc:   "CONTAINER_PORT" (Docker chọn host port ngẫu nhiên)
    
    ports:
      # ─────────────────────────────────────────────────────────
      # KIỂU 1: Bind tất cả interfaces (0.0.0.0) - THÔNG DỤNG NHẤT
      # ─────────────────────────────────────────────────────────
      # Format: "HOST_PORT:CONTAINER_PORT"
      - "9000:9000"   # MinIO API
      - "9001:9001"   # MinIO Console
      
      # Kết quả: 
      # - Lắng nghe trên 0.0.0.0:9000 và 0.0.0.0:9001
      # - Accessible từ: localhost, LAN IP, public IP (nếu có)
      
      
      # ─────────────────────────────────────────────────────────
      # KIỂU 2: Chỉ bind localhost (127.0.0.1) - BẢO MẬT HƠN
      # ─────────────────────────────────────────────────────────
      # Format: "127.0.0.1:HOST_PORT:CONTAINER_PORT"
      # - "127.0.0.1:9000:9000"
      # - "127.0.0.1:9001:9001"
      
      # Kết quả:
      # - Chỉ accessible từ localhost (máy host)
      # - KHÔNG accessible từ máy khác trong mạng
      # - Thường dùng khi có reverse proxy (Nginx) phía trước
      
      
      # ─────────────────────────────────────────────────────────
      # KIỂU 3: Bind vào IP cụ thể của host
      # ─────────────────────────────────────────────────────────
      # Format: "HOST_IP:HOST_PORT:CONTAINER_PORT"
      # - "192.168.1.100:9000:9000"
      
      # Kết quả:
      # - Chỉ accessible qua IP 192.168.1.100:9000
      # - Không accessible qua localhost hay IP khác
      # - Hữu ích khi server có nhiều network interfaces
      
      
      # ─────────────────────────────────────────────────────────
      # KIỂU 4: Host port KHÁC container port
      # ─────────────────────────────────────────────────────────
      # Format: "DIFFERENT_HOST_PORT:CONTAINER_PORT"
      # - "8080:9000"   # Access qua host:8080 → container:9000
      # - "8081:9001"   # Access qua host:8081 → container:9001
      
      # Kết quả:
      # - MinIO API accessible qua port 8080 (không phải 9000)
      # - Hữu ích khi port 9000 đã bị chiếm bởi service khác
      
      
      # ─────────────────────────────────────────────────────────
      # KIỂU 5: Để Docker chọn host port ngẫu nhiên
      # ─────────────────────────────────────────────────────────
      # Format: "CONTAINER_PORT" (không có host port)
      # - "9000"
      
      # Kết quả:
      # - Docker chọn một port cao ngẫu nhiên (ví dụ: 49153)
      # - Kiểm tra bằng: docker port minio 9000
      # - Ít dùng trong production, chủ yếu cho testing
      
      
      # ─────────────────────────────────────────────────────────
      # KIỂU 6: Range of ports
      # ─────────────────────────────────────────────────────────
      # - "9000-9010:9000-9010"
      
      # Kết quả:
      # - Map nguyên một dải ports
      # - Ports được map 1:1 (9000→9000, 9001→9001, ..., 9010→9010)
```

**So sánh chi tiết các kiểu binding:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              SO SÁNH CÁC KIỂU PORT BINDING                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Syntax                      │ Lắng nghe tại     │ Use Case                │
│  ────────────────────────────┼───────────────────┼─────────────────────────│
│  "9000:9000"                 │ 0.0.0.0:9000      │ Development, Simple     │
│                              │                   │ production              │
│  ────────────────────────────┼───────────────────┼─────────────────────────│
│  "127.0.0.1:9000:9000"       │ 127.0.0.1:9000    │ Behind reverse proxy    │
│                              │                   │ (Nginx, Traefik)        │
│  ────────────────────────────┼───────────────────┼─────────────────────────│
│  "192.168.1.100:9000:9000"   │ 192.168.1.100:9000│ Multi-NIC server,       │
│                              │                   │ specific interface      │
│  ────────────────────────────┼───────────────────┼─────────────────────────│
│  "8080:9000"                 │ 0.0.0.0:8080      │ Port conflict,          │
│                              │                   │ custom port             │
│  ────────────────────────────┼───────────────────┼─────────────────────────│
│  "9000"                      │ 0.0.0.0:random    │ Testing, CI/CD          │
│                              │                   │                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Docker Compose cấu hình đầy đủ cho MinIO:**

```yaml
# filepath: docker-compose.yml
# Cấu hình MinIO với port binding đầy đủ và giải thích

version: '3.8'

services:
  minio:
    image: minio/minio:latest
    container_name: minio
    hostname: minio
    
    # ===============================================
    # PORT BINDING CONFIGURATION
    # ===============================================
    ports:
      # MinIO S3 API - Port chính để upload/download files
      # Accessible từ tất cả interfaces
      - "9000:9000"
      
      # MinIO Console - Web UI để quản lý
      # Accessible từ tất cả interfaces
      - "9001:9001"
    
    # ===============================================
    # ENVIRONMENT VARIABLES
    # ===============================================
    environment:
      # Credentials
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-minioadmin}
      
      # Console redirect URL (quan trọng khi dùng reverse proxy)
      MINIO_BROWSER_REDIRECT_URL: ${MINIO_BROWSER_REDIRECT_URL:-http://localhost:9001}
    
    # ===============================================
    # COMMAND - QUAN TRỌNG CHO PORT BINDING
    # ===============================================
    # MinIO phải bind vào 0.0.0.0 (tất cả interfaces)
    # để nhận traffic được forward từ Docker
    command: >
      server /data 
      --address ":9000"
      --console-address ":9001"
    
    # Giải thích command:
    # - server /data: Chạy MinIO server với data directory là /data
    # - --address ":9000": Bind API vào 0.0.0.0:9000
    # - --console-address ":9001": Bind Console vào 0.0.0.0:9001
    #
    # LƯU Ý: ":9000" = "0.0.0.0:9000" (bind tất cả interfaces)
    #        Nếu dùng "127.0.0.1:9000" → CHỈ bind localhost trong container
    #        → Port binding từ Docker SẼ KHÔNG HOẠT ĐỘNG!
    
    # ===============================================
    # VOLUMES
    # ===============================================
    volumes:
      - minio-data:/data
    
    # ===============================================
    # HEALTH CHECK
    # ===============================================
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    
    # ===============================================
    # RESTART POLICY
    # ===============================================
    restart: unless-stopped
    
    # ===============================================
    # NETWORK (optional - mặc định dùng default bridge)
    # ===============================================
    networks:
      - minio-network

# ===============================================
# VOLUMES
# ===============================================
volumes:
  minio-data:
    driver: local

# ===============================================
# NETWORKS
# ===============================================
networks:
  minio-network:
    driver: bridge
```

**Cấu hình cho Production với localhost binding + Nginx:**

```yaml
# filepath: docker-compose-production.yml
# Production setup: MinIO bind localhost, Nginx expose ra ngoài

version: '3.8'

services:
  minio:
    image: minio/minio:latest
    container_name: minio
    
    # ===============================================
    # BIND CHỈ LOCALHOST - AN TOÀN HƠN
    # ===============================================
    # Nginx sẽ proxy traffic đến MinIO
    ports:
      - "127.0.0.1:9000:9000"   # API - chỉ localhost access
      - "127.0.0.1:9001:9001"   # Console - chỉ localhost access
    
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
      # URL cho console khi đằng sau proxy
      MINIO_BROWSER_REDIRECT_URL: https://console.minio.example.com
    
    command: server /data --address ":9000" --console-address ":9001"
    
    volumes:
      - minio-data:/data
    
    networks:
      - internal
    
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: minio-nginx
    
    # ===============================================
    # NGINX EXPOSE RA NGOÀI
    # ===============================================
    ports:
      - "80:80"      # HTTP
      - "443:443"    # HTTPS
    
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    
    depends_on:
      - minio
    
    networks:
      - internal
    
    restart: unless-stopped

volumes:
  minio-data:

networks:
  internal:
    driver: bridge
```

**Kiểm tra port binding:**

```bash
# ===============================================
# KIỂM TRA PORT BINDING SAU KHI START CONTAINER
# ===============================================

# Xem các ports được publish của container
docker port minio

# Output mẫu (bind tất cả interfaces):
# 9000/tcp -> 0.0.0.0:9000
# 9001/tcp -> 0.0.0.0:9001

# Output mẫu (bind localhost only):
# 9000/tcp -> 127.0.0.1:9000
# 9001/tcp -> 127.0.0.1:9001


# Với docker compose:
docker compose port minio 9000
# Output: 0.0.0.0:9000


# ===============================================
# KIỂM TRA AI ĐANG LẮNG NGHE PORT TRÊN HOST
# ===============================================

# Linux - Xem port 9000
sudo ss -tlnp | grep 9000

# Output:
# LISTEN  0  4096  0.0.0.0:9000  0.0.0.0:*  users:(("docker-proxy",pid=12345,fd=4))
#         │   │      │              │           │
#         │   │      │              │           └── Process đang lắng nghe
#         │   │      │              └── Accept từ bất kỳ IP nào
#         │   │      └── Bind address: 0.0.0.0
#         │   └── Backlog queue
#         └── Connection state: LISTEN

# Hoặc dùng netstat:
sudo netstat -tlnp | grep 9000

# Hoặc dùng lsof:
sudo lsof -i :9000


# ===============================================
# KIỂM TRA CHI TIẾT CONTAINER NETWORK
# ===============================================

# Xem network settings của container
docker inspect minio --format='{{json .NetworkSettings.Ports}}' | jq

# Output:
# {
#   "9000/tcp": [
#     {
#       "HostIp": "0.0.0.0",
#       "HostPort": "9000"
#     }
#   ],
#   "9001/tcp": [
#     {
#       "HostIp": "0.0.0.0",
#       "HostPort": "9001"
#     }
#   ]
# }


# Xem IP address của container trong Docker network
docker inspect minio --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
# Output: 172.17.0.2 (hoặc tương tự)


# ===============================================
# TEST CONNECTIVITY
# ===============================================

# Test từ localhost
curl -I http://localhost:9000/minio/health/live
curl -I http://127.0.0.1:9000/minio/health/live

# Test từ LAN IP (thay bằng IP thực của bạn)
curl -I http://192.168.1.100:9000/minio/health/live

# Test từ bên trong container
docker exec minio curl -s http://localhost:9000/minio/health/live

# Output thành công:
# HTTP/1.1 200 OK
# Content-Length: 0
# ...
```

**Xử lý Port Conflict:**

```bash
# ===============================================
# XỬ LÝ KHI PORT ĐÃ BỊ CHIẾM
# ===============================================

# Lỗi khi start container:
# Error response from daemon: driver failed programming external connectivity:
# Bind for 0.0.0.0:9000 failed: port is already allocated

# Bước 1: Tìm process đang dùng port 9000
sudo lsof -i :9000
# Hoặc:
sudo ss -tlnp | grep 9000
# Hoặc:
sudo fuser -v 9000/tcp

# Output mẫu:
# COMMAND     PID USER   FD   TYPE  DEVICE SIZE/OFF NODE NAME
# java      12345 user   50u  IPv4  123456      0t0  TCP *:9000 (LISTEN)


# Bước 2: Quyết định action

# Option A: Kill process đang chiếm port (nếu không cần)
sudo kill -9 12345  # Thay 12345 bằng PID thực tế
# Hoặc:
sudo fuser -k 9000/tcp


# Option B: Đổi MinIO sang port khác
# Trong docker-compose.yml:
```

```yaml
# filepath: docker-compose.yml (đổi port)
services:
  minio:
    ports:
      - "9002:9000"   # MinIO API trên host port 9002
      - "9003:9001"   # MinIO Console trên host port 9003
```

```bash
# Option C: Stop service/container cũ đang dùng port
docker stop <old-container-name>
# Hoặc:
sudo systemctl stop <old-service-name>


# ===============================================
# SCRIPT KIỂM TRA PORT AVAILABILITY
# ===============================================
```

```bash
#!/bin/bash
# filepath: scripts/check-ports.sh

PORTS_TO_CHECK=(9000 9001)

echo "=============================================="
echo "   Port Availability Check"
echo "=============================================="
echo ""

ALL_AVAILABLE=true

for port in "${PORTS_TO_CHECK[@]}"; do
    echo -n "Port ${port}: "
    
    if ss -tln | grep -q ":${port} "; then
        echo "✗ IN USE"
        ALL_AVAILABLE=false
        
        # Tìm process đang dùng port
        PROCESS_INFO=$(sudo lsof -i :${port} 2>/dev/null | grep LISTEN | head -1)
        if [ -n "$PROCESS_INFO" ]; then
            PROCESS_NAME=$(echo "$PROCESS_INFO" | awk '{print $1}')
            PROCESS_PID=$(echo "$PROCESS_INFO" | awk '{print $2}')
            echo "         └── Used by: ${PROCESS_NAME} (PID: ${PROCESS_PID})"
        fi
    else
        echo "✓ Available"
    fi
done

echo ""
if [ "$ALL_AVAILABLE" = true ]; then
    echo "All ports are available. Safe to start MinIO."
else
    echo "Some ports are in use. Please resolve conflicts before starting MinIO."
    exit 1
fi
```

---

#### 1.6.6 Cấu hình reverse proxy với Nginx cho MinIO

**Tại sao cần Reverse Proxy?**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              TẠI SAO CẦN REVERSE PROXY CHO MINIO?                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. SSL/TLS TERMINATION                                                    │
│  ─────────────────────────                                                  │
│     • Nginx xử lý HTTPS, MinIO chạy HTTP (đơn giản hơn)                   │
│     • Dễ quản lý SSL certificates ở một nơi                               │
│     • Automatic certificate renewal với Let's Encrypt                     │
│                                                                             │
│  2. LOAD BALANCING                                                         │
│  ───────────────────                                                        │
│     • Phân tải traffic đến nhiều MinIO servers                            │
│     • Health checks và automatic failover                                  │
│     • Session persistence nếu cần                                         │
│                                                                             │
│  3. CACHING                                                                │
│  ───────────                                                                │
│     • Cache static content và frequent requests                           │
│     • Giảm tải cho MinIO server                                           │
│                                                                             │
│  4. SECURITY                                                               │
│  ──────────                                                                 │
│     • Rate limiting để chống DDoS                                         │
│     • IP whitelisting/blacklisting                                         │
│     • Web Application Firewall (WAF) rules                                │
│     • Hide MinIO version và internal details                              │
│                                                                             │
│  5. URL ROUTING                                                            │
│  ──────────────                                                             │
│     • Multiple domains/subdomains cho API và Console                      │
│     • Path-based routing                                                   │
│     • URL rewriting                                                        │
│                                                                             │
│  6. REQUEST/RESPONSE MODIFICATION                                          │
│  ─────────────────────────────────                                          │
│     • Thêm/sửa headers (CORS, Security headers)                           │
│     • Compression (gzip, brotli)                                          │
│     • Request body size limits                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Kiến trúc với Reverse Proxy:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              KIẾN TRÚC MINIO VỚI NGINX REVERSE PROXY                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  KHÔNG CÓ REVERSE PROXY:                                                   │
│  ─────────────────────────                                                  │
│                                                                             │
│    Client                                                                   │
│      │                                                                      │
│      │ http://minio.example.com:9000                                       │
│      │ (Port 9000 exposed directly)                                        │
│      │                                                                      │
│      ▼                                                                      │
│  ┌─────────┐                                                               │
│  │  MinIO  │ ← Phải tự handle SSL, không có rate limit, ...               │
│  │ :9000   │                                                               │
│  └─────────┘                                                               │
│                                                                             │
│                                                                             │
│  CÓ REVERSE PROXY:                                                         │
│  ──────────────────                                                         │
│                                                                             │
│    Client                                                                   │
│      │                                                                      │
│      │ https://minio.example.com (port 443)                                │
│      │ https://console.minio.example.com (port 443)                        │
│      │                                                                      │
│      ▼                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                         NGINX REVERSE PROXY                           │ │
│  │                                                                       │ │
│  │  • SSL Termination (HTTPS → HTTP)                                    │ │
│  │  • Rate Limiting                                                     │ │
│  │  • Access Logging                                                    │ │
│  │  • Header Modification                                               │ │
│  │  • Load Balancing (nếu có nhiều MinIO nodes)                        │ │
│  │                                                                       │ │
│  │  Routing:                                                            │ │
│  │  • minio.example.com → MinIO API (:9000)                            │ │
│  │  • console.minio.example.com → MinIO Console (:9001)                │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│      │                              │                                       │
│      │ http://minio:9000           │ http://minio:9001                     │
│      │ (internal network)           │ (internal network)                    │
│      ▼                              ▼                                       │
│  ┌─────────────┐            ┌─────────────┐                                │
│  │ MinIO API   │            │MinIO Console│                                │
│  │   :9000     │            │   :9001     │                                │
│  └─────────────┘            └─────────────┘                                │
│                                                                             │
│  MinIO chỉ bind localhost:9000/9001 → không accessible từ bên ngoài       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Cấu hình Nginx cơ bản cho MinIO:**

```nginx
# filepath: /etc/nginx/conf.d/minio.conf
# Cấu hình Nginx reverse proxy cơ bản cho MinIO

# ===============================================
# UPSTREAM DEFINITIONS
# ===============================================
# Định nghĩa backend servers

# MinIO API backend
upstream minio_api {
    server 127.0.0.1:9000;
    
    # Nếu có nhiều MinIO servers (distributed mode):
    # server minio1:9000;
    # server minio2:9000;
    # server minio3:9000;
    # server minio4:9000;
    
    # Connection pooling - giữ connections để reuse
    keepalive 32;
}

# MinIO Console backend
upstream minio_console {
    server 127.0.0.1:9001;
    keepalive 32;
}


# ===============================================
# MINIO API SERVER BLOCK (S3 API)
# ===============================================
server {
    listen 80;
    listen [::]:80;
    server_name minio.example.com s3.example.com;

    # Redirect HTTP → HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name minio.example.com s3.example.com;

    # ─────────────────────────────────────────────
    # SSL CONFIGURATION
    # ─────────────────────────────────────────────
    ssl_certificate /etc/nginx/ssl/minio.example.com.crt;
    ssl_certificate_key /etc/nginx/ssl/minio.example.com.key;
    
    # SSL settings (modern configuration)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # ─────────────────────────────────────────────
    # QUAN TRỌNG CHO MINIO
    # ─────────────────────────────────────────────
    
    # Không giới hạn body size (cho file upload lớn)
    client_max_body_size 0;
    
    # Tắt buffering (quan trọng cho streaming uploads)
    proxy_buffering off;
    proxy_request_buffering off;
    
    # Cho phép chunked transfer encoding
    chunked_transfer_encoding on;

    # ─────────────────────────────────────────────
    # PROXY CONFIGURATION
    # ─────────────────────────────────────────────
    location / {
        proxy_pass http://minio_api;
        
        # Headers quan trọng
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-NginX-Proxy true;
        
        # Connection settings
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        
        # Timeouts (tăng cho file lớn)
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
        send_timeout 300;
    }

    # ─────────────────────────────────────────────
    # LOGGING
    # ─────────────────────────────────────────────
    access_log /var/log/nginx/minio-api-access.log;
    error_log /var/log/nginx/minio-api-error.log;
}


# ===============================================
# MINIO CONSOLE SERVER BLOCK (Web UI)
# ===============================================
server {
    listen 80;
    listen [::]:80;
    server_name console.minio.example.com;
    
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name console.minio.example.com;

    # SSL Configuration (same as API)
    ssl_certificate /etc/nginx/ssl/minio.example.com.crt;
    ssl_certificate_key /etc/nginx/ssl/minio.example.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Body size cho console (ít quan trọng hơn API)
    client_max_body_size 100M;

    # ─────────────────────────────────────────────
    # WEBSOCKET SUPPORT (quan trọng cho Console)
    # ─────────────────────────────────────────────
    location / {
        proxy_pass http://minio_console;
        
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-NginX-Proxy true;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
    }

    access_log /var/log/nginx/minio-console-access.log;
    error_log /var/log/nginx/minio-console-error.log;
}
```

**Cấu hình Nginx nâng cao với Rate Limiting và Security:**

```nginx
# filepath: /etc/nginx/conf.d/minio-advanced.conf
# Cấu hình Nginx nâng cao với security features

# ===============================================
# RATE LIMITING ZONES
# ===============================================
# Định nghĩa rate limit zones (đặt trong http block hoặc conf.d)

# Limit requests per IP
limit_req_zone $binary_remote_addr zone=minio_api_limit:10m rate=100r/s;
limit_req_zone $binary_remote_addr zone=minio_upload_limit:10m rate=10r/s;

# Limit concurrent connections per IP
limit_conn_zone $binary_remote_addr zone=minio_conn_limit:10m;


# ===============================================
# UPSTREAM WITH HEALTH CHECKS
# ===============================================
upstream minio_api {
    # Load balancing method
    least_conn;  # Gửi đến server có ít connections nhất
    
    # Backend servers
    server 127.0.0.1:9000 max_fails=3 fail_timeout=30s;
    # server minio2:9000 max_fails=3 fail_timeout=30s;  # Nếu có nhiều nodes
    
    # Connection pooling
    keepalive 64;
    keepalive_requests 1000;
    keepalive_timeout 60s;
}


# ===============================================
# MINIO API WITH SECURITY
# ===============================================
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name minio.example.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # ─────────────────────────────────────────────
    # SECURITY HEADERS
    # ─────────────────────────────────────────────
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # HSTS (uncomment sau khi test kỹ)
    # add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Hide Nginx version
    server_tokens off;

    # ─────────────────────────────────────────────
    # MINIO SPECIFIC SETTINGS
    # ─────────────────────────────────────────────
    client_max_body_size 0;
    proxy_buffering off;
    proxy_request_buffering off;
    chunked_transfer_encoding on;

    # ─────────────────────────────────────────────
    # MAIN LOCATION WITH RATE LIMITING
    # ─────────────────────────────────────────────
    location / {
        # Rate limiting
        limit_req zone=minio_api_limit burst=200 nodelay;
        limit_conn minio_conn_limit 100;
        
        proxy_pass http://minio_api;
        
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
    }

    # ─────────────────────────────────────────────
    # UPLOAD LOCATION (STRICTER RATE LIMIT)
    # ─────────────────────────────────────────────
    # Match PUT requests to any bucket
    location ~* ^/[^/]+/.+ {
        # Stricter rate limit for uploads
        limit_req zone=minio_upload_limit burst=20 nodelay;
        limit_conn minio_conn_limit 50;
        
        proxy_pass http://minio_api;
        
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        
        # Longer timeouts for uploads
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
    }

    # ─────────────────────────────────────────────
    # HEALTH CHECK ENDPOINT (NO RATE LIMIT)
    # ─────────────────────────────────────────────
    location /minio/health/ {
        proxy_pass http://minio_api;
        proxy_set_header Host $http_host;
        
        # Không rate limit health checks
        limit_req off;
        limit_conn off;
    }

    # ─────────────────────────────────────────────
    # DENY ACCESS TO SENSITIVE PATHS
    # ─────────────────────────────────────────────
    location ~* /\.minio\.sys {
        deny all;
        return 404;
    }

    # ─────────────────────────────────────────────
    # LOGGING
    # ─────────────────────────────────────────────
    access_log /var/log/nginx/minio-access.log combined buffer=512k flush=1m;
    error_log /var/log/nginx/minio-error.log warn;
}
```

**Docker Compose với Nginx và MinIO:**

```yaml
# filepath: docker-compose-with-nginx.yml
# Complete setup: MinIO + Nginx + Let's Encrypt

version: '3.8'

services:
  # ===============================================
  # MINIO - BIND LOCALHOST ONLY
  # ===============================================
  minio:
    image: minio/minio:latest
    container_name: minio
    
    # Chỉ expose trong internal network
    # KHÔNG publish ra host (Nginx sẽ proxy)
    expose:
      - "9000"
      - "9001"
    
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
      # URL cho console redirect (qua Nginx)
      MINIO_BROWSER_REDIRECT_URL: https://console.minio.example.com
      MINIO_SERVER_URL: https://minio.example.com
    
    command: server /data --address ":9000" --console-address ":9001"
    
    volumes:
      - minio-data:/data
    
    networks:
      - internal
    
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3
    
    restart: unless-stopped

  # ===============================================
  # NGINX REVERSE PROXY
  # ===============================================
  nginx:
    image: nginx:alpine
    container_name: nginx
    
    ports:
      - "80:80"
      - "443:443"
    
    volumes:
      # Nginx config
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      
      # SSL certificates
      - ./nginx/ssl:/etc/nginx/ssl:ro
      
      # Logs
      - ./nginx/logs:/var/log/nginx
    
    depends_on:
      minio:
        condition: service_healthy
    
    networks:
      - internal
    
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 30s
      timeout: 10s
      retries: 3
    
    restart: unless-stopped

  # ===============================================
  # CERTBOT (Let's Encrypt) - Optional
  # ===============================================
  certbot:
    image: certbot/certbot:latest
    container_name: certbot
    
    volumes:
      - ./nginx/ssl:/etc/letsencrypt
      - ./nginx/certbot-www:/var/www/certbot
    
    # Chạy renewal định kỳ
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
    
    depends_on:
      - nginx

volumes:
  minio-data:

networks:
  internal:
    driver: bridge
```

**Nginx config file chính:**

```nginx
# filepath: nginx/nginx.conf

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging format
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';

    access_log /var/log/nginx/access.log main buffer=512k flush=1m;

    # Performance optimizations
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript 
               application/xml+rss application/atom+xml image/svg+xml;

    # Hide Nginx version
    server_tokens off;

    # Rate limiting zones
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

    # Include server configs
    include /etc/nginx/conf.d/*.conf;
}
```

**Script tự động cấu hình Nginx:**

```bash
#!/bin/bash
# filepath: scripts/setup-nginx-proxy.sh

set -e

# Configuration
DOMAIN=${1:-"minio.example.com"}
CONSOLE_DOMAIN=${2:-"console.${DOMAIN}"}
MINIO_HOST=${3:-"127.0.0.1"}
MINIO_API_PORT=${4:-9000}
MINIO_CONSOLE_PORT=${5:-9001}

echo "=============================================="
echo "   Nginx Reverse Proxy Setup for MinIO"
echo "=============================================="
echo ""
echo "Configuration:"
echo "  API Domain: ${DOMAIN}"
echo "  Console Domain: ${CONSOLE_DOMAIN}"
echo "  MinIO Host: ${MINIO_HOST}"
echo "  MinIO API Port: ${MINIO_API_PORT}"
echo "  MinIO Console Port: ${MINIO_CONSOLE_PORT}"
echo ""

# Create directories
mkdir -p /etc/nginx/conf.d
mkdir -p /etc/nginx/ssl

# Generate Nginx config
cat > /etc/nginx/conf.d/minio.conf << EOF
# MinIO API
upstream minio_api {
    server ${MINIO_HOST}:${MINIO_API_PORT};
    keepalive 32;
}

# MinIO Console
upstream minio_console {
    server ${MINIO_HOST}:${MINIO_CONSOLE_PORT};
    keepalive 32;
}

# API Server
server {
    listen 80;
    server_name ${DOMAIN};

    client_max_body_size 0;
    proxy_buffering off;
    proxy_request_buffering off;

    location / {
        proxy_pass http://minio_api;
        proxy_set_header Host \$http_host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
    }
}

# Console Server
server {
    listen 80;
    server_name ${CONSOLE_DOMAIN};

    location / {
        proxy_pass http://minio_console;
        proxy_set_header Host \$http_host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
    }
}
EOF

# Test Nginx config
nginx -t

# Reload Nginx
nginx -s reload || systemctl reload nginx

echo ""
echo "=============================================="
echo "   Setup Complete!"
echo "=============================================="
echo ""
echo "Access MinIO:"
echo "  API: http://${DOMAIN}"
echo "  Console: http://${CONSOLE_DOMAIN}"
echo ""
echo "Next steps:"
echo "  1. Configure DNS to point ${DOMAIN} and ${CONSOLE_DOMAIN} to this server"
echo "  2. Set up SSL with: certbot --nginx -d ${DOMAIN} -d ${CONSOLE_DOMAIN}"
echo ""
```

---

#### 1.6.7 Xử lý lỗi timeout khi upload file lớn

**Hiểu về Timeout trong Upload Flow:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              CÁC LOẠI TIMEOUT TRONG UPLOAD FLOW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Upload flow qua nhiều components, mỗi component có timeout riêng:         │
│                                                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │ Browser │───►│  Nginx  │───►│ Backend │───►│ MinIO   │───►│  Disk   │  │
│  │         │    │         │    │ (Java)  │    │         │    │         │  │
│  └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘  │
│       │              │              │              │              │        │
│       ▼              ▼              ▼              ▼              ▼        │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │fetch()  │    │proxy_   │    │HttpClient│   │Connection│   │I/O      │  │
│  │timeout  │    │timeout  │    │timeout   │   │timeout   │   │timeout  │  │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
│                                                                             │
│                                                                             │
│  TIMELINE KHI UPLOAD FILE 1GB:                                             │
│  ─────────────────────────────                                              │
│                                                                             │
│  Time    Event                                                             │
│  ────    ─────────────────────────────────────────────────────────────────│
│  0s      Browser bắt đầu gửi request                                       │
│  5s      TCP connection established                                        │
│  10s     Request headers sent                                              │
│  30s     ─── DEFAULT NGINX proxy_read_timeout (60s) ───                   │
│  60s     ─── Nginx timeout nếu chưa nhận được response header             │
│          ─── ERR_CONNECTION_TIMED_OUT                                      │
│  ...     File vẫn đang upload...                                           │
│  300s    Upload complete (5 phút cho 1GB ở 28Mbps)                        │
│                                                                             │
│                                                                             │
│  VẤN ĐỀ:                                                                   │
│  ─────────                                                                  │
│  • Nginx timeout trước khi MinIO xử lý xong                               │
│  • Browser timeout trước khi server response                              │
│  • Backend timeout khi chờ MinIO                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Các loại timeout error thường gặp:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              CÁC LỖI TIMEOUT THƯỜNG GẶP                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. BROWSER TIMEOUT:                                                       │
│  ──────────────────                                                         │
│     • Error: "net::ERR_CONNECTION_TIMED_OUT"                               │
│     • Error: "The operation timed out"                                     │
│     • Nguyên nhân: Browser hoặc OS timeout (thường 2-5 phút)              │
│                                                                             │
│  2. NGINX PROXY TIMEOUT:                                                   │
│  ────────────────────────                                                   │
│     • Error: "504 Gateway Time-out"                                        │
│     • Error: "upstream timed out (110: Connection timed out)"             │
│     • Nguyên nhân: proxy_read_timeout, proxy_send_timeout quá ngắn        │
│                                                                             │
│  3. JAVA BACKEND TIMEOUT:                                                  │
│  ─────────────────────────                                                  │
│     • Error: "java.net.SocketTimeoutException: Read timed out"            │
│     • Error: "Connection reset by peer"                                    │
│     • Nguyên nhân: HttpClient timeout, MinIO client timeout               │
│                                                                             │
│  4. MINIO TIMEOUT:                                                         │
│  ─────────────────                                                          │
│     • Error: "RequestTimeTooSkewed"                                        │
│     • Error: "SlowDown - Please reduce your request rate"                 │
│     • Nguyên nhân: Server quá tải, disk I/O chậm                          │
│                                                                             │
│  5. TCP KEEPALIVE TIMEOUT:                                                 │
│  ──────────────────────────                                                 │
│     • Error: Connection đột ngột bị đóng                                  │
│     • Nguyên nhân: Intermediate firewall/load balancer đóng idle conn     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Cấu hình timeout cho Nginx:**

```nginx
# filepath: /etc/nginx/conf.d/minio-timeout.conf
# Cấu hình Nginx với timeout phù hợp cho file upload lớn

upstream minio_api {
    server 127.0.0.1:9000;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name minio.example.com;

    # SSL config...
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # ===============================================
    # CRITICAL: Không giới hạn body size
    # ===============================================
    # Cho phép upload file không giới hạn
    # Mặc định Nginx limit 1MB - quá nhỏ!
    client_max_body_size 0;
    
    # ===============================================
    # CRITICAL: Tắt buffering cho upload
    # ===============================================
    # Nếu bật buffering, Nginx sẽ đọc hết body vào buffer
    # trước khi forward đến MinIO → tốn RAM và gây timeout
    proxy_buffering off;
    proxy_request_buffering off;
    
    # ===============================================
    # TIMEOUT CONFIGURATIONS
    # ===============================================
    
    # Connection timeout
    # Thời gian chờ để establish connection đến backend
    # Không cần quá dài vì MinIO cùng server
    proxy_connect_timeout 60s;
    
    # Send timeout  
    # Thời gian chờ giữa 2 write operations đến backend
    # QUAN TRỌNG cho upload: phải đủ dài để xử lý slow clients
    proxy_send_timeout 3600s;  # 1 giờ
    
    # Read timeout
    # Thời gian chờ giữa 2 read operations từ backend
    # QUAN TRỌNG: MinIO cần thời gian để xử lý và response
    proxy_read_timeout 3600s;  # 1 giờ
    
    # Send timeout to client
    # Thời gian chờ giữa 2 write operations đến client
    send_timeout 3600s;  # 1 giờ
    
    # ===============================================
    # KEEPALIVE SETTINGS
    # ===============================================
    # Giữ connection alive để không bị intermediate 
    # devices (firewall, LB) đóng connection
    
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    
    # Client keepalive
    keepalive_timeout 3600s;
    keepalive_requests 1000;

    # ===============================================
    # PROXY CONFIGURATION
    # ===============================================
    location / {
        proxy_pass http://minio_api;
        
        # Forward headers
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Chunked transfer (quan trọng cho streaming upload)
        chunked_transfer_encoding on;
    }
}
```

**Cấu hình timeout cho MinIO Java SDK:**

```java
// filepath: src/main/java/com/example/minio/MinioConfig.java

import io.minio.MinioClient;
import okhttp3.OkHttpClient;
import java.util.concurrent.TimeUnit;

public class MinioConfig {
    
    /**
     * Tạo MinIO Client với timeout configuration phù hợp cho file lớn
     */
    public static MinioClient createClient(
            String endpoint,
            String accessKey,
            String secretKey
    ) {
        // ===============================================
        // CUSTOM HTTP CLIENT VỚI EXTENDED TIMEOUTS
        // ===============================================
        OkHttpClient httpClient = new OkHttpClient.Builder()
            // Connection timeout
            // Thời gian chờ để establish TCP connection
            .connectTimeout(60, TimeUnit.SECONDS)
            
            // Read timeout
            // Thời gian chờ khi đọc data từ server
            // QUAN TRỌNG cho download file lớn
            .readTimeout(3600, TimeUnit.SECONDS)  // 1 giờ
            
            // Write timeout
            // Thời gian chờ khi gửi data đến server
            // QUAN TRỌNG cho upload file lớn
            .writeTimeout(3600, TimeUnit.SECONDS)  // 1 giờ
            
            // Call timeout
            // Timeout cho toàn bộ HTTP call (từ request đến response)
            // Set 0 để disable (dùng read/// filepath: e:\DaiCuongBK\Project3\FileSharing\client\minio.md
// ...existing code...

---

#### 1.6.5 Cấu hình port binding cho Docker container

**Hiểu về Docker Port Binding:**

Docker containers mặc định chạy trong một network namespace riêng biệt, nghĩa là các ports bên trong container không tự động accessible từ bên ngoài. Port binding là cơ chế để "publish" ports từ container ra host.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              DOCKER PORT BINDING - KHÁI NIỆM CƠ BẢN                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  KHÔNG CÓ PORT BINDING:                                                    │
│  ─────────────────────────                                                  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                           HOST MACHINE                               │  │
│  │                                                                      │  │
│  │    Client request → localhost:9000 → ??? (không có gì lắng nghe)    │  │
│  │                                         → ERR_CONNECTION_REFUSED     │  │
│  │                                                                      │  │
│  │    ┌────────────────────────────────────────────────────────────┐   │  │
│  │    │              DOCKER CONTAINER (isolated network)           │   │  │
│  │    │                                                            │   │  │
│  │    │    ┌─────────────────┐                                     │   │  │
│  │    │    │     MinIO       │ ← Lắng nghe 0.0.0.0:9000            │   │  │
│  │    │    │   (port 9000)   │   nhưng CHỈ trong container network │   │  │
│  │    │    └─────────────────┘                                     │   │  │
│  │    │                                                            │   │  │
│  │    │    Container IP: 172.17.0.2:9000 (internal)               │   │  │
│  │    └────────────────────────────────────────────────────────────┘   │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│                                                                             │
│  CÓ PORT BINDING (-p 9000:9000):                                           │
│  ─────────────────────────────────                                          │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                           HOST MACHINE                               │  │
│  │                                                                      │  │
│  │    Client request → localhost:9000                                   │  │
│  │                          │                                           │  │
│  │                          ▼                                           │  │
│  │    ┌─────────────────────────────────────────────┐                  │  │
│  │    │         DOCKER PROXY (docker-proxy)         │                  │  │
│  │    │         Lắng nghe trên HOST:9000            │                  │  │
│  │    └─────────────────────┬───────────────────────┘                  │  │
│  │                          │ Forward traffic                          │  │
│  │                          ▼                                           │  │
│  │    ┌────────────────────────────────────────────────────────────┐   │  │
│  │    │              DOCKER CONTAINER                              │   │  │
│  │    │                                                            │   │  │
│  │    │    ┌─────────────────┐                                     │   │  │
│  │    │    │     MinIO       │ ← Nhận traffic được forward         │   │  │
│  │    │    │   (port 9000)   │                                     │   │  │
│  │    │    └─────────────────┘                                     │   │  │
│  │    └────────────────────────────────────────────────────────────┘   │  │
│  │                                                                      │  │
│  │    → Request thành công!                                            │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Các kiểu port binding trong Docker:**

```yaml
# filepath: docker-compose.yml - Port Binding Syntax Examples

version: '3.8'

services:
  minio:
    image: minio/minio:latest
    
    # ===============================================
    # CÁC KIỂU PORT BINDING
    # ===============================================
    # Syntax: "HOST_PORT:CONTAINER_PORT"
    # Hoặc:   "HOST_IP:HOST_PORT:CONTAINER_PORT"
    # Hoặc:   "CONTAINER_PORT" (Docker chọn host port ngẫu nhiên)
    
    ports:
      # ─────────────────────────────────────────────────────────
      # KIỂU 1: Bind tất cả interfaces (0.0.0.0) - THÔNG DỤNG NHẤT
      # ─────────────────────────────────────────────────────────
      # Format: "HOST_PORT:CONTAINER_PORT"
      - "9000:9000"   # MinIO API
      - "9001:9001"   # MinIO Console
      
      # Kết quả: 
      # - Lắng nghe trên 0.0.0.0:9000 và 0.0.0.0:9001
      # - Accessible từ: localhost, LAN IP, public IP (nếu có)
      
      
      # ─────────────────────────────────────────────────────────
      # KIỂU 2: Chỉ bind localhost (127.0.0.1) - BẢO MẬT HƠN
      # ─────────────────────────────────────────────────────────
      # Format: "127.0.0.1:HOST_PORT:CONTAINER_PORT"
      # - "127.0.0.1:9000:9000"
      # - "127.0.0.1:9001:9001"
      
      # Kết quả:
      # - Chỉ accessible từ localhost (máy host)
      # - KHÔNG accessible từ máy khác trong mạng
      # - Thường dùng khi có reverse proxy (Nginx) phía trước
      
      
      # ─────────────────────────────────────────────────────────
      # KIỂU 3: Bind vào IP cụ thể của host
      # ─────────────────────────────────────────────────────────
      # Format: "HOST_IP:HOST_PORT:CONTAINER_PORT"
      # - "192.168.1.100:9000:9000"
      
      # Kết quả:
      # - Chỉ accessible qua IP 192.168.1.100:9000
      # - Không accessible qua localhost hay IP khác
      # - Hữu ích khi server có nhiều network interfaces
      
      
      # ─────────────────────────────────────────────────────────
      # KIỂU 4: Host port KHÁC container port
      # ─────────────────────────────────────────────────────────
      # Format: "DIFFERENT_HOST_PORT:CONTAINER_PORT"
      # - "8080:9000"   # Access qua host:8080 → container:9000
      # - "8081:9001"   # Access qua host:8081 → container:9001
      
      # Kết quả:
      # - MinIO API accessible qua port 8080 (không phải 9000)
      # - Hữu ích khi port 9000 đã bị chiếm bởi service khác
      
      
      # ─────────────────────────────────────────────────────────
      # KIỂU 5: Để Docker chọn host port ngẫu nhiên
      # ─────────────────────────────────────────────────────────
      # Format: "CONTAINER_PORT" (không có host port)
      # - "9000"
      
      # Kết quả:
      # - Docker chọn một port cao ngẫu nhiên (ví dụ: 49153)
      # - Kiểm tra bằng: docker port minio 9000
      # - Ít dùng trong production, chủ yếu cho testing
      
      
      # ─────────────────────────────────────────────────────────
      # KIỂU 6: Range of ports
      # ─────────────────────────────────────────────────────────
      # - "9000-9010:9000-9010"
      
      # Kết quả:
      # - Map nguyên một dải ports
      # - Ports được map 1:1 (9000→9000, 9001→9001, ..., 9010→9010)
```

**So sánh chi tiết các kiểu binding:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              SO SÁNH CÁC KIỂU PORT BINDING                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Syntax                      │ Lắng nghe tại     │ Use Case                │
│  ────────────────────────────┼───────────────────┼─────────────────────────│
│  "9000:9000"                 │ 0.0.0.0:9000      │ Development, Simple     │
│                              │                   │ production              │
│  ────────────────────────────┼───────────────────┼─────────────────────────│
│  "127.0.0.1:9000:9000"       │ 127.0.0.1:9000    │ Behind reverse proxy    │
│                              │                   │ (Nginx, Traefik)        │
│  ────────────────────────────┼───────────────────┼─────────────────────────│
│  "192.168.1.100:9000:9000"   │ 192.168.1.100:9000│ Multi-NIC server,       │
│                              │                   │ specific interface      │
│  ────────────────────────────┼───────────────────┼─────────────────────────│
│  "8080:9000"                 │ 0.0.0.0:8080      │ Port conflict,          │
│                              │                   │ custom port             │
│  ────────────────────────────┼───────────────────┼─────────────────────────│
│  "9000"                      │ 0.0.0.0:random    │ Testing, CI/CD          │
│                              │                   │                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Docker Compose cấu hình đầy đủ cho MinIO:**

```yaml
# filepath: docker-compose.yml
# Cấu hình MinIO với port binding đầy đủ và giải thích

version: '3.8'

services:
  minio:
    image: minio/minio:latest
    container_name: minio
    hostname: minio
    
    # ===============================================
    # PORT BINDING CONFIGURATION
    # ===============================================
    ports:
      # MinIO S3 API - Port chính để upload/download files
      # Accessible từ tất cả interfaces
      - "9000:9000"
      
      # MinIO Console - Web UI để quản lý
      # Accessible từ tất cả interfaces
      - "9001:9001"
    
    # ===============================================
    # ENVIRONMENT VARIABLES
    # ===============================================
    environment:
      # Credentials
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-minioadmin}
      
      # Console redirect URL (quan trọng khi dùng reverse proxy)
      MINIO_BROWSER_REDIRECT_URL: ${MINIO_BROWSER_REDIRECT_URL:-http://localhost:9001}
    
    # ===============================================
    # COMMAND - QUAN TRỌNG CHO PORT BINDING
    # ===============================================
    # MinIO phải bind vào 0.0.0.0 (tất cả interfaces)
    # để nhận traffic được forward từ Docker
    command: >
      server /data 
      --address ":9000"
      --console-address ":9001"
    
    # Giải thích command:
    # - server /data: Chạy MinIO server với data directory là /data
    # - --address ":9000": Bind API vào 0.0.0.0:9000
    # - --console-address ":9001": Bind Console vào 0.0.0.0:9001
    #
    # LƯU Ý: ":9000" = "0.0.0.0:9000" (bind tất cả interfaces)
    #        Nếu dùng "127.0.0.1:9000" → CHỈ bind localhost trong container
    #        → Port binding từ Docker SẼ KHÔNG HOẠT ĐỘNG!
    
    # ===============================================
    # VOLUMES
    # ===============================================
    volumes:
      - minio-data:/data
    
    # ===============================================
    # HEALTH CHECK
    # ===============================================
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    
    # ===============================================
    # RESTART POLICY
    # ===============================================
    restart: unless-stopped
    
    # ===============================================
    # NETWORK (optional - mặc định dùng default bridge)
    # ===============================================
    networks:
      - minio-network

# ===============================================
# VOLUMES
# ===============================================
volumes:
  minio-data:
    driver: local

# ===============================================
# NETWORKS
# ===============================================
networks:
  minio-network:
    driver: bridge
```

**Cấu hình cho Production với localhost binding + Nginx:**

```yaml
# filepath: docker-compose-production.yml
# Production setup: MinIO bind localhost, Nginx expose ra ngoài

version: '3.8'

services:
  minio:
    image: minio/minio:latest
    container_name: minio
    
    # ===============================================
    # BIND CHỈ LOCALHOST - AN TOÀN HƠN
    # ===============================================
    # Nginx sẽ proxy traffic đến MinIO
    ports:
      - "127.0.0.1:9000:9000"   # API - chỉ localhost access
      - "127.0.0.1:9001:9001"   # Console - chỉ localhost access
    
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
      # URL cho console khi đằng sau proxy
      MINIO_BROWSER_REDIRECT_URL: https://console.minio.example.com
    
    command: server /data --address ":9000" --console-address ":9001"
    
    volumes:
      - minio-data:/data
    
    networks:
      - internal
    
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: minio-nginx
    
    # ===============================================
    # NGINX EXPOSE RA NGOÀI
    # ===============================================
    ports:
      - "80:80"      # HTTP
      - "443:443"    # HTTPS
    
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    
    depends_on:
      - minio
    
    networks:
      - internal
    
    restart: unless-stopped

volumes:
  minio-data:

networks:
  internal:
    driver: bridge
```

**Kiểm tra port binding:**

```bash
# ===============================================
# KIỂM TRA PORT BINDING SAU KHI START CONTAINER
# ===============================================

# Xem các ports được publish của container
docker port minio

# Output mẫu (bind tất cả interfaces):
# 9000/tcp -> 0.0.0.0:9000
# 9001/tcp -> 0.0.0.0:9001

# Output mẫu (bind localhost only):
# 9000/tcp -> 127.0.0.1:9000
# 9001/tcp -> 127.0.0.1:9001


# Với docker compose:
docker compose port minio 9000
# Output: 0.0.0.0:9000


# ===============================================
# KIỂM TRA AI ĐANG LẮNG NGHE PORT TRÊN HOST
# ===============================================

# Linux - Xem port 9000
sudo ss -tlnp | grep 9000

# Output:
# LISTEN  0  4096  0.0.0.0:9000  0.0.0.0:*  users:(("docker-proxy",pid=12345,fd=4))
#         │   │      │              │           │
#         │   │      │              │           └── Process đang lắng nghe
#         │   │      │              └── Accept từ bất kỳ IP nào
#         │   │      └── Bind address: 0.0.0.0
#         │   └── Backlog queue
#         └── Connection state: LISTEN

# Hoặc dùng netstat:
sudo netstat -tlnp | grep 9000

# Hoặc dùng lsof:
sudo lsof -i :9000


# ===============================================
# KIỂM TRA CHI TIẾT CONTAINER NETWORK
# ===============================================

# Xem network settings của container
docker inspect minio --format='{{json .NetworkSettings.Ports}}' | jq

# Output:
# {
#   "9000/tcp": [
#     {
#       "HostIp": "0.0.0.0",
#       "HostPort": "9000"
#     }
#   ],
#   "9001/tcp": [
#     {
#       "HostIp": "0.0.0.0",
#       "HostPort": "9001"
#     }
#   ]
# }


# Xem IP address của container trong Docker network
docker inspect minio --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
# Output: 172.17.0.2 (hoặc tương tự)


# ===============================================
# TEST CONNECTIVITY
# ===============================================

# Test từ localhost
curl -I http://localhost:9000/minio/health/live
curl -I http://127.0.0.1:9000/minio/health/live

# Test từ LAN IP (thay bằng IP thực của bạn)
curl -I http://192.168.1.100:9000/minio/health/live

# Test từ bên trong container
docker exec minio curl -s http://localhost:9000/minio/health/live

# Output thành công:
# HTTP/1.1 200 OK
# Content-Length: 0
# ...
```

**Xử lý Port Conflict:**

```bash
# ===============================================
# XỬ LÝ KHI PORT ĐÃ BỊ CHIẾM
# ===============================================

# Lỗi khi start container:
# Error response from daemon: driver failed programming external connectivity:
# Bind for 0.0.0.0:9000 failed: port is already allocated

# Bước 1: Tìm process đang dùng port 9000
sudo lsof -i :9000
# Hoặc:
sudo ss -tlnp | grep 9000
# Hoặc:
sudo fuser -v 9000/tcp

# Output mẫu:
# COMMAND     PID USER   FD   TYPE  DEVICE SIZE/OFF NODE NAME
# java      12345 user   50u  IPv4  123456      0t0  TCP *:9000 (LISTEN)


# Bước 2: Quyết định action

# Option A: Kill process đang chiếm port (nếu không cần)
sudo kill -9 12345  # Thay 12345 bằng PID thực tế
# Hoặc:
sudo fuser -k 9000/tcp


# Option B: Đổi MinIO sang port khác
# Trong docker-compose.yml:
```

```yaml
# filepath: docker-compose.yml (đổi port)
services:
  minio:
    ports:
      - "9002:9000"   # MinIO API trên host port 9002
      - "9003:9001"   # MinIO Console trên host port 9003
```

```bash
# Option C: Stop service/container cũ đang dùng port
docker stop <old-container-name>
# Hoặc:
sudo systemctl stop <old-service-name>


# ===============================================
# SCRIPT KIỂM TRA PORT AVAILABILITY
# ===============================================
```

```bash
#!/bin/bash
# filepath: scripts/check-ports.sh

PORTS_TO_CHECK=(9000 9001)

echo "=============================================="
echo "   Port Availability Check"
echo "=============================================="
echo ""

ALL_AVAILABLE=true

for port in "${PORTS_TO_CHECK[@]}"; do
    echo -n "Port ${port}: "
    
    if ss -tln | grep -q ":${port} "; then
        echo "✗ IN USE"
        ALL_AVAILABLE=false
        
        # Tìm process đang dùng port
        PROCESS_INFO=$(sudo lsof -i :${port} 2>/dev/null | grep LISTEN | head -1)
        if [ -n "$PROCESS_INFO" ]; then
            PROCESS_NAME=$(echo "$PROCESS_INFO" | awk '{print $1}')
            PROCESS_PID=$(echo "$PROCESS_INFO" | awk '{print $2}')
            echo "         └── Used by: ${PROCESS_NAME} (PID: ${PROCESS_PID})"
        fi
    else
        echo "✓ Available"
    fi
done

echo ""
if [ "$ALL_AVAILABLE" = true ]; then
    echo "All ports are available. Safe to start MinIO."
else
    echo "Some ports are in use. Please resolve conflicts before starting MinIO."
    exit 1
fi
```

---

#### 1.6.6 Cấu hình reverse proxy với Nginx cho MinIO

**Tại sao cần Reverse Proxy?**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              TẠI SAO CẦN REVERSE PROXY CHO MINIO?                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. SSL/TLS TERMINATION                                                    │
│  ─────────────────────────                                                  │
│     • Nginx xử lý HTTPS, MinIO chạy HTTP (đơn giản hơn)                   │
│     • Dễ quản lý SSL certificates ở một nơi                               │
│     • Automatic certificate renewal với Let's Encrypt                     │
│                                                                             │
│  2. LOAD BALANCING                                                         │
│  ───────────────────                                                        │
│     • Phân tải traffic đến nhiều MinIO servers                            │
│     • Health checks và automatic failover                                  │
│     • Session persistence nếu cần                                         │
│                                                                             │
│  3. CACHING                                                                │
│  ───────────                                                                │
│     • Cache static content và frequent requests                           │
│     • Giảm tải cho MinIO server                                           │
│                                                                             │
│  4. SECURITY                                                               │
│  ──────────                                                                 │
│     • Rate limiting để chống DDoS                                         │
│     • IP whitelisting/blacklisting                                         │
│     • Web Application Firewall (WAF) rules                                │
│     • Hide MinIO version và internal details                              │
│                                                                             │
│  5. URL ROUTING                                                            │
│  ──────────────                                                             │
│     • Multiple domains/subdomains cho API và Console                      │
│     • Path-based routing                                                   │
│     • URL rewriting                                                        │
│                                                                             │
│  6. REQUEST/RESPONSE MODIFICATION                                          │
│  ─────────────────────────────────                                          │
│     • Thêm/sửa headers (CORS, Security headers)                           │
│     • Compression (gzip, brotli)                                          │
│     • Request body size limits                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Kiến trúc với Reverse Proxy:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              KIẾN TRÚC MINIO VỚI NGINX REVERSE PROXY                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  KHÔNG CÓ REVERSE PROXY:                                                   │
│  ─────────────────────────                                                  │
│                                                                             │
│    Client                                                                   │
│      │                                                                      │
│      │ http://minio.example.com:9000                                       │
│      │ (Port 9000 exposed directly)                                        │
│      │                                                                      │
│      ▼                                                                      │
│  ┌─────────┐                                                               │
│  │  MinIO  │ ← Phải tự handle SSL, không có rate limit, ...               │
│  │ :9000   │                                                               │
│  └─────────┘                                                               │
│                                                                             │
│                                                                             │
│  CÓ REVERSE PROXY:                                                         │
│  ──────────────────                                                         │
│                                                                             │
│    Client                                                                   │
│      │                                                                      │
│      │ https://minio.example.com (port 443)                                │
│      │ https://console.minio.example.com (port 443)                        │
│      │                                                                      │
│      ▼                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                         NGINX REVERSE PROXY                           │ │
│  │                                                                       │ │
│  │  • SSL Termination (HTTPS → HTTP)                                    │ │
│  │  • Rate Limiting                                                     │ │
│  │  • Access Logging                                                    │ │
│  │  • Header Modification                                               │ │
│  │  • Load Balancing (nếu có nhiều MinIO nodes)                        │ │
│  │                                                                       │ │
│  │  Routing:                                                            │ │
│  │  • minio.example.com → MinIO API (:9000)                            │ │
│  │  • console.minio.example.com → MinIO Console (:9001)                │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│      │                              │                                       │
│      │ http://minio:9000           │ http://minio:9001                     │
│      │ (internal network)           │ (internal network)                    │
│      ▼                              ▼                                       │
│  ┌─────────────┐            ┌─────────────┐                                │
│  │ MinIO API   │            │MinIO Console│                                │
│  │   :9000     │            │   :9001     │                                │
│  └─────────────┘            └─────────────┘                                │
│                                                                             │
│  MinIO chỉ bind localhost:9000/9001 → không accessible từ bên ngoài       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Cấu hình Nginx cơ bản cho MinIO:**

```nginx
# filepath: /etc/nginx/conf.d/minio.conf
# Cấu hình Nginx reverse proxy cơ bản cho MinIO

# ===============================================
# UPSTREAM DEFINITIONS
# ===============================================
# Định nghĩa backend servers

# MinIO API backend
upstream minio_api {
    server 127.0.0.1:9000;
    
    # Nếu có nhiều MinIO servers (distributed mode):
    # server minio1:9000;
    # server minio2:9000;
    # server minio3:9000;
    # server minio4:9000;
    
    # Connection pooling - giữ connections để reuse
    keepalive 32;
}

# MinIO Console backend
upstream minio_console {
    server 127.0.0.1:9001;
    keepalive 32;
}


# ===============================================
# MINIO API SERVER BLOCK (S3 API)
# ===============================================
server {
    listen 80;
    listen [::]:80;
    server_name minio.example.com s3.example.com;

    # Redirect HTTP → HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name minio.example.com s3.example.com;

    # ─────────────────────────────────────────────
    # SSL CONFIGURATION
    # ─────────────────────────────────────────────
    ssl_certificate /etc/nginx/ssl/minio.example.com.crt;
    ssl_certificate_key /etc/nginx/ssl/minio.example.com.key;
    
    # SSL settings (modern configuration)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # ─────────────────────────────────────────────
    # QUAN TRỌNG CHO MINIO
    # ─────────────────────────────────────────────
    
    # Không giới hạn body size (cho file upload lớn)
    client_max_body_size 0;
    
    # Tắt buffering (quan trọng cho streaming uploads)
    proxy_buffering off;
    proxy_request_buffering off;
    
    # Cho phép chunked transfer encoding
    chunked_transfer_encoding on;

    # ─────────────────────────────────────────────
    # PROXY CONFIGURATION
    # ─────────────────────────────────────────────
    location / {
        proxy_pass http://minio_api;
        
        # Headers quan trọng
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-NginX-Proxy true;
        
        # Connection settings
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        
        # Timeouts (tăng cho file lớn)
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
        send_timeout 300;
    }

    # ─────────────────────────────────────────────
    # LOGGING
    # ─────────────────────────────────────────────
    access_log /var/log/nginx/minio-api-access.log;
    error_log /var/log/nginx/minio-api-error.log;
}


# ===============================================
# MINIO CONSOLE SERVER BLOCK (Web UI)
# ===============================================
server {
    listen 80;
    listen [::]:80;
    server_name console.minio.example.com;
    
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name console.minio.example.com;

    # SSL Configuration (same as API)
    ssl_certificate /etc/nginx/ssl/minio.example.com.crt;
    ssl_certificate_key /etc/nginx/ssl/minio.example.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Body size cho console (ít quan trọng hơn API)
    client_max_body_size 100M;

    # ─────────────────────────────────────────────
    # WEBSOCKET SUPPORT (quan trọng cho Console)
    # ─────────────────────────────────────────────
    location / {
        proxy_pass http://minio_console;
        
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-NginX-Proxy true;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
    }

    access_log /var/log/nginx/minio-console-access.log;
    error_log /var/log/nginx/minio-console-error.log;
}
```

**Cấu hình Nginx nâng cao với Rate Limiting và Security:**

```nginx
# filepath: /etc/nginx/conf.d/minio-advanced.conf
# Cấu hình Nginx nâng cao với security features

# ===============================================
# RATE LIMITING ZONES
# ===============================================
# Định nghĩa rate limit zones (đặt trong http block hoặc conf.d)

# Limit requests per IP
limit_req_zone $binary_remote_addr zone=minio_api_limit:10m rate=100r/s;
limit_req_zone $binary_remote_addr zone=minio_upload_limit:10m rate=10r/s;

# Limit concurrent connections per IP
limit_conn_zone $binary_remote_addr zone=minio_conn_limit:10m;


# ===============================================
# UPSTREAM WITH HEALTH CHECKS
# ===============================================
upstream minio_api {
    # Load balancing method
    least_conn;  # Gửi đến server có ít connections nhất
    
    # Backend servers
    server 127.0.0.1:9000 max_fails=3 fail_timeout=30s;
    # server minio2:9000 max_fails=3 fail_timeout=30s;  # Nếu có nhiều nodes
    
    # Connection pooling
    keepalive 64;
    keepalive_requests 1000;
    keepalive_timeout 60s;
}


# ===============================================
# MINIO API WITH SECURITY
# ===============================================
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name minio.example.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # ─────────────────────────────────────────────
    # SECURITY HEADERS
    # ─────────────────────────────────────────────
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # HSTS (uncomment sau khi test kỹ)
    # add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Hide Nginx version
    server_tokens off;

    # ─────────────────────────────────────────────
    # MINIO SPECIFIC SETTINGS
    # ─────────────────────────────────────────────
    client_max_body_size 0;
    proxy_buffering off;
    proxy_request_buffering off;
    chunked_transfer_encoding on;

    # ─────────────────────────────────────────────
    # MAIN LOCATION WITH RATE LIMITING
    # ─────────────────────────────────────────────
    location / {
        # Rate limiting
        limit_req zone=minio_api_limit burst=200 nodelay;
        limit_conn minio_conn_limit 100;
        
        proxy_pass http://minio_api;
        
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
    }

    # ─────────────────────────────────────────────
    # UPLOAD LOCATION (STRICTER RATE LIMIT)
    # ─────────────────────────────────────────────
    # Match PUT requests to any bucket
    location ~* ^/[^/]+/.+ {
        # Stricter rate limit for uploads
        limit_req zone=minio_upload_limit burst=20 nodelay;
        limit_conn minio_conn_limit 50;
        
        proxy_pass http://minio_api;
        
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        
        # Longer timeouts for uploads
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
    }

    # ─────────────────────────────────────────────
    # HEALTH CHECK ENDPOINT (NO RATE LIMIT)
    # ─────────────────────────────────────────────
    location /minio/health/ {
        proxy_pass http://minio_api;
        proxy_set_header Host $http_host;
        
        # Không rate limit health checks
        limit_req off;
        limit_conn off;
    }

    # ─────────────────────────────────────────────
    # DENY ACCESS TO SENSITIVE PATHS
    # ─────────────────────────────────────────────
    location ~* /\.minio\.sys {
        deny all;
        return 404;
    }

    # ─────────────────────────────────────────────
    # LOGGING
    # ─────────────────────────────────────────────
    access_log /var/log/nginx/minio-access.log combined buffer=512k flush=1m;
    error_log /var/log/nginx/minio-error.log warn;
}
```

**Docker Compose với Nginx và MinIO:**

```yaml
# filepath: docker-compose-with-nginx.yml
# Complete setup: MinIO + Nginx + Let's Encrypt

version: '3.8'

services:
  # ===============================================
  # MINIO - BIND LOCALHOST ONLY
  # ===============================================
  minio:
    image: minio/minio:latest
    container_name: minio
    
    # Chỉ expose trong internal network
    # KHÔNG publish ra host (Nginx sẽ proxy)
    expose:
      - "9000"
      - "9001"
    
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
      # URL cho console redirect (qua Nginx)
      MINIO_BROWSER_REDIRECT_URL: https://console.minio.example.com
      MINIO_SERVER_URL: https://minio.example.com
    
    command: server /data --address ":9000" --console-address ":9001"
    
    volumes:
      - minio-data:/data
    
    networks:
      - internal
    
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3
    
    restart: unless-stopped

  # ===============================================
  # NGINX REVERSE PROXY
  # ===============================================
  nginx:
    image: nginx:alpine
    container_name: nginx
    
    ports:
      - "80:80"
      - "443:443"
    
    volumes:
      # Nginx config
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      
      # SSL certificates
      - ./nginx/ssl:/etc/nginx/ssl:ro
      
      # Logs
      - ./nginx/logs:/var/log/nginx
    
    depends_on:
      minio:
        condition: service_healthy
    
    networks:
      - internal
    
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 30s
      timeout: 10s
      retries: 3
    
    restart: unless-stopped

  # ===============================================
  # CERTBOT (Let's Encrypt) - Optional
  # ===============================================
  certbot:
    image: certbot/certbot:latest
    container_name: certbot
    
    volumes:
      - ./nginx/ssl:/etc/letsencrypt
      - ./nginx/certbot-www:/var/www/certbot
    
    # Chạy renewal định kỳ
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
    
    depends_on:
      - nginx

volumes:
  minio-data:

networks:
  internal:
    driver: bridge
```

**Nginx config file chính:**

```nginx
# filepath: nginx/nginx.conf

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging format
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';

    access_log /var/log/nginx/access.log main buffer=512k flush=1m;

    # Performance optimizations
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript 
               application/xml+rss application/atom+xml image/svg+xml;

    # Hide Nginx version
    server_tokens off;

    # Rate limiting zones
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

    # Include server configs
    include /etc/nginx/conf.d/*.conf;
}
```

**Script tự động cấu hình Nginx:**

```bash
#!/bin/bash
# filepath: scripts/setup-nginx-proxy.sh

set -e

# Configuration
DOMAIN=${1:-"minio.example.com"}
CONSOLE_DOMAIN=${2:-"console.${DOMAIN}"}
MINIO_HOST=${3:-"127.0.0.1"}
MINIO_API_PORT=${4:-9000}
MINIO_CONSOLE_PORT=${5:-9001}

echo "=============================================="
echo "   Nginx Reverse Proxy Setup for MinIO"
echo "=============================================="
echo ""
echo "Configuration:"
echo "  API Domain: ${DOMAIN}"
echo "  Console Domain: ${CONSOLE_DOMAIN}"
echo "  MinIO Host: ${MINIO_HOST}"
echo "  MinIO API Port: ${MINIO_API_PORT}"
echo "  MinIO Console Port: ${MINIO_CONSOLE_PORT}"
echo ""

# Create directories
mkdir -p /etc/nginx/conf.d
mkdir -p /etc/nginx/ssl

# Generate Nginx config
cat > /etc/nginx/conf.d/minio.conf << EOF
# MinIO API
upstream minio_api {
    server ${MINIO_HOST}:${MINIO_API_PORT};
    keepalive 32;
}

# MinIO Console
upstream minio_console {
    server ${MINIO_HOST}:${MINIO_CONSOLE_PORT};
    keepalive 32;
}

# API Server
server {
    listen 80;
    server_name ${DOMAIN};

    client_max_body_size 0;
    proxy_buffering off;
    proxy_request_buffering off;

    location / {
        proxy_pass http://minio_api;
        proxy_set_header Host \$http_host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
    }
}

# Console Server
server {
    listen 80;
    server_name ${CONSOLE_DOMAIN};

    location / {
        proxy_pass http://minio_console;
        proxy_set_header Host \$http_host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
    }
}
EOF

# Test Nginx config
nginx -t

# Reload Nginx
nginx -s reload || systemctl reload nginx

echo ""
echo "=============================================="
echo "   Setup Complete!"
echo "=============================================="
echo ""
echo "Access MinIO:"
echo "  API: http://${DOMAIN}"
echo "  Console: http://${CONSOLE_DOMAIN}"
echo ""
echo "Next steps:"
echo "  1. Configure DNS to point ${DOMAIN} and ${CONSOLE_DOMAIN} to this server"
echo "  2. Set up SSL with: certbot --nginx -d ${DOMAIN} -d ${CONSOLE_DOMAIN}"
echo ""
```

// ...existing code...

---

#### 1.6.7 Xử lý lỗi timeout khi upload file lớn

**Hiểu về Timeout trong Upload Flow:**

Khi upload file lớn, request phải đi qua nhiều components, mỗi component có timeout riêng. Hiểu rõ các loại timeout này là bước đầu tiên để xử lý lỗi hiệu quả.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              CÁC LOẠI TIMEOUT TRONG UPLOAD FLOW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Upload flow qua nhiều components, mỗi component có timeout riêng:         │
│                                                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │ Browser │───►│  Nginx  │───►│ Backend │───►│ MinIO   │───►│  Disk   │  │
│  │         │    │ (Proxy) │    │ (Java)  │    │ Server  │    │   I/O   │  │
│  └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘  │
│       │              │              │              │              │        │
│       ▼              ▼              ▼              ▼              ▼        │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │fetch()  │    │proxy_   │    │HttpClient│   │Connection│   │Write    │  │
│  │timeout  │    │timeout  │    │timeout   │   │timeout   │   │timeout  │  │
│  │(browser)│    │(nginx)  │    │(okhttp)  │   │(minio)   │   │(os)     │  │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
│                                                                             │
│  Mỗi component có thể timeout độc lập → cần cấu hình TẤT CẢ!              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Timeline ví dụ khi upload file 1GB:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              TIMELINE UPLOAD FILE 1GB - VÍ DỤ THỰC TẾ                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Giả định: Network speed ~30 Mbps upload                                   │
│                                                                             │
│  Time        Event                                                         │
│  ────────    ─────────────────────────────────────────────────────────────│
│  0s          Browser bắt đầu gửi request                                   │
│  ~1s         TCP connection established                                    │
│  ~2s         Request headers sent                                          │
│  ~3s         Bắt đầu gửi request body (file data)                         │
│              │                                                             │
│              │  ┌────────────────────────────────────────────────────┐    │
│              │  │ FILE ĐANG ĐƯỢC UPLOAD...                           │    │
│              │  │ 1GB ÷ 30Mbps ≈ 280 giây ≈ 4.7 phút                │    │
│              │  └────────────────────────────────────────────────────┘    │
│              │                                                             │
│  ~60s        ⚠️ NGINX proxy_read_timeout mặc định = 60s                   │
│              │  → Nếu chưa cấu hình: 504 Gateway Timeout!                 │
│              │                                                             │
│  ~120s       ⚠️ Nhiều browser có timeout mặc định ~2 phút                 │
│              │                                                             │
│  ~280s       File upload hoàn tất (nếu không bị timeout)                  │
│  ~281s       MinIO xử lý và lưu file                                       │
│  ~282s       MinIO gửi response (200 OK)                                   │
│  ~283s       Nginx forward response về browser                            │
│  ~284s       Browser nhận response → Upload thành công!                   │
│                                                                             │
│                                                                             │
│  VẤN ĐỀ PHỔ BIẾN:                                                          │
│  ─────────────────                                                          │
│  • Default timeouts thường là 30-60 giây                                   │
│  • File 1GB cần ~5 phút ở tốc độ 30Mbps                                   │
│  • File 5GB cần ~25 phút                                                   │
│  • → Timeout xảy ra TRƯỚC KHI upload xong!                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Các loại lỗi timeout thường gặp:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              CÁC LỖI TIMEOUT THƯỜNG GẶP KHI UPLOAD FILE LỚN                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. NGINX PROXY TIMEOUT (504 Gateway Timeout)                              │
│  ─────────────────────────────────────────────                              │
│     Lỗi hiển thị:                                                          │
│     • "504 Gateway Time-out"                                               │
│     • "upstream timed out (110: Connection timed out)"                     │
│                                                                             │
│     Nguyên nhân:                                                           │
│     • proxy_read_timeout mặc định 60s                                      │
│     • proxy_send_timeout mặc định 60s                                      │
│     • Nginx đợi response từ backend quá lâu                               │
│                                                                             │
│     Log Nginx:                                                             │
│     [error] upstream timed out (110: Connection timed out)                 │
│     while reading response header from upstream                            │
│                                                                             │
│                                                                             │
│  2. BROWSER/FETCH TIMEOUT                                                  │
│  ────────────────────────────                                               │
│     Lỗi hiển thị:                                                          │
│     • "net::ERR_CONNECTION_TIMED_OUT"                                      │
│     • "The operation timed out"                                            │
│     • "Failed to fetch" (với timeout implicit)                             │
│                                                                             │
│     Nguyên nhân:                                                           │
│     • Browser có timeout mặc định (thường 2-5 phút)                       │
│     • fetch() không có timeout mặc định nhưng OS có                       │
│     • XMLHttpRequest.timeout được set quá ngắn                            │
│                                                                             │
│                                                                             │
│  3. JAVA BACKEND TIMEOUT                                                   │
│  ───────────────────────────                                                │
│     Lỗi hiển thị:                                                          │
│     • "java.net.SocketTimeoutException: Read timed out"                   │
│     • "java.net.SocketTimeoutException: connect timed out"                │
│     • "Connection reset by peer"                                           │
│                                                                             │
│     Nguyên nhân:                                                           │
│     • OkHttpClient readTimeout mặc định 10s                               │
│     • MinIO Java SDK timeout                                               │
│     • Spring Boot server timeout                                           │
│                                                                             │
│                                                                             │
│  4. MINIO SERVER TIMEOUT                                                   │
│  ───────────────────────────                                                │
│     Lỗi hiển thị:                                                          │
│     • "RequestTimeTooSkewed"                                               │
│     • "SlowDown - Please reduce your request rate"                        │
│     • Connection đột ngột đóng                                             │
│                                                                             │
│     Nguyên nhân:                                                           │
│     • Server quá tải                                                       │
│     • Disk I/O chậm                                                        │
│     • Network latency cao                                                  │
│                                                                             │
│                                                                             │
│  5. TCP KEEPALIVE TIMEOUT                                                  │
│  ────────────────────────────                                               │
│     Lỗi hiển thị:                                                          │
│     • Connection đột ngột bị đóng không có error message rõ ràng          │
│     • "Connection reset"                                                   │
│                                                                             │
│     Nguyên nhân:                                                           │
│     • Firewall/Load balancer đóng idle connections                        │
│     • NAT table timeout                                                    │
│     • Cloud provider connection limits                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Cấu hình timeout cho Nginx - Chi tiết:**

```nginx
# filepath: /etc/nginx/conf.d/minio-upload.conf
# Cấu hình Nginx tối ưu cho upload file lớn

# ===============================================
# UPSTREAM CONFIGURATION
# ===============================================
upstream minio_backend {
    server 127.0.0.1:9000;
    
    # Keepalive connections để reuse
    # Quan trọng: giảm overhead của TCP handshake
    keepalive 64;
    keepalive_requests 1000;
    keepalive_timeout 3600s;
}

server {
    listen 443 ssl http2;
    server_name minio.example.com;

    # SSL configuration...
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # ===============================================
    # CRITICAL: BODY SIZE CONFIGURATION
    # ===============================================
    
    # Không giới hạn body size
    # Mặc định Nginx limit 1MB - quá nhỏ cho file upload!
    # Set 0 = unlimited
    client_max_body_size 0;
    
    # Giải thích:
    # • client_max_body_size 1m;   → Max 1MB (default)
    # • client_max_body_size 100m; → Max 100MB
    # • client_max_body_size 0;    → Unlimited (recommended cho MinIO)


    # ===============================================
    # CRITICAL: BUFFERING CONFIGURATION
    # ===============================================
    
    # TẮT proxy buffering cho upload
    # Nếu BẬT: Nginx đọc TOÀN BỘ request body vào buffer/disk
    #          trước khi forward đến MinIO
    #          → Tốn RAM/disk, delay, có thể gây timeout
    # Nếu TẮT: Nginx stream trực tiếp đến MinIO
    #          → Nhanh hơn, ít resource hơn
    proxy_buffering off;
    
    # TẮT request body buffering
    # Tương tự như trên, cho request body
    proxy_request_buffering off;
    
    # Cho phép chunked transfer encoding
    # Quan trọng cho streaming upload
    chunked_transfer_encoding on;


    # ===============================================
    # TIMEOUT CONFIGURATION - CHI TIẾT
    # ===============================================
    
    # 1. PROXY_CONNECT_TIMEOUT
    # ─────────────────────────
    # Thời gian chờ để thiết lập connection đến backend (MinIO)
    # 
    # Timeline:
    # Client → Nginx → [CONNECT_TIMEOUT] → MinIO
    #
    # Không cần quá dài vì:
    # • MinIO thường cùng server hoặc cùng network
    # • Nếu connect mất >60s thường là có vấn đề
    proxy_connect_timeout 60s;
    
    
    # 2. PROXY_SEND_TIMEOUT
    # ──────────────────────
    # Thời gian chờ giữa 2 WRITE operations liên tiếp đến backend
    # KHÔNG PHẢI tổng thời gian gửi toàn bộ request!
    #
    # Ví dụ:
    # • Gửi chunk 1 → OK
    # • Chờ 3500s không gửi gì → TIMEOUT!
    # • Gửi chunk 2 → Reset timer
    #
    # Set cao vì:
    # • Slow clients có thể gửi data chậm
    # • Network có thể có latency spikes
    proxy_send_timeout 3600s;  # 1 giờ
    
    
    # 3. PROXY_READ_TIMEOUT
    # ──────────────────────
    # Thời gian chờ giữa 2 READ operations liên tiếp từ backend
    # KHÔNG PHẢI tổng thời gian đọc response!
    #
    # Quan trọng nhất cho upload vì:
    # • Upload file → MinIO xử lý → Response
    # • MinIO cần thời gian xử lý file lớn
    # • Nếu timeout trước khi MinIO response → 504
    proxy_read_timeout 3600s;  # 1 giờ
    
    
    # 4. SEND_TIMEOUT
    # ────────────────
    # Thời gian chờ giữa 2 WRITE operations đến CLIENT
    # (Nginx → Browser)
    #
    # Ít quan trọng hơn cho upload, quan trọng cho download
    send_timeout 3600s;  # 1 giờ


    # ===============================================
    # KEEPALIVE CONFIGURATION
    # ===============================================
    
    # Client keepalive
    # Giữ connection với client alive
    keepalive_timeout 3600s;
    keepalive_requests 1000;
    
    # Sử dụng HTTP/1.1 với backend
    # HTTP/1.1 hỗ trợ keepalive, HTTP/1.0 thì không
    proxy_http_version 1.1;
    
    # Không gửi "Connection: close" header
    # Giữ connection để reuse
    proxy_set_header Connection "";


    # ===============================================
    # LOCATION BLOCK CHO UPLOAD
    # ===============================================
    location / {
        proxy_pass http://minio_backend;
        
        # Forward headers
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Chunked transfer support
        proxy_set_header Transfer-Encoding $http_transfer_encoding;
    }

    # ===============================================
    # LOGGING ĐỂ DEBUG TIMEOUT
    # ===============================================
    # Log format bao gồm timing information
    log_format upload_timing '$remote_addr - $remote_user [$time_local] '
                             '"$request" $status $body_bytes_sent '
                             '"$http_referer" "$http_user_agent" '
                             'rt=$request_time '
                             'uct=$upstream_connect_time '
                             'uht=$upstream_header_time '
                             'urt=$upstream_response_time';
    
    access_log /var/log/nginx/minio-upload.log upload_timing;
    error_log /var/log/nginx/minio-error.log warn;
}
```

**Giải thích chi tiết về các timeout trong Nginx:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              NGINX TIMEOUT - GIẢI THÍCH TRỰC QUAN                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  UPLOAD FLOW VỚI TIMEOUT:                                                  │
│                                                                             │
│  Browser                    Nginx                      MinIO               │
│     │                         │                          │                 │
│     │                         │                          │                 │
│     │  ══════ Upload File (streaming) ══════════════════►│                 │
│     │        │                │                          │                 │
│     │        │                │                          │                 │
│     │  [Data chunk 1] ───────►│                          │                 │
│     │        │                │──[proxy_send_timeout]───►│                 │
│     │        │                │        │                 │                 │
│     │  [Data chunk 2] ───────►│        │                 │                 │
│     │        │                │───────►│                 │                 │
│     │        │                │        │                 │                 │
│     │  [Data chunk N] ───────►│        ▼                 │                 │
│     │        │                │───────────────────────────►                │
│     │        │                │                          │                 │
│     │        │                │                          │ Processing...   │
│     │        │                │                          │                 │
│     │        │                │  [proxy_read_timeout]    │                 │
│     │        │                │◄─────────────────────────│                 │
│     │        │                │        │                 │                 │
│     │        │                │        ▼                 │                 │
│     │◄───────────────────────│◄──── Response ───────────│                 │
│     │  [send_timeout]        │                          │                 │
│     │                         │                          │                 │
│                                                                             │
│                                                                             │
│  QUAN TRỌNG:                                                               │
│  ───────────                                                                │
│  • proxy_send_timeout: Reset mỗi khi GỬI data chunk đến MinIO             │
│  • proxy_read_timeout: Reset mỗi khi NHẬN data từ MinIO                   │
│  • Không phải "total time" mà là "idle time between operations"           │
│                                                                             │
│  VÍ DỤ:                                                                    │
│  • proxy_read_timeout = 60s                                                │
│  • Upload 1GB mất 5 phút                                                   │
│  • MinIO response sau 5 phút                                               │
│  • → TIMEOUT! (vì không có data trong 5 phút > 60s)                       │
│                                                                             │
│  GIẢI PHÁP:                                                                │
│  • Set proxy_read_timeout >= thời gian upload + processing                │
│  • Hoặc sử dụng streaming response để keep connection alive               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Cấu hình timeout cho MinIO Java SDK:**

```java
// filepath: src/main/java/com/example/minio/config/MinioConfig.java

package com.example.minio.config;

import io.minio.MinioClient;
import okhttp3.OkHttpClient;
import okhttp3.ConnectionPool;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Configuration
public class MinioConfig {

    @Value("${minio.endpoint}")
    private String endpoint;

    @Value("${minio.access-key}")
    private String accessKey;

    @Value("${minio.secret-key}")
    private String secretKey;

    /**
     * Tạo MinIO Client với timeout configuration tối ưu cho file lớn
     */
    @Bean
    public MinioClient minioClient() {
        // ===============================================
        // CUSTOM HTTP CLIENT VỚI EXTENDED TIMEOUTS
        // ===============================================
        OkHttpClient httpClient = new OkHttpClient.Builder()
            
            // ─────────────────────────────────────────────
            // CONNECTION TIMEOUT
            // ─────────────────────────────────────────────
            // Thời gian chờ để thiết lập TCP connection
            // Thường không cần quá dài vì MinIO cùng network
            .connectTimeout(60, TimeUnit.SECONDS)
            
            // ─────────────────────────────────────────────
            // READ TIMEOUT
            // ─────────────────────────────────────────────
            // Thời gian chờ giữa 2 read operations
            // QUAN TRỌNG cho download file lớn
            // 
            // Ví dụ: Download file 1GB
            // • MinIO đọc từ disk → gửi về client
            // • Nếu disk slow, có thể >10s giữa các chunks
            // • Set cao để tránh timeout
            .readTimeout(3600, TimeUnit.SECONDS)  // 1 giờ
            
            // ─────────────────────────────────────────────
            // WRITE TIMEOUT
            // ─────────────────────────────────────────────
            // Thời gian chờ giữa 2 write operations
            // QUAN TRỌNG cho upload file lớn
            //
            // Ví dụ: Upload file 1GB
            // • Client gửi data → MinIO nhận
            // • Nếu network slow, có thể delay giữa chunks
            // • Set cao để tránh timeout
            .writeTimeout(3600, TimeUnit.SECONDS)  // 1 giờ
            
            // ─────────────────────────────────────────────
            // CALL TIMEOUT
            // ─────────────────────────────────────────────
            // Timeout cho TOÀN BỘ HTTP call (từ request đến response)
            // Bao gồm: connect + send request + receive response
            //
            // Set 0 để disable (sử dụng read/write timeout thay thế)
            // Nếu set giá trị, phải >= thời gian upload + processing
            .callTimeout(0, TimeUnit.SECONDS)  // Disable
            
            // ─────────────────────────────────────────────
            // CONNECTION POOL
            // ─────────────────────────────────────────────
            // Reuse connections để giảm overhead
            .connectionPool(new ConnectionPool(
                10,                    // Max idle connections
                5, TimeUnit.MINUTES    // Keep alive time
            ))
            
            // ─────────────────────────────────────────────
            // RETRY
            // ─────────────────────────────────────────────
            // Tự động retry khi connection fail
            .retryOnConnectionFailure(true)
            
            .build();

        // ===============================================
        // TẠO MINIO CLIENT
        // ===============================================
        return MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .httpClient(httpClient)
                .build();
    }
}
```

**Cấu hình timeout cho Spring Boot (nếu dùng làm backend):**

```yaml
# filepath: src/main/resources/application.yml

server:
  # ===============================================
  # TOMCAT TIMEOUT CONFIGURATION
  # ===============================================
  
  # Connection timeout - thời gian chờ connection được thiết lập
  connection-timeout: 60000  # 60 seconds (milliseconds)
  
  # Tomcat specific settings
  tomcat:
    # Max threads để xử lý requests
    max-threads: 200
    
    # Connection timeout
    connection-timeout: 60000
    
    # Keep-alive timeout
    keep-alive-timeout: 60000
    
    # Max keep-alive requests
    max-keep-alive-requests: 100

spring:
  servlet:
    multipart:
      # ===============================================
      # MULTIPART UPLOAD CONFIGURATION
      # ===============================================
      
      # Enable multipart upload
      enabled: true
      
      # Max file size (set -1 for unlimited)
      max-file-size: -1
      
      # Max request size (set -1 for unlimited)
      max-request-size: -1
      
      # Threshold để switch từ memory sang disk
      # Files > threshold sẽ được lưu tạm vào disk
      file-size-threshold: 10MB
      
      # Thư mục lưu file tạm
      location: ${java.io.tmpdir}

  # ===============================================
  # ASYNC CONFIGURATION (cho streaming)
  # ===============================================
  mvc:
    async:
      # Timeout cho async requests
      request-timeout: 3600000  # 1 hour (milliseconds)

# ===============================================
# MINIO CONFIGURATION
# ===============================================
minio:
  endpoint: http://localhost:9000
  access-key: minioadmin
  secret-key: minioadmin
  
  # Custom timeout settings
  timeout:
    connect: 60        # seconds
    read: 3600         # seconds (1 hour)
    write: 3600        # seconds (1 hour)
```

**Cấu hình timeout cho TypeScript Client:**

```typescript
// filepath: src/utils/uploadWithTimeout.ts

/**
 * Interface cho upload configuration
 */
interface UploadConfig {
    // Timeout cho toàn bộ upload (milliseconds)
    timeout: number;
    
    // Callback khi có progress
    onProgress?: (progress: UploadProgress) => void;
    
    // Callback khi upload bị abort
    onAbort?: () => void;
    
    // Số lần retry khi fail
    maxRetries?: number;
    
    // Delay giữa các lần retry (milliseconds)
    retryDelay?: number;
}

interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
    speed: number;        // bytes/second
    remainingTime: number; // seconds
}

interface UploadResult {
    success: boolean;
    etag?: string;
    error?: string;
    aborted?: boolean;
}

/**
 * Upload file với XMLHttpRequest (hỗ trợ progress và timeout tốt hơn fetch)
 */
function uploadWithXHR(
    url: string,
    file: File,
    config: UploadConfig
): Promise<UploadResult> {
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        const startTime = Date.now();
        let lastLoaded = 0;
        let lastTime = startTime;

        // ===============================================
        // PROGRESS TRACKING
        // ===============================================
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && config.onProgress) {
                const now = Date.now();
                const timeDiff = (now - lastTime) / 1000; // seconds
                const loadedDiff = event.loaded - lastLoaded;
                
                // Tính speed (bytes/second)
                const speed = timeDiff > 0 ? loadedDiff / timeDiff : 0;
                
                // Tính remaining time
                const remaining = event.total - event.loaded;
                const remainingTime = speed > 0 ? remaining / speed : 0;
                
                config.onProgress({
                    loaded: event.loaded,
                    total: event.total,
                    percentage: (event.loaded / event.total) * 100,
                    speed: speed,
                    remainingTime: remainingTime
                });
                
                lastLoaded = event.loaded;
                lastTime = now;
            }
        };

        // ===============================================
        // SUCCESS HANDLER
        // ===============================================
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const etag = xhr.getResponseHeader('ETag');
                console.log(`Upload completed in ${(Date.now() - startTime) / 1000}s`);
                resolve({
                    success: true,
                    etag: etag || undefined
                });
            } else {
                resolve({
                    success: false,
                    error: `HTTP ${xhr.status}: ${xhr.statusText}`
                });
            }
        };

        // ===============================================
        // ERROR HANDLERS
        // ===============================================
        xhr.onerror = () => {
            console.error('Upload network error');
            resolve({
                success: false,
                error: 'Network error - connection may have been lost'
            });
        };

        xhr.onabort = () => {
            console.log('Upload aborted');
            if (config.onAbort) {
                config.onAbort();
            }
            resolve({
                success: false,
                error: 'Upload was cancelled',
                aborted: true
            });
        };

        xhr.ontimeout = () => {
            console.error(`Upload timeout after ${config.timeout}ms`);
            resolve({
                success: false,
                error: `Upload timed out after ${config.timeout / 1000} seconds`
            });
        };

        // ===============================================
        // CONFIGURE REQUEST
        // ===============================================
        xhr.open('PUT', url);
        
        // Set timeout
        // LƯU Ý: XHR timeout tính từ khi gọi send() đến khi nhận response
        // Với file lớn, cần set timeout rất cao hoặc 0 (unlimited)
        xhr.timeout = config.timeout;
        
        // Set Content-Type
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        
        // Send file
        xhr.send(file);
    });
}

/**
 * Upload với retry logic
 */
async function uploadWithRetry(
    getPresignedUrl: () => Promise<string>,
    file: File,
    config: UploadConfig
): Promise<UploadResult> {
    const maxRetries = config.maxRetries || 3;
    const retryDelay = config.retryDelay || 2000;
    
    let lastError = '';
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`Upload attempt ${attempt}/${maxRetries}`);
        
        try {
            // Lấy presigned URL mới cho mỗi attempt
            // (URL cũ có thể đã expire)
            const presignedUrl = await getPresignedUrl();
            
            const result = await uploadWithXHR(presignedUrl, file, config);
            
            if (result.success) {
                return result;
            }
            
            // Nếu bị abort, không retry
            if (result.aborted) {
                return result;
            }
            
            lastError = result.error || 'Unknown error';
            
            // Check if error is retryable
            if (!isRetryableError(lastError)) {
                console.log(`Non-retryable error: ${lastError}`);
                return result;
            }
            
        } catch (error) {
            lastError = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Attempt ${attempt} failed:`, lastError);
        }
        
        // Wait before retry (với exponential backoff)
        if (attempt < maxRetries) {
            const delay = retryDelay * Math.pow(2, attempt - 1);
            console.log(`Waiting ${delay}ms before retry...`);
            await sleep(delay);
        }
    }
    
    return {
        success: false,
        error: `Upload failed after ${maxRetries} attempts. Last error: ${lastError}`
    };
}

/**
 * Kiểm tra error có nên retry không
 */
function isRetryableError(error: string): boolean {
    const retryablePatterns = [
        'timeout',
        'timed out',
        'network',
        'connection',
        'ECONNRESET',
        'ETIMEDOUT',
        'ECONNABORTED',
        '502',
        '503',
        '504',
        'gateway'
    ];
    
    const lowerError = error.toLowerCase();
    return retryablePatterns.some(pattern => 
        lowerError.includes(pattern.toLowerCase())
    );
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ===============================================
// EXAMPLE USAGE
// ===============================================

/**
 * Ví dụ sử dụng upload với timeout configuration
 */
async function exampleUpload(file: File) {
    const config: UploadConfig = {
        // Timeout 1 giờ cho file lớn
        timeout: 60 * 60 * 1000,  // 1 hour in milliseconds
        
        // Progress callback
        onProgress: (progress) => {
            console.log(`Progress: ${progress.percentage.toFixed(1)}%`);
            console.log(`Speed: ${formatBytes(progress.speed)}/s`);
            console.log(`Remaining: ${formatTime(progress.remainingTime)}`);
        },
        
        // Abort callback
        onAbort: () => {
            console.log('Upload was cancelled by user');
        },
        
        // Retry configuration
        maxRetries: 3,
        retryDelay: 2000
    };
    
    // Function để lấy presigned URL từ backend
    const getPresignedUrl = async () => {
        const response = await fetch('/api/upload/presigned-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filename: file.name,
                contentType: file.type,
                fileSize: file.size
            })
        });
        const data = await response.json();
        return data.presignedUrl;
    };
    
    const result = await uploadWithRetry(getPresignedUrl, file, config);
    
    if (result.success) {
        console.log('Upload successful! ETag:', result.etag);
    } else {
        console.error('Upload failed:', result.error);
    }
    
    return result;
}

// Helper functions
function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatTime(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
}

export { 
    uploadWithXHR, 
    uploadWithRetry, 
    UploadConfig, 
    UploadProgress, 
    UploadResult 
};
```

**Cấu hình TCP Keepalive để tránh connection bị đóng:**

```bash
#!/bin/bash
# filepath: scripts/configure-tcp-keepalive.sh

# ===============================================
# TCP KEEPALIVE CONFIGURATION
# ===============================================
# Keepalive giúp giữ connection alive khi không có data
# Quan trọng khi upload file lớn qua firewall/load balancer

echo "Configuring TCP Keepalive settings..."

# ─────────────────────────────────────────────
# tcp_keepalive_time
# ─────────────────────────────────────────────
# Thời gian (giây) sau khi connection idle mới gửi keepalive probe
# Default: 7200 (2 giờ) - quá dài!
# Khuyến nghị: 60 giây
sudo sysctl -w net.ipv4.tcp_keepalive_time=60

# ─────────────────────────────────────────────
# tcp_keepalive_intvl
# ─────────────────────────────────────────────
# Khoảng cách (giây) giữa các keepalive probes
# Default: 75
# Khuyến nghị: 10 giây
sudo sysctl -w net.ipv4.tcp_keepalive_intvl=10

# ─────────────────────────────────────────────
# tcp_keepalive_probes
# ─────────────────────────────────────────────
# Số lần gửi keepalive probe trước khi đóng connection
# Default: 9
# Khuyến nghị: 6
sudo sysctl -w net.ipv4.tcp_keepalive_probes=6

# ─────────────────────────────────────────────
# PERSIST SETTINGS
# ─────────────────────────────────────────────
# Lưu vào /etc/sysctl.conf để persist qua reboot

cat >> /etc/sysctl.conf << EOF

# TCP Keepalive settings for large file uploads
net.ipv4.tcp_keepalive_time = 60
net.ipv4.tcp_keepalive_intvl = 10
net.ipv4.tcp_keepalive_probes = 6
EOF

# Apply changes
sudo sysctl -p

echo "TCP Keepalive configured:"
echo "  tcp_keepalive_time:   $(sysctl -n net.ipv4.tcp_keepalive_time) seconds"
echo "  tcp_keepalive_intvl:  $(sysctl -n net.ipv4.tcp_keepalive_intvl) seconds"
echo "  tcp_keepalive_probes: $(sysctl -n net.ipv4.tcp_keepalive_probes)"
echo ""
echo "Connection will be probed after $(sysctl -n net.ipv4.tcp_keepalive_time)s of idle"
echo "Total timeout: $(($(sysctl -n net.ipv4.tcp_keepalive_time) + $(sysctl -n net.ipv4.tcp_keepalive_intvl) * $(sysctl -n net.ipv4.tcp_keepalive_probes)))s"
```

**Giải pháp Multipart Upload để tránh timeout:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              MULTIPART UPLOAD - GIẢI PHÁP CHO FILE LỚN                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  VẤN ĐỀ VỚI SINGLE UPLOAD:                                                │
│  ──────────────────────────                                                 │
│                                                                             │
│  File 1GB, upload speed 30Mbps:                                            │
│  • Total time: ~5 phút                                                     │
│  • Timeout risk: CAO                                                       │
│  • Nếu fail ở 99%: Phải upload lại từ đầu!                               │
│                                                                             │
│                                                                             │
│  GIẢI PHÁP MULTIPART UPLOAD:                                               │
│  ────────────────────────────                                               │
│                                                                             │
│  File 1GB, chia thành 100 parts x 10MB:                                    │
│  • Mỗi part upload riêng biệt                                             │
│  • Mỗi part có timeout ngắn (30-60s)                                      │
│  • Nếu 1 part fail: Chỉ retry part đó                                     │
│  • Có thể upload parallel nhiều parts                                     │
│                                                                             │
│                                                                             │
│  SO SÁNH:                                                                  │
│                                                                             │
│  Single Upload:                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │████████████████████████████████████████████████████████████████████│  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│    0%                           50%                                 100%   │
│    ◄──────────────── 5 phút liên tục ─────────────────►                   │
│    Timeout risk: ████████████████████████████ HIGH                        │
│                                                                             │
│                                                                             │
│  Multipart Upload (10 parts parallel):                                     │
│  ┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐                                │
│  │Part 1││Part 2││Part 3││Part 4││Part 5│  ← Batch 1 (parallel)          │
│  └──────┘└──────┘└──────┘└──────┘└──────┘                                │
│  ┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐                                │
│  │Part 6││Part 7││Part 8││Part 9││Part10│  ← Batch 2 (parallel)          │
│  └──────┘└──────┘└──────┘└──────┘└──────┘                                │
│    ◄──── 30s ────►◄──── 30s ────►                                         │
│    Total: ~1 phút (với parallel)                                          │
│    Timeout risk: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ LOW                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**TypeScript Multipart Upload Implementation:**

```typescript
// filepath: src/utils/multipartUpload.ts

interface MultipartConfig {
    // Size của mỗi part (bytes)
    partSize: number;
    
    // Số parts upload đồng thời
    concurrency: number;
    
    // Timeout cho mỗi part (milliseconds)
    partTimeout: number;
    
    // Số lần retry cho mỗi part
    partRetries: number;
    
    // Progress callback
    onProgress?: (progress: MultipartProgress) => void;
}

interface MultipartProgress {
    totalParts: number;
    completedParts: number;
    percentage: number;
    currentPartProgress?: number;
}

interface PartInfo {
    partNumber: number;
    start: number;
    end: number;
    size: number;
}

interface UploadedPart {
    partNumber: number;
    etag: string;
}

const DEFAULT_CONFIG: MultipartConfig = {
    partSize: 10 * 1024 * 1024,  // 10MB per part
    concurrency: 5,               // 5 parallel uploads
    partTimeout: 120000,          // 2 minutes per part
    partRetries: 3                // 3 retries per part
};

/**
 * Multipart upload với MinIO
 * Tránh timeout bằng cách chia file thành nhiều parts nhỏ
 */
class MultipartUploader {
    private config: MultipartConfig;
    private abortController: AbortController;
    private uploadId: string | null = null;
    private bucket: string;
    private objectKey: string;

    constructor(
        private apiBaseUrl: string,
        bucket: string,
        objectKey: string,
        config: Partial<MultipartConfig> = {}
    ) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.abortController = new AbortController();
        this.bucket = bucket;
        this.objectKey = objectKey;
    }

    /**
     * Upload file với multipart
     */
    async upload(file: File): Promise<{ success: boolean; error?: string }> {
        try {
            console.log(`Starting multipart upload for ${file.name} (${formatBytes(file.size)})`);
            
            // ===============================================
            // STEP 1: Initiate multipart upload
            // ===============================================
            console.log('Step 1: Initiating multipart upload...');
            const initResponse = await this.initiateUpload(file);
            this.uploadId = initResponse.uploadId;
            console.log(`Upload ID: ${this.uploadId}`);

            // ===============================================
            // STEP 2: Calculate parts
            // ===============================================
            const parts = this.calculateParts(file.size);
            console.log(`Step 2: File will be split into ${parts.length} parts`);

            // ===============================================
            // STEP 3: Upload parts with concurrency control
            // ===============================================
            console.log(`Step 3: Uploading parts (concurrency: ${this.config.concurrency})...`);
            const uploadedParts = await this.uploadParts(file, parts);
            console.log(`Uploaded ${uploadedParts.length} parts successfully`);

            // ===============================================
            // STEP 4: Complete multipart upload
            // ===============================================
            console.log('Step 4: Completing multipart upload...');
            await this.completeUpload(uploadedParts);
            console.log('Multipart upload completed successfully!');

            return { success: true };

        } catch (error) {
            console.error('Multipart upload failed:', error);
            
            // Abort nếu có uploadId
            if (this.uploadId) {
                try {
                    await this.abortUpload();
                } catch (abortError) {
                    console.error('Failed to abort upload:', abortError);
                }
            }
            
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Initiate multipart upload - lấy uploadId từ MinIO
     */
    private async initiateUpload(file: File): Promise<{ uploadId: string }> {
        const response = await fetch(`${this.apiBaseUrl}/multipart/initiate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bucket: this.bucket,
                objectKey: this.objectKey,
                contentType: file.type
            }),
            signal: this.abortController.signal
        });

        if (!response.ok) {
            throw new Error(`Failed to initiate upload: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Calculate parts based on file size
     */
    private calculateParts(fileSize: number): PartInfo[] {
        const parts: PartInfo[] = [];
        let partNumber = 1;
        let offset = 0;

        while (offset < fileSize) {
            const start = offset;
            const end = Math.min(offset + this.config.partSize, fileSize);
            
            parts.push({
                partNumber,
                start,
                end,
                size: end - start
            });

            partNumber++;
            offset = end;
        }

        return parts;
    }

    /**
     * Upload parts với concurrency control
     */
    private async uploadParts(file: File, parts: PartInfo[]): Promise<UploadedPart[]> {
        const uploadedParts: UploadedPart[] = [];
        let completedCount = 0;

        // Semaphore để control concurrency
        const semaphore = new Semaphore(this.config.concurrency);

        const uploadPromises = parts.map(async (part) => {
            await semaphore.acquire();
            
            try {
                const result = await this.uploadPart(file, part);
                uploadedParts.push(result);
                
                completedCount++;
                if (this.config.onProgress) {
                    this.config.onProgress({
                        totalParts: parts.length,
                        completedParts: completedCount,
                        percentage: (completedCount / parts.length) * 100
                    });
                }
                
                return result;
            } finally {
                semaphore.release();
            }
        });

        await Promise.all(uploadPromises);

        // Sort by part number
        return uploadedParts.sort((a, b) => a.partNumber - b.partNumber);
    }

    /**
     * Upload single part với retry
     */
    private async uploadPart(file: File, part: PartInfo): Promise<UploadedPart> {
        const chunk = file.slice(part.start, part.end);
        
        for (let attempt = 1; attempt <= this.config.partRetries; attempt++) {
            try {
                console.log(`Uploading part ${part.partNumber} (attempt ${attempt})...`);
                
                // Get presigned URL for this part
                const presignedUrl = await this.getPartPresignedUrl(part.partNumber);
                
                // Upload với timeout
                const etag = await this.uploadChunk(presignedUrl, chunk);
                
                console.log(`Part ${part.partNumber} uploaded successfully`);
                return {
                    partNumber: part.partNumber,
                    etag
                };
                
            } catch (error) {
                console.error(`Part ${part.partNumber} attempt ${attempt} failed:`, error);
                
                if (attempt === this.config.partRetries) {
                    throw new Error(`Part ${part.partNumber} failed after ${this.config.partRetries} attempts`);
                }
                
                // Wait before retry
                await sleep(1000 * attempt);
            }
        }
        
        throw new Error(`Part ${part.partNumber} upload failed`);
    }

    /**
     * Get presigned URL for a specific part
     */
    private async getPartPresignedUrl(partNumber: number): Promise<string> {
        const response = await fetch(`${this.apiBaseUrl}/multipart/presigned-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bucket: this.bucket,
                objectKey: this.objectKey,
                uploadId: this.uploadId,
                partNumber
            }),
            signal: this.abortController.signal
        });

        if (!response.ok) {
            throw new Error(`Failed to get presigned URL: ${response.status}`);
        }

        const data = await response.json();
        return data.presignedUrl;
    }

    /**
     * Upload chunk to presigned URL
     */
    private uploadChunk(url: string, chunk: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const etag = xhr.getResponseHeader('ETag');
                    if (etag) {
                        resolve(etag.replace(/"/g, ''));
                    } else {
                        reject(new Error('No ETag in response'));
                    }
                } else {
                    reject(new Error(`HTTP ${xhr.status}`));
                }
            };
            
            xhr.onerror = () => reject(new Error('Network error'));
            xhr.ontimeout = () => reject(new Error('Timeout'));
            xhr.onabort = () => reject(new Error('Aborted'));
            
            xhr.open('PUT', url);
            xhr.timeout = this.config.partTimeout;
            xhr.setRequestHeader('Content-Type', 'application/octet-stream');
            xhr.send(chunk);
        });
    }

    /**
     * Complete multipart upload
     */
    private async completeUpload(parts: UploadedPart[]): Promise<void> {
        const response = await fetch(`${this.apiBaseUrl}/multipart/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bucket: this.bucket,
                objectKey: this.objectKey,
                uploadId: this.uploadId,
                parts: parts.map(p => ({
                    partNumber: p.partNumber,
                    etag: p.etag
                }))
            }),
            signal: this.abortController.signal
        });

        if (!response.ok) {
            throw new Error(`Failed to complete upload: ${response.status}`);
        }
    }

    /**
     * Abort multipart upload
     */
    async abortUpload(): Promise<void> {
        if (!this.uploadId) return;

        console.log('Aborting multipart upload...');
        this.abortController.abort();

        await fetch(`${this.apiBaseUrl}/multipart/abort`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bucket: this.bucket,
                objectKey: this.objectKey,
                uploadId: this.uploadId
            })
        });

        console.log('Multipart upload aborted');
    }
}

/**
 * Simple semaphore for concurrency control
 */
class Semaphore {
    private permits: number;
    private waiting: Array<() => void> = [];

    constructor(permits: number) {
        this.permits = permits;
    }

    async acquire(): Promise<void> {
        if (this.permits > 0) {
            this.permits--;
            return;
        }

        return new Promise(resolve => {
            this.waiting.push(resolve);
        });
    }

    release(): void {
        const next = this.waiting.shift();
        if (next) {
            next();
        } else {
            this.permits++;
        }
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export { MultipartUploader, MultipartConfig, MultipartProgress };
```

**Troubleshooting Timeout Issues - Checklist:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              TIMEOUT TROUBLESHOOTING CHECKLIST                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  □ 1. NGINX CONFIGURATION                                                  │
│     ────────────────────────                                                │
│     □ client_max_body_size = 0 (unlimited)                                 │
│     □ proxy_buffering = off                                                │
│     □ proxy_request_buffering = off                                        │
│     □ proxy_read_timeout >= expected upload time                          │
│     □ proxy_send_timeout >= expected upload time                          │
│     □ proxy_connect_timeout = 60s                                         │
│                                                                             │
│     Test: nginx -t && nginx -s reload                                     │
│                                                                             │
│                                                                             │
│  □ 2. JAVA BACKEND CONFIGURATION                                           │
│     ─────────────────────────────                                           │
│     □ OkHttpClient readTimeout >= 1 hour                                  │
│     □ OkHttpClient writeTimeout >= 1 hour                                 │
│     □ Spring multipart max-file-size = -1                                 │
│     □ Spring multipart max-request-size = -1                              │
│                                                                             │
│     Test: Xem logs khi upload file lớn                                    │
│                                                                             │
│                                                                             │
│  □ 3. CLIENT (BROWSER) CONFIGURATION                                       │
│     ──────────────────────────────────                                      │
│     □ XMLHttpRequest.timeout đủ lớn hoặc = 0                              │
│     □ Không dùng fetch với AbortController timeout ngắn                   │
│     □ Handle progress để detect stuck uploads                              │
│                                                                             │
│     Test: Check browser DevTools Network tab                               │
│                                                                             │
│                                                                             │
│  □ 4. TCP/OS CONFIGURATION                                                 │
│     ────────────────────────                                                │
│     □ tcp_keepalive_time = 60                                             │
│     □ tcp_keepalive_intvl = 10                                            │
│     □ tcp_keepalive_probes = 6                                            │
│                                                                             │
│     Test: sysctl -a | grep keepalive                                      │
│                                                                             │
│                                                                             │
│  □ 5. CLOUD/FIREWALL CONFIGURATION                                         │
│     ─────────────────────────────────                                       │
│     □ AWS ALB idle timeout >= 4000s (max)                                 │
│     □ Cloud firewall không có connection timeout thấp                     │
│     □ Corporate proxy không kill long connections                         │
│                                                                             │
│     Test: Upload từ trong và ngoài firewall                               │
│                                                                             │
│                                                                             │
│  □ 6. MINIO CONFIGURATION                                                  │
│     ──────────────────────                                                  │
│     □ Đủ disk space                                                       │
│     □ Đủ memory                                                           │
│     □ Không bị rate limit                                                 │
│                                                                             │
│     Test: mc admin info myminio                                           │
│                                                                             │
│                                                                             │
│  □ 7. MULTIPART UPLOAD (cho file > 100MB)                                 │
│     ──────────────────────────────────────                                  │
│     □ Sử dụng multipart thay vì single upload                             │
│     □ Part size 5-100MB tùy network                                       │
│     □ Concurrency 3-10 tùy bandwidth                                      │
│     □ Timeout per part 60-120s                                            │
│                                                                             │
│     Test: Upload file 1GB+ với multipart                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Script tự động test timeout configuration:**

```bash
#!/bin/bash
# filepath: scripts/test-upload-timeout.sh

# ===============================================
# Test Upload Timeout Configuration
# ===============================================

set -e

MINIO_ENDPOINT=${1:-"http://localhost:9000"}
BUCKET=${2:-"test-bucket"}
TEST_SIZE_MB=${3:-100}

echo "=============================================="
echo "   Upload Timeout Test"
echo "=============================================="
echo ""
echo "MinIO Endpoint: ${MINIO_ENDPOINT}"
echo "Bucket: ${BUCKET}"
echo "Test file size: ${TEST_SIZE_MB}MB"
echo ""

# Create test file
echo "[1/5] Creating test file..."
TEST_FILE="/tmp/upload-test-${TEST_SIZE_MB}mb.bin"
dd if=/dev/urandom of=${TEST_FILE} bs=1M count=${TEST_SIZE_MB} 2>/dev/null
echo "  Created: ${TEST_FILE}"

# Get presigned URL
echo ""
echo "[2/5] Getting presigned upload URL..."
# (Thay bằng API call thực tế của bạn)
# PRESIGNED_URL=$(curl -s http://localhost:8080/api/upload/presigned-url | jq -r '.url')

# For testing, upload directly to MinIO
PRESIGNED_URL="${// filepath: e:\DaiCuongBK\Project3\FileSharing\client\minio.md
// ...existing code...

---

#### 1.6.7 Xử lý lỗi timeout khi upload file lớn

**Hiểu về Timeout trong Upload Flow:**

Khi upload file lớn, request phải đi qua nhiều components, mỗi component có timeout riêng. Hiểu rõ các loại timeout này là bước đầu tiên để xử lý lỗi hiệu quả.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              CÁC LOẠI TIMEOUT TRONG UPLOAD FLOW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Upload flow qua nhiều components, mỗi component có timeout riêng:         │
│                                                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │ Browser │───►│  Nginx  │───►│ Backend │───►│ MinIO   │───►│  Disk   │  │
│  │         │    │ (Proxy) │    │ (Java)  │    │ Server  │    │   I/O   │  │
│  └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘  │
│       │              │              │              │              │        │
│       ▼              ▼              ▼              ▼              ▼        │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │fetch()  │    │proxy_   │    │HttpClient│   │Connection│   │Write    │  │
│  │timeout  │    │timeout  │    │timeout   │   │timeout   │   │timeout  │  │
│  │(browser)│    │(nginx)  │    │(okhttp)  │   │(minio)   │   │(os)     │  │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
│                                                                             │
│  Mỗi component có thể timeout độc lập → cần cấu hình TẤT CẢ!              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Timeline ví dụ khi upload file 1GB:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              TIMELINE UPLOAD FILE 1GB - VÍ DỤ THỰC TẾ                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Giả định: Network speed ~30 Mbps upload                                   │
│                                                                             │
│  Time        Event                                                         │
│  ────────    ─────────────────────────────────────────────────────────────│
│  0s          Browser bắt đầu gửi request                                   │
│  ~1s         TCP connection established                                    │
│  ~2s         Request headers sent                                          │
│  ~3s         Bắt đầu gửi request body (file data)                         │
│              │                                                             │
│              │  ┌────────────────────────────────────────────────────┐    │
│              │  │ FILE ĐANG ĐƯỢC UPLOAD...                           │    │
│              │  │ 1GB ÷ 30Mbps ≈ 280 giây ≈ 4.7 phút                │    │
│              │  └────────────────────────────────────────────────────┘    │
│              │                                                             │
│  ~60s        ⚠️ NGINX proxy_read_timeout mặc định = 60s                   │
│              │  → Nếu chưa cấu hình: 504 Gateway Timeout!                 │
│              │                                                             │
│  ~120s       ⚠️ Nhiều browser có timeout mặc định ~2 phút                 │
│              │                                                             │
│  ~280s       File upload hoàn tất (nếu không bị timeout)                  │
│  ~281s       MinIO xử lý và lưu file                                       │
│  ~282s       MinIO gửi response (200 OK)                                   │
│  ~283s       Nginx forward response về browser                            │
│  ~284s       Browser nhận response → Upload thành công!                   │
│                                                                             │
│                                                                             │
│  VẤN ĐỀ PHỔ BIẾN:                                                          │
│  ─────────────────                                                          │
│  • Default timeouts thường là 30-60 giây                                   │
│  • File 1GB cần ~5 phút ở tốc độ 30Mbps                                   │
│  • File 5GB cần ~25 phút                                                   │
│  • → Timeout xảy ra TRƯỚC KHI upload xong!                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Các loại lỗi timeout thường gặp:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              CÁC LỖI TIMEOUT THƯỜNG GẶP KHI UPLOAD FILE LỚN                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. NGINX PROXY TIMEOUT (504 Gateway Timeout)                              │
│  ─────────────────────────────────────────────                              │
│     Lỗi hiển thị:                                                          │
│     • "504 Gateway Time-out"                                               │
│     • "upstream timed out (110: Connection timed out)"                     │
│                                                                             │
│     Nguyên nhân:                                                           │
│     • proxy_read_timeout mặc định 60s                                      │
│     • proxy_send_timeout mặc định 60s                                      │
│     • Nginx đợi response từ backend quá lâu                               │
│                                                                             │
│     Log Nginx:                                                             │
│     [error] upstream timed out (110: Connection timed out)                 │
│     while reading response header from upstream                            │
│                                                                             │
│                                                                             │
│  2. BROWSER/FETCH TIMEOUT                                                  │
│  ────────────────────────────                                               │
│     Lỗi hiển thị:                                                          │
│     • "net::ERR_CONNECTION_TIMED_OUT"                                      │
│     • "The operation timed out"                                            │
│     • "Failed to fetch" (với timeout implicit)                             │
│                                                                             │
│     Nguyên nhân:                                                           │
│     • Browser có timeout mặc định (thường 2-5 phút)                       │
│     • fetch() không có timeout mặc định nhưng OS có                       │
│     • XMLHttpRequest.timeout được set quá ngắn                            │
│                                                                             │
│                                                                             │
│  3. JAVA BACKEND TIMEOUT                                                   │
│  ───────────────────────────                                                │
│     Lỗi hiển thị:                                                          │
│     • "java.net.SocketTimeoutException: Read timed out"                   │
│     • "java.net.SocketTimeoutException: connect timed out"                │
│     • "Connection reset by peer"                                           │
│                                                                             │
│     Nguyên nhân:                                                           │
│     • OkHttpClient readTimeout mặc định 10s                               │
│     • MinIO Java SDK timeout                                               │
│     • Spring Boot server timeout                                           │
│                                                                             │
│                                                                             │
│  4. MINIO SERVER TIMEOUT                                                   │
│  ───────────────────────────                                                │
│     Lỗi hiển thị:                                                          │
│     • "RequestTimeTooSkewed"                                               │
│     • "SlowDown - Please reduce your request rate"                        │
│     • Connection đột ngột đóng                                             │
│                                                                             │
│     Nguyên nhân:                                                           │
│     • Server quá tải                                                       │
│     • Disk I/O chậm                                                        │
│     • Network latency cao                                                  │
│                                                                             │
│                                                                             │
│  5. TCP KEEPALIVE TIMEOUT                                                  │
│  ────────────────────────────                                               │
│     Lỗi hiển thị:                                                          │
│     • Connection đột ngột bị đóng không có error message rõ ràng          │
│     • "Connection reset"                                                   │
│                                                                             │
│     Nguyên nhân:                                                           │
│     • Firewall/Load balancer đóng idle connections                        │
│     • NAT table timeout                                                    │
│     • Cloud provider connection limits                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Cấu hình timeout cho Nginx - Chi tiết:**

```nginx
# filepath: /etc/nginx/conf.d/minio-upload.conf
# Cấu hình Nginx tối ưu cho upload file lớn

# ===============================================
# UPSTREAM CONFIGURATION
# ===============================================
upstream minio_backend {
    server 127.0.0.1:9000;
    
    # Keepalive connections để reuse
    # Quan trọng: giảm overhead của TCP handshake
    keepalive 64;
    keepalive_requests 1000;
    keepalive_timeout 3600s;
}

server {
    listen 443 ssl http2;
    server_name minio.example.com;

    # SSL configuration...
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # ===============================================
    # CRITICAL: BODY SIZE CONFIGURATION
    # ===============================================
    
    # Không giới hạn body size
    # Mặc định Nginx limit 1MB - quá nhỏ cho file upload!
    # Set 0 = unlimited
    client_max_body_size 0;
    
    # Giải thích:
    # • client_max_body_size 1m;   → Max 1MB (default)
    # • client_max_body_size 100m; → Max 100MB
    # • client_max_body_size 0;    → Unlimited (recommended cho MinIO)


    # ===============================================
    # CRITICAL: BUFFERING CONFIGURATION
    # ===============================================
    
    # TẮT proxy buffering cho upload
    # Nếu BẬT: Nginx đọc TOÀN BỘ request body vào buffer/disk
    #          trước khi forward đến MinIO
    #          → Tốn RAM/disk, delay, có thể gây timeout
    # Nếu TẮT: Nginx stream trực tiếp đến MinIO
    #          → Nhanh hơn, ít resource hơn
    proxy_buffering off;
    
    # TẮT request body buffering
    # Tương tự như trên, cho request body
    proxy_request_buffering off;
    
    # Cho phép chunked transfer encoding
    # Quan trọng cho streaming upload
    chunked_transfer_encoding on;


    # ===============================================
    # TIMEOUT CONFIGURATION - CHI TIẾT
    # ===============================================
    
    # 1. PROXY_CONNECT_TIMEOUT
    # ─────────────────────────
    # Thời gian chờ để thiết lập connection đến backend (MinIO)
    # 
    # Timeline:
    # Client → Nginx → [CONNECT_TIMEOUT] → MinIO
    #
    # Không cần quá dài vì:
    # • MinIO thường cùng server hoặc cùng network
    # • Nếu connect mất >60s thường là có vấn đề
    proxy_connect_timeout 60s;
    
    
    # 2. PROXY_SEND_TIMEOUT
    # ──────────────────────
    # Thời gian chờ giữa 2 WRITE operations liên tiếp đến backend
    # KHÔNG PHẢI tổng thời gian gửi toàn bộ request!
    #
    # Ví dụ:
    # • Gửi chunk 1 → OK
    # • Chờ 3500s không gửi gì → TIMEOUT!
    # • Gửi chunk 2 → Reset timer
    #
    # Set cao vì:
    # • Slow clients có thể gửi data chậm
    # • Network có thể có latency spikes
    proxy_send_timeout 3600s;  # 1 giờ
    
    
    # 3. PROXY_READ_TIMEOUT
    # ──────────────────────
    # Thời gian chờ giữa 2 READ operations liên tiếp từ backend
    # KHÔNG PHẢI tổng thời gian đọc response!
    #
    # Quan trọng nhất cho upload vì:
    # • Upload file → MinIO xử lý → Response
    # • MinIO cần thời gian xử lý file lớn
    # • Nếu timeout trước khi MinIO response → 504
    proxy_read_timeout 3600s;  # 1 giờ
    
    
    # 4. SEND_TIMEOUT
    # ────────────────
    # Thời gian chờ giữa 2 WRITE operations đến CLIENT
    # (Nginx → Browser)
    #
    # Ít quan trọng hơn cho upload, quan trọng cho download
    send_timeout 3600s;  # 1 giờ


    # ===============================================
    # KEEPALIVE CONFIGURATION
    # ===============================================
    
    # Client keepalive
    # Giữ connection với client alive
    keepalive_timeout 3600s;
    keepalive_requests 1000;
    
    # Sử dụng HTTP/1.1 với backend
    # HTTP/1.1 hỗ trợ keepalive, HTTP/1.0 thì không
    proxy_http_version 1.1;
    
    # Không gửi "Connection: close" header
    # Giữ connection để reuse
    proxy_set_header Connection "";


    # ===============================================
    # LOCATION BLOCK CHO UPLOAD
    # ===============================================
    location / {
        proxy_pass http://minio_backend;
        
        # Forward headers
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Chunked transfer support
        proxy_set_header Transfer-Encoding $http_transfer_encoding;
    }

    # ===============================================
    # LOGGING ĐỂ DEBUG TIMEOUT
    # ===============================================
    # Log format bao gồm timing information
    log_format upload_timing '$remote_addr - $remote_user [$time_local] '
                             '"$request" $status $body_bytes_sent '
                             '"$http_referer" "$http_user_agent" '
                             'rt=$request_time '
                             'uct=$upstream_connect_time '
                             'uht=$upstream_header_time '
                             'urt=$upstream_response_time';
    
    access_log /var/log/nginx/minio-upload.log upload_timing;
    error_log /var/log/nginx/minio-error.log warn;
}
```

**Giải thích chi tiết về các timeout trong Nginx:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              NGINX TIMEOUT - GIẢI THÍCH TRỰC QUAN                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  UPLOAD FLOW VỚI TIMEOUT:                                                  │
│                                                                             │
│  Browser                    Nginx                      MinIO               │
│     │                         │                          │                 │
│     │                         │                          │                 │
│     │  ══════ Upload File (streaming) ══════════════════►│                 │
│     │        │                │                          │                 │
│     │        │                │                          │                 │
│     │  [Data chunk 1] ───────►│                          │                 │
│     │        │                │──[proxy_send_timeout]───►│                 │
│     │        │                │        │                 │                 │
│     │  [Data chunk 2] ───────►│        │                 │                 │
│     │        │                │───────►│                 │                 │
│     │        │                │        │                 │                 │
│     │  [Data chunk N] ───────►│        ▼                 │                 │
│     │        │                │───────────────────────────►                │
│     │        │                │                          │                 │
│     │        │                │                          │ Processing...   │
│     │        │                │                          │                 │
│     │        │                │  [proxy_read_timeout]    │                 │
│     │        │                │◄─────────────────────────│                 │
│     │        │                │        │                 │                 │
│     │        │                │        ▼                 │                 │
│     │◄───────────────────────│◄──── Response ───────────│                 │
│     │  [send_timeout]        │                          │                 │
│     │                         │                          │                 │
│                                                                             │
│                                                                             │
│  QUAN TRỌNG:                                                               │
│  ───────────                                                                │
│  • proxy_send_timeout: Reset mỗi khi GỬI data chunk đến MinIO             │
│  • proxy_read_timeout: Reset mỗi khi NHẬN data từ MinIO                   │
│  • Không phải "total time" mà là "idle time between operations"           │
│                                                                             │
│  VÍ DỤ:                                                                    │
│  • proxy_read_timeout = 60s                                                │
│  • Upload 1GB mất 5 phút                                                   │
│  • MinIO response sau 5 phút                                               │
│  • → TIMEOUT! (vì không có data trong 5 phút > 60s)                       │
│                                                                             │
│  GIẢI PHÁP:                                                                │
│  • Set proxy_read_timeout >= thời gian upload + processing                │
│  • Hoặc sử dụng streaming response để keep connection alive               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Cấu hình timeout cho MinIO Java SDK:**

```java
// filepath: src/main/java/com/example/minio/config/MinioConfig.java

package com.example.minio.config;

import io.minio.MinioClient;
import okhttp3.OkHttpClient;
import okhttp3.ConnectionPool;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Configuration
public class MinioConfig {

    @Value("${minio.endpoint}")
    private String endpoint;

    @Value("${minio.access-key}")
    private String accessKey;

    @Value("${minio.secret-key}")
    private String secretKey;

    /**
     * Tạo MinIO Client với timeout configuration tối ưu cho file lớn
     */
    @Bean
    public MinioClient minioClient() {
        // ===============================================
        // CUSTOM HTTP CLIENT VỚI EXTENDED TIMEOUTS
        // ===============================================
        OkHttpClient httpClient = new OkHttpClient.Builder()
            
            // ─────────────────────────────────────────────
            // CONNECTION TIMEOUT
            // ─────────────────────────────────────────────
            // Thời gian chờ để thiết lập TCP connection
            // Thường không cần quá dài vì MinIO cùng network
            .connectTimeout(60, TimeUnit.SECONDS)
            
            // ─────────────────────────────────────────────
            // READ TIMEOUT
            // ─────────────────────────────────────────────
            // Thời gian chờ giữa 2 read operations
            // QUAN TRỌNG cho download file lớn
            // 
            // Ví dụ: Download file 1GB
            // • MinIO đọc từ disk → gửi về client
            // • Nếu disk slow, có thể >10s giữa các chunks
            // • Set cao để tránh timeout
            .readTimeout(3600, TimeUnit.SECONDS)  // 1 giờ
            
            // ─────────────────────────────────────────────
            // WRITE TIMEOUT
            // ─────────────────────────────────────────────
            // Thời gian chờ giữa 2 write operations
            // QUAN TRỌNG cho upload file lớn
            //
            // Ví dụ: Upload file 1GB
            // • Client gửi data → MinIO nhận
            // • Nếu network slow, có thể delay giữa chunks
            // • Set cao để tránh timeout
            .writeTimeout(3600, TimeUnit.SECONDS)  // 1 giờ
            
            // ─────────────────────────────────────────────
            // CALL TIMEOUT
            // ─────────────────────────────────────────────
            // Timeout cho TOÀN BỘ HTTP call (từ request đến response)
            // Bao gồm: connect + send request + receive response
            //
            // Set 0 để disable (sử dụng read/write timeout thay thế)
            // Nếu set giá trị, phải >= thời gian upload + processing
            .callTimeout(0, TimeUnit.SECONDS)  // Disable
            
            // ─────────────────────────────────────────────
            // CONNECTION POOL
            // ─────────────────────────────────────────────
            // Reuse connections để giảm overhead
            .connectionPool(new ConnectionPool(
                10,                    // Max idle connections
                5, TimeUnit.MINUTES    // Keep alive time
            ))
            
            // ─────────────────────────────────────────────
            // RETRY
            // ─────────────────────────────────────────────
            // Tự động retry khi connection fail
            .retryOnConnectionFailure(true)
            
            .build();

        // ===============================================
        // TẠO MINIO CLIENT
        // ===============================================
        return MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .httpClient(httpClient)
                .build();
    }
}
```

**Cấu hình timeout cho Spring Boot (nếu dùng làm backend):**

```yaml
# filepath: src/main/resources/application.yml

server:
  # ===============================================
  # TOMCAT TIMEOUT CONFIGURATION
  # ===============================================
  
  # Connection timeout - thời gian chờ connection được thiết lập
  connection-timeout: 60000  # 60 seconds (milliseconds)
  
  # Tomcat specific settings
  tomcat:
    # Max threads để xử lý requests
    max-threads: 200
    
    # Connection timeout
    connection-timeout: 60000
    
    # Keep-alive timeout
    keep-alive-timeout: 60000
    
    # Max keep-alive requests
    max-keep-alive-requests: 100

spring:
  servlet:
    multipart:
      # ===============================================
      # MULTIPART UPLOAD CONFIGURATION
      # ===============================================
      
      # Enable multipart upload
      enabled: true
      
      # Max file size (set -1 for unlimited)
      max-file-size: -1
      
      # Max request size (set -1 for unlimited)
      max-request-size: -1
      
      # Threshold để switch từ memory sang disk
      # Files > threshold sẽ được lưu tạm vào disk
      file-size-threshold: 10MB
      
      # Thư mục lưu file tạm
      location: ${java.io.tmpdir}

  # ===============================================
  # ASYNC CONFIGURATION (cho streaming)
  # ===============================================
  mvc:
    async:
      # Timeout cho async requests
      request-timeout: 3600000  # 1 hour (milliseconds)

# ===============================================
# MINIO CONFIGURATION
# ===============================================
minio:
  endpoint: http://localhost:9000
  access-key: minioadmin
  secret-key: minioadmin
  
  # Custom timeout settings
  timeout:
    connect: 60        # seconds
    read: 3600         # seconds (1 hour)
    write: 3600        # seconds (1 hour)
```

**Cấu hình timeout cho TypeScript Client:**

```typescript
// filepath: src/utils/uploadWithTimeout.ts

/**
 * Interface cho upload configuration
 */
interface UploadConfig {
    // Timeout cho toàn bộ upload (milliseconds)
    timeout: number;
    
    // Callback khi có progress
    onProgress?: (progress: UploadProgress) => void;
    
    // Callback khi upload bị abort
    onAbort?: () => void;
    
    // Số lần retry khi fail
    maxRetries?: number;
    
    // Delay giữa các lần retry (milliseconds)
    retryDelay?: number;
}

interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
    speed: number;        // bytes/second
    remainingTime: number; // seconds
}

interface UploadResult {
    success: boolean;
    etag?: string;
    error?: string;
    aborted?: boolean;
}

/**
 * Upload file với XMLHttpRequest (hỗ trợ progress và timeout tốt hơn fetch)
 */
function uploadWithXHR(
    url: string,
    file: File,
    config: UploadConfig
): Promise<UploadResult> {
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        const startTime = Date.now();
        let lastLoaded = 0;
        let lastTime = startTime;

        // ===============================================
        // PROGRESS TRACKING
        // ===============================================
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && config.onProgress) {
                const now = Date.now();
                const timeDiff = (now - lastTime) / 1000; // seconds
                const loadedDiff = event.loaded - lastLoaded;
                
                // Tính speed (bytes/second)
                const speed = timeDiff > 0 ? loadedDiff / timeDiff : 0;
                
                // Tính remaining time
                const remaining = event.total - event.loaded;
                const remainingTime = speed > 0 ? remaining / speed : 0;
                
                config.onProgress({
                    loaded: event.loaded,
                    total: event.total,
                    percentage: (event.loaded / event.total) * 100,
                    speed: speed,
                    remainingTime: remainingTime
                });
                
                lastLoaded = event.loaded;
                lastTime = now;
            }
        };

        // ===============================================
        // SUCCESS HANDLER
        // ===============================================
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const etag = xhr.getResponseHeader('ETag');
                console.log(`Upload completed in ${(Date.now() - startTime) / 1000}s`);
                resolve({
                    success: true,
                    etag: etag || undefined
                });
            } else {
                resolve({
                    success: false,
                    error: `HTTP ${xhr.status}: ${xhr.statusText}`
                });
            }
        };

        // ===============================================
        // ERROR HANDLERS
        // ===============================================
        xhr.onerror = () => {
            console.error('Upload network error');
            resolve({
                success: false,
                error: 'Network error - connection may have been lost'
            });
        };

        xhr.onabort = () => {
            console.log('Upload aborted');
            if (config.onAbort) {
                config.onAbort();
            }
            resolve({
                success: false,
                error: 'Upload was cancelled',
                aborted: true
            });
        };

        xhr.ontimeout = () => {
            console.error(`Upload timeout after ${config.timeout}ms`);
            resolve({
                success: false,
                error: `Upload timed out after ${config.timeout / 1000} seconds`
            });
        };

        // ===============================================
        // CONFIGURE REQUEST
        // ===============================================
        xhr.open('PUT', url);
        
        // Set timeout
        // LƯU Ý: XHR timeout tính từ khi gọi send() đến khi nhận response
        // Với file lớn, cần set timeout rất cao hoặc 0 (unlimited)
        xhr.timeout = config.timeout;
        
        // Set Content-Type
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        
        // Send file
        xhr.send(file);
    });
}

/**
 * Upload với retry logic
 */
async function uploadWithRetry(
    getPresignedUrl: () => Promise<string>,
    file: File,
    config: UploadConfig
): Promise<UploadResult> {
    const maxRetries = config.maxRetries || 3;
    const retryDelay = config.retryDelay || 2000;
    
    let lastError = '';
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`Upload attempt ${attempt}/${maxRetries}`);
        
        try {
            // Lấy presigned URL mới cho mỗi attempt
            // (URL cũ có thể đã expire)
            const presignedUrl = await getPresignedUrl();
            
            const result = await uploadWithXHR(presignedUrl, file, config);
            
            if (result.success) {
                return result;
            }
            
            // Nếu bị abort, không retry
            if (result.aborted) {
                return result;
            }
            
            lastError = result.error || 'Unknown error';
            
            // Check if error is retryable
            if (!isRetryableError(lastError)) {
                console.log(`Non-retryable error: ${lastError}`);
                return result;
            }
            
        } catch (error) {
            lastError = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Attempt ${attempt} failed:`, lastError);
        }
        
        // Wait before retry (với exponential backoff)
        if (attempt < maxRetries) {
            const delay = retryDelay * Math.pow(2, attempt - 1);
            console.log(`Waiting ${delay}ms before retry...`);
            await sleep(delay);
        }
    }
    
    return {
        success: false,
        error: `Upload failed after ${maxRetries} attempts. Last error: ${lastError}`
    };
}

/**
 * Kiểm tra error có nên retry không
 */
function isRetryableError(error: string): boolean {
    const retryablePatterns = [
        'timeout',
        'timed out',
        'network',
        'connection',
        'ECONNRESET',
        'ETIMEDOUT',
        'ECONNABORTED',
        '502',
        '503',
        '504',
        'gateway'
    ];
    
    const lowerError = error.toLowerCase();
    return retryablePatterns.some(pattern => 
        lowerError.includes(pattern.toLowerCase())
    );
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ===============================================
// EXAMPLE USAGE
// ===============================================

/**
 * Ví dụ sử dụng upload với timeout configuration
 */
async function exampleUpload(file: File) {
    const config: UploadConfig = {
        // Timeout 1 giờ cho file lớn
        timeout: 60 * 60 * 1000,  // 1 hour in milliseconds
        
        // Progress callback
        onProgress: (progress) => {
            console.log(`Progress: ${progress.percentage.toFixed(1)}%`);
            console.log(`Speed: ${formatBytes(progress.speed)}/s`);
            console.log(`Remaining: ${formatTime(progress.remainingTime)}`);
        },
        
        // Abort callback
        onAbort: () => {
            console.log('Upload was cancelled by user');
        },
        
        // Retry configuration
        maxRetries: 3,
        retryDelay: 2000
    };
    
    // Function để lấy presigned URL từ backend
    const getPresignedUrl = async () => {
        const response = await fetch('/api/upload/presigned-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filename: file.name,
                contentType: file.type,
                fileSize: file.size
            })
        });
        const data = await response.json();
        return data.presignedUrl;
    };
    
    const result = await uploadWithRetry(getPresignedUrl, file, config);
    
    if (result.success) {
        console.log('Upload successful! ETag:', result.etag);
    } else {
        console.error('Upload failed:', result.error);
    }
    
    return result;
}

// Helper functions
function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatTime(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
}

export { 
    uploadWithXHR, 
    uploadWithRetry, 
    UploadConfig, 
    UploadProgress, 
    UploadResult 
};
```

**Cấu hình TCP Keepalive để tránh connection bị đóng:**

```bash
#!/bin/bash
# filepath: scripts/configure-tcp-keepalive.sh

# ===============================================
# TCP KEEPALIVE CONFIGURATION
# ===============================================
# Keepalive giúp giữ connection alive khi không có data
# Quan trọng khi upload file lớn qua firewall/load balancer

echo "Configuring TCP Keepalive settings..."

# ─────────────────────────────────────────────
# tcp_keepalive_time
# ─────────────────────────────────────────────
# Thời gian (giây) sau khi connection idle mới gửi keepalive probe
# Default: 7200 (2 giờ) - quá dài!
# Khuyến nghị: 60 giây
sudo sysctl -w net.ipv4.tcp_keepalive_time=60

# ─────────────────────────────────────────────
# tcp_keepalive_intvl
# ─────────────────────────────────────────────
# Khoảng cách (giây) giữa các keepalive probes
# Default: 75
# Khuyến nghị: 10 giây
sudo sysctl -w net.ipv4.tcp_keepalive_intvl=10

# ─────────────────────────────────────────────
# tcp_keepalive_probes
# ─────────────────────────────────────────────
# Số lần gửi keepalive probe trước khi đóng connection
# Default: 9
# Khuyến nghị: 6
sudo sysctl -w net.ipv4.tcp_keepalive_probes=6

# ─────────────────────────────────────────────
# PERSIST SETTINGS
# ─────────────────────────────────────────────
# Lưu vào /etc/sysctl.conf để persist qua reboot

cat >> /etc/sysctl.conf << EOF

# TCP Keepalive settings for large file uploads
net.ipv4.tcp_keepalive_time = 60
net.ipv4.tcp_keepalive_intvl = 10
net.ipv4.tcp_keepalive_probes = 6
EOF

# Apply changes
sudo sysctl -p

echo "TCP Keepalive configured:"
echo "  tcp_keepalive_time:   $(sysctl -n net.ipv4.tcp_keepalive_time) seconds"
echo "  tcp_keepalive_intvl:  $(sysctl -n net.ipv4.tcp_keepalive_intvl) seconds"
echo "  tcp_keepalive_probes: $(sysctl -n net.ipv4.tcp_keepalive_probes)"
echo ""
echo "Connection will be probed after $(sysctl -n net.ipv4.tcp_keepalive_time)s of idle"
echo "Total timeout: $(($(sysctl -n net.ipv4.tcp_keepalive_time) + $(sysctl -n net.ipv4.tcp_keepalive_intvl) * $(sysctl -n net.ipv4.tcp_keepalive_probes)))s"
```

**Giải pháp Multipart Upload để tránh timeout:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              MULTIPART UPLOAD - GIẢI PHÁP CHO FILE LỚN                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  VẤN ĐỀ VỚI SINGLE UPLOAD:                                                │
│  ──────────────────────────                                                 │
│                                                                             │
│  File 1GB, upload speed 30Mbps:                                            │
│  • Total time: ~5 phút                                                     │
│  • Timeout risk: CAO (default timeout thường 60s)                         │
│  • Nếu fail ở 99%: Phải upload lại từ đầu!                               │
│  • Memory usage: Có thể phải load toàn bộ file vào RAM                    │
│                                                                             │
│                                                                             │
│  GIẢI PHÁP MULTIPART UPLOAD:                                               │
│  ────────────────────────────                                               │
│                                                                             │
│  File 1GB, chia thành 100 parts x 10MB:                                    │
│  • Mỗi part upload riêng biệt với timeout ngắn                            │
│  • Mỗi part có thể retry độc lập                                          │
│  • Nếu 1 part fail: Chỉ retry part đó, không mất data đã upload           │
│  • Có thể upload parallel nhiều parts → nhanh hơn                         │
│  • Memory efficient: Chỉ cần buffer 1 part tại một thời điểm              │
│                                                                             │
│                                                                             │
│  SO SÁNH TRỰC QUAN:                                                        │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ SINGLE UPLOAD (1GB file)                                            │   │
│  │                                                                     │   │
│  │ ████████████████████████████████████████████████████████████████   │   │
│  │ 0%                        50%                               100%   │   │
│  │ ◄────────────────── 5 phút liên tục ──────────────────────►        │   │
│  │                                                                     │   │
│  │ Timeout risk: ████████████████████████████████████ HIGH            │   │
│  │ Nếu fail ở 80%: Mất hết 800MB đã upload!                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ MULTIPART UPLOAD (1GB = 20 parts x 50MB, concurrency = 5)          │   │
│  │                                                                     │   │
│  │ Batch 1 (parallel):                                                │   │
│  │ ┌────┐┌────┐┌────┐┌────┐┌────┐                                    │   │
│  │ │ P1 ││ P2 ││ P3 ││ P4 ││ P5 │  ← 5 parts upload đồng thời       │   │
│  │ └────┘└────┘└────┘└────┘└────┘                                    │   │
│  │ ◄──────── ~30 giây ────────►                                       │   │
│  │                                                                     │   │
│  │ Batch 2 (parallel):                                                │   │
│  │ ┌────┐┌────┐┌────┐┌────┐┌────┐                                    │   │
│  │ │ P6 ││ P7 ││ P8 ││ P9 ││P10 │                                    │   │
│  │ └────┘└────┘└────┘└────┘└────┘                                    │   │
│  │ ◄──────── ~30 giây ────────►                                       │   │
│  │                                                                     │   │
│  │ ... (tiếp tục với batch 3, 4)                                      │   │
│  │                                                                     │   │
│  │ Total time: ~2 phút (nhanh hơn 2.5x so với single upload!)        │   │
│  │ Timeout risk: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ LOW                    │   │
│  │ Nếu P8 fail: Chỉ retry P8, giữ nguyên 7 parts đã upload           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Luồng Multipart Upload chi tiết:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              MULTIPART UPLOAD - LUỒNG XỬ LÝ CHI TIẾT                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Client                     Backend                      MinIO             │
│  (Browser)                  (Java)                                         │
│     │                          │                           │               │
│     │                          │                           │               │
│  ═══════════════════ PHASE 1: INITIATE ════════════════════               │
│     │                          │                           │               │
│     │  POST /api/multipart/    │                           │               │
│     │       initiate           │                           │               │
│     │─────────────────────────►│                           │               │
│     │  {bucket, key,           │                           │               │
│     │   contentType, size}     │                           │               │
│     │                          │                           │               │
│     │                          │  createMultipartUpload()  │               │
│     │                          │──────────────────────────►│               │
│     │                          │                           │               │
│     │                          │◄──────────────────────────│               │
│     │                          │       uploadId            │               │
│     │                          │                           │               │
│     │◄─────────────────────────│                           │               │
│     │  {uploadId, partSize}    │                           │               │
│     │                          │                           │               │
│     │                          │                           │               │
│  ═══════════════════ PHASE 2: GET PRESIGNED URLs ══════════               │
│     │                          │                           │               │
│     │  POST /api/multipart/    │                           │               │
│     │       presigned-urls     │                           │               │
│     │─────────────────────────►│                           │               │
│     │  {uploadId, partNumbers: │                           │               │
│     │   [1,2,3,4,5,...]}       │                           │               │
│     │                          │                           │               │
│     │                          │  getPresignedUrl() x N    │               │
│     │                          │──────────────────────────►│               │
│     │                          │                           │               │
│     │◄─────────────────────────│                           │               │
│     │  {urls: [url1, url2,...]}│                           │               │
│     │                          │                           │               │
│     │                          │                           │               │
│  ═══════════════════ PHASE 3: UPLOAD PARTS ════════════════               │
│     │                          │                           │               │
│     │  (Browser uploads directly to MinIO using presigned URLs)           │
│     │                          │                           │               │
│     │  PUT url1 (Part 1)       │                           │               │
│     │───────────────────────────────────────────────────►│               │
│     │                          │                           │               │
│     │◄───────────────────────────────────────────────────│               │
│     │  200 OK, ETag: "abc123"  │                           │               │
│     │                          │                           │               │
│     │  PUT url2 (Part 2)       │                           │               │
│     │───────────────────────────────────────────────────►│  (parallel)   │
│     │                          │                           │               │
│     │  PUT url3 (Part 3)       │                           │               │
│     │───────────────────────────────────────────────────►│  (parallel)   │
│     │                          │                           │               │
│     │  ... (upload all parts)  │                           │               │
│     │                          │                           │               │
│     │◄───────────────────────────────────────────────────│               │
│     │  All ETags collected     │                           │               │
│     │                          │                           │               │
│     │                          │                           │               │
│  ═══════════════════ PHASE 4: COMPLETE ════════════════════               │
│     │                          │                           │               │
│     │  POST /api/multipart/    │                           │               │
│     │       complete           │                           │               │
│     │─────────────────────────►│                           │               │
│     │  {uploadId, parts: [     │                           │               │
│     │    {partNumber: 1,       │                           │               │
│     │     etag: "abc123"},     │                           │               │
│     │    {partNumber: 2,       │                           │               │
│     │     etag: "def456"},     │                           │               │
│     │    ...                   │                           │               │
│     │  ]}                      │                           │               │
│     │                          │                           │               │
│     │                          │  completeMultipartUpload()│               │
│     │                          │──────────────────────────►│               │
│     │                          │                           │               │
│     │                          │◄──────────────────────────│               │
│     │                          │       200 OK              │               │
│     │                          │                           │               │
│     │◄─────────────────────────│                           │               │
│     │  {success: true,         │                           │               │
│     │   objectKey, etag}       │                           │               │
│     │                          │                           │               │
│  ══════════════════════════════════════════════════════════               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Java Backend - Multipart Upload Service:**

```java
// filepath: src/main/java/com/example/minio/service/MultipartUploadService.java

package com.example.minio.service;

import io.minio.*;
import io.minio.http.Method;
import io.minio.messages.Part;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class MultipartUploadService {

    private final MinioClient minioClient;
    
    @Value("${minio.bucket}")
    private String defaultBucket;
    
    // Part size: MinIO yêu cầu tối thiểu 5MB cho mỗi part (trừ part cuối)
    private static final long MIN_PART_SIZE = 5 * 1024 * 1024;  // 5MB
    private static final long DEFAULT_PART_SIZE = 50 * 1024 * 1024;  // 50MB
    private static final long MAX_PART_SIZE = 5L * 1024 * 1024 * 1024;  // 5GB (max theo S3 spec)
    
    // Presigned URL expiry
    private static final int PRESIGNED_URL_EXPIRY_MINUTES = 60;
    
    public MultipartUploadService(MinioClient minioClient) {
        this.minioClient = minioClient;
    }
    
    /**
     * Initiate multipart upload
     * Trả về uploadId và thông tin để client chia file
     */
    public InitiateResponse initiateMultipartUpload(
            String bucket,
            String objectKey,
            String contentType,
            long fileSize
    ) throws Exception {
        
        if (bucket == null || bucket.isEmpty()) {
            bucket = defaultBucket;
        }
        
        // Tính toán part size phù hợp
        long partSize = calculateOptimalPartSize(fileSize);
        int totalParts = (int) Math.ceil((double) fileSize / partSize);
        
        // Validate
        if (totalParts > 10000) {
            // S3/MinIO limit: max 10000 parts
            partSize = (long) Math.ceil((double) fileSize / 10000);
            totalParts = (int) Math.ceil((double) fileSize / partSize);
        }
        
        // Initiate multipart upload với MinIO
        CreateMultipartUploadResponse response = minioClient.createMultipartUpload(
            CreateMultipartUploadArgs.builder()
                .bucket(bucket)
                .object(objectKey)
                .contentType(contentType)
                .build()
        );
        
        String uploadId = response.result().uploadId();
        
        return new InitiateResponse(
            uploadId,
            bucket,
            objectKey,
            partSize,
            totalParts,
            fileSize
        );
    }
    
    /**
     * Tính toán part size tối ưu dựa trên file size
     */
    private long calculateOptimalPartSize(long fileSize) {
        // File nhỏ: dùng part size nhỏ
        if (fileSize < 100 * 1024 * 1024) {  // < 100MB
            return Math.max(MIN_PART_SIZE, fileSize / 10);
        }
        
        // File trung bình: 50MB per part
        if (fileSize < 5L * 1024 * 1024 * 1024) {  // < 5GB
            return DEFAULT_PART_SIZE;
        }
        
        // File lớn: tính để có ~100 parts
        long calculatedSize = fileSize / 100;
        return Math.min(MAX_PART_SIZE, Math.max(MIN_PART_SIZE, calculatedSize));
    }
    
    /**
     * Tạo presigned URLs cho các parts
     */
    public List<PresignedPartUrl> getPresignedUrls(
            String bucket,
            String objectKey,
            String uploadId,
            List<Integer> partNumbers
    ) throws Exception {
        
        List<PresignedPartUrl> urls = new ArrayList<>();
        
        for (Integer partNumber : partNumbers) {
            String url = minioClient.getPresignedObjectUrl(
                GetPresignedObjectUrlArgs.builder()
                    .method(Method.PUT)
                    .bucket(bucket)
                    .object(objectKey)
                    .expiry(PRESIGNED_URL_EXPIRY_MINUTES, TimeUnit.MINUTES)
                    .extraQueryParams(Map.of(
                        "uploadId", uploadId,
                        "partNumber", String.valueOf(partNumber)
                    ))
                    .build()
            );
            
            urls.add(new PresignedPartUrl(partNumber, url));
        }
        
        return urls;
    }
    
    /**
     * Complete multipart upload
     * Ghép các parts thành object hoàn chỉnh
     */
    public CompleteResponse completeMultipartUpload(
            String bucket,
            String objectKey,
            String uploadId,
            List<PartInfo> parts
    ) throws Exception {
        
        // Chuyển đổi sang format MinIO cần
        Part[] partsArray = parts.stream()
            .sorted(Comparator.comparingInt(PartInfo::getPartNumber))
            .map(p -> new Part(p.getPartNumber(), p.getEtag()))
            .toArray(Part[]::new);
        
        // Complete upload
        ObjectWriteResponse response = minioClient.completeMultipartUpload(
            CompleteMultipartUploadArgs.builder()
                .bucket(bucket)
                .object(objectKey)
                .uploadId(uploadId)
                .parts(partsArray)
                .build()
        );
        
        return new CompleteResponse(
            true,
            objectKey,
            response.etag(),
            response.versionId()
        );
    }
    
    /**
     * Abort multipart upload
     * Gọi khi có lỗi hoặc user cancel
     */
    public void abortMultipartUpload(
            String bucket,
            String objectKey,
            String uploadId
    ) throws Exception {
        
        minioClient.abortMultipartUpload(
            AbortMultipartUploadArgs.builder()
                .bucket(bucket)
                .object(objectKey)
                .uploadId(uploadId)
                .build()
        );
    }
    
    /**
     * List incomplete multipart uploads
     * Dùng để cleanup các uploads bị bỏ dở
     */
    public List<IncompleteUpload> listIncompleteUploads(String bucket) throws Exception {
        List<IncompleteUpload> uploads = new ArrayList<>();
        
        Iterable<Result<io.minio.messages.Upload>> results = 
            minioClient.listIncompleteUploads(
                ListIncompleteUploadsArgs.builder()
                    .bucket(bucket)
                    .build()
            );
        
        for (Result<io.minio.messages.Upload> result : results) {
            io.minio.messages.Upload upload = result.get();
            uploads.add(new IncompleteUpload(
                upload.objectName(),
                upload.uploadId(),
                upload.initiated()
            ));
        }
        
        return uploads;
    }
    
    // ===============================================
    // DATA CLASSES
    // ===============================================
    
    public record InitiateResponse(
        String uploadId,
        String bucket,
        String objectKey,
        long partSize,
        int totalParts,
        long fileSize
    ) {}
    
    public record PresignedPartUrl(
        int partNumber,
        String url
    ) {}
    
    public record PartInfo(
        int partNumber,
        String etag
    ) {
        public int getPartNumber() { return partNumber; }
        public String getEtag() { return etag; }
    }
    
    public record CompleteResponse(
        boolean success,
        String objectKey,
        String etag,
        String versionId
    ) {}
    
    public record IncompleteUpload(
        String objectKey,
        String uploadId,
        java.time.ZonedDateTime initiated
    ) {}
}
```

**Java Backend - REST Controller:**

```java
// filepath: src/main/java/com/example/minio/controller/MultipartUploadController.java

package com.example.minio.controller;

import com.example.minio.service.MultipartUploadService;
import com.example.minio.service.MultipartUploadService.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/multipart")
@CrossOrigin(origins = "*")  // Cấu hình CORS cho frontend
public class MultipartUploadController {

    private final MultipartUploadService uploadService;
    
    public MultipartUploadController(MultipartUploadService uploadService) {
        this.uploadService = uploadService;
    }
    
    /**
     * Initiate multipart upload
     */
    @PostMapping("/initiate")
    public ResponseEntity<InitiateResponse> initiate(
            @RequestBody InitiateRequest request
    ) {
        try {
            InitiateResponse response = uploadService.initiateMultipartUpload(
                request.bucket(),
                request.objectKey(),
                request.contentType(),
                request.fileSize()
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Get presigned URLs for parts
     */
    @PostMapping("/presigned-urls")
    public ResponseEntity<PresignedUrlsResponse> getPresignedUrls(
            @RequestBody PresignedUrlsRequest request
    ) {
        try {
            List<PresignedPartUrl> urls = uploadService.getPresignedUrls(
                request.bucket(),
                request.objectKey(),
                request.uploadId(),
                request.partNumbers()
            );
            return ResponseEntity.ok(new PresignedUrlsResponse(urls));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Complete multipart upload
     */
    @PostMapping("/complete")
    public ResponseEntity<CompleteResponse> complete(
            @RequestBody CompleteRequest request
    ) {
        try {
            CompleteResponse response = uploadService.completeMultipartUpload(
                request.bucket(),
                request.objectKey(),
                request.uploadId(),
                request.parts()
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Abort multipart upload
     */
    @PostMapping("/abort")
    public ResponseEntity<Map<String, Boolean>> abort(
            @RequestBody AbortRequest request
    ) {
        try {
            uploadService.abortMultipartUpload(
                request.bucket(),
                request.objectKey(),
                request.uploadId()
            );
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("success", false));
        }
    }
    
    // ===============================================
    // REQUEST/RESPONSE DTOs
    // ===============================================
    
    public record InitiateRequest(
        String bucket,
        String objectKey,
        String contentType,
        long fileSize
    ) {}
    
    public record PresignedUrlsRequest(
        String bucket,
        String objectKey,
        String uploadId,
        List<Integer> partNumbers
    ) {}
    
    public record PresignedUrlsResponse(
        List<PresignedPartUrl> urls
    ) {}
    
    public record CompleteRequest(
        String bucket,
        String objectKey,
        String uploadId,
        List<PartInfo> parts
    ) {}
    
    public record AbortRequest(
        String bucket,
        String objectKey,
        String uploadId
    ) {}
}
```

**TypeScript Client - Multipart Uploader:**

```typescript
// filepath: src/utils/multipartUploader.ts

/**
 * Multipart Uploader for MinIO
 * 
 * Chia file thành nhiều parts và upload song song để:
 * - Tránh timeout cho file lớn
 * - Cho phép retry từng part khi fail
 * - Tăng tốc upload với parallel uploads
 */

// ===============================================
// INTERFACES
// ===============================================

interface MultipartConfig {
    // API base URL của backend
    apiBaseUrl: string;
    
    // Bucket name (optional, sẽ dùng default bucket nếu không specify)
    bucket?: string;
    
    // Số parts upload đồng thời
    concurrency?: number;
    
    // Timeout cho mỗi part (milliseconds)
    partTimeout?: number;
    
    // Số lần retry cho mỗi part
    maxRetries?: number;
    
    // Delay giữa các lần retry (milliseconds)
    retryDelay?: number;
    
    // Callbacks
    onProgress?: (progress: MultipartProgress) => void;
    onPartComplete?: (partNumber: number, etag: string) => void;
    onError?: (error: Error, partNumber?: number) => void;
}

interface MultipartProgress {
    phase: 'initiating' | 'uploading' | 'completing';
    totalParts: number;
    completedParts: number;
    percentage: number;
    uploadedBytes: number;
    totalBytes: number;
    currentPartProgress?: number;
    speed?: number;  // bytes per second
    estimatedTimeRemaining?: number;  // seconds
}

interface UploadedPart {
    partNumber: number;
    etag: string;
}

interface InitiateResponse {
    uploadId: string;
    bucket: string;
    objectKey: string;
    partSize: number;
    totalParts: number;
    fileSize: number;
}

interface PresignedUrl {
    partNumber: number;
    url: string;
}

// ===============================================
// DEFAULT CONFIG
// ===============================================

const DEFAULT_CONFIG: Partial<MultipartConfig> = {
    concurrency: 5,
    partTimeout: 120000,  // 2 minutes per part
    maxRetries: 3,
    retryDelay: 2000
};

// ===============================================
// MULTIPART UPLOADER CLASS
// ===============================================

export class MultipartUploader {
    private config: MultipartConfig;
    private abortController: AbortController;
    private uploadId: string | null = null;
    private bucket: string | null = null;
    private objectKey: string | null = null;
    private isAborted: boolean = false;
    
    // Progress tracking
    private startTime: number = 0;
    private uploadedBytes: number = 0;
    
    constructor(config: MultipartConfig) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.abortController = new AbortController();
    }
    
    /**
     * Upload file với multipart
     */
    async upload(
        file: File,
        objectKey?: string
    ): Promise<{ success: boolean; error?: string; objectKey?: string; etag?: string }> {
        
        this.startTime = Date.now();
        this.uploadedBytes = 0;
        this.isAborted = false;
        
        const finalObjectKey = objectKey || this.generateObjectKey(file.name);
        
        try {
            // ─────────────────────────────────────────────
            // PHASE 1: Initiate multipart upload
            // ─────────────────────────────────────────────
            this.reportProgress({
                phase: 'initiating',
                totalParts: 0,
                completedParts: 0,
                percentage: 0,
                uploadedBytes: 0,
                totalBytes: file.size
            });
            
            console.log(`[MULTIPART] Initiating upload for ${file.name} (${this.formatBytes(file.size)})`);
            
            const initResponse = await this.initiateUpload(file, finalObjectKey);
            this.uploadId = initResponse.uploadId;
            this.bucket = initResponse.bucket;
            this.objectKey = initResponse.objectKey;
            
            console.log(`[MULTIPART] Upload ID: ${this.uploadId}`);
            console.log(`[MULTIPART] Part size: ${this.formatBytes(initResponse.partSize)}`);
            console.log(`[MULTIPART] Total parts: ${initResponse.totalParts}`);
            
            // ─────────────────────────────────────────────
            // PHASE 2: Upload parts
            // ─────────────────────────────────────────────
            const uploadedParts = await this.uploadAllParts(file, initResponse);
            
            if (this.isAborted) {
                throw new Error('Upload was aborted');
            }
            
            // ─────────────────────────────────────────────
            // PHASE 3: Complete multipart upload
            // ─────────────────────────────────────────────
            this.reportProgress({
                phase: 'completing',
                totalParts: initResponse.totalParts,
                completedParts: initResponse.totalParts,
                percentage: 99,
                uploadedBytes: file.size,
                totalBytes: file.size
            });
            
            console.log('[MULTIPART] Completing upload...');
            
            const completeResponse = await this.completeUpload(uploadedParts);
            
            this.reportProgress({
                phase: 'completing',
                totalParts: initResponse.totalParts,
                completedParts: initResponse.totalParts,
                percentage: 100,
                uploadedBytes: file.size,
                totalBytes: file.size
            });
            
            const totalTime = (Date.now() - this.startTime) / 1000;
            console.log(`[MULTIPART] Upload completed in ${totalTime.toFixed(1)}s`);
            console.log(`[MULTIPART] Average speed: ${this.formatBytes(file.size / totalTime)}/s`);
            
            return {
                success: true,
                objectKey: completeResponse.objectKey,
                etag: completeResponse.etag
            };
            
        } catch (error) {
            console.error('[MULTIPART] Upload failed:', error);
            
            // Abort upload để cleanup
            if (this.uploadId && !this.isAborted) {
                try {
                    await this.abortUpload();
                } catch (abortError) {
                    console.error('[MULTIPART] Failed to abort:', abortError);
                }
            }
            
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    
    /**
     * Abort upload đang thực hiện
     */
    async abort(): Promise<void> {
        console.log('[MULTIPART] Aborting upload...');
        this.isAborted = true;
        this.abortController.abort();
        
        if (this.uploadId) {
            await this.abortUpload();
        }
    }
    
    // ===============================================
    // PRIVATE METHODS
    // ===============================================
    
    /**
     * Initiate multipart upload với backend
     */
    private async initiateUpload(file: File, objectKey: string): Promise<InitiateResponse> {
        const response = await fetch(`${this.config.apiBaseUrl}/multipart/initiate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bucket: this.config.bucket,
                objectKey,
                contentType: file.type || 'application/octet-stream',
                fileSize: file.size
            }),
            signal: this.abortController.signal
        });
        
        if (!response.ok) {
            throw new Error(`Failed to initiate upload: ${response.status}`);
        }
        
        return response.json();
    }
    
    /**
     * Upload tất cả parts với concurrency control
     */
    private async uploadAllParts(
        file: File,
        initResponse: InitiateResponse
    ): Promise<UploadedPart[]> {
        
        const { partSize, totalParts } = initResponse;
        const uploadedParts: UploadedPart[] = [];
        const semaphore = new Semaphore(this.config.concurrency!);
        
        // Tạo danh sách part info
        const partInfos: Array<{ partNumber: number; start: number; end: number }> = [];
        for (let i = 0; i < totalParts; i++) {
            const partNumber = i + 1;
            const start = i * partSize;
            const end = Math.min(start + partSize, file.size);
            partInfos.push({ partNumber, start, end });
        }
        
        // Lấy presigned URLs cho tất cả parts
        console.log('[MULTIPART] Getting presigned URLs...');
        const partNumbers = partInfos.map(p => p.partNumber);
        const presignedUrls = await this.getPresignedUrls(partNumbers);
        const urlMap = new Map(presignedUrls.map(u => [u.partNumber, u.url]));
        
        // Upload parts song song
        console.log(`[MULTIPART] Starting parallel upload (concurrency: ${this.config.concurrency})...`);
        
        const uploadPromises = partInfos.map(async (partInfo) => {
            await semaphore.acquire();
            
            try {
                if (this.isAborted) {
                    throw new Error('Upload aborted');
                }
                
                const url = urlMap.get(partInfo.partNumber);
                if (!url) {
                    throw new Error(`No presigned URL for part ${partInfo.partNumber}`);
                }
                
                const chunk = file.slice(partInfo.start, partInfo.end);
                const result = await this.uploadPart(partInfo.partNumber, url, chunk);
                
                uploadedParts.push(result);
                
                // Update progress
                this.uploadedBytes += chunk.size;
                this.reportProgress({
                    phase: 'uploading',
                    totalParts,
                    completedParts: uploadedParts.length,
                    percentage: (uploadedParts.length / totalParts) * 100,
                    uploadedBytes: this.uploadedBytes,
                    totalBytes: file.size,
                    speed: this.calculateSpeed(),
                    estimatedTimeRemaining: this.estimateTimeRemaining(file.size)
                });
                
                if (this.config.onPartComplete) {
                    this.config.onPartComplete(result.partNumber, result.etag);
                }
                
                return result;
                
            } finally {
                semaphore.release();
            }
        });
        
        await Promise.all(uploadPromises);
        
        // Sort by part number
        return uploadedParts.sort((a, b) => a.partNumber - b.partNumber);
    }
    
    /**
     * Get presigned URLs từ backend
     */
    private async getPresignedUrls(partNumbers: number[]): Promise<PresignedUrl[]> {
        const response = await fetch(`${this.config.apiBaseUrl}/multipart/presigned-urls`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bucket: this.bucket,
                objectKey: this.objectKey,
                uploadId: this.uploadId,
                partNumbers
            }),
            signal: this.abortController.signal
        });
        
        if (!response.ok) {
            throw new Error(`Failed to get presigned URLs: ${response.status}`);
        }
        
        const data = await response.json();
        return data.urls;
    }
    
    /**
     * Upload single part với retry
     */
    private async uploadPart(
        partNumber: number,
        url: string,
        chunk: Blob
    ): Promise<UploadedPart> {
        
        const maxRetries = this.config.maxRetries!;
        let lastError: Error | null = null;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`[PART ${partNumber}] Uploading (attempt ${attempt})...`);
                
                const etag = await this.uploadChunk(url, chunk);
                
                console.log(`[PART ${partNumber}] Complete. ETag: ${etag}`);
                
                return { partNumber, etag };
                
            } catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');
                console.error(`[PART ${partNumber}] Attempt ${attempt} failed:`, lastError.message);
                
                if (this.config.onError) {
                    this.config.onError(lastError, partNumber);
                }
                
                if (attempt < maxRetries && !this.isAborted) {
                    const delay = this.config.retryDelay! * Math.pow(2, attempt - 1);
                    console.log(`[PART ${partNumber}] Retrying in ${delay}ms...`);
                    await this.sleep(delay);
                }
            }
        }
        
        throw new Error(`Part ${partNumber} failed after ${maxRetries} attempts: ${lastError?.message}`);
    }
    
    /**
     * Upload chunk to presigned URL
     */
    private uploadChunk(url: string, chunk: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const etag = xhr.getResponseHeader('ETag');
                    if (etag) {
                        // Remove quotes from ETag
                        resolve(etag.replace(/"/g, ''));
                    } else {
                        reject(new Error('No ETag in response'));
                    }
                } else {
                    reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                }
            };
            
            xhr.onerror = () => reject(new Error('Network error'));
            xhr.ontimeout = () => reject(new Error('Timeout'));
            xhr.onabort = () => reject(new Error('Aborted'));
            
            xhr.open('PUT', url);
            xhr.timeout = this.config.partTimeout!;
            xhr.setRequestHeader('Content-Type', 'application/octet-stream');
            xhr.send(chunk);
        });
    }
    
    /**
     * Complete multipart upload
     */
    private async completeUpload(parts: UploadedPart[]): Promise<{
        objectKey: string;
        etag: string;
    }> {
        const response = await fetch(`${this.config.apiBaseUrl}/multipart/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bucket: this.bucket,
                objectKey: this.objectKey,
                uploadId: this.uploadId,
                parts: parts.map(p => ({
                    partNumber: p.partNumber,
                    etag: p.etag
                }))
            }),
            signal: this.abortController.signal
        });
        
        if (!response.ok) {
            throw new Error(`Failed to complete upload: ${response.status}`);
        }
        
        return response.json();
    }
    
    /**
     * Abort multipart upload
     */
    private async abortUpload(): Promise<void> {
        try {
            await fetch(`${this.config.apiBaseUrl}/multipart/abort`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bucket: this.bucket,
                    objectKey: this.objectKey,
                    uploadId: this.uploadId
                })
            });
            console.log('[MULTIPART] Upload aborted successfully');
        } catch (error) {
            console.error('[MULTIPART] Failed to abort upload:', error);
        }
    }
    
    // ===============================================
    // HELPER METHODS
    // ===============================================
    
    private reportProgress(progress: MultipartProgress): void {
        if (this.config.onProgress) {
            this.config.onProgress(progress);
        }
    }
    
    private calculateSpeed(): number {
        const elapsed = (Date.now() - this.startTime) / 1000;
        return elapsed > 0 ? this.uploadedBytes / elapsed : 0;
    }
    
    private estimateTimeRemaining(totalBytes: number): number {
        const speed = this.calculateSpeed();
        if (speed <= 0) return 0;
        const remainingBytes = totalBytes - this.uploadedBytes;
        return remainingBytes / speed;
    }
    
    private generateObjectKey(filename: string): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const ext = filename.split('.').pop();
        const name = filename.replace(/\.[^/.]+$/, '');
        return `uploads/${timestamp}-${random}/${name}.${ext}`;
    }
    
    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ===============================================
// SEMAPHORE FOR CONCURRENCY CONTROL
// ===============================================

class Semaphore {
    private permits: number;
    private waiting: Array<() => void> = [];
    
    constructor(permits: number) {
        this.permits = permits;
    }
    
    async acquire(): Promise<void> {
        if (this.permits > 0) {
            this.permits--;
            return;
        }
        
        return new Promise(resolve => {
            this.waiting.push(resolve);
        });
    }
    
    release(): void {
        const next = this.waiting.shift();
        if (next) {
            next();
        } else {
            this.permits++;
        }
    }
}

// ===============================================
// USAGE EXAMPLE
// ===============================================

/**
 * Ví dụ sử dụng MultipartUploader
 */
export async function uploadLargeFile(file: File): Promise<void> {
    const uploader = new MultipartUploader({
        apiBaseUrl: 'http://localhost:8080/api',
        concurrency: 5,
        partTimeout: 120000,
        maxRetries: 3,
        
        onProgress: (progress) => {
            console.log(`Progress: ${progress.percentage.toFixed(1)}%`);
            console.log(`Uploaded: ${progress.completedParts}/${progress.totalParts} parts`);
            if (progress.speed) {
                console.log(`Speed: ${formatBytes(progress.speed)}/s`);
            }
            if (progress.estimatedTimeRemaining) {
                console.log(`ETA: ${Math.round(progress.estimatedTimeRemaining)}s`);
            }
        },
        
        onPartComplete: (partNumber, etag) => {
            console.log(`Part ${partNumber} complete: ${etag}`);
        },
        
        onError: (error, partNumber) => {
            console.error(`Error${partNumber ? ` on part ${partNumber}` : ''}:`, error.message);
        }
    });
    
    const result = await uploader.upload(file);
    
    if (result.success) {
        console.log('Upload successful!');
        console.log('Object key:', result.objectKey);
        console.log('ETag:', result.etag);
    } else {
        console.error('Upload failed:', result.error);
    }
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
```

**React Component sử dụng Multipart Uploader:**

```tsx
// filepath: src/components/MultipartFileUploader.tsx

import React, { useState, useRef, useCallback } from 'react';
import { MultipartUploader, MultipartProgress } from '../utils/multipartUploader';

interface UploadState {
    status: 'idle' | 'uploading' | 'success' | 'error';
    progress: MultipartProgress | null;
    error: string | null;
    result: { objectKey: string; etag: string } | null;
}

export const MultipartFileUploader: React.FC = () => {
    const [uploadState, setUploadState] = useState<UploadState>({
        status: 'idle',
        progress: null,
        error: null,
        result: null
    });
    
    const uploaderRef = useRef<MultipartUploader | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // Reset state
        setUploadState({
            status: 'uploading',
            progress: null,
            error: null,
            result: null
        });
        
        // Create uploader
        uploaderRef.current = new MultipartUploader({
            apiBaseUrl: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
            concurrency: 5,
            partTimeout: 120000,
            maxRetries: 3,
            
            onProgress: (progress) => {
                setUploadState(prev => ({
                    ...prev,
                    progress
                }));
            },
            
            onError: (error, partNumber) => {
                console.error(`Upload error${partNumber ? ` (part ${partNumber})` : ''}:`, error);
            }
        });
        
        try {
            const result = await uploaderRef.current.upload(file);
            
            if (result.success) {
                setUploadState({
                    status: 'success',
                    progress: null,
                    error: null,
                    result: {
                        objectKey: result.objectKey!,
                        etag: result.etag!
                    }
                });
            } else {
                setUploadState({
                    status: 'error',
                    progress: null,
                    error: result.error || 'Upload failed',
                    result: null
                });
            }
        } catch (error) {
            setUploadState({
                status: 'error',
                progress: null,
                error: error instanceof Error ? error.message : 'Unknown error',
                result: null
            });
        }
        
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);
    
    const handleCancel = useCallback(async () => {
        if (uploaderRef.current) {
            await uploaderRef.current.abort();
            setUploadState({
                status: 'idle',
                progress: null,
                error: 'Upload cancelled',
                result: null
            });
        }
    }, []);
    
    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    const formatTime = (seconds: number): string => {
        if (seconds < 60) return `${Math.round(seconds)}s`;
        if (seconds < 3600) return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`;
        return `${Math.floor(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
    };
    
    return (
        <div className="multipart-uploader">
            <h2>Large File Uploader (Multipart)</h2>
            
            {/* File Input */}
            <div className="upload-input">
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    disabled={uploadState.status === 'uploading'}
                />
            </div>
            
            {/* Progress Display */}
            {uploadState.status === 'uploading' && uploadState.progress && (
                <div className="upload-progress">
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${uploadState.progress.percentage}%` }}
                        />
                    </div>
                    
                    <div className="progress-info">
                        <span className="percentage">
                            {uploadState.progress.percentage.toFixed(1)}%
                        </span>
                        <span className="phase">
                            {uploadState.progress.phase}
                        </span>
                    </div>
                    
                    <div className="progress-details">
                        <div>
                            Parts: {uploadState.progress.completedParts} / {uploadState.progress.totalParts}
                        </div>
                        <div>
                            Uploaded: {formatBytes(uploadState.progress.uploadedBytes)} / {formatBytes(uploadState.progress.totalBytes)}
                        </div>
                        {uploadState.progress.speed && (
                            <div>
                                Speed: {formatBytes(uploadState.progress.speed)}/s
                            </div>
                        )}
                        {uploadState.progress.estimatedTimeRemaining && (
                            <div>
                                ETA: {formatTime(uploadState.progress.estimatedTimeRemaining)}
                            </div>
                        )}
                    </div>
                    
                    <button onClick={handleCancel} className="cancel-button">
                        Cancel
                    </button>
                </div>
            )}
            
            {/* Success Message */}
            {uploadState.status === 'success' && uploadState.result && (
                <div className="upload-success">
                    <h3>✅ Upload Successful!</h3>
                    <p>Object Key: {uploadState.result.objectKey}</p>
                    <p>ETag: {uploadState.result.etag}</p>
                </div>
            )}
            
            {/* Error Message */}
            {uploadState.error && (
                <div className="upload-error">
                    <h3>❌ Error</h3>
                    <p>{uploadState.error}</p>
                </div>
            )}
            
            <style>{`
                .multipart-uploader {
                    max-width: 600px;
                    margin: 20px auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                }
                
                .upload-input {
                    margin: 20px 0;
                }
                
                .upload-progress {
                    margin: 20px 0;
                }
                
                .progress-bar {
                    width: 100%;
                    height: 20px;
                    background: #eee;
                    border-radius: 10px;
                    overflow: hidden;
                }
                
                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #4caf50, #8bc34a);
                    transition: width 0.3s ease;
                }
                
                .progress-info {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 10px;
                }
                
                .percentage {
                    font-size: 24px;
                    font-weight: bold;
                }
                
                .phase {
                    text-transform: capitalize;
                    color: #666;
                }
                
                .progress-details {
                    margin-top: 15px;
                    font-size: 14px;
                    color: #666;
                }
                
                .progress-details > div {
                    margin: 5px 0;
                }
                
                .cancel-button {
                    margin-top: 15px;
                    padding: 10px 20px;
                    background: #f44336;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                
                .cancel-button:hover {
                    background: #d32f2f;
                }
                
                .upload-success {
                    padding: 20px;
                    background: #e8f5e9;
                    border-radius: 4px;
                    margin-top: 20px;
                }
                
                .upload-error {
                    padding: 20px;
                    background: #ffebee;
                    border-radius: 4px;
                    margin-top: 20px;
                }
            `}</style>
        </div>
    );
};
```

**Timeout Troubleshooting Checklist:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              TIMEOUT TROUBLESHOOTING CHECKLIST                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  □ 1. NGINX CONFIGURATION                                                  │
│     ────────────────────────                                                │
│     □ client_max_body_size = 0 (unlimited)                                 │
│     □ proxy_buffering = off                                                │
│     □ proxy_request_buffering = off                                        │
│     □ proxy_read_timeout >= thời gian upload dự kiến                      │
│     □ proxy_send_timeout >= thời gian upload dự kiến                      │
│     □ proxy_connect_timeout = 60s                                         │
│                                                                             │
│     Kiểm tra: nginx -t && nginx -s reload                                 │
│                                                                             │
│                                                                             │
│  □ 2. JAVA BACKEND CONFIGURATION                                           │
│     ─────────────────────────────                                           │
│     □ OkHttpClient readTimeout >= 1 hour                                  │
│     □ OkHttpClient writeTimeout >= 1 hour                                 │
│     □ OkHttpClient callTimeout = 0 (disabled)                             │
│     □ Spring multipart max-file-size = -1                                 │
│     □ Spring multipart max-request-size = -1                              │
│                                                                             │
│     Kiểm tra: Xem logs khi upload file lớn                                │
│                                                                             │
│                                                                             │
│  □ 3. CLIENT (BROWSER) CONFIGURATION                                       │
│     ──────────────────────────────────                                      │
│     □ XMLHttpRequest.timeout đủ lớn hoặc = 0                              │
│     □ Không dùng fetch với AbortController timeout ngắn                   │
│     □ Sử dụng multipart upload cho file > 100MB                           │
│                                                                             │
│     Kiểm tra: Browser DevTools → Network tab                              │
│                                                                             │
│                                                                             │
│  □ 4. TCP/OS CONFIGURATION                                                 │
│     ────────────────────────                                                │
│     □ net.ipv4.tcp_keepalive_time = 60                                    │
│     □ net.ipv4.tcp_keepalive_intvl = 10                                   │
│     □ net.ipv4.tcp_keepalive_probes = 6                                   │
│                                                                             │
│     Kiểm tra: sysctl -a | grep keepalive                                  │
│                                                                             │
│                                                                             │
│  □ 5. CLOUD/FIREWALL CONFIGURATION                                         │
│     ─────────────────────────────────                                       │
│     □ AWS ALB idle timeout >= 4000s (max)                                 │
│     □ Cloud firewall không có connection timeout thấp                     │
│     □ Corporate proxy không kill long connections                         │
│                                                                             │
│     Kiểm tra: Upload từ trong và ngoài firewall                           │
│                                                                             │
│                                                                             │
│  □ 6. MINIO CONFIGURATION                                                  │
│     ──────────────────────                                                  │
│     □ Đủ disk space                                                       │
│     □ Đủ memory                                                           │
│     □ Không bị rate limit                                                 │
│                                                                             │
│     Kiểm tra: mc admin info myminio                                       │
│                                                                             │
│                                                                             │
│  □ 7. MULTIPART UPLOAD BEST PRACTICES                                     │
│     ───────────────────────────────────                                     │
│     □ Sử dụng multipart cho file > 100MB                                  │
│     □ Part size: 10-100MB tùy network                                     │
│     □ Concurrency: 3-10 tùy bandwidth và server capacity                  │
│     □ Part timeout: 60-120s                                               │
│     □ Retry: 3 lần với exponential backoff                                │
│                                                                             │
│                                                                             │
│  □ 8. DEBUGGING STEPS                                                      │
│     ─────────────────────                                                   │
│     1. Test với file nhỏ (< 10MB) trước                                   │
│     2. Tăng dần kích thước file                                           │
│     3. Kiểm tra logs ở mỗi component khi fail                             │
│     4. Sử dụng curl để test trực tiếp MinIO                              │
│     5. Test multipart upload với mc client                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 1.7 Kiểm Tra Cấu Hình MinIO
- 1.7.1 Kiểm tra cấu hình MinIO triển khai bằng Docker
- 1.7.2 Kiểm tra cấu hình MinIO triển khai trên máy ảo
- 1.7.3 Sử dụng MinIO Client (mc) để kiểm tra kết nối
- 1.7.4 Kiểm tra health endpoint của MinIO API
- 1.7.5 Kiểm tra bucket và policy đã được tạo
- 1.7.6 Sử dụng công cụ curl để test API endpoint
- 1.7.7 Xem và phân tích log để debug lỗi cấu hình

---

## Phần 2: API Upload và Presigned Upload URL

### 2.1 Tổng Quan về Upload trong MinIO
- 2.1.1 Các phương thức upload được MinIO hỗ trợ
- 2.1.2 So sánh direct upload và presigned URL upload
- 2.1.3 Khi nào nên sử dụng presigned URL cho upload
- 2.1.4 Giới hạn kích thước file và multipart upload

### 2.2 Cấu Hình MinIO Java SDK
- 2.2.1 Thêm dependency MinIO vào project Maven hoặc Gradle
- 2.2.2 Khởi tạo MinIO Client trong Java
- 2.2.3 Cấu hình connection pool và timeout
- 2.2.4 Xử lý exception và retry logic

### 2.3 Tạo Presigned Upload URL Bằng Java
- 2.3.1 Cú pháp tạo presigned PUT URL với MinIO Java SDK
- 2.3.2 Cấu hình thời gian hết hạn cho presigned URL
- 2.3.3 Thêm điều kiện và metadata vào presigned URL
- 2.3.4 Tạo presigned URL cho multipart upload
- 2.3.5 Khởi tạo multipart upload và lấy upload ID
- 2.3.6 Tạo presigned URL cho từng part trong multipart upload
- 2.3.7 Hoàn thành multipart upload với danh sách ETag

### 2.4 Sử Dụng Presigned Upload URL Trong TypeScript
- 2.4.1 Gọi API backend để lấy presigned upload URL
- 2.4.2 Sử dụng fetch API để upload file với presigned URL
- 2.4.3 Sử dụng axios để upload file với presigned URL
- 2.4.4 Cấu hình header Content-Type khi upload
- 2.4.5 Xử lý progress callback khi upload
- 2.4.6 Xử lý lỗi và retry khi upload thất bại
- 2.4.7 Upload multipart với nhiều presigned URL

### 2.5 Triển Khai Multipart Upload Hoàn Chỉnh
- 2.5.1 Luồng khởi tạo multipart upload từ client đến server
- 2.5.2 Chia file thành các chunk trong TypeScript
- 2.5.3 Upload song song nhiều chunk với semaphore control
- 2.5.4 Thu thập ETag từ response của mỗi part
- 2.5.5 Gọi API complete multipart upload
- 2.5.6 Xử lý abort multipart upload khi có lỗi

---

## Phần 3: API Download và Presigned Download URL

### 3.1 Tổng Quan về Download trong MinIO
- 3.1.1 Các phương thức download được MinIO hỗ trợ
- 3.1.2 So sánh direct download và presigned URL download
- 3.1.3 Khi nào nên sử dụng presigned URL cho download
- 3.1.4 Range request và partial download

### 3.2 Tạo Presigned Download URL Bằng Java
- 3.2.1 Cú pháp tạo presigned GET URL với MinIO Java SDK
- 3.2.2 Cấu hình thời gian hết hạn cho presigned download URL
- 3.2.3 Thêm response header vào presigned URL
- 3.2.4 Cấu hình Content-Disposition cho download
- 3.2.5 Tạo presigned URL với điều kiện IP hoặc thời gian

### 3.3 Sử Dụng Presigned Download URL Trong TypeScript
- 3.3.1 Gọi API backend để lấy presigned download URL
- 3.3.2 Sử dụng fetch API để download file
- 3.3.3 Download file với range request để lấy từng phần
- 3.3.4 Xử lý response và chuyển đổi sang Blob
- 3.3.5 Trigger browser download với URL.createObjectURL
- 3.3.6 Xử lý progress callback khi download
- 3.3.7 Xử lý lỗi và retry khi download thất bại

### 3.4 Triển Khai Chunked Download Hoàn Chỉnh
- 3.4.1 Lấy thông tin file size bằng HEAD request
- 3.4.2 Tính toán các byte range cần download
- 3.4.3 Download song song nhiều range với semaphore control
- 3.4.4 Ghép các chunk theo đúng thứ tự byte offset
- 3.4.5 Tạo Blob từ các ArrayBuffer đã download
- 3.4.6 Xử lý hủy download và cleanup resource

---

## Phần 4: API Stream Upload và Download

### 4.1 Tổng Quan về Streaming trong MinIO
- 4.1.1 Streaming là gì và ưu điểm của streaming
- 4.1.2 So sánh streaming với buffered upload và download
- 4.1.3 Các trường hợp sử dụng streaming phù hợp
- 4.1.4 Giới hạn và lưu ý khi sử dụng streaming

### 4.2 Stream Upload Bằng Java
- 4.2.1 Sử dụng putObject với InputStream trong Java
- 4.2.2 Cấu hình chunk size cho stream upload
- 4.2.3 Xử lý unknown content length khi stream upload
- 4.2.4 Tạo presigned URL hỗ trợ chunked transfer encoding
- 4.2.5 Xử lý timeout và connection keep-alive

### 4.3 Stream Upload Từ TypeScript Client
- 4.3.1 Sử dụng ReadableStream để đọc file theo chunk
- 4.3.2 Upload stream với fetch API và ReadableStream body
- 4.3.3 Cấu hình header Transfer-Encoding chunked
- 4.3.4 Xử lý backpressure khi upload stream
- 4.3.5 Theo dõi progress khi stream upload

### 4.4 Stream Download Bằng Java
- 4.4.1 Sử dụng getObject để lấy InputStream trong Java
- 4.4.2 Tạo presigned URL cho stream download
- 4.4.3 Cấu hình buffer size cho stream download
- 4.4.4 Xử lý partial content và resume download

### 4.5 Stream Download Từ TypeScript Client
- 4.5.1 Sử dụng fetch API với response.body ReadableStream
- 4.5.2 Đọc stream theo chunk với ReadableStreamDefaultReader
- 4.5.3 Xử lý và transform data trong quá trình stream
- 4.5.4 Tính toán progress khi stream download
- 4.5.5 Xử lý hủy stream và cleanup resource
- 4.5.6 Streaming trực tiếp xuống file system với File System Access API

---

## Phần 5: Mở Rộng và Scale MinIO

### 5.1 Tổng Quan về Kiến Trúc Phân Tán của MinIO
- 5.1.1 Erasure coding trong MinIO là gì
- 5.1.2 Cách MinIO đảm bảo data durability
- 5.1.3 Các chế độ triển khai MinIO: standalone, distributed, federated
- 5.1.4 Yêu cầu phần cứng và số lượng drive tối thiểu

### 5.2 Scale MinIO Với Nhiều Ổ Cứng (Giả Lập)
- 5.2.1 Tạo nhiều thư mục giả lập nhiều ổ cứng trên một máy
- 5.2.2 Cấu hình MinIO với multiple drive paths
- 5.2.3 Cấu hình erasure coding set size
- 5.2.4 Kiểm tra phân bố dữ liệu trên các drive
- 5.2.5 Mô phỏng lỗi drive và kiểm tra data recovery
- 5.2.6 Thêm drive mới vào MinIO cluster đang chạy

### 5.3 Scale MinIO Với Nhiều Server Song Song
- 5.3.1 Yêu cầu và chuẩn bị nhiều server hoặc máy ảo
- 5.3.2 Cấu hình network giữa các MinIO server
- 5.3.3 Cấu hình distributed MinIO với nhiều node
- 5.3.4 Đồng bộ thời gian giữa các server với NTP
- 5.3.5 Cấu hình load balancer phía trước MinIO cluster
- 5.3.6 Kiểm tra replication và consistency giữa các node
- 5.3.7 Xử lý khi một node trong cluster bị down
- 5.3.8 Mở rộng cluster bằng cách thêm server pool mới

### 5.4 Giám Sát và Vận Hành MinIO Cluster
- 5.4.1 Sử dụng MinIO Console để giám sát cluster
- 5.4.2 Cấu hình metrics endpoint cho Prometheus
- 5.4.3 Thiết lập alert khi có drive hoặc node lỗi
- 5.4.4 Backup và restore cấu hình MinIO
- 5.4.5 Upgrade MinIO cluster không downtime
- 5.4.6 Best practices cho production MinIO cluster

---

## Phụ Lục

### A. Tham Khảo Nhanh MinIO Client (mc) Commands
### B. Danh Sách Các Lỗi Thường Gặp và Cách Khắc Phục
### C. Checklist Bảo Mật Cho MinIO Production
### D. So Sánh Hiệu Năng Các Cấu Hình MinIO Khác Nhau
### E. Tài Liệu Tham Khảo và Nguồn Học Thêm