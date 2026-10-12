# Architecture Decision Records (ADR)

Mỗi ADR ghi lại một quyết định kiến trúc: bối cảnh, quyết định, và hệ quả. Dùng mẫu [0000-template.md](0000-template.md).

Quy ước đặt tên: `NNNN-tieu-de-ngan-gon.md` (số tăng dần, không tái sử dụng).

Trạng thái: `Proposed` → `Accepted` → (`Deprecated` | `Superseded by ADR-NNNN`).

| # | Tiêu đề | Trạng thái | Ngày |
|---|---|---|---|
| [0001](0001-record-architecture-decisions.md) | Ghi lại quyết định kiến trúc bằng ADR | Accepted | 2026-10-12 |
| [0002](0002-monorepo-structure.md) | Cấu trúc monorepo backend + frontend | Accepted | 2026-10-12 |
| [0003](0003-backend-spring-boot.md) | Backend: Spring Boot 4 + Java 21, package-by-feature | Accepted | 2026-10-12 |
| [0004](0004-frontend-angular-tailwind.md) | Frontend: Angular 22 standalone + signals + Tailwind v4 | Accepted | 2026-10-12 |
| [0005](0005-postgresql-flyway.md) | PostgreSQL local + Flyway migration | Accepted | 2026-10-12 |
| [0006](0006-stateless-jwt-auth.md) | Xác thực stateless bằng JWT | Accepted | 2026-10-12 |
| [0007](0007-local-file-storage-streaming.md) | Lưu file trên local disk, stream audio qua HTTP Range | Accepted | 2026-10-12 |
| [0008](0008-api-conventions.md) | Quy ước REST API và định dạng lỗi | Accepted | 2026-10-12 |
