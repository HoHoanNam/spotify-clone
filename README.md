# Spotify Clone

Bản clone Spotify tập trung vào core feature: xác thực, phát nhạc, thư viện nhạc, playlist & liked songs, admin upload.

| Phần | Công nghệ |
|---|---|
| `backend/` | Spring Boot 4.1 · Java 21 · Spring Security (JWT) · JPA · Flyway · PostgreSQL |
| `frontend/` | Angular 22 (standalone, signals) · Tailwind CSS v4 |
| `docs/` | ADR, tổng quan kiến trúc, roadmap, changelog |

## Bắt đầu nhanh

Xem hướng dẫn đầy đủ tại [docs/development/setup.md](docs/development/setup.md).

```bash
# Backend (cần PostgreSQL với database spotify_clone)
cd backend && cp application-local.example.yml application-local.yml && ./mvnw spring-boot:run

# Frontend
cd frontend && npm install && npm start
```

## Tài liệu

Bắt đầu từ [docs/README.md](docs/README.md).
