import {API_BASE, type CommonResponse, tokenManager} from '../baseApi';
import type {AuthProvider, UserRole} from "../enums.ts";
import axios from "axios";

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

}

export default authApiResource;