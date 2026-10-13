# Luồng thực thi Auth

Tài liệu này giải thích cách phần xác thực (Auth) hoạt động. Nó đi theo 4 luồng chính: **khởi động app**, **đăng ký**, **đăng nhập**, và **gọi API có token**. Mỗi luồng được trình bày theo đúng thứ tự code chạy, kèm đoạn code quan trọng và giải thích.

Quyết định thiết kế nằm ở [ADR-0006: Xác thực stateless bằng JWT](../adr/0006-stateless-jwt-auth.md). Tài liệu này mô tả cách quyết định đó được hiện thực hoá trong code.

**Mục lục**

- [0. Bức tranh tổng thể](#0-bức-tranh-tổng-thể)
- [1. Lúc khởi động app](#1-lúc-khởi-động-app)
- [2. Luồng đăng ký](#2-luồng-đăng-ký-post-apiauthregister)
- [3. Luồng đăng nhập](#3-luồng-đăng-nhập-post-apiauthlogin)
- [4. Luồng gọi API có token](#4-luồng-gọi-api-có-token-ví-dụ-get-apime)
- [5. Các đường đi của lỗi](#5-các-đường-đi-của-lỗi)
- [6. Tóm tắt](#6-tóm-tắt)
- [7. Tự kiểm chứng](#7-tự-kiểm-chứng)

---

## 0. Bức tranh tổng thể

```
HTTP request
   │
   ▼
┌──────────────── Spring Security filter chain ────────────────┐
│  CorsFilter → ... → JwtAuthenticationFilter → ...             │
│                 → AuthorizationFilter (permitAll / authenticated / hasRole)
└───────────────────────────────────────────────────────────────┘
   │ (được phép đi tiếp)
   ▼
DispatcherServlet → Controller → Service → Repository → PostgreSQL
   │ (nếu ném exception)
   ▼
GlobalExceptionHandler → ProblemDetail JSON
```

Có hai "tầng" xử lý lỗi khác nhau, cần phân biệt từ đầu:

- **Tầng filter** (trước khi vào controller): lỗi được xử lý bởi `authenticationEntryPoint` (trả 401) và `AccessDeniedHandler` (trả 403).
- **Tầng controller/service**: lỗi đi vào `GlobalExceptionHandler`.

Các file liên quan:

| File | Vai trò |
|---|---|
| [config/SecurityConfig.java](../../backend/src/main/java/com/spotify/clone/config/SecurityConfig.java) | Dựng filter chain, luật phân quyền, `AuthenticationManager`, `PasswordEncoder` |
| [auth/JwtService.java](../../backend/src/main/java/com/spotify/clone/auth/JwtService.java) | Tạo và đọc JWT |
| [auth/JwtAuthenticationFilter.java](../../backend/src/main/java/com/spotify/clone/auth/JwtAuthenticationFilter.java) | Đọc header `Bearer` ở mỗi request |
| [auth/AppUserDetailsService.java](../../backend/src/main/java/com/spotify/clone/auth/AppUserDetailsService.java) | Tìm user theo email lúc đăng nhập |
| [auth/AppUserDetails.java](../../backend/src/main/java/com/spotify/clone/auth/AppUserDetails.java) | Adapter giữa entity `User` và Spring Security |
| [auth/AuthService.java](../../backend/src/main/java/com/spotify/clone/auth/AuthService.java) / [AuthController.java](../../backend/src/main/java/com/spotify/clone/auth/AuthController.java) | Đăng ký, đăng nhập |
| [auth/AdminSeeder.java](../../backend/src/main/java/com/spotify/clone/auth/AdminSeeder.java) | Tạo tài khoản admin lúc khởi động |
| [user/UserController.java](../../backend/src/main/java/com/spotify/clone/user/UserController.java) / [UserService.java](../../backend/src/main/java/com/spotify/clone/user/UserService.java) | `GET` / `PATCH /api/me` |
| [common/exception/GlobalExceptionHandler.java](../../backend/src/main/java/com/spotify/clone/common/exception/GlobalExceptionHandler.java) | Đổi exception thành Problem Details |

---

## 1. Lúc khởi động app

### 1.1 `JwtService` tạo khoá ký một lần duy nhất

```java
public JwtService(AppProperties props) {
  this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(props.jwt().secret()));
  this.ttl = props.jwt().accessTokenTtl();
}
```

- `app.jwt.secret` trong `application.yml` là chuỗi Base64. Constructor decode chuỗi đó ra thành byte, rồi tạo `SecretKey` dùng cho thuật toán HMAC.
- `hmacShaKeyFor` ném lỗi nếu key ngắn hơn 256 bit. Nhờ vậy cấu hình sai bị phát hiện ngay lúc khởi động, thay vì khi đã có người dùng.
- Spring tự đổi `24h` trong file cấu hình thành kiểu `Duration`.

### 1.2 `SecurityConfig` dựng filter chain

```java
http
    .csrf(AbstractHttpConfigurer::disable)
    .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
    .httpBasic(AbstractHttpConfigurer::disable)
    .formLogin(AbstractHttpConfigurer::disable)
    .exceptionHandling(e -> e
        .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
    .authorizeHttpRequests(auth -> auth
        .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
        .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
        .requestMatchers("/api/admin/**").hasRole("ADMIN")
        .anyRequest().authenticated())
    .addFilterBefore(new JwtAuthenticationFilter(jwtService, userRepository),
        UsernamePasswordAuthenticationFilter.class);
```

| Dòng | Ý nghĩa |
|---|---|
| `csrf disable` | CSRF là kiểu tấn công lợi dụng cookie mà trình duyệt tự gửi kèm. Ở đây token nằm trong header `Authorization` và trình duyệt không tự gửi header này, nên không cần chống CSRF. |
| `STATELESS` | Server không tạo `HttpSession`. Mỗi request phải tự chứng minh danh tính bằng token. |
| `httpBasic` / `formLogin` disable | Tắt trang login HTML mặc định và cơ chế Basic auth, vì đăng nhập đã có API riêng. |
| `authenticationEntryPoint(401)` | Request chưa đăng nhập mà gọi endpoint cần đăng nhập sẽ nhận 401. Nếu không cấu hình, mặc định là 403. |
| `dispatcherTypeMatchers(ERROR)` | Cho phép lượt chuyển tiếp nội bộ sang `/error`. Giải thích chi tiết ở [mục 5.1](#51-lỗi-ở-tầng-filter-chưa-vào-controller). |
| `requestMatchers(...)` | Các luật được xét **theo thứ tự từ trên xuống, luật đầu tiên khớp sẽ quyết định**. Vì vậy `anyRequest()` luôn phải nằm cuối. |
| `hasRole("ADMIN")` | Spring tự thêm tiền tố, nên thực chất là kiểm tra authority `ROLE_ADMIN`. |
| `addFilterBefore(...)` | Chèn filter JWT vào chain, chạy trước bước phân quyền. |

```java
@Bean
AuthenticationManager authenticationManager(AuthenticationConfiguration config) {
  return config.getAuthenticationManager();
}
```

Bean này cho phép `AuthService` inject `AuthenticationManager`. Spring thấy trong context có đúng một `UserDetailsService` (là `AppUserDetailsService`) và một `PasswordEncoder` (BCrypt), nên tự lắp chúng vào một `DaoAuthenticationProvider`. Log khởi động có dòng xác nhận việc này:

```
Global AuthenticationManager configured with UserDetailsService bean with name appUserDetailsService
```

### 1.3 `AdminSeeder` chạy sau khi app sẵn sàng

```java
public class AdminSeeder implements ApplicationRunner {
  @Override @Transactional
  public void run(ApplicationArguments args) {
    var admin = props.admin();
    if (admin == null || !StringUtils.hasText(admin.email()) || ...) return;  // không cấu hình → bỏ qua
    if (userRepository.existsByEmail(email)) return;                          // đã có → không tạo lại
    User user = new User("Admin", email, passwordEncoder.encode(admin.password()));
    user.setRole(Role.ADMIN);
    userRepository.save(user);
  }
}
```

- `ApplicationRunner` chạy **một lần**, sau khi toàn bộ context đã sẵn sàng. Lúc này Flyway đã tạo xong bảng.
- Có thể khởi động lại app bao nhiêu lần cũng được: nếu admin đã tồn tại thì seeder không làm gì.
- Email và mật khẩu admin lấy từ `app.admin.*` (biến môi trường `ADMIN_EMAIL` / `ADMIN_PASSWORD`, hoặc file `application-local.yml`). Không commit mật khẩu thật lên git.

---

## 2. Luồng đăng ký: `POST /api/auth/register`

```
Client ──▶ JwtAuthenticationFilter (không có header → bỏ qua)
       ──▶ AuthorizationFilter (/api/auth/** → permitAll)
       ──▶ AuthController.register ──▶ @Valid ──▶ AuthService.register
       ◀── 201 { accessToken, tokenType, expiresIn, user }
```

### 2.1 Validate ở controller

```java
@PostMapping("/register")
@ResponseStatus(HttpStatus.CREATED)
AuthResponse register(@Valid @RequestBody RegisterRequest req) { ... }
```

- `@RequestBody`: Jackson chuyển JSON thành record `RegisterRequest`. Nếu JSON sai cú pháp, Spring ném `HttpMessageNotReadableException` và client nhận **400**.
- `@Valid`: chạy các annotation `@NotBlank`, `@Email`, `@Size` khai báo trong `RegisterRequest`. Nếu sai, Spring ném `MethodArgumentNotValidException`, và handler trả **400** kèm `errors: {field: message}`.
- Request không hợp lệ bị chặn ngay tại đây, nên service luôn nhận dữ liệu đã qua kiểm tra.
- Mật khẩu giới hạn `@Size(max = 72)` vì BCrypt chỉ xử lý tối đa 72 byte; `BCryptPasswordEncoder` của Spring Security 7 ném lỗi nếu dài hơn.

### 2.2 Logic ở service

```java
@Transactional
public AuthResponse register(RegisterRequest req) {
  String email = User.normalizeEmail(req.email());               // ① chuẩn hoá
  if (userRepository.existsByEmail(email)) {                      // ② kiểm tra nhanh
    throw new ConflictException("Email is already registered");
  }
  User user = new User(req.username().strip(), email,
                       passwordEncoder.encode(req.password()));   // ③ băm mật khẩu
  try {
    user = userRepository.saveAndFlush(user);                     // ④ ghi xuống DB ngay
  } catch (DataIntegrityViolationException ex) {
    throw new ConflictException("Email is already registered");   // ⑤ chặn race condition
  }
  return issueToken(user);                                        // ⑥ đăng ký xong là đăng nhập luôn
}
```

- **①** Chuẩn hoá `Nam@Gmail.com ` thành `nam@gmail.com`. Nếu bỏ bước này, cùng một người có thể đăng ký 2 tài khoản chỉ khác nhau ở chữ hoa/thường.
- **②** Đây là bước kiểm tra để trả lỗi 409 dễ hiểu. Nó **không đủ để chống trùng**, vì 2 request đăng ký cùng email gửi đồng thời đều có thể vượt qua bước này cùng lúc.
- **③** BCrypt tự sinh *salt* ngẫu nhiên và ghép vào chuỗi hash, ví dụ `$2a$10$<salt><hash>`. Vì vậy cùng một mật khẩu băm hai lần sẽ ra hai chuỗi khác nhau. DB không bao giờ lưu mật khẩu gốc.
- **④** `save()` thường chỉ ghi xuống DB khi transaction commit, tức là sau khi method đã return. Lúc đó lỗi trùng email sẽ nổ ra ở ngoài khối `try`. `saveAndFlush()` buộc lệnh `INSERT` chạy ngay, nên lỗi rơi đúng vào `catch`.
- **⑤** Bước chặn trùng thật sự là constraint `uk_users_email` trong DB. Request đến sau sẽ vi phạm constraint và nhận 409 thay vì 500.
- **⑥** Gọi `issueToken` để trả token ngay, client không cần gọi thêm API login.

### 2.3 Tạo token

```java
public String generateToken(User user) {
  Instant now = Instant.now();
  return Jwts.builder()
      .subject(String.valueOf(user.getId()))      // "sub": "2"
      .claim("role", user.getRole().name())       // "role": "USER"
      .issuedAt(Date.from(now))                   // "iat"
      .expiration(Date.from(now.plus(ttl)))       // "exp"
      .signWith(key)                              // chữ ký HMAC
      .compact();
}
```

Một JWT gồm 3 phần nối với nhau bằng dấu chấm: `header.payload.signature`.

```
eyJhbGciOiJIUzM4NCJ9 . eyJzdWIiOiIyIiwicm9sZSI6IlVTRVIi... . -w4EwuvT2Hv...
   {"alg":"HS384"}          {"sub":"2","role":"USER",...}        HMAC(header.payload, key)
```

- Payload chỉ được **mã hoá Base64**, không phải **mã hoá bảo mật**: ai có token cũng đọc được nội dung. Vì vậy tuyệt đối không đặt password hay thông tin nhạy cảm vào payload.
- Thứ bảo vệ token là **chữ ký**. Nếu ai đó sửa `"role":"USER"` thành `"ADMIN"`, chữ ký không còn khớp và server từ chối token.
- `subject` lưu `id` thay vì email, vì email có thể đổi còn id thì không.
- Claim `role` chỉ để frontend biết có nên hiển thị menu Admin hay không. Backend **không tin** claim này mà luôn đọc role từ DB (xem [mục 4.1](#41-filter)).

---

## 3. Luồng đăng nhập: `POST /api/auth/login`

```
AuthService.login
  └─ authenticationManager.authenticate(email, password)
        └─ ProviderManager
              └─ DaoAuthenticationProvider
                    ├─ AppUserDetailsService.loadUserByUsername(email)  → SELECT user
                    ├─ preAuthenticationChecks  (enabled? locked?)
                    └─ passwordEncoder.matches(raw, hash)               → BCrypt so sánh
  └─ jwtService.generateToken(user)
```

### 3.1 Service

```java
public AuthResponse login(LoginRequest req) {
  Authentication auth = authenticationManager.authenticate(
      UsernamePasswordAuthenticationToken.unauthenticated(req.email(), req.password()));
  AppUserDetails principal = (AppUserDetails) auth.getPrincipal();
  User user = userRepository.findById(principal.id()).orElseThrow();
  return issueToken(user);
}
```

- `unauthenticated(email, password)` tạo một "đơn yêu cầu xác thực" chưa được duyệt.
- Nếu `authenticate()` thành công, nó trả về một `Authentication` **đã xác thực**, bên trong có `principal` là `AppUserDetails`.
- Nếu thất bại, nó **ném exception** thay vì trả `null` hay `false`. Vì vậy method này không cần `if` nào để kiểm tra kết quả.
- Lý do dùng `AuthenticationManager` thay vì tự viết `passwordEncoder.matches(...)`: Spring đã xử lý sẵn các chi tiết dễ sai, như kiểm tra `enabled`, chống timing attack khi email không tồn tại (vẫn chạy BCrypt giả để thời gian phản hồi giống nhau), và chuẩn hoá các loại lỗi.

### 3.2 Tìm user cho Spring

```java
public UserDetails loadUserByUsername(String email) {
  return userRepository.findByEmailNormalized(email)
      .map(AppUserDetails::from)
      .orElseThrow(() -> new UsernameNotFoundException("User not found"));
}
```

Spring gọi tham số này là "username", nhưng ở dự án này đó là email. Method dùng `findByEmailNormalized` để `NAM@gmail.com` vẫn tìm thấy tài khoản.

### 3.3 Adapter giữa Entity và Spring Security

```java
public record AppUserDetails(Long id, String email, String password, Role role, boolean enabled)
    implements UserDetails {
  public Collection<? extends GrantedAuthority> getAuthorities() {
    return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));   // khớp hasRole("ADMIN")
  }
  public String getUsername() { return email; }
  ...
}
```

- Spring Security chỉ làm việc với interface `UserDetails`. Record này là lớp trung gian giữa entity `User` và Spring.
- Dùng record thay vì truyền thẳng entity vì record là object **bất biến và tách khỏi Hibernate**. Nó được giữ trong `SecurityContext` suốt request mà không gây lỗi lazy-loading.
- `toString()` đã được override để không in password ra log.

### 3.4 Khi đăng nhập thất bại

| Tình huống | Exception Spring ném | Handler | HTTP |
|---|---|---|---|
| Email không tồn tại | `UsernameNotFoundException` → Spring **tự đổi** thành `BadCredentialsException` | `handleAuthentication` | 401 |
| Sai mật khẩu | `BadCredentialsException` | `handleAuthentication` | 401 |
| Tài khoản bị khoá | `DisabledException` | `handleDisabled` | 403 |

Spring đổi `UsernameNotFoundException` thành `BadCredentialsException` vì thuộc tính `hideUserNotFoundExceptions` mặc định là `true`. Kết hợp với việc handler trả cùng một thông báo `"Invalid email or password"` cho cả hai trường hợp, kẻ tấn công không dò được email nào đã đăng ký.

Các exception này nổ ra **bên trong controller**, nên chúng đi vào `GlobalExceptionHandler` chứ không qua `authenticationEntryPoint`.

> **Hạn chế đã biết:** Spring kiểm tra `enabled` *trước* khi so mật khẩu, nên một tài khoản bị khoá trả 403 ngay cả khi mật khẩu sai. Người ngoài vì vậy có thể dò ra email nào đang bị khoá. Rủi ro thấp ở giai đoạn này; có thể xử lý sau bằng cách tự cấu hình `DaoAuthenticationProvider`.

---

## 4. Luồng gọi API có token: ví dụ `GET /api/me`

```
Authorization: Bearer eyJ...
   │
   ▼
JwtAuthenticationFilter
   ├─ không có header / không bắt đầu bằng "Bearer " ──▶ đi tiếp, chưa đăng nhập
   ├─ token sai chữ ký / hết hạn ──▶ catch, đi tiếp, chưa đăng nhập
   └─ token hợp lệ ──▶ SELECT user by id ──▶ còn enabled? ──▶ đặt vào SecurityContext
   │
   ▼
AuthorizationFilter: /api/me cần authenticated()
   ├─ SecurityContext rỗng ──▶ authenticationEntryPoint ──▶ 401
   └─ có Authentication    ──▶ vào controller
   │
   ▼
UserController.me(@AuthenticationPrincipal AppUserDetails me)
```

### 4.1 Filter

```java
protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                FilterChain chain) throws ServletException, IOException {
  String header = request.getHeader(HttpHeaders.AUTHORIZATION);
  if (header == null || !header.startsWith(PREFIX)) {
    chain.doFilter(request, response);          // ① không có token: không chặn, chỉ không xác thực
    return;
  }
  try {
    Long userId = jwtService.parseUserId(header.substring(PREFIX.length()));  // ② verify chữ ký + exp
    userRepository.findById(userId)                                           // ③ đọc lại từ DB
        .filter(User::isEnabled)
        .map(AppUserDetails::from)
        .ifPresent(principal -> {
          var auth = UsernamePasswordAuthenticationToken.authenticated(
              principal, null, principal.getAuthorities());                   // ④ credentials = null
          SecurityContext context = SecurityContextHolder.createEmptyContext();
          context.setAuthentication(auth);
          SecurityContextHolder.setContext(context);                          // ⑤ "đăng nhập" cho request này
        });
  } catch (JwtException | IllegalArgumentException ex) {
    SecurityContextHolder.clearContext();
  }
  chain.doFilter(request, response);
}
```

- **① Filter không bao giờ tự trả lỗi.** Nó chỉ trả lời câu hỏi "request này là của ai?". Còn câu hỏi "người này có được phép không?" là việc của `AuthorizationFilter` phía sau. Nhờ tách như vậy, các endpoint public như `/api/auth/login` vẫn chạy bình thường kể cả khi client gửi kèm một token đã hết hạn.
- **② `parseSignedClaims`** làm 3 việc cùng lúc: kiểm tra định dạng, kiểm tra chữ ký, kiểm tra `exp`. Bất kỳ bước nào sai đều ném `JwtException`.
- **③ Vì sao phải query DB khi token đã có chữ ký hợp lệ?** Token có hiệu lực 24 giờ. Nếu admin khoá tài khoản hoặc hạ quyền giữa chừng, việc đọc lại từ DB giúp thay đổi đó có tác dụng **ngay lập tức**. Chi phí chỉ là một query theo khoá chính, rất nhanh.
- **④** Hàm `authenticated(...)` có 3 tham số, và chính phiên bản 3 tham số này đánh dấu `isAuthenticated() = true`. `credentials` truyền `null` vì mật khẩu không còn cần đến sau khi đã xác thực.
- **⑤ `SecurityContextHolder`** lưu thông tin theo **ThreadLocal**, tức là riêng cho thread đang xử lý request này. Hết request, Spring tự xoá. Vì cấu hình là `STATELESS`, thông tin này không được lưu vào session.
- Class này **không có `@Component`** mà được tạo bằng `new` trong `SecurityConfig`. Nếu là bean, Spring Boot sẽ tự đăng ký nó thêm một lần nữa vào chuỗi filter servlet thông thường, khiến filter chạy hai lần cho mỗi request.

### 4.2 Controller lấy user hiện tại

```java
@GetMapping
UserResponse me(@AuthenticationPrincipal AppUserDetails me) {
  return userService.getById(me.id());
}
```

`@AuthenticationPrincipal` lấy `principal` mà filter đã đặt ở bước ⑤ và inject thẳng vào tham số. Controller không cần biết token là gì.

Endpoint này đặt ở `/api/me` chứ không phải `/api/auth/me`: `/api/auth/**` đang `permitAll`, nên nếu đặt ở đó request chưa đăng nhập vẫn lọt vào và `me` sẽ là `null`.

### 4.3 Cập nhật profile

```java
@Transactional
public UserResponse updateProfile(Long id, UpdateProfileRequest req) {
  User user = find(id);
  user.setUsername(req.username().strip());   // không gọi save()
  return UserResponse.from(user);
}
```

Method này không gọi `save()` mà DB vẫn được cập nhật, nhờ cơ chế **dirty checking** của Hibernate:

- Entity được load bên trong `@Transactional` sẽ được Hibernate theo dõi.
- Khi transaction commit, Hibernate so sánh trạng thái hiện tại của entity với lúc load. Thấy `username` đã đổi, nó tự sinh lệnh `UPDATE`.
- `@UpdateTimestamp` cũng tự cập nhật `updated_at` trong lần này.

---

## 5. Các đường đi của lỗi

### 5.1 Lỗi ở tầng filter, chưa vào controller

| Tình huống | Ai xử lý | Kết quả |
|---|---|---|
| Chưa đăng nhập, gọi endpoint cần đăng nhập | `HttpStatusEntryPoint(401)` | 401, body rỗng |
| Đã đăng nhập nhưng thiếu quyền (USER gọi `/api/admin`) | `AccessDeniedHandler` mặc định → `response.sendError(403)` | 403 |

**Vì sao cần dòng `dispatcherTypeMatchers(ERROR).permitAll()`:**

```
USER → /api/admin/x → AuthorizationFilter: thiếu quyền → sendError(403)
     → Tomcat chuyển tiếp nội bộ sang /error (dispatcher type = ERROR)
     → chạy lại security filter chain cho /error
         JwtAuthenticationFilter: OncePerRequestFilter mặc định BỎ QUA lượt ERROR
         → SecurityContext rỗng → /error cần authenticated → 401 ❌
```

Khi cho phép lượt ERROR đi qua, `/error` trả đúng mã 403 ban đầu.

### 5.2 Lỗi ở tầng controller/service

```java
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler { ... }
```

- `@RestControllerAdvice` bắt exception ném ra từ **mọi controller** và đổi thành response JSON.
- **Khi có nhiều handler cùng khớp, Spring chọn handler có kiểu exception cụ thể nhất**, không phụ thuộc thứ tự viết trong file. Ví dụ `DisabledException` khớp cả `handleDisabled` lẫn `handleAuthentication` (vì là lớp con của `AuthenticationException`) lẫn `Exception`. Spring chọn `handleDisabled` vì nó cụ thể nhất.
- Kế thừa `ResponseEntityExceptionHandler` để các lỗi chuẩn của Spring MVC (JSON hỏng, 404, 405, 415) được trả đúng mã. Nếu không kế thừa, handler `Exception.class` sẽ bắt hết các lỗi này thành 500.
- `ProblemDetail` là định dạng lỗi chuẩn RFC 9457: `{type, title, status, detail, instance}`. Nhờ vậy frontend xử lý mọi lỗi theo cùng một cách (xem [ADR-0008](../adr/0008-api-conventions.md)).

### 5.3 Bảng mã trả về

| Trường hợp | HTTP |
|---|---|
| Đăng ký thành công | 201 + token |
| Đăng ký trùng email (kể cả khác hoa/thường) | 409 |
| Thiếu hoặc sai field | 400 + `errors` |
| JSON sai cú pháp | 400 |
| Sai mật khẩu / email không tồn tại | 401, cùng một thông báo |
| Tài khoản bị khoá | 403 |
| Gọi endpoint cần đăng nhập mà không có token, hoặc token sai/hết hạn | 401 |
| User thường gọi `/api/admin/**` | 403 |
| Route không tồn tại / sai method | 404 / 405 |

---

## 6. Tóm tắt

| Bước | Class | Việc chính |
|---|---|---|
| Khởi động | `JwtService`, `SecurityConfig`, `AdminSeeder` | Tạo khoá ký, dựng filter chain, tạo admin |
| Đăng ký | `AuthController` → `AuthService.register` | Validate → chuẩn hoá email → BCrypt → INSERT → trả token |
| Đăng nhập | `AuthService.login` → `AuthenticationManager` → `AppUserDetailsService` | Tìm user → kiểm tra enabled → so khớp BCrypt → trả token |
| Mỗi request | `JwtAuthenticationFilter` | Verify token → đọc user từ DB → đặt vào `SecurityContext` |
| Phân quyền | `AuthorizationFilter` (luật trong `SecurityConfig`) | `permitAll` / `authenticated` / `hasRole` |
| Lỗi | `EntryPoint` / `AccessDeniedHandler` / `GlobalExceptionHandler` | 401 / 403 / Problem Details |

---

## 7. Tự kiểm chứng

**Bằng debugger:** đặt breakpoint ở 3 chỗ, chạy app ở chế độ debug và gọi thử bằng Swagger UI (`/swagger-ui.html`):

1. `JwtAuthenticationFilter.doFilterInternal`
2. `AppUserDetailsService.loadUserByUsername`
3. Dòng đầu của `AuthService.login`

Khi gọi `/api/auth/login`, cả filter lẫn login đều dừng ở breakpoint. Khi gọi `/api/me` có token, chỉ filter dừng.

**Bằng curl:**

```bash
# Đăng ký → 201 + token
curl -i -X POST localhost:8080/api/auth/register -H "Content-Type: application/json" \
  -d '{"email":"Nam@Test.com","password":"12345678","username":"Nam"}'

# Đăng nhập sai mật khẩu → 401
curl -i -X POST localhost:8080/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"nam@test.com","password":"wrong-pass"}'

# /api/me không token → 401; có token → 200
curl -i localhost:8080/api/me -H "Authorization: Bearer <token>"

# User thường gọi admin → 403
curl -i localhost:8080/api/admin/anything -H "Authorization: Bearer <token>"
```

Để xem nội dung một token, dán nó vào https://jwt.io. Phần payload đọc được ngay, minh hoạ việc payload JWT không được mã hoá bảo mật.
