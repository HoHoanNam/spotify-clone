# Giao diện dùng chung & tính năng UX

Các thành phần dùng ở nhiều trang, cùng những tính năng nâng cao trải nghiệm. Quy ước tổ chức file component: [overview.md](../architecture/overview.md#quy-ước-chính).

## 1. Khung ứng dụng (`layout/`)

```
┌ topbar: logo · ‹ › · Home · [ Search ] · Admin · avatar ▾ ───────────────┐
├ sidebar (Your Library) ┬ main (router-outlet) ┬ queue panel (khi mở) ──────┤
├ player bar ─────────────────────────────────────────────────────────────────┤
└ tab bar Home / Search / Your Library (chỉ trên điện thoại) ────────────────┘
```

- `Shell` chứa các overlay dùng chung cho toàn app: toast, context menu, dialog xác nhận, dialog phím tắt.
- Cuộn trang nằm trong `<main>`, không phải `window`: khi điều hướng, `Shell` tự cuộn về đầu trang và đóng menu.
- Dưới `md` thì sidebar ẩn; "Your Library" chuyển sang trang `/collection` và thanh tab dưới cùng. Panel Queue chỉ hiện từ `lg`.

## 2. Thành phần dùng chung (`shared/`)

| Thành phần | Mô tả |
|---|---|
| `track-list` | Bảng bài hát: double-click để phát; cột # chuyển thành nút play khi hover, hiện sóng nhạc khi đang phát; tim; thời lượng; nút "…"; chuột phải mở menu; cột "Date added" (`addedAt`); kéo-thả (`reorderable`, output `moved`); "Remove from this playlist" (`removable`, output `removed`) |
| `track-menu.service` | Dựng menu bài hát: Add to playlist ▸ (New playlist + playlist của tôi), Remove from this playlist, Save to / Remove from Liked Songs, Add to queue, Go to artist (▸ nếu nhiều nghệ sĩ), Go to album. `forList()` cho header album/playlist/nghệ sĩ |
| `menu/context-menu(.service)` | Một context menu cho toàn app; mở tại con trỏ (`openAt`) hoặc dưới nút (`openFrom`); không tràn ra ngoài màn hình; submenu tự lật sang trái khi gần mép phải; đóng khi click ra ngoài, Esc, cuộn, resize, điều hướng |
| `dialog/modal` | Khung dialog: nền mờ, Esc / click nền để đóng, tự focus vào field đầu |
| `dialog/confirm(.service)` | `await confirm({ title, message, confirmLabel, danger })` thay `window.confirm` |
| `like-button` | Nút tim, đọc / ghi qua `LibraryStore` |
| `playlist-cover` | Ảnh riêng, mosaic 2×2 hoặc placeholder |
| `media-card` | Card album / nghệ sĩ / playlist / bài hát, nút play trượt lên khi hover |
| `shelf` | Hàng card có tiêu đề + "Show all"; `singleRow` chỉ giữ số card vừa một hàng |
| `infinite-scroll` | Directive dùng `IntersectionObserver`, phát sự kiện khi phần tử "lính canh" gần vào màn hình |
| `relative-time.pipe` | "5 minutes ago", "3 days ago", rồi "Oct 14, 2026" |

`core/util/paged-list.ts` (`PagedList<T>`) quản lý trạng thái cuộn vô hạn: `items`, `loading`, `done`, `error`, `loadMore()`, `reset(fetch?)`. Mẫu dùng chuẩn: chỉ render "lính canh" khi không đang tải, để directive được tạo lại và bắn lần nữa nếu danh sách vẫn ngắn hơn màn hình.

```html
@if (list.loading()) { <app-page-status /> }
@else if (!list.done()) { <div (appInfiniteScroll)="list.loadMore()"></div> }
```

## 3. Kéo-thả

- Mọi dòng trong `track-list` đều `draggable`, dữ liệu gồm `application/x-spotify-clone-tracks` (JSON mảng id) và `text/plain` (tên bài).
- Thả vào **playlist** ở sidebar → thêm vào playlist; thả vào **Liked Songs** → like. Mục đang được kéo qua có viền xanh.
- Trong playlist của mình (`reorderable`): kéo lên/xuống để đổi thứ tự; một vạch xanh cho biết vị trí sẽ thả.

## 4. Phím tắt

Bị bỏ qua khi đang gõ trong ô nhập liệu. Bấm `?` (hoặc menu tài khoản → Keyboard shortcuts) để xem danh sách.

| Phím | Tác dụng |
|---|---|
| `Space` | Phát / tạm dừng |
| `Ctrl` + `→` / `←` | Bài tiếp / bài trước |
| `Shift` + `→` / `←` | Tua ±5 giây |
| `Ctrl` + `↑` / `↓` | Âm lượng ±10% |
| `M` · `S` · `R` · `L` | Tắt tiếng · Shuffle · Repeat · Like bài đang phát |
| `Q` | Mở / đóng Queue |
| `/` | Focus ô tìm kiếm |
| `?` | Danh sách phím tắt |

## 5. Các tính năng UX khác

- **Cập nhật lạc quan** cho like / lưu / follow / sắp xếp / xoá bài khỏi playlist: UI đổi ngay, hoàn tác nếu server báo lỗi.
- **Ghi nhớ phiên nghe** sau khi tải lại trang ([player.md](player.md#3-lưu--khôi-phục-phiên-nghe)).
- **Recent searches** và ô "Browse all" trên trang Search.
- **Toast** cho mọi thao tác ("Added to Liked Songs", "Added to My Playlist #2", "Already in …").
- Biểu tượng **loa** ở sidebar cho danh sách đang phát; tên bài đang phát có màu xanh trong mọi danh sách.
- Nút back / forward lịch sử ở top bar (từ `lg`).
