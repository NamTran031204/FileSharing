package org.example.filesharing.configurations;

import lombok.RequiredArgsConstructor;
import com.file.service.filesharing.core.enums.auth.UserGrantedRole;
import org.example.filesharing.filters.JwtAuthenticationFilter;
import com.file.service.filesharing.core.setting.RuntimeSettings;
import com.file.service.filesharing.core.setting.SettingKey;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpMethod;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.DispatcherType;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;
    // ObjectProvider de context test khong co RuntimeSettings van dung duoc, mac dinh localhost:5173
    private final ObjectProvider<RuntimeSettings> runtimeSettings;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/auth/**"
                        ).permitAll()
                        // proof link cho khach khong tai khoan, tu kiem token trong service
                        .requestMatchers("/api/public/**").permitAll()

                        // cong phia: da dang nhap va khong co ROLE_USER; tung hanh dong do @PreAuthorize
                        .requestMatchers("/api/admin/**").access((authentication, ctx) -> {
                            Authentication a = authentication.get();
                            boolean adminSide = a != null && a.isAuthenticated()
                                    && !(a instanceof AnonymousAuthenticationToken)
                                    && a.getAuthorities().stream()
                                    .noneMatch(g -> UserGrantedRole.ROLE_USER.name().equals(g.getAuthority()));
                            return new AuthorizationDecision(adminSide);
                        })
                        .requestMatchers(
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/swagger-resources/**",
                                "/webjars/**"
                        ).permitAll()
                        .dispatcherTypeMatchers(DispatcherType.ASYNC).permitAll()
                        // API ban than cua tai khoan phia quan tri (TK 5.5): tai khoan do chi duoc doc/sua chinh minh
                        .requestMatchers(HttpMethod.GET, "/api/users").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/users/*").authenticated()
                        .anyRequest().hasAuthority(UserGrantedRole.ROLE_USER.name())
                )

                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                .authenticationProvider(authenticationProvider())

                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource() {
            // dung lai viec khop duong dan /api/**, nhung origin doc tu setting moi request
            @Override
            public CorsConfiguration getCorsConfiguration(HttpServletRequest request) {
                return super.getCorsConfiguration(request) == null ? null : buildCorsConfiguration();
            }
        };
        source.registerCorsConfiguration("/api/**", buildCorsConfiguration());
        return source;
    }

    private CorsConfiguration buildCorsConfiguration() {
        CorsConfiguration configuration = new CorsConfiguration();

        RuntimeSettings rs = runtimeSettings.getIfAvailable();
        configuration.setAllowedOrigins(rs == null
                ? List.of("http://localhost:5173")
                : rs.list(SettingKey.SECURITY_CORS_ALLOWED_ORIGINS));

        configuration.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"
        ));

        configuration.setAllowedHeaders(Arrays.asList(
                "Authorization",
                "Content-Type",
                "Accept",
                "Origin",
                "X-Requested-With",
                "X-Guest-Key"
        ));

        configuration.setExposedHeaders(Arrays.asList(
                "Authorization",
                "Content-Disposition"
        ));

        configuration.setAllowCredentials(true);

        configuration.setMaxAge(3600L);
        return configuration;
    }
}
