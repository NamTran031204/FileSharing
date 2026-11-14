import axios from 'axios';
import {API_BASE, tokenManager} from './baseApi';
import {serviceOptions} from './api/index.defs';
import {LangUtil} from '../utils/lang.util';

const baseUrl = API_BASE.endsWith('/api') ? API_BASE.slice(0, -4) : API_BASE;

const apiClient = axios.create({
    baseURL: baseUrl,
});

apiClient.interceptors.request.use((config) => {
    config.headers = config.headers ?? {};
    config.headers['Accept-Language'] = LangUtil.getLang();
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
        // ACCESS_DENIED: App hien man "Ban can quyen truy cap"
        if (error?.response?.data?.code === '5701') {
            window.dispatchEvent(new CustomEvent('access:denied'));
        }
        // dung message da dich cua server (vd 5702 can vai tro COMMENTER) thay "Request failed with status code ..."
        const serverMessage = error?.response?.data?.message;
        if (typeof serverMessage === 'string' && serverMessage) {
            error.message = serverMessage;
        }

        return Promise.reject(error);
    },
);

serviceOptions.axios = apiClient;
serviceOptions.loading = false;
serviceOptions.showError = false;

export default apiClient;
