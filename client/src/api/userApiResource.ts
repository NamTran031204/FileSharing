import baseApi, {type PageRequest, type PageResult} from "./baseApi.ts";

export interface UserDto {
    userId: string;
    email: string;
    publicUserName: string;
    avatarUrl: string | null;
    isActive: boolean;
    creationTimestamp: string;
    modificationTimestamp: string;
}

export interface UpdateUserRequestDto {
    publicUserName?: string;
    avatarUrl?: string | null;
}

export interface UserSearchRequestDto {
    keyword: string | null;  // search by username or email
}

// ==================== API Resource ====================

const userApiResource = {
    /**
     * Get user by ID
     * @param userId - user ID
     */
    getUserById: (userId: string) =>
        baseApi.get<UserDto>(`/users/${userId}`),

    getCurrentUser: () =>
        baseApi.get<UserDto>(`/users`),

    /**
     * Get user by email
     * @param email - user email
     */
    getUserByEmail: (email: string) =>
        baseApi.get<UserDto>(`/users/email/${encodeURIComponent(email)}`),

    /**
     * Update user by ID
     * @param userId - user ID
     * @param data - update request data
     */
    updateUser: (userId: string, data: UpdateUserRequestDto) =>
        baseApi.put<UserDto>(`/users/${userId}`, data),

    /**
     * Delete user by ID
     * @param userId - user ID
     */
    deleteUser: (userId: string) =>
        baseApi.delete<string>(`/users/${userId}`),

    /**
     * Search users by username or email with pagination
     * @param data - pagination and search request
     */
    searchUsers: (data: PageRequest<UserSearchRequestDto>) =>
        baseApi.post<PageResult<UserDto>>('/users/search', data),
};

export default userApiResource;