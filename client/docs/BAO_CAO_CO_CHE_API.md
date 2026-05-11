# Báo cáo: Cơ chế gửi API và xác thực trong dự án ReactJS Zero

## 1. Tổng quan kiến trúc

Dự án sử dụng **axios** làm HTTP client, được tổ chức theo mô hình phân lớp:

```
Component/Hook
    └── ResourceService (e.g. HostRoleApiResourceService)
            └── axios() wrapper (index.defs.ts)
                    └── serviceOptions.axios (được inject là httpService)
                            └── AxiosBaseHttpApi (axios instance có interceptors)
                                    └── Backend API
```

---

## 2. Các file chính và vai trò

| File                                                       | Vai trò                                                                |
|------------------------------------------------------------|------------------------------------------------------------------------|
| `src/core/service-proxies/axios.base.ts`                   | Tạo axios instance với cấu hình gốc                                    |
| `src/core/service-proxies/httpService.ts`                  | Gắn interceptors (request/response) vào axios instance                 |
| `src/api/auth/index.defs.ts` (và các `index.defs.ts` khác) | Định nghĩa `serviceOptions`, hàm `getConfigs()`, hàm `axios()` wrapper |
| `src/api/auth/HostRoleApiResourceService.ts`               | Service class gọi API cụ thể                                           |
| `src/core/utils/jwt.utils.ts`                              | Quản lý token trong localStorage                                       |
| `src/core/service-proxies/auth/authApiService.ts`          | Gọi API login và refresh-token                                         |
| `src/index.tsx`                                            | Inject axios instance vào các serviceOptions                           |

---

## 3. Khởi tạo Axios (`axios.base.ts`)

```typescript
export const AxiosBaseHttpApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL,  // URL API từ env
    timeout: -1,                             // Không timeout
    withCredentials: true,                   // GỬI COOKIE TỰ ĐỘNG trong mỗi request
    paramsSerializer: { ... },
    transformRequest: [dateTransformer, ...], // Chuyển Date → "yyyy-MM-dd'T'HH:mm:ss"
    transformResponse: [...]                  // Parse JSON response
});
```

**Điểm quan trọng:** `withCredentials: true` — trình duyệt tự động đính kèm cookie (bao gồm session cookie/auth cookie do backend set) vào mọi request mà không cần frontend tự thêm header.

---

## 4. Inject Axios Instance (`src/index.tsx`)

Khi app khởi động, `httpService` (axios instance đã có interceptors) được inject vào `serviceOptions` của tất cả nhóm API:

```typescript
myShopAxiosOptions.axios = httpService;
authAxiosOptions.axios = httpService;
hostAxiosOptions.axios = httpService;
posAxiosOptions.axios = httpService;
```

Từ đó, mọi service class đều dùng chung một axios instance duy nhất.

---

## 5. Request Interceptor (`httpService.ts`, dòng 44–184)

Mỗi request trước khi gửi đi sẽ được thêm các header sau:

```typescript
config.headers['x-client-id'] = 'reactjs-app';
config.headers.common['Accept-Language'] = LangUtil.getLang();  // Ngôn ngữ hiện tại
config.headers.common['x-web-app'] = "true";
config.headers.common['x-shop-current'] = CurrentShopUtil.getShop(); // ID cửa hàng đang chọn
```

**Không có `Authorization: Bearer` trong request interceptor.** Token được xử lý theo cơ chế cookie (xem mục 6).

### Tùy chọn mã hóa (khi `VITE_ENCRYPT_ENABLE=TRUE`)

Nếu bật mã hóa, toàn bộ payload được:
1. Tạo `requestId` và `sessionId` ngẫu nhiên
2. Ký số `signature` bằng `signKey`
3. Mã hóa AES payload gốc
4. Mã hóa key AES bằng RSA public key
5. Đổi URL thành `VITE_ENCRYPT_API` và gửi payload đã mã hóa

---

## 6. Cơ chế xác thực Token

### Cách token hoạt động

Dự án sử dụng **Cookie-based authentication** là cơ chế chính:

- Khi login thành công, **backend set cookie** (httpOnly) chứa session/token.
- Trình duyệt tự động gửi cookie này trong mỗi request nhờ `withCredentials: true`.
- Frontend **không cần tự thêm** `Authorization` header vào mỗi request bình thường.

### Lưu trữ token trong localStorage

```typescript
// jwt.utils.ts
const TOKEN_KEY = 'auth-token';
const REFRESHTOKEN_KEY = 'auth-refresh-token';

saveToken(token: string): void {
    // Bị comment out — token KHÔNG được lưu vào localStorage từ frontend
    // window.localStorage.setItem(TOKEN_KEY, token);
}

saveRefreshToken(token: string): void {
    window.localStorage.setItem(REFRESHTOKEN_KEY, token);  // Refresh token được lưu
}
```

**Lưu ý:** `saveToken()` bị comment out, nghĩa là `auth-token` trong localStorage không được cập nhật từ frontend. Token xác thực chính đi qua cookie do backend quản lý.

---

## 7. Response Interceptor và Refresh Token (`httpService.ts`, dòng 186–283)

### Xử lý lỗi 401 (Token hết hạn)

```
Request → Backend trả 401
    └── Có refreshToken trong localStorage?
            ├── Có → Gọi AuthApiService.refreshToken()
            │           └── Backend trả token mới
            │                   └── Retry toàn bộ request đang chờ
            │                           (thêm Authorization: Bearer {newToken} vào header)
            └── Không → Redirect về trang login
```

Chi tiết code:

```typescript
if (status === 401 && !!JwtUtils.getRefreshToken()) {
    if (!isRefreshing) {
        isRefreshing = true;
        AuthApiService.refreshToken().then((result) => {
            if (result.isSuccessful) {
                const newToken = result.data?.accessToken || '';
                JwtUtils.saveToken(newToken);
                JwtUtils.saveRefreshToken(result.data?.refreshToken || '');
                isRefreshing = false;
                onRrefreshed(newToken);
            } else {
                window.location.href = paths.login;
            }
        });
    }
    // Các request khác xếp hàng chờ token mới
    return new Promise((resolve) => {
        subscribeTokenRefresh((token: string) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            resolve(axios(originalRequest));
        });
    });
}
```

**Header `Authorization: Bearer` chỉ được thêm vào khi retry sau 401**, không phải trong mọi request.

### Xử lý lỗi 403 (Không có quyền)

```typescript
if (status === 403) {
    UiUtils.showError('errorApi.' + data?.error?.code);
}
```

---

## 8. Hàm `getConfigs()` trong `index.defs.ts`

```typescript
export function getConfigs(method, contentType, url, options): IRequestConfig {
    const configs = {
        loading: serviceOptions.loading,   // Flag hiện loading
        showError: serviceOptions.showError, // Flag hiện lỗi
        ...options,                         // Merge options từ caller
        method,
        url
    };
    configs.headers = {
        ...options.headers,
        'Content-Type': contentType        // Đặt Content-Type (thường là 'application/json')
    };
    return configs;
}
```

---

## 9. Ví dụ luồng đầy đủ: `HostRoleApiResourceService.getPaged()`

```
1. Component gọi: HostRoleApiResourceService.getPaged({ body: { filter: "abc" } })
2. Service tạo config:
       url = "/api/auth-plugin/host-role/get-paged"
       method = "POST"
       headers = { "Content-Type": "application/json" }
       data = { filter: "abc" }
3. Gọi axios() wrapper → serviceOptions.axios.request(config)
4. Request Interceptor thêm headers:
       x-client-id: reactjs-app
       Accept-Language: vi
       x-web-app: true
       x-shop-current: {shopId}
       (cookie được trình duyệt tự thêm do withCredentials: true)
5. Request gửi đến: VITE_API_URL + "/api/auth-plugin/host-role/get-paged"
6. Backend xác thực qua cookie, trả về dữ liệu
7. Response Interceptor parse JSON
8. axios() wrapper resolve(res.data) về cho component
```

---

## 10. Refresh Token Service (`authApiService.ts`)

```typescript
public async refreshToken() {
    let data = qs.stringify({
        AccessToken: JwtUtils.getToken(),        // Lấy từ localStorage (có thể rỗng)
        RefreshToken: JwtUtils.getRefreshToken(), // Lấy từ localStorage
    });
    // Gọi trực tiếp AxiosBaseHttpApi (bypass interceptors retry loop)
    const result = await AxiosBaseHttpApi.request({
        method: 'post',
        url: 'api/auth-plugin/auth/refresh-token',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: data
    });
    return result.data as CommonResultDto<JwtDto>;
}
```

---

## 11. Tóm tắt cơ chế xác thực

| Cơ chế | Mô tả |
|--------|-------|
| **Chính: Cookie** | Backend set httpOnly cookie khi login. Trình duyệt tự gửi nhờ `withCredentials: true` |
| **Phụ: Bearer Token (chỉ khi retry)** | Sau khi refresh token, `Authorization: Bearer {newToken}` được thêm vào request bị retry |
| **Custom headers luôn có** | `x-client-id`, `Accept-Language`, `x-web-app`, `x-shop-current` |
| **Refresh token** | Lưu trong `localStorage['auth-refresh-token']`, dùng khi nhận 401 |
| **Access token** | Backend quản lý qua cookie; `saveToken()` ở frontend bị comment out |

---

*Báo cáo được tạo ngày 2026-05-08*
