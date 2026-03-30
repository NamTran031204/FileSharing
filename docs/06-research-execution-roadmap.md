# 06. Roadmap thực thi nghiên cứu (không code)

## 1. Mốc thời gian đề xuất: 4 tuần

### Tuần 1 - Discovery
Mục tiêu: chốt vấn đề và nhu cầu thực tế.
1. Phỏng vấn nhanh 6-8 người dùng mục tiêu (Producer, Reviewer, PM)
2. Tổng hợp pain points và journey hiện tại
3. Chốt KPI sản phẩm sơ bộ

Deliverable:
1. Persona cards
2. Current journey + bottlenecks
3. Problem statement bản 1

### Tuần 2 - Scope và trải nghiệm
Mục tiêu: chốt chức năng và UX luồng chính.
1. Benchmark đối thủ và rút feature map
2. Viết user stories + acceptance criteria
3. Vẽ wireframe low-fi cho 3 luồng chính

Deliverable:
1. MVP scope list (P0/P1/P2)
2. Wireframe player/annotation/version
3. Permission-action mapping

### Tuần 3 - Solution design
Mục tiêu: chốt kỹ thuật và hợp đồng hệ thống.
1. Thiết kế data model mức domain
2. Draft API contract
3. Chốt phương án streaming/transcoding trên giấy

Deliverable:
1. Data model draft
2. API contract draft
3. Kiến trúc logical + sequence diagrams

### Tuần 4 - Validation & sign-off
Mục tiêu: giảm rủi ro trước implementation.
1. Spike checklist và tiêu chí pass/fail
2. Đánh giá rủi ro, chi phí, vận hành
3. Review với stakeholder và chốt go/no-go

Deliverable:
1. Risk register + mitigation
2. NFR baseline (latency, reliability, security)
3. Quyết định cuối cho phase build

## 2. RACI gợi ý
1. Product Owner: quyết định scope và business priority
2. Tech Lead: quyết định kiến trúc, stack, API
3. UX: luồng review và annotation interaction
4. QA: tiêu chí kiểm chứng và test strategy

## 3. Definition of Ready trước phase code
1. PRD có acceptance criteria rõ theo từng P0
2. API + data model được frontend/backend duyệt
3. Quyết định streaming/transcode có bằng chứng spike
4. KPI kỹ thuật và ngưỡng chấp nhận được chốt
5. Danh sách rủi ro top 10 có owner xử lý
