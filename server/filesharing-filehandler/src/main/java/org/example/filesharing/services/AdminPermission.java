package org.example.filesharing.services;

import lombok.Getter;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Catalogue permission quan tri (nguon chan ly, TK 4.2). permissionName = "Admin.<Resource>.<Action>".
 * Them/bot permission chi can sua enum nay; chuoi la trong DB bi bo qua boi AdminPermissionResolver.
 */
@Getter
public enum AdminPermission {
    USER_GET_PAGED("Admin.User.GetPaged", "AccountAndRole", "User", "GetPaged"),
    USER_GET_DETAIL("Admin.User.GetDetail", "AccountAndRole", "User", "GetDetail"),
    USER_CREATE("Admin.User.Create", "AccountAndRole", "User", "Create"),
    USER_LOCK("Admin.User.Lock", "AccountAndRole", "User", "Lock"),
    USER_REVOKE_SESSION("Admin.User.RevokeSession", "AccountAndRole", "User", "RevokeSession"),
    USER_ASSIGN_ROLE("Admin.User.AssignRole", "AccountAndRole", "User", "AssignRole"),

    ROLE_GET_PAGED("Admin.Role.GetPaged", "AccountAndRole", "Role", "GetPaged"),
    ROLE_GET_DETAIL("Admin.Role.GetDetail", "AccountAndRole", "Role", "GetDetail"),
    ROLE_CREATE("Admin.Role.Create", "AccountAndRole", "Role", "Create"),
    ROLE_UPDATE("Admin.Role.Update", "AccountAndRole", "Role", "Update"),
    ROLE_DELETE("Admin.Role.Delete", "AccountAndRole", "Role", "Delete"),

    SETTING_GET_PAGED("Admin.Setting.GetPaged", "System", "Setting", "GetPaged"),
    SETTING_UPDATE("Admin.Setting.Update", "System", "Setting", "Update"),
    SETTING_TEST_MAIL("Admin.Setting.TestMail", "System", "Setting", "TestMail"),

    EMAIL_TEMPLATE_GET_PAGED("Admin.EmailTemplate.GetPaged", "System", "EmailTemplate", "GetPaged"),
    EMAIL_TEMPLATE_UPDATE("Admin.EmailTemplate.Update", "System", "EmailTemplate", "Update"),
    EMAIL_TEMPLATE_PREVIEW("Admin.EmailTemplate.Preview", "System", "EmailTemplate", "Preview"),
    EMAIL_TEMPLATE_SEND_TEST("Admin.EmailTemplate.SendTest", "System", "EmailTemplate", "SendTest"),

    NODE_GET_PAGED("Admin.Node.GetPaged", "System", "Node", "GetPaged"),
    NODE_DRAIN("Admin.Node.Drain", "System", "Node", "Drain");

    private final String permissionName;
    private final String group;
    private final String resource;
    private final String action;

    AdminPermission(String permissionName, String group, String resource, String action) {
        this.permissionName = permissionName;
        this.group = group;
        this.resource = resource;
        this.action = action;
    }

    /** Toan bo ten permission trong catalogue. */
    public static Set<String> allNames() {
        return Arrays.stream(values()).map(AdminPermission::getPermissionName)
                .collect(Collectors.toUnmodifiableSet());
    }
}
