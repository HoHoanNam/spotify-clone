# Module Catalog: bài hát, album, nghệ sĩ, tìm kiếm

Phần "chỉ đọc" của kho nhạc mà mọi người dùng đã đăng nhập đều xem được. Việc thêm/sửa/xoá nằm ở [admin.md](admin.md). Mô hình dữ liệu và lý do: [ADR-0009](../adr/0009-catalog-track-model.md).

## 1. Mô hình dữ liệu (V3)

```
artists 1 ── n albums 1 ── n tracks n ── n artists   (qua track_artists, có position)
```

- `tracks.album_id` có thể NULL (single). Xoá album → bài thành single (`ON DELETE SET NULL`).
- `track_artists.position = 0` là nghệ sĩ chính.
- `tracks.play_count` tăng khi một lần nghe được tính (xem [player.md](player.md#4-đếm-lượt-nghe)).

## 2. API

| Method | Path | Trả về | Ghi chú |
|---|---|---|---|
| GET | `/api/tracks?q&page&size&sort` | `PageResponse<TrackResponse>` | mặc định mới nhất trước; `sort=playCount,desc` = phổ biến nhất; `q` lọc theo tên |
| GET | `/api/tracks/{id}` | `TrackResponse` | |
| POST | `/api/tracks/{id}/play` | 204 | +1 `play_count` và ghi lịch sử nghe của user |
| GET | `/api/albums?q&page&size` | `PageResponse<AlbumSummary>` | |
| GET | `/api/albums/{id}` | `AlbumDetail` | kèm danh sách bài theo `track_number` |
| GET | `/api/artists?q&page&size` | `PageResponse<ArtistSummary>` | mặc định sắp theo tên |
| GET | `/api/artists/{id}` | `ArtistDetail` | `followers`, `albums`, `topTracks` (10 bài nghe nhiều nhất), `appearsOn` (bài có nghệ sĩ làm khách mời) |
| GET | `/api/search?q` | `SearchResponse` | tối đa 10 kết quả mỗi loại: `tracks`, `albums`, `artists`, `playlists` (chỉ playlist public) |

`size` tối đa 50 (`spring.data.web.pageable.max-page-size`). Tìm kiếm dùng `ILIKE '%q%'`, không phân biệt hoa thường.

`TrackResponse.coverUrl` đã được fallback sẵn: dùng ảnh riêng của bài, không có thì lấy ảnh album.

## 3. Backend

- Mỗi `XxxService.list(q, pageable)` chọn `findByTitleContainingIgnoreCase` khi có `q`, ngược lại dùng `findAll`.
- DTO được tạo **bên trong** method `@Transactional(readOnly = true)` vì `open-in-view=false`: nạp lazy ngoài transaction sẽ ném lỗi.
- `TrackRepository.findFeaturing` dùng JPQL `index(a) > 0` trên danh sách `@OrderColumn`.
- `incrementPlayCount` là một câu `UPDATE … SET play_count = play_count + 1` (atomic) với `clearAutomatically = true`, để entity đã nạp trước đó trong cùng transaction không giữ số cũ.

## 4. Frontend

| Route | Component | Nội dung |
|---|---|---|
| `/` | `features/home/home` | Lời chào; lưới truy cập nhanh (Liked Songs, playlist của bạn, bài nghe gần đây); "Popular songs"; các hàng cuộn "New releases", "Artists", "Recently played", "Playlists from the community". Mỗi hàng có "Show all" |
| `/section/:kind` | `features/section/section-page` | Trang "Show all": `tracks`, `popular`, `recent`, `albums`, `artists`, `playlists`, cuộn vô hạn |
| `/search?q&type` | `features/search/search-page` | Chip "All / Songs / Artists / Albums / Playlists". Tab "All" gọi `/api/search`; các tab còn lại gọi list endpoint với `q` và cuộn vô hạn. Khi chưa gõ gì: "Recent searches" + ô "Browse all" |
| `/album/:id` | `features/album/album-page` | Header gradient; nút play, lưu album (⊕/✓), menu "…"; danh sách bài; ngày phát hành; "More by <nghệ sĩ>" |
| `/artist/:id` | `features/artist/artist-page` | Ảnh nền, số follower; play, Follow, menu "…"; Popular (5 bài, "See more"); Discography; Appears on; About |

- Nút play trên **card** (album, nghệ sĩ, playlist) dùng `ListPlayerService`: lần bấm đầu tải chi tiết rồi phát, bấm lại khi đang phát thì tạm dừng.
- "Recent searches" (`RecentSearches`) lưu trong `localStorage`, tối đa 10 mục, mỗi trình duyệt một danh sách. Mục được ghi lại khi bấm vào kết quả.
- Ô tìm kiếm ở top bar giữ nguyên tab đang chọn (`queryParamsHandling: 'merge'`) khi đang ở `/search`.

## 5. Test

- `AdminTrackControllerTest`: upload, đọc duration, đổi thứ tự nghệ sĩ.
- `AdminCatalogUpdateTest`: sửa album/nghệ sĩ; "Appears on" chỉ chứa bài mà nghệ sĩ làm khách mời.
- `LibraryControllerTest.recentlyPlayedIsDistinctAndNewestFirst`: `play` tăng `play_count` và ghi lịch sử.

## 6. Hạn chế đã biết

- Tìm kiếm `ILIKE '%q%'` không dùng được index B-tree. Khi dữ liệu lớn: `pg_trgm` + GIN index, hoặc full-text search.
- Không có trang chi tiết bài hát (`/track/:id`); menu bài hát dẫn tới album/nghệ sĩ.
