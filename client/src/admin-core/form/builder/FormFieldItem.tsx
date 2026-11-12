import React, {useCallback, useMemo} from 'react';
import {Col} from 'antd';
import {OrdFormField} from "../float-label/FormField";
import {FloatFieldLabel} from "../float-label/index";
import {useResponsiveSpan} from "@plugin-core/shared/hooks/useResponsiveSpan";
import {ValidationRules} from "./utils";
import {type CustomContentFieldConfig, type CustomFieldConfig, type DateRangeFieldConfig, type FormFieldConfig} from './types';
import {useFormFieldComponent} from './useFormFieldComponent';
import _ from 'lodash';
import validateUtils from "@plugin-core/shared/utils/validate.utils";
import {v4 as uuidv4} from "uuid";
import OrdDateRangeInput from "../inputs/OrdDateRangeInput";

interface FormFieldItemProps {
    field: FormFieldConfig;
    disableResponsiveCol?: boolean;
}

/**
 * Component tối ưu để render form field với memo và useMemo
 */
const FormFieldItem: React.FC<FormFieldItemProps> = (props: FormFieldItemProps) => {
    const {field, disableResponsiveCol = false} = props;

    // Destructure field properties với useMemo để tránh re-computation
    const fieldConfig = useMemo(() => {
        const {
            name,
            label,
            type,
            required = false,
            rules = [],
            span = 24,
            formItemProps = {},
            hidden = false,
            disabled,
            initialValue,
            ignoreLabel
        } = field;

        return {
            name,
            label,
            type,
            required,
            rules,
            span,
            formItemProps,
            hidden,
            disabled,
            initialValue,
            ignoreLabel
        };
    }, [field]);
    const fieldName = useMemo(() => {
        return field.name || 'field-' + uuidv4();
    }, [field.name])
    // Early return cho hidden fields
    if (fieldConfig.hidden) {
        return null;
    }

    // Memoize responsive span calculation
    // eslint-disable-next-line react-hooks/rules-of-hooks -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
    const responsiveSpan = useResponsiveSpan(fieldConfig.span, disableResponsiveCol);

    // Memoize validation rules
    // eslint-disable-next-line react-hooks/rules-of-hooks -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
    const finalRules = useMemo(() => {
        const {required, rules} = fieldConfig;
        let final_rules = rules || [];
        if (required) {
            const fieldName = fieldConfig.label || field.name;
            if (typeof fieldName === 'string') {
                final_rules = [validateUtils.requiredWithFieldName(fieldName), ...rules]
            } else {
                final_rules = [validateUtils.required, ...rules]
            }

        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
        // @ts-ignore
        const maxLength: number = fieldConfig?.maxLength;
        if (maxLength && maxLength > 0) {
            final_rules = [...final_rules, ValidationRules.maxLength(maxLength)];
        }
        return final_rules;
    }, [fieldConfig.required, fieldConfig.rules, fieldConfig.name, fieldConfig.label]);

    // Memoize common field props
    // eslint-disable-next-line react-hooks/rules-of-hooks -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
    const commonFieldProps = useMemo(() => ({
        label: fieldConfig.label ?? fieldConfig.name,
        name: fieldConfig.name ?? '',
        rules: finalRules,
        required: fieldConfig.required,
        initialValue: fieldConfig.initialValue,
        ...fieldConfig.formItemProps,
        disabled: fieldConfig.disabled,
        ignoreLabel: fieldConfig.ignoreLabel,
    }), [
        fieldConfig.label,
        fieldConfig.name,
        fieldConfig.required,
        fieldConfig.initialValue,
        fieldConfig.disabled,
        fieldConfig.formItemProps,
        fieldConfig.ignoreLabel,
        finalRules
    ]);

    // Get field component với dependency chính xác
    // eslint-disable-next-line react-hooks/rules-of-hooks -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
    const fieldComponent = useFormFieldComponent(field);

    // Memoize render component function
    // eslint-disable-next-line react-hooks/rules-of-hooks -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
    const renderComponent = useCallback(() => {
        const {type} = fieldConfig;

        if (!type) {
            return null;
        }

        // Custom field
        if (type === 'custom') {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
            // @ts-ignore
            const customConfig = field as CustomFieldConfig;
            return customConfig.render();
        }
        // Checkbox field
        if (type === 'checkbox') {
            return (
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
                // @ts-ignore
                <OrdFormField {...commonFieldProps} isCheckbox={true}/>
            );
        }
        if (type === 'custom-field-content') {
            const customConfig = field as CustomContentFieldConfig;
            return (
                <OrdFormField {...commonFieldProps}>
                    {customConfig.content}
                </OrdFormField>
            );
        }
        // Date range bound to two flat form fields — avoid nesting under a single Form.Item name.
        if (type === 'date-range') {
            const dateRangeField = field as DateRangeFieldConfig;
            if (dateRangeField.names) {
                const [startName, endName] = dateRangeField.names;
                return (
                    <FloatFieldLabel
                        label={fieldConfig.label ?? fieldConfig.name}
                        required={fieldConfig.required}
                        ignoreLabel={fieldConfig.ignoreLabel}
                    >
                        <OrdDateRangeInput
                            {...(dateRangeField.componentProps || {})}
                            startName={startName}
                            endName={endName}
                            required={fieldConfig.required}
                            disabled={fieldConfig.disabled}
                        />
                    </FloatFieldLabel>
                );
            }
        }
        // No field component
        if (!fieldComponent) {
            return null;
        }
        // Search input field (special case)
        if (type === 'search-input') {
            return fieldComponent;
        }

        // Default wrapped field
        return (
            <OrdFormField {...commonFieldProps}>
                {fieldComponent}
            </OrdFormField>
        );
    }, [
        fieldConfig.type,
        field, // For custom field
        commonFieldProps,
        fieldComponent
    ]);

    // Memoize the entire component render
    // eslint-disable-next-line react-hooks/rules-of-hooks -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
    const componentContent = useMemo(() => {
        return renderComponent();
    }, [renderComponent]);
    if (fieldConfig.type == 'custom' && !fieldConfig?.span) {
        return (
            <>
                {componentContent}
            </>

        );
    }
    if (fieldConfig.type == 'blank') {
        return (
            <>
                <Col key={fieldName} {...responsiveSpan}></Col>
            </>
        );
    }

    return (
        <>
            <Col key={fieldName} {...responsiveSpan}>
                {componentContent}
            </Col>
        </>

    );
};
// ✅ Memo hóa
export default React.memo(FormFieldItem, (prevProps, nextProps) => {
    return _.eq(prevProps.field, nextProps.field)
        && prevProps.disableResponsiveCol === nextProps.disableResponsiveCol;
});
