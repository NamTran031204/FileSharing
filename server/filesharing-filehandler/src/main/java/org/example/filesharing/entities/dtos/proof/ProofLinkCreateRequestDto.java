package org.example.filesharing.entities.dtos.proof;

import com.file.service.filesharing.core.enums.ShareTokenTime;
import lombok.Data;

@Data
public class ProofLinkCreateRequestDto {
    // null = khong gioi han
    private ShareTokenTime rangeTime;
}
