/* eslint-disable @typescript-eslint/no-explicit-any -- giữ nguyên mã gốc wifi-webapp (PORTING.md) */
import {useTranslation} from "react-i18next";
import React, {type ReactNode} from "react";
import {OrdTransConfirm} from "@plugin-core/shared/common/translation/OrdTransConfirm";

export interface ModifyModalI18nConfig {
    titleI18nKey?: {
        create?: string;
        edit?: string;
        viewDetail?: string;
    };
    successI18nKey?: {
        create?: string;
        edit?: string;
        remove?: string;
    };
    confirmI18nKey?: {
        remove?: string;
    };
    translationNamespace?: string | string[]; // namespace cho useTranslation
}

export interface UseModifyModalI18nProps {
    entityTranslationNs: string;
    i18nConfig?: ModifyModalI18nConfig;
}

export const useModifyModalI18n = ({
                                       entityTranslationNs,
                                       i18nConfig
                                   }: UseModifyModalI18nProps) => {
    const {t} = useTranslation(['modify-modal']);
    const {t: tCommon} = useTranslation(['common']);
    const {t: tCustom} = useTranslation(i18nConfig?.translationNamespace || ['modify-modal']);

    const getTitleText = (mode: 'create' | 'edit' | 'viewDetail', editingItem?: any) => {
        if (i18nConfig?.titleI18nKey) {
            const keyMap = {
                create: i18nConfig.titleI18nKey.create,
                edit: i18nConfig.titleI18nKey.edit,
                viewDetail: i18nConfig.titleI18nKey.viewDetail,
            };
            const key = keyMap[mode];
            return key ? tCustom(key, editingItem || {}) as string : '---';
        } else {
            const entity = t('entity.' + entityTranslationNs);
            const keyMap = {
                create: t('common.title.create', {entity}),
                edit: t('common.title.edit', {entity}),
                viewDetail: t('common.title.view', {entity}),
            };
            return keyMap[mode] || '---';
        }
    };

    const renderBoldName = (text: string, name?: string): ReactNode => {
        if (!name) return text;
        const idx = text.indexOf(name);
        if (idx === -1) return text;
        return (
            <span>
                {text.slice(0, idx)}<strong>{name}</strong>{text.slice(idx + name.length)}
            </span>
        );
    };

    const getSuccessMessage = (
        mode: 'create' | 'edit' | 'viewDetail',
        data: any
    ): ReactNode => {
        if (i18nConfig?.successI18nKey) {
            const keyMap = {
                create: i18nConfig.successI18nKey.create,
                edit: i18nConfig.successI18nKey.edit,
                viewDetail: i18nConfig.successI18nKey.remove,
            };
            const key = keyMap[mode];
            return key ? tCustom(key, (data)) as string : '';
        } else {
            const entity = t('entity.' + entityTranslationNs);
            const keyMap = {
                create: t('common.success.create', {entity, ...data}),
                edit: t('common.success.edit', {entity, ...data}),
                viewDetail: t('common.success.remove', {entity, ...data}),
            };
            const text = (keyMap[mode] || '') as string;
            return renderBoldName(text, data?.name);
        }
    };

    const getDeleteSuccessMessage = (
        deletingItem: any
    ) => {
        if (i18nConfig?.successI18nKey?.remove) {
            return tCustom(i18nConfig.successI18nKey.remove, ({...deletingItem})) as string;
        } else {
            const entity = t('entity.' + entityTranslationNs);
            return t('common.success.remove', {entity, ...deletingItem}) as string;
        }
    };

    const getConfirmContent = (deletingItem: any): React.ReactNode => {
        if (i18nConfig?.confirmI18nKey?.remove) {
            return (
                <OrdTransConfirm
                    ns={i18nConfig.translationNamespace || ['modify-modal']}
                    i18nKey={i18nConfig.confirmI18nKey.remove}
                    values={deletingItem}
                />
            );
        } else {
            const entity = t('entity.' + entityTranslationNs);
            return (
                <OrdTransConfirm
                    ns={'modify-modal'}
                    i18nKey={'common.confirm.remove'}
                    values={{entity, ...deletingItem}}
                />
            );
        }
    };

    const getConfirmTitle = () => {
        return tCommon('confirmDelete');
    };

    return {
        getTitleText,
        getSuccessMessage,
        getDeleteSuccessMessage,
        getConfirmContent,
        getConfirmTitle,
        t,
        tCommon
    };
};
