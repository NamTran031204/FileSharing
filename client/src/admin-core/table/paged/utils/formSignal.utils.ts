import {type FormInstance} from "antd";

const updateExtendUIField = (form: FormInstance, field: string) => {
    const tick = Date.now();
    const current = form.getFieldValue("extendUI") || {};
    form.setFieldValue("extendUI", {
        ...current,
        [field]: tick,
    });
};

export const formSignalUtils = {
    reloadTableAndCounter: (form: FormInstance) => {
        updateExtendUIField(form, "onLoadDataTable");
        updateExtendUIField(form, "reloadStatusCounter");
    },
    reloadTableOnly: (form: FormInstance) => {
        updateExtendUIField(form, "onLoadDataTable");
    },
    reloadCounterOnly: (form: FormInstance) => {
        updateExtendUIField(form, "reloadStatusCounter");
    },
};
