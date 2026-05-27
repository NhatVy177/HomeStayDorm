# Homestay Dorm — Style Reference
> Rõ ràng để khách dễ thuê, tinh gọn để hệ thống dễ quản lý.

**Theme:** light

Homestay Dorm sử dụng giao diện sáng, nền trắng/xám rất nhẹ để tạo cảm giác sạch sẽ, đáng tin và dễ đọc lâu. Bảng màu chính xoay quanh xanh mint-teal làm màu nhận diện, cam terracotta làm điểm nhấn hành động, kết hợp chữ charcoal để tránh cảm giác gắt như đen thuần. Các khối giao diện dùng nền trắng, viền mỏng và bóng mềm để tạo chiều sâu nhẹ nhưng vẫn giữ tổng thể tối giản. Bo góc lớn được dùng nhất quán cho card, nút, input và badge nhằm tạo cảm giác thân thiện, hiện đại, phù hợp với hệ thống thuê phòng/homestay cho sinh viên và khách thuê trẻ.

## Tokens — Colors

| Name | Value | Token | Role |
|---|---:|---|---|
| Porcelain White | `#ffffff` | `--surface` | Nền card, modal, input, header, các khối nội dung chính |
| Cloud Canvas | `#f8f9fa` | `--bg` | Nền tổng thể của trang, giúp giao diện sáng nhưng không chói |
| Soft Paper | `#f9fafb` | `--surface-soft` | Nền phụ cho input, vùng lọc, trạng thái nhẹ |
| Charcoal Ink | `#222222` | `--text` | Chữ chính, tiêu đề, nội dung quan trọng |
| Deep Header Ink | `#1a1a1a` | `--heading-text` | Tiêu đề lớn, heading nổi bật |
| Quiet Graphite | `#555555` | `--muted` | Chữ phụ, mô tả, label, metadata |
| Mist Border | `#e9ecef` | `--line` | Viền card, input, header, button phụ |
| Mint Teal | `#2fb7a4` | `--green` | Màu nhận diện chính, trạng thái còn trống, icon, hover |
| Harbor Teal | `#16796f` | `--green-dark` | Chữ nhấn, link, active nav, trạng thái quan trọng |
| Mint Wash | `#eaf7f5` | `--green-soft` | Nền badge, pill, hover nav, icon box |
| Terracotta Flame | `#e86f51` | `--orange` / `--cta` | CTA chính, avatar, điểm nhấn tương tác |
| Burnt Coral | `#bf4c32` | `--orange-dark` / `--cta-dark` | Hover/gradient đậm cho CTA |
| Coral Mist | `#fff1ed` | `--orange-soft` | Nền tag giá, trạng thái hành động nhẹ |
| Footer Navy | `#1e293b` | `--footer-bg` | Nền footer, toast, vùng thông tin cuối trang |
| Pure White | `#ffffff` | `--white` | Chữ trên nền CTA hoặc nền tối |
| Hero Glass Start | `#ffffff` | `--hero-start` | Điểm đầu gradient nền hero |
| Hero Glass End | `#f8f9fa` | `--hero-end` | Điểm cuối gradient nền hero |
| Terracotta CTA Gradient | `linear-gradient(135deg, #e86f51 0%, #bf4c32 100%)` | `--gradient-cta` | Nút chính, hành động nổi bật nhất |
| Soft Hero Gradient | `linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)` | `--gradient-hero` | Nền hero/landing section |
| Mint Ambient Glow | `radial-gradient(circle at 10% 12%, rgba(47,183,164,0.055), transparent 30%)` | `--gradient-mint-glow` | Ánh sáng nền rất nhẹ ở hero |
| Coral Ambient Glow | `radial-gradient(circle at 88% 10%, rgba(232,111,81,0.05), transparent 24%)` | `--gradient-coral-glow` | Ánh sáng phụ tạo điểm ấm cho hero |

## Tokens — Typography

Font chính của hệ thống là `Inter`, dùng cho body, form, card, bảng, mô tả và nội dung dài vì dễ đọc, trung tính và rõ nét trên giao diện web. Font nhấn là `Be Vietnam Pro`, dùng cho header, brand, navigation và headline để chữ tiếng Việt gọn, hiện đại, ít bị nặng mắt. Font substitute hệ thống: `"Segoe UI", Arial, sans-serif`. Weights khuyến nghị: `400` cho body thường, `500` cho navigation/input, `600` cho button và heading vừa, `700` cho card title/section title, `800` chỉ dùng cho số liệu hoặc điểm nhấn rất ngắn. Letter spacing mặc định nên giữ âm nhẹ ở heading để chữ thanh thoát: body `0em`, nav/button `-0.012em`, heading `-0.02em` đến `-0.045em`.

**Type Scale**

| Role (caption, body-sm, body, subheading, heading-sm, heading, heading-lg, display) | Size | Line Height | Letter Spacing | Token |
|---|---:|---:|---:|---|
| caption | `12px` | `16px` | `0em` | `--font-caption` |
| body-sm | `14px` | `21px` | `0em` | `--font-body-sm` |
| body | `16px` | `26px` | `0em` | `--font-body` |
| subheading | `18px` | `26px` | `-0.012em` | `--font-subheading` |
| heading-sm | `20px` | `24px` | `-0.016em` | `--font-heading-sm` |
| heading | `clamp(28px, 4vw, 40px)` | `1.18` | `-0.02em` | `--font-heading` |
| heading-lg | `clamp(38px, 5vw, 62px)` | `1.08` | `-0.045em` | `--font-heading-lg` |
| display | `64px` | `70px` | `-0.05em` | `--font-display` |

## Tokens — Spacing & Shapes

- Base unit: `4px`.
- Density: `comfortable`.
- Nguyên tắc: dùng khoảng cách rộng vừa phải, ưu tiên thoáng, không nhồi nhiều nội dung trong một khung. Các trang dashboard/sidebar sau này vẫn dùng cùng scale để không lệch so với trang chủ.

**Spacing Scale**

| Name | Value | Token |
|---|---:|---|
| space-1 | `4px` | `--space-1` |
| space-2 | `8px` | `--space-2` |
| space-3 | `12px` | `--space-3` |
| space-4 | `16px` | `--space-4` |
| space-5 | `20px` | `--space-5` |
| space-6 | `24px` | `--space-6` |
| space-7 | `28px` | `--space-7` |
| space-8 | `32px` | `--space-8` |
| space-10 | `40px` | `--space-10` |
| space-12 | `48px` | `--space-12` |
| space-14 | `56px` | `--space-14` |
| space-16 | `64px` | `--space-16` |
| section-y | `74px` | `--section-y` |

**Border Radius**

| Element | Value | Token |
|---|---:|---|
| Small badge / compact tag | `12px` | `--radius-sm` |
| Input / mobile menu / small control | `14px - 16px` | `--radius-md` |
| Icon box / small card element | `18px` | `--radius-icon` |
| Button / pill / nav item | `999px` | `--radius-pill` |
| Modal close button | `14px` | `--radius-control` |
| Standard card | `26px - 28px` | `--radius-card` |
| Search panel / large card | `30px` | `--radius-xl` |
| Hero image | `38px` desktop, `30px` mobile | `--radius-hero` |
| Modal | `28px` | `--radius-modal` |

Layout:
- Desktop container: `width: min(1440px, calc(100% - 120px)); max-width: 1440px; margin: 0 auto;`.
- Desktop lớn từ `1600px`: `width: min(1480px, calc(100% - 180px)); max-width: 1480px;`.
- Mobile container: `width: min(100% - 28px, 1140px);`.
- Section gap dọc: `74px` desktop, `58px` mobile.
- Card padding: `20px` cho room card content, `24px` cho benefit/step card, `18px` cho search box.
- Element gap: `8px` cho nav, `10px` cho header actions, `12px` cho form/search, `18px` cho card grid nhỏ, `22px` cho room grid, `44px - 68px` cho hero grid.
- Không dùng layout kéo sát mép toàn màn hình; mọi trang phải canh theo cùng container của header/trang chủ để tránh lệch khung.

**Shadows**

| Name | Value | Token |
|---|---:|---|
| Soft Card Shadow | `0 14px 34px rgba(15, 23, 42, 0.075)` | `--shadow` |
| Header Shadow | `0 8px 24px rgba(15, 23, 42, 0.035)` | `--shadow-header` |
| Button CTA Shadow | `0 12px 24px rgba(232, 111, 81, 0.24)` | `--shadow-cta` |
| Button CTA Hover Shadow | `0 16px 30px rgba(232, 111, 81, 0.30)` | `--shadow-cta-hover` |
| Control Shadow | `0 8px 18px rgba(15, 23, 42, 0.035)` | `--shadow-control` |
| Modal Shadow | `0 24px 60px rgba(47, 111, 159, 0.16)` | `--shadow-modal` |
| Optional Hard Offset Mockup | `rgb(15, 23, 42) 2px 2px 0px 0px` | `--shadow-hard-demo` |

## Components

**Filled Primary Button**

| Property | Value |
|---|---|
| Background | `linear-gradient(135deg, #e86f51, #bf4c32)` |
| Text | `#ffffff`, font `Inter/Be Vietnam Pro`, `14px - 16px`, weight `600` |
| Border | `none` |
| Radius | `999px` |
| Padding | Header: `10px 17px`; Body CTA: `12px 18px` |
| Height | Header min-height `42px`; normal button theo nội dung |
| Shadow | `0 12px 24px rgba(232, 111, 81, 0.24)` |
| Hover | `translateY(-2px)`, shadow tăng lên `0 16px 30px rgba(232, 111, 81, 0.30)`, saturation nhẹ |
| Usage | CTA chính: Đăng ký, Tìm phòng, Xem phòng trống, Gửi form |

**Outlined Accent Button**

| Property | Value |
|---|---|
| Background | `#ffffff` |
| Text | `#333333`; hover đổi sang `#16796f` |
| Border | `1px solid #e9ecef`; hover dùng `#dfe5eb` |
| Radius | `999px` |
| Padding | Header: `10px 17px`; Body: `12px 18px` |
| Shadow | `0 8px 18px rgba(15, 23, 42, 0.035)` |
| Hover | `background: #f9fafb`, `translateY(-2px)` |
| Usage | Đăng nhập, nút phụ trong hero, thao tác thứ cấp |

**Ghost Bordered Button**

| Property | Value |
|---|---|
| Background | `transparent` hoặc `#ffffff` ở vùng có nền sáng |
| Text | Default `#333333`; active/hover `#16796f` |
| Border | `1px solid transparent`; active `1px solid #e9ecef` |
| Radius | `999px` |
| Padding | `10px 13px` |
| Shadow | Chỉ dùng khi active: `0 8px 20px rgba(15, 23, 42, 0.06)` |
| Hover | `background: #eaf7f5`; text `#16796f` |
| Usage | Navigation link, tab nhẹ, filter pill không phải CTA |

**Header Position & Layout Standard — áp dụng thống nhất cho mọi UI**

| Property | Value |
|---|---|
| Position | `sticky` |
| Top | `0` |
| Z-index | `60` |
| Background | `rgba(255, 255, 255, 0.92)` |
| Backdrop | `backdrop-filter: blur(14px)` |
| Border | `border-bottom: 1px solid #e9ecef` |
| Shadow | `0 8px 24px rgba(15, 23, 42, 0.035)` |
| Desktop height | `.topbar { height: 84px; }` |
| Tablet/mobile height | `height: auto; padding: 14px 0;` |
| Desktop container | `.container-wide { width: min(1440px, calc(100% - 120px)); max-width: 1440px; margin: 0 auto; }` |
| Large desktop container | `@media (min-width:1600px) { width: min(1480px, calc(100% - 180px)); }` |
| Mobile container | `width: calc(100% - 28px)` |
| Header layout | Brand nằm trái; navigation và actions dồn về phải; không căn giữa nav độc lập |
| Brand | Icon `48px × 48px`, hình tròn, nền trắng, viền `#e9ecef`, gap với text `12px` |
| Brand text | `Homestay Dorm`, font `Be Vietnam Pro`, size `18px`, weight `700`; chữ `Dorm` dùng `#16796f`, weight `800` |
| Navigation | `.nav-center { margin-left: auto; display: flex; justify-content: flex-end; align-items: center; gap: 8px; flex-wrap: wrap; }` |
| Nav order | `Trang chủ` → `Phòng trống` → `Quy trình` → `Liên hệ` |
| Nav item | `14.5px`, weight `500`, padding `10px 13px`, radius `999px`, color `#333333` |
| Active nav | Background `#ffffff`, text `#16796f`, border `#e9ecef`, shadow nhẹ |
| Header actions | `.header-actions { display: flex; justify-content: flex-end; align-items: center; gap: 10px; flex-shrink: 0; }` |
| Action order | `Đăng nhập` dùng Outlined Accent Button; `Đăng ký` dùng Filled Primary Button; mobile menu nằm cuối |
| Mobile behavior | Ẩn `.nav-center`, hiện `.mobile-menu`; ẩn bớt account/logout nếu là dashboard khách hàng |
| Alignment rule | Header và toàn bộ nội dung trang phải dùng cùng container width. Tuyệt đối không để header rộng một kiểu, body rộng một kiểu vì sẽ làm khung bị lệch. |
| Dashboard rule | Với trang khách hàng/dashboard, vẫn giữ chuẩn header này: logo trái, cụm hồ sơ/tài khoản hoặc hành động nằm góc phải; không đặt thông tin người dùng lặp lại ở sidebar nếu header đã có. |

**Iconography & Micro UI**

| Element | Rule |
|---|---|
| Main icon style | Line icon mảnh, bo tròn đầu nét, stroke khoảng `1.8px - 2px` |
| Brand icon | Icon nhà trong vòng tròn `48px`, màu `#16796f` |
| Emoji icon | Chỉ dùng trong card phụ hoặc landing section, không lạm dụng trong dashboard nghiệp vụ |
| Badge / status | Dạng pill, radius `999px`, padding `6px 10px` hoặc `8px 12px` |
| Available status | Background `#2fb7a4`, text `#ffffff` |
| Soon status | Background `#4a5568`, text `#ffffff` |
| Price tag | Background `#fff1ed`, text `#bf4c32`, border `rgba(232,111,81,0.18)` |
| Input | Background `#ffffff`, border `#e9ecef`, radius `16px`, padding `13px 14px` |
| Input focus | Border `#2fb7a4`, ring `0 0 0 4px rgba(47, 183, 164, 0.12)` |
| Card | Background `#ffffff`, border `#e9ecef`, radius `26px - 28px`, shadow `--shadow` |
