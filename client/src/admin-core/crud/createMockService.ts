/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
/**
 * Mock Service Factory
 *
 * Tạo mock CRUD service từ array data.
 * Dùng để dev UI trước khi backend ready.
 * Khi backend xong, chỉ cần đổi 1 dòng import.
 */

import {type ICrudService, type PagedInput} from './types';

export interface MockServiceConfig<TPagedDto> {
    /** Dữ liệu mock ban đầu */
    data: TPagedDto[];
    /** Hàm filter tùy chỉnh (ngoài filter text mặc định) */
    filterFn?: (item: TPagedDto, body: any) => boolean;
    /** Các field dùng để full-text search (mặc định: ['code', 'name']) */
    searchFields?: string[];
    /** Field chứa ID (mặc định: 'id') */
    idField?: string;
}

export const createMockService = <TPagedDto extends Record<string, any> = any>(
    config: MockServiceConfig<TPagedDto>
): ICrudService<TPagedDto> => {
    const {
        data: mockData,
        filterFn,
        searchFields = ['code', 'name'],
        idField = 'id',
    } = config;

    const findById = (id: any) => mockData.find(x => x[idField] === id);
    const findIndexById = (id: any) => mockData.findIndex(x => x[idField] === id);

    return {
        async getPaged(params) {
            const body = params?.body as PagedInput & Record<string, any>;
            let filtered = [...mockData];

            // Full-text search
            if (body?.filter) {
                const search = body.filter.toLowerCase();
                filtered = filtered.filter(x =>
                    searchFields.some(field =>
                        x[field]?.toString().toLowerCase().includes(search)
                    )
                );
            }

            // Active status filter
            if (body?.isActived !== null && body?.isActived !== undefined) {
                filtered = filtered.filter(x => x.isActived === body.isActived);
            }

            // Custom filter
            if (filterFn && body) {
                filtered = filtered.filter(x => filterFn(x, body));
            }

            // Pagination
            const skip = body?.skipCount || 0;
            const take = body?.maxResultCount || 20;
            const paged = filtered.slice(skip, skip + take);

            return {
                isSuccessful: true,
                data: {items: paged, totalCount: filtered.length},
            };
        },

        async getById(params) {
            const item = findById(params?.body?.id ?? params?.body?.encodedId);
            return {isSuccessful: !!item, data: item as any};
        },

        async create(params) {
            const newItem = {[idField]: Date.now(), ...params.body} as TPagedDto;
            mockData.push(newItem);
            return {isSuccessful: true, data: newItem as any};
        },

        async update(params) {
            const body = params.body as Record<string, any>;
            const index = findIndexById(body?.[idField] ?? body?.encodedId);
            if (index >= 0) {
                mockData[index] = {...mockData[index], ...body};
                return {isSuccessful: true, data: mockData[index] as any};
            }
            return {isSuccessful: false, message: 'Not found'};
        },

        async remove(params) {
            const index = findIndexById(params?.body?.id ?? params?.body?.encodedId);
            if (index >= 0) {
                mockData.splice(index, 1);
                return {isSuccessful: true, data: true};
            }
            return {isSuccessful: false, data: false};
        },

        async setActiveStatus(params) {
            const item = findById(params?.body?.id ?? params?.body?.encodedId);
            if (item) {
                (item as any).isActived = params.body?.isActived;
                return {isSuccessful: true, data: true};
            }
            return {isSuccessful: false, data: false};
        },

        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
        async getCountByActive(_params) {
            const active = mockData.filter(x => x.isActived).length;
            const inactive = mockData.filter(x => !x.isActived).length;
            return {
                isSuccessful: true,
                data: [
                    {statusValue: true, statusDescription: 'Đang hoạt động', totalCount: active},
                    {statusValue: false, statusDescription: 'Ngừng hoạt động', totalCount: inactive},
                ],
            };
        },

        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
        async getComboOptions(_params) {
            return {
                isSuccessful: true,
                data: mockData.map(x => ({
                    value: x[idField],
                    label: x.name,
                    text: x.name,
                })),
            };
        },

        async exportToExcel() {
            console.warn('[MockService] exportToExcel is not implemented');
            return {};
        },
    };
};
