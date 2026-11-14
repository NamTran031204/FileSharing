package org.example.filesharing.entities.dtos.access;

import com.file.service.filesharing.core.enums.access.AccessRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.filesharing.utils.access.AccessContext;
import org.example.filesharing.utils.access.AccessResolver;
import org.example.filesharing.utils.access.Action;

import java.util.Arrays;
import java.util.List;

/**
 * Quyen cua nguoi dang dang nhap tai tai nguyen (design 6.2). role = max(ownRole, vai tro qua link), null = khong co.
 * capabilities: cac Action can = true; REVIEW_DECIDE con can duoc chi dinh trong session.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MyAccessDTO {
    private AccessRole role;
    private AccessRole ownRole;
    private List<Action> capabilities;
    private List<AccessSourceDTO> sources;

    public static MyAccessDTO from(AccessContext ctx) {
        return MyAccessDTO.builder()
                .role(ctx.role())
                .ownRole(ctx.own())
                .capabilities(Arrays.stream(Action.values()).filter(a -> AccessResolver.can(ctx, a)).toList())
                .sources(ctx.sources().stream()
                        .map(s -> new AccessSourceDTO(s.type(), s.role(), s.folderId()))
                        .toList())
                .build();
    }
}
