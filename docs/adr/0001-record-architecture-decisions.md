# ADR-0001: Ghi lại quyết định kiến trúc bằng ADR

- **Trạng thái**: Accepted
- **Ngày**: 2026-10-12

## Bối cảnh

Dự án phát triển dần qua nhiều giai đoạn (local → Docker → có thể deploy). Lý do đằng sau các lựa chọn công nghệ dễ bị quên, khiến sau này khó đánh giá có nên thay đổi hay không.

## Quyết định

Dùng Architecture Decision Records (định dạng rút gọn của Michael Nygard) lưu trong `docs/adr/`, kèm `docs/CHANGELOG.md` cho các thay đổi quan trọng.

## Hệ quả

- Mọi quyết định kiến trúc mới phải có ADR đi kèm trong cùng commit/PR.
- ADR đã chấp nhận là bất biến; thay đổi quyết định bằng ADR mới (supersede).
