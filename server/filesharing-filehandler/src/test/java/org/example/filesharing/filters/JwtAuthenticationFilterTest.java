package org.example.filesharing.filters;

import jakarta.servlet.FilterChain;
import org.example.filesharing.entities.models.UserEntity;
import org.example.filesharing.services.JwtService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;

import java.time.Instant;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class JwtAuthenticationFilterTest {

    private static final String EMAIL = "u@test.com";
    private static final Instant MOC = Instant.parse("2026-01-01T00:00:10Z");

    private JwtService jwtService;
    private UserDetailsService userDetailsService;
    private JwtAuthenticationFilter filter;
    private UserEntity user;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        jwtService = mock(JwtService.class);
        userDetailsService = mock(UserDetailsService.class);
        filter = new JwtAuthenticationFilter(jwtService, userDetailsService);
        user = UserEntity.builder().email(EMAIL).enabled(true).userGrantedRoles(new java.util.ArrayList<>()).build();
        when(jwtService.extractUsername("t")).thenReturn(EMAIL);
        when(jwtService.isTokenValid(any(), any())).thenReturn(true);
        when(userDetailsService.loadUserByUsername(EMAIL)).thenReturn(user);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void run(Date iat) throws Exception {
        when(jwtService.extractIssuedAt("t")).thenReturn(iat);
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader("Authorization", "Bearer t");
        FilterChain chain = mock(FilterChain.class);
        filter.doFilter(req, new MockHttpServletResponse(), chain);
        // chain luon duoc goi, quyet dinh nam o authentication
        verify(chain).doFilter(any(), any());
    }

    @Test
    void userDisabled_khongAuthenticated() throws Exception {
        user.setEnabled(false);
        run(new Date(MOC.plusSeconds(100).toEpochMilli()));
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void iatTruocMoc_khongAuthenticated() throws Exception {
        user.setSessionsValidAfter(MOC);
        run(new Date(MOC.minusSeconds(1).toEpochMilli()));
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void iatSauMoc_authenticated() throws Exception {
        user.setSessionsValidAfter(MOC);
        run(new Date(MOC.plusSeconds(1).toEpochMilli()));
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void iatCungGiayVoiMoc_catVeGiayNenHopLe() throws Exception {
        user.setSessionsValidAfter(MOC);
        run(new Date(MOC.toEpochMilli() + 500));
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void sessionsValidAfterNull_tokenCuVanChay() throws Exception {
        run(null);
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void thieuIatNhungCoMoc_tuChoi() throws Exception {
        user.setSessionsValidAfter(MOC);
        run(null);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }
}
