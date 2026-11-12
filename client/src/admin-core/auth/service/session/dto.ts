/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import {type AppBootstrapExtendDto, type AppUserCurrentDto, type UserInformationDto} from "@plugin-core/shared/types/common.types";
import {type OrdThemeDto} from "@plugin-core/shared/types/common.types";

export class AppBootstrapDto {
    setting?: { [key: string]: any; } | undefined;
    isLogined!: boolean;
    user?: UserInformationDto;
    extend?: AppBootstrapExtendDto;
    userCurrent?: AppUserCurrentDto;

    get theme(): OrdThemeDto {
        return this?.extend?.theme || {};
    }
}
