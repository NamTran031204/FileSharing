import React, {useMemo} from 'react';
import {Row} from 'antd';
import {type FormBuilderConfig} from './types';
import FormFieldItem from "./FormFieldItem";

interface FormBuilderComponentProps {
    config: FormBuilderConfig;
    disableResponsiveCol?: boolean;
    ignoreRowWrapper?: boolean;
}

export const OrdFormBuilder: React.FC<FormBuilderComponentProps> = ({
                                                                        config,
                                                                        disableResponsiveCol,
                                                                        ignoreRowWrapper = false,
                                                                    }) => {
    const visibleFields = useMemo(() => config.fields.filter(field => !field.hidden), [config.fields]);
    const ordered = useMemo(() => {
        const search = visibleFields.filter(f => f.type === 'search-input');
        const rest = visibleFields.filter(f => f.type !== 'search-input');
        return [...rest, ...search];
    }, [visibleFields]);
    const FormContent = <>
        {ordered.map((field, index) => (
            <FormFieldItem
                key={`field-${field?.name}-${index}`}
                field={field}
                disableResponsiveCol={disableResponsiveCol}
            />
        ))}
    </>;
    if (ignoreRowWrapper) {
        return FormContent
    }
    return (
        <Row gutter={18}>
            {FormContent}
        </Row>
    );
};
