import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import 'dayjs/locale/en';
import viVN from 'antd/locale/vi_VN';
import enUS from 'antd/locale/en_US';

const LANG_KEY = 'Accept-Language';

export const SUPPORTED_LANGS = ['vi', 'en'] as const;
export type Lang = typeof SUPPORTED_LANGS[number];

const getLang = (): Lang => {
    try {
        const stored = window.localStorage.getItem(LANG_KEY);
        if (stored === 'vi' || stored === 'en') return stored;
    } catch { /* localStorage bi chan -> dung mac dinh */ }
    return 'vi';
};

const setLang = (lang: Lang) => {
    try {
        window.localStorage.setItem(LANG_KEY, lang);
    } catch { /* bo qua */ }
};

/** BCP-47 tag cho Intl / toLocaleString */
const getDateLocale = (lang: Lang = getLang()) => (lang === 'en' ? 'en-US' : 'vi-VN');

const getAntLocale = (lang: Lang = getLang()) => {
    dayjs.locale(lang);
    return lang === 'en' ? enUS : viVN;
};

export const LangUtil = {getLang, setLang, getDateLocale, getAntLocale};
