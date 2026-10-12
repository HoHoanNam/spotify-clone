# Tổng quan kiến trúc

```
┌──────────────────────┐   /api (proxy khi dev)   ┌───────────────────────────┐
│  Angular SPA          │ ───────────────────────▶ │  Spring Boot API (:8080)   │
│  (:4200)              │   JWT Bearer token       │  Security · JPA · Flyway   │
│  layout / features    │ ◀─────────────────────── │                           │
│  <audio> ← Range req  │                          └──────┬──────────────┬─────┘
└──────────────────────┘                                  │              │
                                                    PostgreSQL     Local disk
                                                  (spotify_clone)  (storage/audio, images)
```

## Cấu trúc thư mục

```
spotify/
├─ backend/                         Spring Boot (Maven)
│  ├─ src/main/java/com/spotify/clone/
│  │  ├─ config/                    SecurityConfig, OpenApiConfig, AppProperties
│  │  ├─ common/                    exception/, web/ (PageResponse, HealthController)
│  │  └─ <feature>/                 (sẽ thêm) auth, user, artist, album, track, playlist, like, storage, admin
│  ├─ src/main/resources/
│  │  ├─ application.yml            cấu hình chung, đọc biến môi trường
│  │  ├─ application-dev.yml        profile dev (mặc định)
│  │  └─ db/migration/              Flyway migrations
│  └─ application-local.example.yml mẫu cấu hình riêng máy
├─ frontend/                        Angular 22 + Tailwind v4
│  ├─ src/app/
│  │  ├─ core/                      (sẽ thêm) services, interceptors, guards, models
│  │  ├─ layout/                    shell, sidebar, player-bar
│  │  ├─ features/                  home, ... (lazy-loaded)
│  │  └─ shared/                    (sẽ thêm) component tái sử dụng
│  ├─ src/environments/             apiUrl theo môi trường
│  └─ proxy.conf.json               /api → localhost:8080
└─ docs/                            tài liệu, ADR, changelog
```

## Quy ước chính

- Backend: package-by-feature ([ADR-0003](../adr/0003-backend-spring-boot.md)); DTO là `record`; lỗi theo Problem Details ([ADR-0008](../adr/0008-api-conventions.md)).
- Frontend: standalone component, signals, lazy route ([ADR-0004](../adr/0004-frontend-angular-tailwind.md)).
- Schema chỉ thay đổi qua Flyway migration ([ADR-0005](../adr/0005-postgresql-flyway.md)).
