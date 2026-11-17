import type {PagedRequest} from '@plugin-core/api/core/base-types';
import {AdminUserControllerService} from './api/AdminUserControllerService';
import {AdminSettingControllerService} from './api/AdminSettingControllerService';
import {AdminEmailTemplateControllerService} from './api/AdminEmailTemplateControllerService';
import {AdminNodeControllerService} from './api/AdminNodeControllerService';
import type {AdminUserRowDto, PageRequestDtoAdminUserFilterDto} from './api/index.defs';
import UiUtils from '../utils/uiUtils';
import i18n from '../i18n';

type FsPage<T> = {
    isSuccessful?: boolean;
    code?: string;
    message?: string;
    data?: {totalCount?: string | number; data?: T[]};
};

/** Chuyen service sinh tu dong (PageRequestDto/PageResult) sang hop dong getPaged cua CrudPage. */
export const toCrudPaged = <T extends object>(
    search: (p: {body?: {skipCount?: number; maxResultCount?: number; sorting?: string; filter?: Record<string, unknown>}}) => Promise<FsPage<T>>,
    idField: keyof T,
) => ({
    getPaged: async ({body}: {body?: PagedRequest & Record<string, unknown>} = {}) => {
        const {skipCount, maxResultCount, sorting, ...filter} = body ?? {};
        const res = await search({body: {skipCount, maxResultCount, sorting, filter}});
        return {
            ...res,
            data: {
                totalCount: String(res.data?.totalCount ?? 0),
                // encodedId chi de lam view_id/rowKey cua bang; hanh dong goi service sinh tu dong voi id that
                items: (res.data?.data ?? []).map((x) => ({...x, encodedId: String(x[idField])})),
            },
        };
    },
});


type FsResp<T> = {isSuccessful?: boolean; message?: string; data?: T};

/**
 * Goi 1 API admin: loi nghiep vu (HTTP 4xx hoac isSuccessful=false) hien toast theo message backend.
 * Tra ve {ok, data}; thanh cong co successKey (key i18n) thi hien toast thanh cong.
 */
export const adminCall = async <T>(
    fn: () => Promise<FsResp<T>>,
    successKey?: string,
): Promise<{ok: boolean; data?: T}> => {
    try {
        const res = await fn();
        if (res?.isSuccessful === false) {
            UiUtils.showError(res.message || i18n.t('admin:common.error'));
            return {ok: false};
        }
        if (successKey) UiUtils.showSuccess(i18n.t(successKey));
        return {ok: true, data: res?.data};
    } catch (err) {
        UiUtils.showError((err as Error)?.message || i18n.t('admin:common.error'));
        return {ok: false};
    }
};

const S = AdminSettingControllerService;
const T = AdminEmailTemplateControllerService;

/** Bao cac service sinh tu dong theo ten nghiep vu (ten method sinh tu dong nhu settings1/emailTemplates2 kho doc). */
export const adminApi = {
    users: {
        ...toCrudPaged<AdminUserRowDto>(
            (p) => AdminUserControllerService.getPaged({body: p.body as PageRequestDtoAdminUserFilterDto}),
            'userId',
        ),
        detail: AdminUserControllerService.users1,
        create: AdminUserControllerService.users,
        lock: AdminUserControllerService.lock,
        unlock: AdminUserControllerService.unlock,
        roles: AdminUserControllerService.roles,
        revokeSessions: AdminUserControllerService.revokeSessions,
    },
    settings: {
        list: () => S.settings1(),
        updateGroup: S.settings,
        reset: S.reset,
        mailTest: S.test,
    },
    templates: {
        list: () => T.emailTemplates2(),
        // danh muc ma it va co dinh: lay het mot lan roi loc/cat trang o client theo hop dong getPaged cua bang chung
        getPaged: async ({body}: {body?: {skipCount?: number; maxResultCount?: number; searchText?: string}} = {}) => {
            const res = await T.emailTemplates2();
            const q = (body?.searchText ?? '').trim().toLowerCase();
            const all = (res.data ?? []).filter((r) =>
                !q || [r.code, r.name, r.description].some((x) => (x ?? '').toLowerCase().includes(q)));
            const skip = body?.skipCount ?? 0;
            const size = body?.maxResultCount ?? all.length;
            return {
                ...res,
                data: {
                    totalCount: String(all.length),
                    items: all.slice(skip, skip + size).map((r) => ({...r, encodedId: r.code})),
                },
            };
        },
        get: T.emailTemplates,
        update: T.emailTemplates1,
        sendTest: T.sendTest,
        reset: T.reset,
        preview: T.preview,
    },
    nodes: {
        list: () => AdminNodeControllerService.nodes(),
        drain: AdminNodeControllerService.drain,
    },
};
