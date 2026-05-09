import axios from 'axios';
import {API_BASE, tokenManager} from './baseApi';
import {serviceOptions} from './api/index.defs';

const baseUrl = API_BASE.endsWith('/api') ? API_BASE.slice(0, -4) : API_BASE;

const apiClient = axios.create({
    baseURL: baseUrl,
});

apiClient.interceptors.request.use((config) => {
    const token = tokenManager.getAccessToken();
    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error?.response?.status === 401) {
            tokenManager.clearTokens();
            window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }

        return Promise.reject(error);
    },
);

serviceOptions.axios = apiClient;
serviceOptions.loading = false;
serviceOptions.showError = false;

export default apiClient;
