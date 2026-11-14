package org.example.filesharing.controllers;

import com.file.service.filesharing.core.entity.CommonResponse;
import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.dtos.access.AccessSettingsRequestDTO;
import org.example.filesharing.entities.dtos.access.GrantRequestDTO;
import org.example.filesharing.entities.dtos.access.GrantRoleRequestDTO;
import org.example.filesharing.entities.dtos.access.JoinLinkResponseDTO;
import org.example.filesharing.entities.dtos.access.LinkRequestDTO;
import org.example.filesharing.entities.dtos.access.LinkSettingsDTO;
import org.example.filesharing.entities.dtos.access.MentionUserDTO;
import org.example.filesharing.entities.dtos.access.PeopleResponseDTO;
import org.example.filesharing.entities.dtos.access.SharedFolderDTO;
import org.example.filesharing.services.AccessGrantService;
import org.example.filesharing.services.AccessQueryService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// type: project hoac folder
@RestController
@RequestMapping("api/access")
@RequiredArgsConstructor
public class AccessController {

    private final AccessGrantService accessGrantService;
    private final AccessQueryService accessQueryService;

    @GetMapping("/{type}/{id}/people")
    public CommonResponse<PeopleResponseDTO> getPeople(@PathVariable("type") String type,
                                                       @PathVariable("id") String id) {
        return CommonResponse.success(accessQueryService.getPeople(type, id));
    }

    // danh sach de mention, khong tra vai tro (Q7)
    @GetMapping("/{type}/{id}/mention-users")
    public CommonResponse<List<MentionUserDTO>> getUserMention(@PathVariable("type") String type,
                                                               @PathVariable("id") String id) {
        return CommonResponse.success(accessQueryService.getUserMention(type, id));
    }

    @GetMapping("/shared-with-me")
    public CommonResponse<List<SharedFolderDTO>> getSharedWithMe() {
        return CommonResponse.success(accessQueryService.getSharedWithMe());
    }

    @PostMapping("/{type}/{id}/grants")
    public CommonResponse<Void> addGrant(@PathVariable("type") String type,
                                         @PathVariable("id") String id,
                                         @RequestBody GrantRequestDTO request) {
        accessGrantService.addGrant(type, id, request);
        return CommonResponse.success();
    }

    @PutMapping("/{type}/{id}/grants/{userId}")
    public CommonResponse<Void> changeRole(@PathVariable("type") String type,
                                           @PathVariable("id") String id,
                                           @PathVariable("userId") String userId,
                                           @RequestBody GrantRoleRequestDTO request) {
        accessGrantService.changeRole(type, id, userId, request);
        return CommonResponse.success();
    }

    @DeleteMapping("/{type}/{id}/grants/{userId}")
    public CommonResponse<Void> removeGrant(@PathVariable("type") String type,
                                            @PathVariable("id") String id,
                                            @PathVariable("userId") String userId) {
        accessGrantService.removeGrant(type, id, userId);
        return CommonResponse.success();
    }

    @PutMapping("/{type}/{id}/settings")
    public CommonResponse<Void> updateSettings(@PathVariable("type") String type,
                                               @PathVariable("id") String id,
                                               @RequestBody AccessSettingsRequestDTO request) {
        accessGrantService.updateSettings(type, id, request);
        return CommonResponse.success();
    }

    // link chi o folder; tra token cho nguoi co MANAGE_ACCESS
    @PutMapping("/folder/{id}/link")
    public CommonResponse<LinkSettingsDTO> updateLink(@PathVariable("id") String id,
                                                      @RequestBody LinkRequestDTO request) {
        return CommonResponse.success(accessGrantService.updateLink(id, request));
    }

    @PostMapping("/link/{token}/join")
    public CommonResponse<JoinLinkResponseDTO> joinLink(@PathVariable("token") String token) {
        return CommonResponse.success(accessGrantService.joinLink(token));
    }
}
