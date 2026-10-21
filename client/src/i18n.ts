import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import {LangUtil, type Lang} from './utils/lang.util';

// Lazy glob - Vite tach chunk rieng cho tung file dich
const loaders = import.meta.glob('./translations/**/*.json') as Record<string, () => Promise<{ default: Record<string, unknown> }>>;

const parsePath = (path: string) => {
    const match = path.match(/\.\/translations\/(.+?)\/(.+?)\.json$/);
    return match ? {lng: match[1], ns: match[2]} : null;
};

async function loadLanguageResources(lang: string): Promise<Record<string, Record<string, unknown>>> {
    const resources: Record<string, Record<string, unknown>> = {};
    await Promise.all(
        Object.entries(loaders).map(async ([path, loader]) => {
            const info = parsePath(path);
            if (!info || info.lng !== lang) return;
            resources[info.ns] = (await loader()).default;
        }),
    );
    return resources;
}

const currentLang = LangUtil.getLang();

/** main.tsx await truoc khi render */
export const i18nReady: Promise<typeof i18n> = (async () => {
    // luon nap vi lam fallback
    const [viRes, curRes] = await Promise.all([
        loadLanguageResources('vi'),
        currentLang === 'vi' ? Promise.resolve(null) : loadLanguageResources(currentLang),
    ]);
    const resources: Record<string, Record<string, Record<string, unknown>>> = {vi: viRes};
    if (curRes) resources[currentLang] = curRes;

    await i18n.use(initReactI18next).init({
        resources,
        lng: currentLang,
        fallbackLng: 'vi',
        ns: Object.keys(viRes),
        defaultNS: 'common',
        interpolation: {escapeValue: false},
    });
    return i18n;
})();

/** Doi ngon ngu runtime - lazy load neu chua co */
export async function switchLanguage(lang: Lang): Promise<void> {
    if (!i18n.hasResourceBundle(lang, 'common')) {
        const resources = await loadLanguageResources(lang);
        for (const [ns, data] of Object.entries(resources)) {
            i18n.addResourceBundle(lang, ns, data, true, true);
        }
    }
    LangUtil.setLang(lang);
    LangUtil.getAntLocale(lang);
    await i18n.changeLanguage(lang);
}

export default i18n;
