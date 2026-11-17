package org.example.filesharing.configurations;

import com.file.service.filesharing.core.enums.auth.UserGrantedRole;
import org.example.filesharing.entities.models.UserEntity;
import org.example.filesharing.services.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

// controller gia chi de thu cong quyen, filter jwt that chay voi service mock
@WebMvcTest(controllers = AdminGateTest.StubAdminController.class)
@Import({SecurityConfig.class, AdminGateTest.StubAdminController.class})
class AdminGateTest {

    @RestController
    static class StubAdminController {
        @GetMapping("/api/admin/users")
        String users() {
            return "ok";
        }
    }

    @Autowired
    MockMvc mvc;
    @MockBean
    JwtService jwtService;
    @MockBean
    UserDetailsService userDetailsService;

    @BeforeEach
    void setUp() {
        when(jwtService.extractUsername("t")).thenReturn("u@test.com");
        when(jwtService.isTokenValid(any(), any())).thenReturn(true);
    }

    private int statusVoiRole(UserGrantedRole role) throws Exception {
        UserEntity user = UserEntity.builder().email("u@test.com").enabled(true)
                .userGrantedRoles(List.of(UserGrantedRole.ROLE_USER, role)).build();
        when(userDetailsService.loadUserByUsername("u@test.com")).thenReturn(user);
        return mvc.perform(get("/api/admin/users").header("Authorization", "Bearer t"))
                .andReturn().getResponse().getStatus();
    }

    @Test
    void roleAdmin_403() throws Exception {
        assertEquals(403, statusVoiRole(UserGrantedRole.ROLE_ADMIN));
    }

    @Test
    void roleSa_khong403() throws Exception {
        assertEquals(200, statusVoiRole(UserGrantedRole.ROLE_SA));
    }

    @Test
    void anDanh_401hoac403() throws Exception {
        int s = mvc.perform(get("/api/admin/users")).andReturn().getResponse().getStatus();
        assertTrue(s == 401 || s == 403, "status=" + s);
    }
}
