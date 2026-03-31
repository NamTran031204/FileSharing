# Huong dan step-by-step cau hinh frontend su dung refresh token

Tai lieu nay huong dan cach cau hinh day du cho client frontend de:
- tu dong gan access token vao request
- tu dong refresh khi access token het han
- retry request bi 401 sau khi refresh thanh cong
- logout an toan neu refresh that bai

Noi dung duoc viet de ap dung truc tiep cho codebase hien tai:
- React + Vite + TypeScript
- `src/api/baseApi.ts` (fetch wrapper)
- `src/api/authApi/authApiResource.ts` (login/register)

---

## 1) Muc tieu va luong tong quan

Luong chuan:
1. User login -> backend tra ve `accessToken` + `refreshToken`.
2. Frontend luu token (hien tai dang luu localStorage qua `tokenManager`).
3. Moi API request tu dong gui `Authorization: Bearer <accessToken>`.
4. Neu API tra `401` (access token het han) -> goi API refresh bang `refreshToken`.
5. Refresh thanh cong -> cap nhat token moi -> retry request vua loi 1 lan.
6. Refresh that bai -> clear token -> phat su kien unauthorized -> dieu huong ve trang login.

---

## 2) Chuan hoa contract voi backend (bat buoc)

Can thong nhat voi backend:
- Endpoint refresh, vi du: `POST /auth/refresh`
- Request body (vi du):

```json
{
  "refreshToken": "..."
}
```

- Response body thanh cong (vi du):

```json
{
  "isSuccessful": true,
  "data": {
    "accessToken": "new_access_token",
    "refreshToken": "new_refresh_token_or_null"
  },
  "code": "SUCCESS",
  "message": "OK"
}
```

Luu y:
- Neu backend khong rotate refresh token, `refreshToken` co the tra ve `null`.
- Frontend phai giu refresh token cu neu response khong tra refresh token moi.

---

## 3) Cap nhat authApiResource: them ham refresh token

File: `src/api/authApi/authApiResource.ts`

Them method `refreshToken`:

```ts
refreshToken: async () => {
    const rf = tokenManager.getRefreshToken();
    if (!rf) {
        throw new Error('NO_REFRESH_TOKEN');
    }

    const response = await authAxios.post<CommonResponse<UserLoginResponseDto>>(
        '/auth/refresh',
        { refreshToken: rf }
    );

    if (!response.data.isSuccessful) {
        throw new Error(response.data.message || 'Refresh token failed');
    }

    const nextAccess = response.data.data.accessToken;
    const nextRefresh = response.data.data.refreshToken ?? rf;

    tokenManager.setTokens(nextAccess, nextRefresh);
    return nextAccess;
},
```

Checklist:
- [ ] Dung endpoint refresh dung voi backend
- [ ] Co fallback refresh token cu (`?? rf`)
- [ ] Throw error khi refresh that bai

---

## 4) Cap nhat baseApi: single-flight refresh + retry 1 lan

File: `src/api/baseApi.ts`

### 4.1 Them bien khoa refresh toan cuc

Dat gan dau file:

```ts
let refreshPromise: Promise<string> | null = null;
```

### 4.2 Tao ham refresh chi chay 1 lan cho nhieu request 401 dong thoi

```ts
async function refreshAccessTokenOnce(): Promise<string> {
    if (!refreshPromise) {
        refreshPromise = import('./authApi/authApiResource')
            .then(({ default: authApiResource }) => authApiResource.refreshToken())
            .finally(() => {
                refreshPromise = null;
            });
    }

    return refreshPromise;
}
```

Y nghia:
- 10 request cung 401 cung luc -> chi 1 request refresh duoc goi
- 9 request con lai cho ket qua chung

### 4.3 Mo rong request de danh dau da retry

```ts
type RequestInitEx = RequestInit & {
    _retry?: boolean;
};
```

### 4.4 Sua `requestRaw` de retry sau refresh

Mau logic:

```ts
async function requestRaw<T>(path: string, init?: RequestInitEx): Promise<T> {
    const url = `${API_BASE}${path}`;
    const headers = createHeaders(init?.headers as HeadersInit);

    const res = await fetch(url, {
        ...init,
        headers
    });

    if (!res.ok) {
        const is401 = res.status === 401;
        const isAuthEndpoint =
            path.startsWith('/auth/login') ||
            path.startsWith('/auth/refresh') ||
            path.startsWith('/auth/register');

        if (is401 && !isAuthEndpoint && !init?._retry) {
            try {
                const newAccessToken = await refreshAccessTokenOnce();

                const retryHeaders = new Headers({
                    'Content-Type': 'application/json',
                    ...(init?.headers as HeadersInit),
                    'Authorization': `Bearer ${newAccessToken}`,
                });

                const retryRes = await fetch(url, {
                    ...init,
                    _retry: true,
                    headers: retryHeaders,
                } as RequestInitEx);

                if (!retryRes.ok) {
                    throw new ApiError('UNAUTHORIZED', 'Retry failed', retryRes.status);
                }

                return retryRes.json();
            } catch {
                tokenManager.clearTokens();
                window.dispatchEvent(new CustomEvent('auth:unauthorized'));
                throw new ApiError('UNAUTHORIZED', 'Session expired', 401);
            }
        }

        if (is401) {
            tokenManager.clearTokens();
            window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }

        const errorData = await res.json().catch(() => ({}));
        throw new ApiError(
            errorData.code || 'UNKNOWN_ERROR',
            errorData.message || `HTTP ${res.status}`,
            res.status
        );
    }

    return res.json();
}
```

Luu y quan trong:
- Khong retry vo han, chi retry 1 lan (`_retry`).
- Khong trigger refresh cho endpoint auth de tranh loop.
- Van clear token va ban event unauthorized neu refresh fail.

---

## 5) Handle unauthorized tai tang UI

Can xu ly event `auth:unauthorized` 1 cho duy nhat o tang app shell.

Vi du o `src/main.tsx` hoac component root:

```ts
window.addEventListener('auth:unauthorized', () => {
    // xoa store user, cache, route ve login
    window.location.href = '/login';
});
```

Khuyen nghi:
- Neu dung router (`react-router-dom`), co the navigate thay vi set `window.location.href`.
- Nho remove event listener neu dang ky trong component React.

---

## 6) Chuan hoa login va logout

### Login
Da co san trong `authApiResource.login`:
- luu `accessToken` + `refreshToken` qua `tokenManager.setTokens(...)`

Can dam bao:
- [ ] `refreshToken` khong undefined neu backend bat buoc refresh
- [ ] Neu co the undefined, xu ly fallback ro rang

### Logout
Tao luong logout chuan:
1. Goi API logout (neu backend co)
2. `tokenManager.clearTokens()`
3. Xoa user state (MobX store, cache)
4. Dieu huong login

---

## 7) Loai bo cac diem set Bearer thu cong (neu co)

Nguyen tac:
- Tat ca request qua `baseApi` de duoc huong co che refresh thong nhat.
- Han che viet rieng `Authorization: Bearer ...` trong tung service.

Neu co request dac biet can header rieng, van nen di qua `baseApi` va merge header.

---

## 8) Bao mat va best practice

1. Muc uu tien cao nhat la giu refresh token an toan.
2. LocalStorage de bi XSS hon HttpOnly cookie. Neu backend ho tro, nen chuyen refresh token sang HttpOnly cookie.
3. Access token nen song ngan (vi du 5-15 phut).
4. Refresh token nen co han va co co che revoke.
5. Neu backend rotate refresh token, frontend phai luu token moi ngay sau refresh.
6. Khong log token ra console.

---

## 9) Ke hoach test step-by-step

Test toi thieu:

1. Login thanh cong
- Ky vong: luu du 2 token

2. Goi API khi access token con han
- Ky vong: request thanh cong, khong goi refresh

3. Het han access token, refresh con han
- Ky vong: 1 lan refresh, request cu retry thanh cong

4. 5 request song song cung gap 401
- Ky vong: chi 1 request refresh duoc goi

5. Refresh token het han
- Ky vong: clear token, ban event unauthorized, quay ve login

6. Refresh endpoint tra loi 500
- Ky vong: tuong tu case 5

7. Reload trang sau khi da login
- Ky vong: app van authenticated, request van co Bearer

8. Logout
- Ky vong: token bi xoa, vao route can auth se bi chan

---

## 10) Checklist trien khai nhanh

- [ ] Co endpoint `/auth/refresh` va contract ro rang
- [ ] Co `authApiResource.refreshToken()`
- [ ] Co `refreshPromise` single-flight trong `baseApi`
- [ ] Co retry 1 lan cho request 401
- [ ] Co event `auth:unauthorized` + redirect login
- [ ] Co logout clear token + clear state
- [ ] Da test du 8 scenario o muc 9

---

## 11) Mau sequence ngan gon

1. Login -> save token
2. Request A/B/C gui Bearer access token
3. Access token het han -> A nhan 401
4. A goi refresh, B/C cho `refreshPromise`
5. Refresh thanh cong -> cap nhat token
6. A/B/C retry voi access token moi
7. Neu refresh fail -> clear token + redirect login

---

Tai lieu nay uu tien tinh on dinh (single-flight), tranh loop refresh, va han che race condition khi co nhieu request song song.
