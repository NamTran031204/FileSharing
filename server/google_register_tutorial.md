### PHẦN 1: CHIẾN LƯỢC GIAO TIẾP (CLIENT - SERVER)

Trước khi viết code, chúng ta cần thống nhất luồng đi (Flow):

#### 1\. Đăng ký Local (Email/Password)

* **Client:** Gửi JSON `{ email, password, confirmPassword, userName }`.
* **Server:** Validate dữ liệu -\> Hash password -\> Tạo User với `provider: LOCAL` -\> Lưu DB.
* **Kết quả:** Trả về thông tin User hoặc Token để tự động login.

#### 2\. Đăng nhập/Đăng ký qua Google (OAuth2)

*Lưu ý: Với Google, hành động "Đăng ký" và "Đăng nhập" thường là một API duy nhất (Upsert - Nếu chưa có thì tạo, có rồi thì đăng nhập).*

* **Client:** Sử dụng thư viện Google SDK (Frontend) để user đăng nhập. Google trả về một chuỗi **`idToken`** (JWT).
* **Client:** Gửi JSON `{ idToken: "..." }` xuống Server.
* **Server:**
    1.  Dùng thư viện của Google verify `idToken` để đảm bảo không bị fake.
    2.  Lấy email từ token.
    3.  Kiểm tra DB:
        * *Nếu email chưa tồn tại:* Tạo user mới với `provider: GOOGLE`, `password: null`, `emailVerified: true`.
        * *Nếu email đã tồn tại:* Kiểm tra xem đã có provider GOOGLE chưa. Nếu chưa thì add thêm vào list `providers` (Liên kết tài khoản).
    4.  Tạo JWT của hệ thống bạn (Access Token) và trả về.

-----

### PHẦN 2: TRIỂN KHAI BACKEND (SPRING BOOT)

#### Bước 1: Thêm Dependency xác thực Google

Bạn cần thư viện để verify token từ Google gửi lên. Thêm vào `pom.xml`:

```xml
<dependency>
    <groupId>com.google.api-client</groupId>
    <artifactId>google-api-client</artifactId>
    <version>2.2.0</version>
</dependency>
```

#### Bước 2: Tạo DTO cho Google Request

Vì `UserRegisterRequestDto` của bạn yêu cầu `password` `@NotNull`, nên ta không dùng nó cho Google được. Hãy tạo DTO mới:

```java
// UserGoogleLoginRequestDto.java
package org.example.filesharing.entities.dtos.auth;

import lombok.Data;

@Data
public class UserGoogleLoginRequestDto {
    private String idToken; // Token nhận được từ React
}
```

#### Bước 3: Cập nhật `AuthController`

Bạn cần tách ra 2 endpoint riêng biệt để dễ xử lý validation.

```java
@RestController
@RequestMapping("api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserService userService;

    // 1. Đăng ký Local (Giữ nguyên logic cũ nhưng hoàn thiện)
    @PostMapping("/register")
    public CommonResponse<UserRegisterResponseDto> register(@Valid @RequestBody UserRegisterRequestDto request) {
        return CommonResponse.success(userService.registerUser(request));
    }

    // 2. Đăng nhập/Đăng ký Google (Mới)
    @PostMapping("/google")
    public CommonResponse<UserLoginResponseDto> googleLogin(@RequestBody UserGoogleLoginRequestDto request) {
        // Hàm này sẽ trả về Token đăng nhập luôn
        return CommonResponse.success(userService.processGoogleLogin(request));
    }
    
    // ... api login local cũ
}
```

#### Bước 4: Implement Logic trong `UserService`

Đây là phần quan trọng nhất để xử lý logic đa provider dựa trên `UserEntity` của bạn.

```java
@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder; // Bean BCryptPasswordEncoder
    // Config Google Client ID trong application.properties
    @Value("${google.client.id}")
    private String googleClientId; 

    // --- LOGIC LOCAL ---
    public UserRegisterResponseDto registerUser(UserRegisterRequestDto request) {
        // 1. Check email tồn tại
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ApiException(ErrorCode.EMAIL_EXISTED);
        }

        // 2. Tạo User Entity
        UserEntity newUser = UserEntity.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword())) // Hash pass
                .userName(request.getUserName())
                .enabled(true) // Có thể set false nếu cần verify email
                .createdAt(Instant.now())
                .roles(new ArrayList<>(List.of(UserRole.ROLE_USER)))
                .build();

        // 3. Add Provider LOCAL
        newUser.addProvider(AuthProvider.LOCAL, null); // ID null cho local

        userRepository.save(newUser);
        return convertToRegisterResponse(newUser); // Map entity sang DTO trả về
    }

    // --- LOGIC GOOGLE ---
    public UserLoginResponseDto processGoogleLogin(UserGoogleLoginRequestDto request) {
        // 1. Verify ID Token với Google Server
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                .setAudience(Collections.singletonList(googleClientId))
                .build();

        GoogleIdToken idToken = verifier.verify(request.getIdToken());
        if (idToken == null) throw new ApiException(ErrorCode.INVALID_TOKEN);

        GoogleIdToken.Payload payload = idToken.getPayload();
        String email = payload.getEmail();
        String googleUserId = payload.getSubject();
        String name = (String) payload.get("name");

        // 2. Tìm User trong DB
        UserEntity user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            // CASE 2.1: User mới hoàn toàn -> Đăng ký tự động
            user = UserEntity.builder()
                    .email(email)
                    .userName(name)
                    .enabled(true)
                    .emailVerified(true) // Google đã verify rồi
                    .createdAt(Instant.now())
                    .roles(new ArrayList<>(List.of(UserRole.ROLE_USER)))
                    .providers(new ArrayList<>())
                    .build();
        }

        // 3. Liên kết Provider nếu chưa có (Merge Account)
        // Logic này tận dụng hàm hasProvider bạn đã viết trong UserEntity
        if (!user.hasProvider(AuthProvider.GOOGLE)) {
            user.addProvider(AuthProvider.GOOGLE, googleUserId);
        }
        
        // Cập nhật lần đăng nhập cuối
        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        // 4. Sinh JWT Token của hệ thống bạn (Access Token)
        String accessToken = jwtTokenProvider.generateToken(user);
        return new UserLoginResponseDto(accessToken);
    }
}
```

-----

### PHẦN 3: TRIỂN KHAI FRONTEND (TYPESCRIPT)

Bạn cần cập nhật file `authApiResource.ts` để thêm API Google.

#### 1\. Cập nhật `authApiResource.ts`

```typescript
import baseApi from '../baseApi';

// ... các interface cũ giữ nguyên ...

// Thêm Interface cho Google Request
interface UserGoogleLoginRequestDto {
    idToken: string;
}

const authApiResource = {
    // API đăng ký Local (như cũ)
    register: async (data: UserRegisterRequestDto) =>
        baseApi.post<UserRegisterResponseDto>('/auth/register', data),

    // API đăng nhập Local (như cũ)
    login: async (data: UserLoginRequestDto) =>
        baseApi.post<UserLoginResponseDto>('/auth/login', data),

    // API đăng nhập Google (MỚI)
    loginGoogle: async (idToken: string) => 
        baseApi.post<UserLoginResponseDto>('/auth/google', { idToken }),
}

export default authApiResource;
```

#### 2\. Cách tích hợp vào Component React

Sử dụng thư viện `@react-oauth/google` là chuẩn nhất hiện nay.

```bash
npm install @react-oauth/google
```

**Ví dụ Code Component:**

```tsx
import { GoogleLogin } from '@react-oauth/google';
import authApiResource from '../api/authApiResource';

const LoginPage = () => {

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            // Google trả về credential chính là idToken
            const { credential } = credentialResponse;
            
            if (credential) {
                // Gọi API của bạn để verify và lấy token hệ thống
                const response = await authApiResource.loginGoogle(credential);
                
                // Lưu token vào localStorage
                localStorage.setItem('accessToken', response.token);
                console.log("Đăng nhập Google thành công!");
            }
        } catch (error) {
            console.error("Lỗi đăng nhập Google", error);
        }
    };

    return (
        <div className="login-container">
            {/* Form đăng nhập Local ở đây */}
            
            <div className="separator">Hoặc</div>

            {/* Nút đăng nhập Google */}
            <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => console.log('Login Failed')}
            />
        </div>
    );
};
```

### TỔNG KẾT FLOW

1.  **Local:** Client gửi user/pass -\> Server check pass -\> Server trả Token.
2.  **Google:** Client lấy `idToken` từ Google -\> Client gửi `idToken` cho Server -\> Server verify token, tự tạo user nếu chưa có -\> Server trả Token.

Cách tiếp cận này tận dụng tốt cấu trúc `AuthProviderInfo` trong `UserEntity` của bạn, cho phép một user sau này có thể đăng nhập bằng cả 2 cách nếu họ dùng chung 1 email.