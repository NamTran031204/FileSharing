package com.file.service.filesharing.core.setting;

/** kieu gia tri cua setting, SettingValidator parse theo kieu nay */
public enum SettingType {
    INT, LONG, BOOL, STRING, URL, EMAIL,
    /** chuoi kieu spring: 900s, 24h, 30d; min/max tinh bang giay */
    DURATION,
    /** chuoi kieu spring: 50GB; min/max tinh bang byte */
    DATA_SIZE,
    /** danh sach cach nhau dau phay */
    STRING_LIST,
    ENUM
}
