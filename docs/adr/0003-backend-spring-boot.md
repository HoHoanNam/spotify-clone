# ADR-0003: Backend Spring Boot 4 + Java 21, package-by-feature

- **Trạng thái**: Accepted
- **Ngày**: 2026-10-12

## Bối cảnh

Tech stack được chỉ định là Java Spring Boot. Cần chọn phiên bản và cách tổ chức code.

## Quyết định

- **Spring Boot 4.1.x** (bản ổn định mới nhất tại thời điểm khởi tạo), **Java 21 LTS**, build bằng **Maven** (có Maven wrapper `mvnw`).
- Thư viện chính: Spring Web MVC, Spring Data JPA, Spring Security, Bean Validation, Flyway, PostgreSQL driver, Lombok, springdoc-openapi (Swagger UI), jjwt.
- **Package-by-feature** dưới `com.spotify.clone`:
  - `config/` — cấu hình hạ tầng (security, CORS, OpenAPI, `AppProperties`).
  - `common/` — thành phần dùng chung (exception handler, `PageResponse`...).
  - Mỗi domain một package: `auth/`, `user/`, `artist/`, `album/`, `track/`, `playlist/`, `like/`, `storage/`, `admin/`. Bên trong chứa entity, repository, service, controller, dto của domain đó.
- Cấu hình qua `application.yml` + biến môi trường; giá trị riêng máy đặt trong `application-local.yml` (gitignored). Cấu hình ứng dụng gom vào record `AppProperties` (prefix `app`).
- `spring.jpa.open-in-view=false`, `ddl-auto=validate` — schema do Flyway quản lý, Hibernate chỉ kiểm tra.

## Hệ quả

- Code của một feature nằm gần nhau, dễ xoá/sửa theo feature.
- Spring Boot 4 còn mới: một số tài liệu/thư viện bên thứ ba có thể vẫn hướng dẫn theo Boot 3 (ví dụ tên property đã đổi như `spring.web.error.*`). Khi gặp, ghi lại trong CHANGELOG.
