package org.example.filesharing.entities.dtos.folder;

import com.file.service.filesharing.core.entity.models.FolderEntity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.example.filesharing.entities.dtos.access.MyAccessDTO;

/** get-by-id folder: truong cua danh sach + myAccess (design 6.2). */
@Getter
@Setter
@NoArgsConstructor
public class FolderDetailDTO extends FolderListItemDTO {
    private MyAccessDTO myAccess;

    public static FolderDetailDTO of(FolderEntity folder, MyAccessDTO myAccess) {
        FolderDetailDTO dto = fill(new FolderDetailDTO(), folder, myAccess.getRole());
        dto.setMyAccess(myAccess);
        return dto;
    }
}
