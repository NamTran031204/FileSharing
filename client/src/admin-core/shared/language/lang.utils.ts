/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import vi_VN from 'antd/locale/vi_VN';
import enUS from 'antd/locale/en_US';
import dayjs from "dayjs";

import 'dayjs/locale/vi';
import i18next from "i18next";

// eslint-disable-next-line @typescript-eslint/no-namespace -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
export namespace LangUtil {
    export const getLang = () => {
        if (window.localStorage.getItem('Accept-Language')) {
            return window.localStorage.getItem('Accept-Language') || 'vi';
        }
        window.localStorage.setItem('Accept-Language', 'vi');
        return 'vi';
    }
    export const setLang = (langKey: string) => {
        return window.localStorage.setItem('Accept-Language', langKey);
    }
    export const getAntLocale = () => {
        const key = getLang();
        if (key === 'vi') {
            dayjs.locale('vi');
            return vi_VN;
        }
        if (key === 'en') {
            dayjs.locale('en');
            return enUS;
        }
    }
}
// eslint-disable-next-line @typescript-eslint/no-namespace -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
export namespace l {
    export const trans = (keyPrefixNs: string, prm?: any) => {
        const [ns, ...rest] = keyPrefixNs.split('.');
        return i18next.t(rest.join('.'), {...prm, ns: ns}) as string;
    }
    export const transCommon = (key: string, prm?: any) => {
        return i18next.t(key, {...prm, ns: 'common'}) as string;
    }
}


export class LWithNs {
    private readonly _ns: string;

    constructor(ns: string) {
        this._ns = ns;
    }

    l(key: string, prm?: any) {
        return i18next.t(key, {...prm, ns: this._ns || 'common'}) as string;
    }
}
