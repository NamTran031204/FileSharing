package org.example.filesharing.services;

import org.example.filesharing.entities.dtos.access.MentionUserDTO;
import org.example.filesharing.entities.dtos.access.PeopleResponseDTO;
import org.example.filesharing.entities.dtos.access.SharedFolderDTO;

import java.util.List;

/** Doc quyen: danh sach nguoi, danh sach mention, "Duoc chia se voi toi". type la "project" hoac "folder". */
public interface AccessQueryService {

    /** VIEW_PEOPLE; nguoi goi khong la thanh vien project thi bo lop ke thua tu project (Q7). */
    PeopleResponseDTO getPeople(String type, String id);

    /** VIEW_PEOPLE; owner, thanh vien project, grant thuong tren chain, khong gom nguoi vao qua link. */
    List<MentionUserDTO> getUserMention(String type, String id);

    List<SharedFolderDTO> getSharedWithMe();
}
