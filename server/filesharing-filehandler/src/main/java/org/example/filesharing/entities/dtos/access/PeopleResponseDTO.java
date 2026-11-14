package org.example.filesharing.entities.dtos.access;

import com.file.service.filesharing.core.enums.access.AccessRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.filesharing.utils.access.AccessContext;

import java.util.List;

/**
 * 3 lop quyen tai project/folder (design 3.7): link, truc tiep, ke thua kem nguon, nhom vao qua link.
 * link chi co o folder; token chi tra cho nguoi co MANAGE_ACCESS.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PeopleResponseDTO {
    private LinkSettingsDTO link;
    private List<Person> direct;
    private List<Person> inherited;
    private List<Person> viaLink;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Person {
        private String userId;
        private String publicUserName;
        private String email;
        private AccessRole role;
        // OWNER, PROJECT, FOLDER hoac LINK; folderId/folderName chi co voi FOLDER va LINK
        private AccessContext.SourceType source;
        private String folderId;
        private String folderName;
    }
}
