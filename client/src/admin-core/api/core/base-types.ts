/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
/**
 * Generic base types shared by every service in `@api/services/*`.
 *
 * Shapes copied verbatim from `webapp/src/api/base/index.defs.ts` (the
 * swagger-axios-codegen output). Once migration finishes and that file is
 * removed, these definitions become the single source of truth.
 */

/** Server-side validation error (one field). */
export interface ValidationError {
  /**  */
  propertyName?: string;

  /**  */
  errorMessage?: string;

  /**  */
  errorCode?: string;
}

/** Inline error payload embedded in `ApiResponse.errorDetail` / `.notification`. */
export interface ApiResponseError {
  /**  */
  code?: string;

  /**  */
  message?: string;

  /**  */
  paramMessage?: string[];

  /**  */
  data?: any | null;
}

/** Standard envelope returned by every backend endpoint. */
export interface ApiResponse<T = any> {
  /**  */
  code?: string;

  /**  */
  message?: string;

  /**  */
  data?: T;

  /**  */
  extend?: any | null;

  /**  */
  errorDetail?: ApiResponseError;

  /**  */
  notification?: ApiResponseError;

  /**  */
  errors?: ValidationError[];

  /**  */
  isSuccessful?: boolean;
}

/** Page of items returned by `*Service.getPaged(...)`. */
export interface PagedResult<T> {
  /**  */
  items?: T[];

  /**  */
  totalCount?: string;
}

/** Standard paging + filtering input for `*Service.getPaged(...)`. */
export interface PagedRequest {
  /**  */
  filter?: string;

  /**  */
  isActived?: boolean;

  /**  */
  skipCount?: number;

  /**  */
  maxResultCount?: number;

  /**  */
  sorting?: string;
}

/** Input for `*Service.getById` / `*Service.remove` (single-id lookup). */
export interface EncodedIdRequest {
  /**  */
  encodedId?: string;
}

/** Input for `*Service.setActiveStatus` (batch activation/deactivation). */
export interface SetActiveStatusRequest {
  /**  */
  encodedIds?: string[];

  /**  */
  isActived?: boolean;
}

/** Input for `*Service.getComboOptions` (cascading combobox lookups). */
export interface ComboOptionRequest {
  /**  */
  filter?: string;

  /**  */
  isActived?: boolean;

  /**  */
  cascaderValue?: string;

  /**  */
  maxResultCount?: number;
}

/** Single option returned by `*Service.getComboOptions`. */
export interface ComboOption {
  /**  */
  value?: any | null;

  /**  */
  displayName?: string;

  /**  */
  data?: any | null;
}

/** Bucket returned by `*Service.getCountByActive` (count per status). */
export interface CountByActiveStatus {
  /**  */
  statusValue?: any | null;

  /**  */
  statusDescription?: string;

  /**  */
  totalCount?: string;
}
