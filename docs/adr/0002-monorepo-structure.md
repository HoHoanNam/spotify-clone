# ADR-0002: Cấu trúc monorepo backend + frontend

- **Trạng thái**: Accepted
- **Ngày**: 2026-10-12

## Bối cảnh

Dự án gồm một Spring Boot API và một Angular SPA, phát triển bởi cùng một người/nhóm nhỏ. Thay đổi một feature thường chạm cả hai phía (API + UI).

## Các phương án đã cân nhắc

1. **Monorepo** (`backend/`, `frontend/`, `docs/` trong một repo) — một PR cho một feature, tài liệu tập trung.
2. **Hai repo riêng** — tách biệt CI/versioning nhưng tốn công đồng bộ, không cần thiết ở quy mô này.

## Quyết định

Dùng monorepo. Mỗi project con giữ nguyên tooling riêng (Maven wrapper cho backend, npm/Angular CLI cho frontend), không dùng build tool bao trùm (Nx, Gradle composite...).

## Hệ quả

- Một commit có thể chứa cả thay đổi API và UI của một feature.
- Khi thêm Docker (giai đoạn sau), `docker-compose.yml` đặt ở thư mục gốc.
