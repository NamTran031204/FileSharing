import _ from "lodash";

export const LOGGING_APP_ENABLE = 'LOGGING_APP_ENABLE';

class Utils {
    private readonly VIETNAMESE_REGEX: RegExp =
        /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

    toDate(arg0: any): Date | undefined {
        throw new Error("Method not implemented.");
    }

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
        return ('' + d).match(/^ *$/) !== null;
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

    fts(str: string | null | undefined) {
        return this.removeMultiSpace(this.toLowerCaseNonAccentVietnamese(str));
    }

    removeMultiSpace(str?: string | null) {
        if (!str) {
            return str;
        }
        return str.replace(/\s+/g, ' ').trim();
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

    omitPagedResultCommon(body: any) {
        if (!body) {
            return body;
        }
        return _.omit(body, [
            'hotKeyScopeId',
            'extendResetTick',
            'isShowAdvanceSearch',
            'onSearchBeginning',
            'version'
        ]);
    }

    isArrayEmpty(v: any[]) {
        return (v || []).length === 0;
    }

    getTextLabel(fieldName: string) {
        const inputElement = document.getElementById(fieldName);
        const floatLabelElement = inputElement?.closest(".float-label");
        return floatLabelElement?.querySelector(".label.as-label")?.childNodes[0]?.textContent?.trim() || floatLabelElement?.querySelector("label")?.childNodes[0]?.textContent?.trim() || "";
    }

    pad2Number(d: number) {
        return (d < 10) ? '0' + d.toString() : d.toString();
    }

    hasVietnamese(str: string | undefined): boolean {
        if (!str) return false;
        return this.VIETNAMESE_REGEX.test(str);
    }

    getLoggingAppEnabled() {
        return window.localStorage.getItem(LOGGING_APP_ENABLE);
    }

    getVtbDisable() {
        return import.meta.env?.VITE_DISABLE === "true";
    }
}

export default new Utils();
