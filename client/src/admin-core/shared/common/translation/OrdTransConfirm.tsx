import {type OrdTransProps} from "@plugin-core/shared/common/translation/types";
import React from "react";
import {Trans} from "react-i18next";

export const OrdTransConfirm: React.FC<OrdTransProps> = ({
                                                             i18nKey,
                                                             values,
                                                             components = {italic: <i/>, bold: <strong/>},
                                                             ns = 'confirm',
                                                         }) => {
    return (
        <OrdTrans
            ns={ns}
            i18nKey={i18nKey}
            values={values}
            components={components}
        />
    );
};

export const OrdTrans: React.FC<OrdTransProps> = ({
                                                      i18nKey,
                                                      values,
                                                      components = {italic: <i/>, bold: <strong/>},
                                                      ns,
                                                  }) => {
    return (
        <Trans
            ns={ns}
            i18nKey={i18nKey}
            values={values}
            components={components}
        />
    );
};