import Utils from "@plugin-core/shared/utils/utils";
import {type SelectDataSource} from "@plugin-core/form/select/data-source/selectDataSource";
import {useSelectDataSource} from "@plugin-core/form/hooks/useSelectDataSource";
import {useTranslation} from "react-i18next";

export const useSelectIsActived = (): SelectDataSource => {
    const {t, i18n} = useTranslation('common');
    const key = `FilterIsActived_${i18n.language}`;

    return useSelectDataSource(key, async () => {
        return [{
            value: true,
            label: t('dang_hoat_dong'),
            fts: Utils.toLowerCaseNonAccentVietnamese(t('dang_hoat_dong'))
        }, {
            value: false,
            label: t('ngung_hoat_dong'),
            fts: Utils.toLowerCaseNonAccentVietnamese(t('ngung_hoat_dong'))
        }];
    });
};