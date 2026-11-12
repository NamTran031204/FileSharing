/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import {type ComboOptionDto} from "@plugin-core/shared/types/common.types";
import {LWithNs} from "@plugin-core/shared/language/lang.utils";
import {AppExtendCode, PriceFixNumber} from "@plugin-core/shared/AppConst";
import NumberUtil from "@plugin-core/shared/utils/number.util";

class Utils {
    filterNaN(input: number) {
        return (isNaN(input) ? 0 : input);
    }

    isNullOrEmpty(input: any): boolean {
        return typeof input === 'undefined' || input === null || input === '';
    }

    isNotNull(input: any): boolean {
        return !this.isNullOrEmpty(input);
    }

    isEmptyOrWhiteSpace(d: string) {
        if (this.isNullOrEmpty(d)) {
            return true;
        }
        return ('' + d).match(/^\s*$/) !== null;
    }

    toNonAccentVietnamese(str: string) {
        str = str.replace(/A|Á|À|Ã|Ạ|Â|Ấ|Ầ|Ẫ|Ậ|Ă|Ắ|Ằ|Ẵ|Ặ/g, "A");
        str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
        str = str.replace(/E|É|È|Ẽ|Ẹ|Ê|Ế|Ề|Ễ|Ệ/, "E");
        str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
        str = str.replace(/I|Í|Ì|Ĩ|Ị/g, "I");
        str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
        str = str.replace(/O|Ó|Ò|Õ|Ọ|Ô|Ố|Ồ|Ỗ|Ộ|Ơ|Ớ|Ờ|Ỡ|Ợ/g, "O");
        str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
        str = str.replace(/U|Ú|Ù|Ũ|Ụ|Ư|Ứ|Ừ|Ữ|Ự/g, "U");
        str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
        str = str.replace(/Y|Ý|Ỳ|Ỹ|Ỵ/g, "Y");
        str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
        str = str.replace(/Đ/g, "D");
        str = str.replace(/đ/g, "d");
        // Some system encode vietnamese combining accent as individual utf-8 characters
        str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // Huyền sắc hỏi ngã nặng
        str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // Â, Ê, Ă, Ơ, Ư
        return str;
    }

    toLowerCaseNonAccentVietnamese(str: string | null | undefined): string {
        if (!str) {
            return '';
        }
        if (this.isNullOrEmpty(str)) {
            return str;
        }
        str = '' + str;
        str = str.toLowerCase();
//     We can also use this instead of from line 11 to line 17
//     str = str.replace(/\u00E0|\u00E1|\u1EA1|\u1EA3|\u00E3|\u00E2|\u1EA7|\u1EA5|\u1EAD|\u1EA9|\u1EAB|\u0103|\u1EB1|\u1EAF|\u1EB7|\u1EB3|\u1EB5/g, "a");
//     str = str.replace(/\u00E8|\u00E9|\u1EB9|\u1EBB|\u1EBD|\u00EA|\u1EC1|\u1EBF|\u1EC7|\u1EC3|\u1EC5/g, "e");
//     str = str.replace(/\u00EC|\u00ED|\u1ECB|\u1EC9|\u0129/g, "i");
//     str = str.replace(/\u00F2|\u00F3|\u1ECD|\u1ECF|\u00F5|\u00F4|\u1ED3|\u1ED1|\u1ED9|\u1ED5|\u1ED7|\u01A1|\u1EDD|\u1EDB|\u1EE3|\u1EDF|\u1EE1/g, "o");
//     str = str.replace(/\u00F9|\u00FA|\u1EE5|\u1EE7|\u0169|\u01B0|\u1EEB|\u1EE9|\u1EF1|\u1EED|\u1EEF/g, "u");
//     str = str.replace(/\u1EF3|\u00FD|\u1EF5|\u1EF7|\u1EF9/g, "y");
//     str = str.replace(/\u0111/g, "d");
        str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
        str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
        str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
        str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
        str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
        str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
        str = str.replace(/đ/g, "d");
        // Some system encode vietnamese combining accent as individual utf-8 characters
        str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // Huyền sắc hỏi ngã nặng
        str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // Â, Ê, Ă, Ơ, Ư
        return str;
    }

    compareFts(keyFilter: string | null, searchTerm: string | null) {
        if (this.isNullOrEmpty(searchTerm)) {
            return true;
        }
        if (!this.isNullOrEmpty(searchTerm)) {
            searchTerm = this.toLowerCaseNonAccentVietnamese(searchTerm)
                .replace(/\s+/g, ' ');
        }
        if (!this.isNullOrEmpty(keyFilter)) {
            keyFilter = this.toLowerCaseNonAccentVietnamese(keyFilter)
                .replace(/\s+/g, ' ');
        }
        return !!keyFilter && !!searchTerm && keyFilter.indexOf(searchTerm) > -1;
    }

    removeAccentVietnamese(arr: any[]) {
        let fts = '';
        if (arr && arr.length > 0) {
            arr.forEach(it => {
                fts = fts + ' ' + this.toLowerCaseNonAccentVietnamese(it);
            })
        }
        return fts;
    }

    toCapitalizeText(txt: string): string {
        if (this.isNullOrEmpty(txt)) {
            return txt;
        }
        const capitalizes = txt.split(' ').map(it => {
            if (this.isNullOrEmpty(it)) {
                return it;
            }
            return it.charAt(0).toUpperCase() + it.slice(1);
        });
        return capitalizes.join(' ');
    }

    mapCommonSelectOption(result: ComboOptionDto[], ns = '') {
        if (!result || result.length === 0) {
            return [];
        }
        if (ns != '') {
            result.forEach(it => {
                const l = new LWithNs(ns);
                it.displayName = l.l(it.displayName || '');
            });
        }
        return result.map(it => ({
            value: it.value,
            label: it.displayName,
            disabled: it.disabled,
            fts: this.toLowerCaseNonAccentVietnamese(it.displayName || ''),

            data: {
                ...it.data
            },
        }));
    }

    resolveTenancyCode(userName?: string | null) {
        // const fontEndUrl: string = import.meta.env.VITE_FONT_END_URL;
        const fontEndUrl = window.location.origin;
        if (fontEndUrl && fontEndUrl.indexOf('localhost') < 0) {
            const host = location.host.toLowerCase();
            const host_fontEndUrl = new URL(fontEndUrl).host.toLowerCase();
            if (host !== host_fontEndUrl) {
                return host.replace('.' + host_fontEndUrl, '');
            }
        }
        if (userName && userName.indexOf('_') > -1) {
            const parts = userName.split('_');
            parts.pop();
            return parts.join('_');
        }
        return null;
    }

    setPriceWithFixed(price: number | undefined | null, isZero = false) {
        if (!price) {
            return isZero ? 0 : null;
        }
        return parseFloat(price.toFixed(PriceFixNumber));
    }

    parseFloatWithFixed(value: number | undefined | null, fixed = 2) {
        if (!value) {
            return value;
        }
        return parseFloat(value.toFixed(fixed));
    }

    // Chuyển string số thành string số điện thoại dạng (xxx)-xxx-xxxx
    transformPhoneNumber(rawNum: string) {
        if (rawNum) {
            const areaCodeStr = rawNum.slice(0, 3);
            const midSectionStr = rawNum.slice(3, 6);
            const lastSectionStr = rawNum.slice(6);
            return `(${areaCodeStr})-${midSectionStr}-${lastSectionStr}`;
        } else {
            return '';
        }
    }

    //  format Number để hiển thị ngoài view
    formatterNumber = (value: string | number | undefined, fixed = 0, nullVal = '0') => {
        return NumberUtil.formatString({
            value: value,
            decimalLimit: fixed,
            nullValue: nullVal,
            padDecimal: true
        })
        // if (value)
        //     if (typeof value == 'number') {
        //         value = Math.round(value * Math.pow(10, fixed)) / Math.pow(10, fixed);
        //         return `${value.toFixed(fixed)}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        //     } else {
        //         return `${(Math.round(parseFloat(value) * Math.pow(10, fixed)) / Math.pow(10, fixed)).toFixed(fixed)}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        //     }
        // else{
        //     if (typeof value == 'number') {
        //         value = Math.round(value * Math.pow(10, fixed)) / Math.pow(10, fixed);
        //         return `${value.toFixed(fixed)}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        //     }else{
        //         return nullVal;
        //     }
        // }

    };

    //  format Number bên trong thẻ input
    formatterNumberInput = (value: string | number | undefined) => {
        return NumberUtil.formatString({
            value: value,
            // decimalLimit: fixed,
            // nullValue: nullVal
        })

        // if (value)
        //     return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        // else
        //     return '';
    };


    pad2Number(d: number) {
        return (d < 10) ? '0' + d.toString() : d.toString();
    }

    parseNumber = (value: string | undefined) => value?.replace(/\\s?|(,*)/g, '') as unknown as number;

    getTextLabel(fieldName: string) {
        const inputElement = document.getElementById(fieldName);
        const floatLabelElement = inputElement?.closest(".float-label");
        return floatLabelElement?.querySelector(".label.as-label")?.childNodes[0]?.textContent?.trim() || "";
    }

    fts(str: string | null | undefined) {
        return this.removeMultiSpace(this.toLowerCaseNonAccentVietnamese(str));
    }

    removeMultiSpace(str?: string | null) {
        if (!str) {
            return str;
        }
        return str.replace(/\s+/g, ' ').trim();
    }

    getPathUpTo = (segment: string) => {
        if (!segment?.length) {
            return '';
        }

        if (segment[0] !== '/') {
            segment = '/' + segment;
        }

        const systemCodeValues = Object.values(AppExtendCode);
        const pathNameLocation = window.location.pathname;

        const matchedValue = systemCodeValues.find(value => pathNameLocation.includes(value));
        const pathName = matchedValue ? pathNameLocation.substring(0, pathNameLocation.indexOf(matchedValue) + matchedValue.length) : "";

        return pathName + segment;
    };
}

export default new Utils();
