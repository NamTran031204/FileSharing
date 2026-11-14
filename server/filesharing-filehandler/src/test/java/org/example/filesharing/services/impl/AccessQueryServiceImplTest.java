package org.example.filesharing.services.impl;

import com.file.service.filesharing.core.entity.models.FolderEntity;
import com.file.service.filesharing.core.entity.models.ProjectEntity;
import com.file.service.filesharing.core.entity.models.access.AccessGrant;
import com.file.service.filesharing.core.entity.models.access.LinkAccess;
import com.file.service.filesharing.core.entity.models.project.ProjectCollaborator;
import com.file.service.filesharing.core.enums.ProjectStatus;
import com.file.service.filesharing.core.enums.access.AccessRole;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import com.file.service.filesharing.core.exceptions.specException.UserBusinessException;
import org.example.filesharing.entities.dtos.access.MentionUserDTO;
import org.example.filesharing.entities.dtos.access.PeopleResponseDTO;
import org.example.filesharing.entities.dtos.access.SharedFolderDTO;
import org.example.filesharing.entities.models.UserEntity;
import org.example.filesharing.repositories.ProjectRepo;
import org.example.filesharing.repositories.UserRepo;
import org.example.filesharing.services.AccessService;
import org.example.filesharing.services.AuditService;
import org.example.filesharing.utils.access.AccessContext;
import org.example.filesharing.utils.access.Action;
import org.example.filesharing.utils.access.ResourceRef;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyIterable;
import static org.mockito.Mockito.*;

/** people, mention-users, shared-with-me (T16, Q7). */
class AccessQueryServiceImplTest {

    private static final String PX = "px";
    private static final String OWNER = "u-owner";
    private static final String MEMBER = "u-member";
    // K1 grant thuong o F1, K2 chi grant o F2 (anh em), G2 grant o F1a, L1 vao qua link F1
    private static final String K1 = "u-k1";
    private static final String K2 = "u-k2";
    private static final String G2 = "u-g2";
    private static final String L1 = "u-l1";
    private static final String ME = "u-me";

    private AccessService accessService;
    private ProjectRepo projectRepo;
    private UserRepo userRepo;
    private MongoTemplate mongoTemplate;
    private AuditService auditService;
    private AccessQueryServiceImpl service;

    private ProjectEntity project;
    private final Map<String, FolderEntity> folders = new HashMap<>();

    @BeforeEach
    void setUp() {
        accessService = mock(AccessService.class);
        projectRepo = mock(ProjectRepo.class);
        userRepo = mock(UserRepo.class);
        mongoTemplate = mock(MongoTemplate.class);
        auditService = mock(AuditService.class);
        service = new AccessQueryServiceImpl(accessService, projectRepo, userRepo, mongoTemplate, auditService);

        project = project(PX, OWNER, ProjectStatus.ACTIVE, MEMBER);
        when(projectRepo.findById(PX)).thenAnswer(inv -> Optional.of(project));

        FolderEntity f1 = folder("F1", null, grant(K1, AccessRole.COMMENTER), viaLink(L1));
        f1.setLink(LinkAccess.builder().token("tk").role(AccessRole.COMMENTER).allowDownload(false)
                .allowProofSelection(false).build());
        folder("F1a", "F1", grant(G2, AccessRole.VIEWER));
        folder("F2", null, grant(K2, AccessRole.COMMENTER));
        when(accessService.chain("F1")).thenAnswer(inv -> List.of(folders.get("F1")));
        when(accessService.chain("F1a")).thenAnswer(inv -> List.of(folders.get("F1"), folders.get("F1a")));

        when(userRepo.findAllById(anyIterable())).thenAnswer(inv -> {
            List<UserEntity> users = new ArrayList<>();
            for (Object id : (Iterable<?>) inv.getArgument(0)) {
                users.add(UserEntity.builder().userId((String) id).email(id + "@test.local").publicUserName("ten " + id).build());
            }
            return users;
        });
        when(auditService.getCurrentUserId()).thenReturn(ME);
    }

    // ---------- mention-users ----------

    @Test
    void mentionListsOwnerMembersAndChainGrantsOnly() {
        callerIs(ResourceRef.folder("F1a"), ctx(AccessRole.COMMENTER, AccessContext.SourceType.FOLDER));

        List<MentionUserDTO> users = service.getUserMention("folder", "F1a");

        assertEquals(Set.of(OWNER, MEMBER, K1, G2), users.stream().map(MentionUserDTO::getUserId).collect(Collectors.toSet()));
        assertEquals(4, users.size());
        assertEquals(OWNER + "@test.local", users.stream().filter(u -> OWNER.equals(u.getUserId())).findFirst().orElseThrow().getEmail());
        verify(accessService).require(ResourceRef.folder("F1a"), Action.VIEW_PEOPLE);
    }

    @Test
    void mentionAtSiblingFolderDoesNotLeakOtherGuests() {
        callerIs(ResourceRef.folder("F1"), ctx(AccessRole.COMMENTER, AccessContext.SourceType.FOLDER));

        List<String> ids = service.getUserMention("folder", "F1").stream().map(MentionUserDTO::getUserId).toList();

        assertFalse(ids.contains(K2));
        assertFalse(ids.contains(L1));
        assertFalse(ids.contains(G2));
    }

    @Test
    void mentionByLinkOnlyUserIsRejectedBeforeReadingUsers() {
        when(accessService.require(ResourceRef.folder("F1"), Action.VIEW_PEOPLE))
                .thenThrow(new FileBusinessException(ErrorCode.ACTION_NOT_ALLOWED));

        FileBusinessException e = assertThrows(FileBusinessException.class, () -> service.getUserMention("folder", "F1"));

        assertEquals(ErrorCode.ACTION_NOT_ALLOWED, e.getErrorCode());
        verify(userRepo, never()).findAllById(anyIterable());
    }

    @Test
    void mentionAtProjectListsOwnerAndMembers() {
        callerIs(ResourceRef.project(PX), ctx(AccessRole.VIEWER, AccessContext.SourceType.PROJECT));

        List<String> ids = service.getUserMention("project", PX).stream().map(MentionUserDTO::getUserId).toList();

        assertEquals(Set.of(OWNER, MEMBER), Set.copyOf(ids));
    }

    // ---------- people ----------

    @Test
    void peopleForNonMemberDropsProjectLayerAndHidesToken() {
        callerIs(ResourceRef.folder("F1a"), ctx(AccessRole.COMMENTER, AccessContext.SourceType.FOLDER));

        PeopleResponseDTO people = service.getPeople("folder", "F1a");

        assertEquals(List.of(G2), ids(people.getDirect()));
        assertEquals(List.of(K1), ids(people.getInherited()));
        assertEquals(AccessContext.SourceType.FOLDER, people.getInherited().get(0).getSource());
        assertEquals("F1", people.getInherited().get(0).getFolderId());
        assertEquals(List.of(L1), ids(people.getViaLink()));

        callerIs(ResourceRef.folder("F1"), ctx(AccessRole.COMMENTER, AccessContext.SourceType.FOLDER));
        PeopleResponseDTO atF1 = service.getPeople("folder", "F1");
        assertTrue(atF1.getLink().isEnabled());
        assertEquals(AccessRole.COMMENTER, atF1.getLink().getRole());
        assertNull(atF1.getLink().getToken());
    }

    @Test
    void peopleForManagerShowsProjectLayerAndToken() {
        callerIs(ResourceRef.folder("F1"), ctx(AccessRole.OWNER, AccessContext.SourceType.OWNER));

        PeopleResponseDTO people = service.getPeople("folder", "F1");

        assertEquals(List.of(K1), ids(people.getDirect()));
        assertEquals(Set.of(OWNER, MEMBER), Set.copyOf(ids(people.getInherited())));
        assertEquals("tk", people.getLink().getToken());
        verify(accessService).require(ResourceRef.folder("F1"), Action.VIEW_PEOPLE);
    }

    @Test
    void peopleOfProjectHasOnlyDirectMembers() {
        callerIs(ResourceRef.project(PX), ctx(AccessRole.VIEWER, AccessContext.SourceType.PROJECT));

        PeopleResponseDTO people = service.getPeople("project", PX);

        assertEquals(Set.of(OWNER, MEMBER), Set.copyOf(ids(people.getDirect())));
        assertTrue(people.getInherited().isEmpty());
        assertTrue(people.getViaLink().isEmpty());
        assertNull(people.getLink());
    }

    @Test
    void unknownTypeIsBadRequest() {
        assertThrows(UserBusinessException.class, () -> service.getPeople("asset", "a1"));
    }

    // ---------- shared-with-me ----------

    @Test
    void sharedWithMeKeepsOnlyUsableGrantsOutsideMyProjects() {
        ProjectEntity pa = project("pa", OWNER, ProjectStatus.ACTIVE);
        ProjectEntity pb = project("pb", OWNER, ProjectStatus.ACTIVE, ME);
        ProjectEntity pc = project("pc", OWNER, ProjectStatus.ARCHIVED);
        ProjectEntity pd = project("pd", OWNER, ProjectStatus.ACTIVE);
        pd.setIsActive(false);
        ProjectEntity pe = project("pe", ME, ProjectStatus.ACTIVE);

        FolderEntity fa = shared("FA", "pa", grant(ME, AccessRole.COMMENTER));
        FolderEntity fb = shared("FB", "pa", viaLink(ME));
        fb.setLink(LinkAccess.builder().token("x").role(AccessRole.VIEWER)
                .expiresAt(Instant.now().minus(1, ChronoUnit.HOURS)).build());
        FolderEntity fc = shared("FC", "pa", viaLink(ME));
        fc.setLink(LinkAccess.builder().token("y").role(AccessRole.COMMENTER).build());
        FolderEntity fcNull = shared("FC0", "pa", viaLink(ME));
        fcNull.setLink(LinkAccess.builder().token("z").role(null).allowProofSelection(true).build());
        FolderEntity fd = shared("FD", "pb", grant(ME, AccessRole.VIEWER));
        FolderEntity fe = shared("FE", "pc", grant(ME, AccessRole.VIEWER));
        FolderEntity ff = shared("FF", "pd", grant(ME, AccessRole.VIEWER));
        FolderEntity fg = shared("FG", "pe", grant(ME, AccessRole.VIEWER));
        when(mongoTemplate.find(any(Query.class), eq(FolderEntity.class)))
                .thenReturn(List.of(fa, fb, fc, fcNull, fd, fe, ff, fg));
        when(projectRepo.findAllById(anyIterable())).thenReturn(List.of(pa, pb, pc, pd, pe));

        List<SharedFolderDTO> shared = service.getSharedWithMe();

        assertEquals(List.of("FA", "FC"), shared.stream().map(SharedFolderDTO::getFolderId).sorted().toList());
        SharedFolderDTO viaLink = shared.stream().filter(s -> "FC".equals(s.getFolderId())).findFirst().orElseThrow();
        assertTrue(viaLink.isViaLink());
        assertEquals(AccessRole.COMMENTER, viaLink.getRole());
        ArgumentCaptor<Query> captor = ArgumentCaptor.forClass(Query.class);
        verify(mongoTemplate, times(1)).find(captor.capture(), eq(FolderEntity.class));
        assertEquals(ME, captor.getValue().getQueryObject().get("grants.userId"));
        assertEquals(true, captor.getValue().getQueryObject().get("isActive"));
        verify(projectRepo, times(1)).findAllById(anyIterable());
    }

    // ---------- helpers ----------

    private void callerIs(ResourceRef ref, AccessContext ctx) {
        when(accessService.require(ref, Action.VIEW_PEOPLE)).thenReturn(ctx);
    }

    private static AccessContext ctx(AccessRole own, AccessContext.SourceType source) {
        return new AccessContext(own, null, own, null, true, ProjectStatus.ACTIVE, false,
                List.of(new AccessContext.Source(source, own, null)));
    }

    private static List<String> ids(Collection<PeopleResponseDTO.Person> people) {
        return people.stream().map(PeopleResponseDTO.Person::getUserId).toList();
    }

    private static ProjectEntity project(String id, String owner, ProjectStatus status, String... members) {
        List<ProjectCollaborator> collaborators = new ArrayList<>();
        for (String m : members) {
            collaborators.add(ProjectCollaborator.builder().userId(m).role(AccessRole.VIEWER).build());
        }
        ProjectEntity p = ProjectEntity.builder().projectId(id).projectName("ten " + id).ownerId(owner).status(status)
                .collaborators(collaborators).build();
        p.setIsActive(true);
        return p;
    }

    private FolderEntity folder(String id, String parent, AccessGrant... grants) {
        FolderEntity f = FolderEntity.builder().folderId(id).projectId(PX).parentFolderId(parent).folderName("ten " + id)
                .grants(new ArrayList<>(List.of(grants))).build();
        f.setIsActive(true);
        f.setIsTrash(false);
        folders.put(id, f);
        return f;
    }

    private static FolderEntity shared(String id, String projectId, AccessGrant grant) {
        FolderEntity f = FolderEntity.builder().folderId(id).projectId(projectId).folderName("ten " + id)
                .grants(new ArrayList<>(List.of(grant))).build();
        f.setIsActive(true);
        f.setIsTrash(false);
        return f;
    }

    private static AccessGrant grant(String userId, AccessRole role) {
        return AccessGrant.builder().userId(userId).role(role).grantedAt(Instant.now()).build();
    }

    private static AccessGrant viaLink(String userId) {
        return AccessGrant.builder().userId(userId).viaLink(true).grantedAt(Instant.now()).build();
    }
}
