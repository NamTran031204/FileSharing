import React from "react";
import {
    type CheckboxFieldConfig,
    type CustomContentFieldConfig,
    type CustomFieldConfig,
    type DateFieldConfig,
    type DateRangeFieldConfig, type DateTimeFieldConfig,
    type FormBuilderConfig,
    type FormFieldConfig,
    type InputFieldConfig,
    type InputRegexFieldConfig,
    type NumberFieldConfig,
    type SearchInputFieldConfig,
    type SelectFieldConfig,
    type TextareaFieldConfig
} from "./types";
import {OrdFormBuilder} from "./index";
import {v4 as uuidv4} from "uuid";

export class FormBuilder {
    private fields: FormFieldConfig[] = [];

    private addField<T extends FormFieldConfig>(type: FormFieldConfig["type"], options: Omit<T, "type">): FormBuilder {
        this.fields.push({type, ...options} as FormFieldConfig);
        return this;
    }

    addText(options: InputFieldConfig) {
        return this.addField("input", options);
    }

    addRegexText(options: InputRegexFieldConfig) {
        return this.addField("input-regex", options);
    }

    addTextArea(options: TextareaFieldConfig) {
        return this.addField("textarea", options);
    }

    addPassword(options: TextareaFieldConfig) {
        return this.addField("password", options);
    }

    addNumber(options: NumberFieldConfig) {
        return this.addField("number", options);
    }

    addSelect(options: SelectFieldConfig) {
        return this.addField("select", options);
    }

    addDate(options: DateFieldConfig) {
        return this.addField("date", options);
    }
    addDateTime(options: DateTimeFieldConfig) {
        return this.addField("dateTime", options);
    }

    addDateRange(options: DateRangeFieldConfig) {
        const name = options.name ?? options.names?.[0];
        return this.addField("date-range", {...options, name: name ?? 'dateRange'});
    }

    addCheckbox(options: CheckboxFieldConfig) {
        return this.addField("checkbox", {
            ...options,
            label: options.checkboxText || options.label
        });
    }

    addCustom(options: CustomFieldConfig) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
        // @ts-ignore
        return this.addField("custom", options);
    }

    addCustomFieldContent(options: CustomContentFieldConfig) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
        // @ts-ignore
        return this.addField("custom-field-content", options);
    }

    addSearchInput(options: SearchInputFieldConfig) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
        // @ts-ignore
        return this.addField("search-input", options);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ nguyên mã gốc wifi-webapp (PORTING.md)
    addBlank(span: number) {
        return this.addField("blank", {
            name: 'blank-' + uuidv4()
        });
    }

    addIf(condition: boolean, callback: (builder: FormBuilder) => FormBuilder) {
        return condition ? callback(this) : this;
    }

    build(): FormBuilderConfig {
        return {fields: this.fields};
    }

    buildComponent(): React.FC {
        const config = this.build();
        return () => <OrdFormBuilder config={config}/>;
    }
}
