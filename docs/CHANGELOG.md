# Changelog

Ghi lại các thay đổi quan trọng (feature hoàn thành, thay đổi API/schema, breaking change, nâng cấp phụ thuộc lớn). Mục mới nhất ở trên cùng.

Định dạng mỗi mục: `## YYYY-MM-DD — Tiêu đề` rồi các nhóm **Added / Changed / Fixed / Removed**, liên kết ADR nếu có.

## 2026-10-12 — Khởi tạo base dự án

### Added
- Monorepo `backend/` + `frontend/` + `docs/` ([ADR-0002](adr/0002-monorepo-structure.md)).
- Backend Spring Boot 4.1.1 / Java 21 tạo từ Spring Initializr, thêm springdoc-openapi 3.1.1 và jjwt 0.13.0 ([ADR-0003](adr/0003-backend-spring-boot.md)).
  - `SecurityConfig` stateless (chưa có JWT filter), CORS cho `http://localhost:4200`, BCrypt `PasswordEncoder`.
  - `AppProperties` (prefix `app`: storage, cors, jwt), `OpenApiConfig` với Bearer auth.
  - `GlobalExceptionHandler` trả Problem Details, `PageResponse<T>`, `GET /api/health`.
  - Flyway `V1__baseline.sql` (schema rỗng).
  - Cấu hình riêng máy qua `application-local.yml` (gitignored).
- Frontend Angular 22 + Tailwind v4 ([ADR-0004](adr/0004-frontend-angular-tailwind.md)).
  - Layout shell tĩnh: sidebar, vùng nội dung, player bar placeholder; trang Home placeholder.
  - Design token màu Spotify trong `styles.css`, proxy `/api` → `:8080`, `environment.apiUrl`.
- Thư mục tài liệu: ADR 0001–0008, tổng quan kiến trúc, roadmap, hướng dẫn setup.

### Notes
- Spring Initializr trả `bootVersion=4.1.1.RELEASE` nhưng artifact trên Maven Central là `4.1.1` → đã sửa trong `pom.xml`.
- Spring Boot 4 đổi `server.error.include-stacktrace` thành `spring.web.error.include-stacktrace`.
