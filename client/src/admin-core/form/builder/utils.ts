/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import ValidateUtils from "@plugin-core/shared/utils/validate.utils";

export class ValidationRules {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
    static required = (message?: string) => ValidateUtils.required;
    static email = ValidateUtils.email;
    static phone = ValidateUtils.phoneNumberVietNam;
    //static url = ValidateUtils.url;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
    static minLength = (min: number, message?: string) => ValidateUtils.minLength(min);
    static maxLength = (max: number, message?: string) => ValidateUtils.maxLength(max, message);
    static pattern = (pattern: RegExp, message: string) => ({pattern, message});
    static custom = (validator: (rule: any, value: any) => Promise<void>) => ({validator});
}
