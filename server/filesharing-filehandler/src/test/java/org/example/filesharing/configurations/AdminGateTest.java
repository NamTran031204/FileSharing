package org.example.filesharing.configurations;

import com.file.service.filesharing.core.enums.auth.UserGrantedRole;
import com.file.service.filesharing.core.exceptions.GlobalExceptionHandler;
import org.example.filesharing.entities.models.AdminRoleEntity;
import org.example.filesharing.entities.models.UserEntity;
import org.example.filesharing.repositories.AdminRoleRepo;
import org.example.filesharing.services.AdminPermissionResolver;
import org.example.filesharing.services.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

// controller gia chi de thu cong quyen; filter jwt va resolver that chay, chi service/repo bi mock
@WebMvcTest(controllers = AdminGateTest.StubController.class)
@Import({SecurityConfig.class, AdminGateTest.StubController.class, GlobalExceptionHandler.class,
        AdminPermissionResolver.class})
class AdminGateTest {

    @RestController
    static class StubController {
        // co y KHONG co @PreAuthorize: cong phia van phai chan user thuong
        @GetMapping("/api/admin/users")
        String users() {
            return "ok";
        }

        @GetMapping("/api/admin/denied")
        @PreAuthorize("denyAll()")
        String denied() {
            return "no";
        }

        @GetMapping("/api/admin/drain")
        @PreAuthorize("hasAuthority('Admin.Node.Drain')")
        String drain() {
            return "ok";
        }

        @GetMapping("/api/project")
        String project() {
            return "ok";
        }

        @GetMapping("/api/users")
        String me() {
            return "ok";
        }

        @PutMapping("/api/users/{id}")
        String updateMe() {
            return "ok";
        }
    }

    @Autowired
    MockMvc mvc;
    @MockBean
    JwtService jwtService;
    @MockBean
    UserDetailsService userDetailsService;
    @MockBean
    AdminRoleRepo adminRoleRepo;

    @BeforeEach
    void setUp() {
        when(jwtService.extractUsername("t")).thenReturn("u@test.com");
        when(jwtService.isTokenValid(any(), any())).thenReturn(true);
    }

    private void dangNhap(List<UserGrantedRole> roles, List<String> adminRoleIds) {
        UserEntity user = UserEntity.builder().email("u@test.com").enabled(true)
                .userGrantedRoles(roles).adminRoleIds(adminRoleIds).build();
        when(userDetailsService.loadUserByUsername("u@test.com")).thenReturn(user);
    }

    private int status(String path) throws Exception {
        return mvc.perform(get(path).header("Authorization", "Bearer t")).andReturn().getResponse().getStatus();
    }

    @Test
    void userThuong_admin403_duCoControllerQuenPreAuthorize() throws Exception {
        dangNhap(List.of(UserGrantedRole.ROLE_USER), null);
        assertEquals(403, status("/api/admin/users"));
    }

    @Test
    void userVuaCoRoleSa_failClosed403() throws Exception {
        dangNhap(List.of(UserGrantedRole.ROLE_USER, UserGrantedRole.ROLE_SA), null);
        assertEquals(403, status("/api/admin/users"));
    }

    @Test
    void phiaQuanTri_khongRoleUser_200() throws Exception {
        dangNhap(List.of(UserGrantedRole.ROLE_SA), null);
        assertEquals(200, status("/api/admin/users"));
        dangNhap(List.of(), List.of("r1"));
        assertEquals(200, status("/api/admin/users"));
    }

    @Test
    void phiaQuanTri_goiApiUser_403_tru_apiBanThan() throws Exception {
        dangNhap(List.of(UserGrantedRole.ROLE_SA), null);
        assertEquals(403, status("/api/project"));
        assertEquals(200, status("/api/users"));
        assertEquals(200, mvc.perform(put("/api/users/x").header("Authorization", "Bearer t"))
                .andReturn().getResponse().getStatus());
    }

    @Test
    void userThuong_goiApiUser_200() throws Exception {
        dangNhap(List.of(UserGrantedRole.ROLE_USER), null);
        assertEquals(200, status("/api/project"));
    }

    @Test
    void preAuthorizeBiTuChoi_403vaEnvelope() throws Exception {
        dangNhap(List.of(UserGrantedRole.ROLE_SA), null);
        var res = mvc.perform(get("/api/admin/denied").header("Authorization", "Bearer t"))
                .andReturn().getResponse();
        assertEquals(403, res.getStatus());
        assertTrue(res.getContentAsString().contains("\"isSuccessful\":false"), res.getContentAsString());
    }

    @Test
    void anDanh_401hoac403() throws Exception {
        int s = mvc.perform(get("/api/admin/users")).andReturn().getResponse().getStatus();
        assertTrue(s == 401 || s == 403, "status=" + s);
    }

    // AC-4 (BE): them quyen vao nhom co hieu luc o request ke tiep, cung token, khong cache
    @Test
    void themQuyenVaoNhom_hieuLucLanGoiSau_khongCanTokenMoi() throws Exception {
        dangNhap(List.of(), List.of("r1"));
        when(adminRoleRepo.findAllById(List.of("r1"))).thenReturn(List.of(
                AdminRoleEntity.builder().id("r1").permissions(List.of("Admin.Node.GetPaged")).build()));
        assertEquals(403, status("/api/admin/drain"));

        when(adminRoleRepo.findAllById(List.of("r1"))).thenReturn(List.of(
                AdminRoleEntity.builder().id("r1").permissions(List.of("Admin.Node.GetPaged", "Admin.Node.Drain")).build()));
        assertEquals(200, status("/api/admin/drain"));

        when(adminRoleRepo.findAllById(List.of("r1"))).thenReturn(List.of(
                AdminRoleEntity.builder().id("r1").permissions(List.of("Admin.Node.GetPaged")).build()));
        assertEquals(403, status("/api/admin/drain"));
    }
}
