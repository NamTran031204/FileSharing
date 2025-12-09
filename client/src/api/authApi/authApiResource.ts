import baseApi from '../baseApi';

export type AuthProvider = 'LOCAL' | 'GOOGLE';

export type UserRole = 'ROLE_USER' | 'ROLE_ADMIN';

interface AuthProviderInfo {
    provider: AuthProvider;
    providerId: string | null;
    linkedAt: string;
}

interface UserRegisterRequestDto {
    email: string;
    password: string;
    retypePassword: string;
    userName: string;
}

interface UserRegisterResponseDto {
    email: string;
    userName: string;
    createdAt: string;
    providers: AuthProviderInfo[];
    roles: UserRole[];
    enabled: boolean;
}

interface UserLoginRequestDto {
    email: string;
    password: string;
}

interface UserLoginResponseDto {
    token: string;
}

const authApiResource = {

    register: async (data: UserRegisterRequestDto) =>
        baseApi.post<UserRegisterResponseDto>('/user/register', data),

    login: async (data: UserLoginRequestDto) =>
        baseApi.post<UserLoginResponseDto>('/user/login', data),

}

export default authApiResource;
export type {
    UserRegisterRequestDto,
    AuthProviderInfo,
    UserRegisterResponseDto,
    UserLoginRequestDto,
    UserLoginResponseDto
}