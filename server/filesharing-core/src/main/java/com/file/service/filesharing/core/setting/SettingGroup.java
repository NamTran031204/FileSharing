package com.file.service.filesharing.core.setting;

/** nhom setting hien thi tren man quan tri; fixed = thong so loi cua dev, nam trong FixedSettings, admin chi doc */
public enum SettingGroup {
    APP(true), AUTH(true), UPLOAD(true), DOWNLOAD(true), PROOF(true), DASHBOARD(true), RETENTION(true), JOB(true),
    WORKER(true), VIDEO(true), IMAGE(true), RAW(true), MAIL(false);

    private final boolean fixed;

    SettingGroup(boolean fixed) {
        this.fixed = fixed;
    }

    public boolean isFixed() {
        return fixed;
    }
}
