package org.example.filesharing.entities.dtos.appBootstrap;

import lombok.Data;
import org.example.filesharing.enums.auth.UserGrantedRole;

import java.util.List;
import java.util.Map;

@Data
public class UserAppBootstrap {
    private String email;
    private String publicUserName;
    private List<UserGrantedRole> userGrantedRoles;
    private Map<String, Object> metadata;
    private List<String> userPermissions;

    private String locale;
    private String theme;

    // phat trien phase 2 voi cong ty
    private String companyId;
    private String domain;
    private String companyName;
}
