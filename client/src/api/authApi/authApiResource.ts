import {API_BASE, ApiError, type CommonResponse, tokenManager} from '../baseApi';
import type {AuthProvider, UserRole} from "../enums.ts";
import axios from "axios";
import type {MetadataEntity} from "../fileApi/userFileApiResource.ts";

export interface AuthProviderInfo {
    provider: AuthProvider;
    providerId: string | null;
    linkedAt: string;
}

export interface UserRegisterRequestDto {
    email: string;
    password: string;
    confirmPassword: string;
    userName: string;
}

export interface UserRegisterResponseDto {
    userId: string;
    email: string;
    userName: string;
    createdAt: string;
    providers: AuthProvider[];
    roles: UserRole[];
    enabled: boolean;
}

export interface UserLoginRequestDto {
    email: string;
    password: string;
}

export interface UserLoginResponseDto {
    accessToken: string;
    refreshToken?: string;
}

export interface GoogleAuthRequestDto {
    credential: string;
}

const authAxios = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    }
});

const authApiResource = {

    register: async (data: UserRegisterRequestDto) => {
        const response = await authAxios.post<CommonResponse<UserRegisterResponseDto>>(
            '/auth/register',
            data
        );

        if (!response.data.isSuccessful) {
            throw new Error(response.data.message || 'Register failed');
        }
        return response.data.data;
    },

    login: async (data: UserLoginRequestDto) => {
        const response = await authAxios.post<CommonResponse<UserLoginResponseDto>>(
            '/auth/login',
            data
        );

        if (!response.data.isSuccessful) {
            throw new Error(response.data.message || 'Login failed');
        }

        tokenManager.setTokens(
            response.data.data.accessToken,
            response.data.data.refreshToken!
        );

        return response.data.data;
    },

    registerWithGoogle: async (credential: string) => {
        try {
            const response = await authAxios.post<CommonResponse<UserLoginResponseDto>>(
                '/auth/google/register',
                {credential} as GoogleAuthRequestDto
            );

            if (!response.data.isSuccessful) {
                throw new ApiError(response.data.code, response.data.message || 'Google register failed');
            }

            tokenManager.setTokens(
                response.data.data.accessToken,
                response.data.data.refreshToken!
            );

            return response.data.data;
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.data) {
                const data = err.response.data as CommonResponse<UserLoginResponseDto>;
                throw new ApiError(data.code, data.message || 'Google register failed');
            }
            throw err;
        }
    },

    loginWithGoogle: async (credential: string) => {
        try {
            const response = await authAxios.post<CommonResponse<UserLoginResponseDto>>(
                '/auth/google/login',
                {credential} as GoogleAuthRequestDto
            );

            if (!response.data.isSuccessful) {
                throw new ApiError(response.data.code, response.data.message || 'Google login failed');
            }

            tokenManager.setTokens(
                response.data.data.accessToken,
                response.data.data.refreshToken!
            );

            return response.data.data;
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.data) {
                const data = err.response.data as CommonResponse<UserLoginResponseDto>;
                throw new ApiError(data.code, data.message || 'Google login failed');
            }
            throw err;
        }
    },

    checkLegit: async (shareToken: string) => {
        const response = await authAxios.post<CommonResponse<MetadataEntity>>(
            `/auth/check-legit/${shareToken}`
        );

        if (!response.data.isSuccessful) {
            throw new Error(response.data.message || 'You has no Legit! Please Login/Register to continue.');
        }
        return response.data.data;
    }

}

export default authApiResource;
