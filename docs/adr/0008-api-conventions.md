# ADR-0008: Quy ước REST API và định dạng lỗi

- **Trạng thái**: Accepted
- **Ngày**: 2026-10-12

## Quyết định

- Mọi endpoint có tiền tố `/api`. Tài nguyên dùng danh từ số nhiều (`/api/tracks`, `/api/playlists/{id}/tracks`); tài nguyên của người dùng hiện tại dùng `/api/me/...`; chức năng quản trị dưới `/api/admin/...`.
- Request/response dùng DTO (Java `record`), **không trả entity JPA ra ngoài**.
- Danh sách phân trang trả về `PageResponse<T>` (`content`, `page`, `size`, `totalElements`, `totalPages`), tham số `?page=&size=` (page bắt đầu từ 0).
- Lỗi trả về chuẩn **RFC 9457 Problem Details** (`ProblemDetail` của Spring), xử lý tập trung trong `GlobalExceptionHandler`. Lỗi validation có thêm thuộc tính `errors: { field: message }`.
- Tài liệu API tự sinh bằng springdoc: Swagger UI tại `/swagger-ui.html`, OpenAPI JSON tại `/api-docs`.

## Hệ quả

- Frontend có thể xử lý lỗi thống nhất dựa trên `status`/`detail`.
