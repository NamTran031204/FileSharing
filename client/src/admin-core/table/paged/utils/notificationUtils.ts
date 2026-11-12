/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
// notificationUtils.ts
export const createNotificationTransform = {
    /**
     * Tạo transform function từ single field
     * @param field - Tên field muốn lấy
     * @returns Transform function
     *
     * @example
     * // Thay vì:
     * transformNotificationParameter: (d: CountryDto) => ({ name: d?.name })
     *
     * // Chỉ cần:
     * transformNotificationParameter: createNotificationTransform.fromField('name')
     */
    fromField: (field: string) => (entity: any) => ({[field]: entity?.[field]}),

    /**
     * Tạo transform function từ multiple fields
     * @param fields - Array các field names
     * @returns Transform function
     *
     * @example
     * transformNotificationParameter: createNotificationTransform.fromFields(['name', 'code'])
     * // Result: { name: entity.name, code: entity.code }
     */
    fromFields: (fields: string[]) => (entity: any) => {
        const result: Record<string, any> = {};
        fields.forEach(field => {
            result[field] = entity?.[field];
        });
        return result;
    },

    /**
     * Tạo transform function với field mapping
     * @param mapping - Object mapping từ key hiển thị sang field name
     * @returns Transform function
     *
     * @example
     * transformNotificationParameter: createNotificationTransform.fromMapping({
     *   displayName: 'name',
     *   identifier: 'id'
     * })
     * // Result: { displayName: entity.name, identifier: entity.id }
     *
     * @example
     * // Map userName sang name
     * transformNotificationParameter: createNotificationTransform.fromMapping({
     *   name: 'userName'
     * })
     * // Result: { name: entity.userName }
     */
    fromMapping: (mapping: Record<string, string>) => (entity: any) => {
        const result: Record<string, any> = {};
        Object.entries(mapping).forEach(([key, sourceField]) => {
            result[key] = entity?.[sourceField];
        });
        return result;
    },

    /**
     * Shorthand để map 1 field sang tên khác
     * @param targetKey - Key muốn hiển thị
     * @param sourceField - Field name trong entity
     * @returns Transform function
     *
     * @example
     * transformNotificationParameter: createNotificationTransform.mapField('name', 'userName')
     * // Result: { name: entity.userName }
     */
    mapField: (targetKey: string, sourceField: string) => (entity: any) => ({
        [targetKey]: entity?.[sourceField]
    }),

    /**
     * Tạo transform function với custom logic
     * @param transformer - Custom transform function
     * @returns Transform function
     *
     * @example
     * transformNotificationParameter: createNotificationTransform.custom((entity) => ({
     *   fullName: `${entity.firstName} ${entity.lastName}`,
     *   status: entity.isActive ? 'Active' : 'Inactive'
     * }))
     */
    custom: (transformer: (entity: any) => any) => transformer,

    /**
     * Return entity as is (no transformation)
     */
    identity: (entity: any) => entity
};
