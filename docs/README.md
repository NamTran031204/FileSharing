# Media Review Phase 2 - Bộ tài liệu nghiên cứu sản phẩm

## Mục tiêu
Bộ tài liệu này hiện thực hóa kế hoạch trong plan-mediaReview.prompt.md theo hướng Product Discovery + Solution Design, phục vụ giai đoạn trước khi code.

## Cấu trúc tài liệu
1. 01-product-requirements-prd.md: Yêu cầu sản phẩm, phạm vi, tiêu chí thành công
2. 02-user-needs-and-market-research.md: Nhu cầu thực tế và benchmark thị trường
3. 03-core-features-priority-mvp.md: Danh sách chức năng quan trọng theo mức ưu tiên
4. 04-proposed-tech-stack-architecture.md: Tech stack dự kiến và kiến trúc thực thi
5. 05-data-api-contract-draft.md: Draft mô hình dữ liệu và hợp đồng API mức sản phẩm
6. 06-research-execution-roadmap.md: Kế hoạch thực thi nghiên cứu theo tuần
7. 07-spike-and-validation-plan.md: Danh sách spike/POC và tiêu chí xác minh

## Bối cảnh đầu vào
- Dự án hiện có: React + TypeScript + Vite + Ant Design (client), Spring Boot + JWT (server), MinIO + MongoDB.
- Hướng Phase 2: Media Review platform cho creative workflow (video/image review, feedback theo timeline, versioning).

## Deliverable phải có trước khi sang phase implementation
1. PRD được duyệt (scope MVP + acceptance criteria rõ ràng)
2. Quyết định streaming/transcoding được chốt bằng spike
3. Data model và API contracts được thống nhất giữa frontend/backend
4. Wireframe luồng review chính và permission matrix được duyệt
5. Danh sách rủi ro, chi phí hạ tầng và KPI kỹ thuật có baseline
