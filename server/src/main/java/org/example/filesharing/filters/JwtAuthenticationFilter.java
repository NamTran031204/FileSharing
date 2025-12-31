package org.example.filesharing.filters;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.example.filesharing.services.JwtService;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // bỏ Bearer -> lấy token
        final String jwt = authHeader.substring(7);

        // Extract username từ token
        final String userEmail = jwtService.extractUsername(jwt);

        // Kiểm tra:
        // 1. userEmail được extract thành công
        // 2. User chưa được authenticate (SecurityContext rỗng)
        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            // Load user từ database
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);

            // Validate token với user details
            if (jwtService.isTokenValid(jwt, userDetails)) {

                // Tạo Authentication object
                // UsernamePasswordAuthenticationToken là implementation của Authentication
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,                    // Principal (user info)
                        null,                           // Credentials (null vì đã authenticate qua JWT)
                        userDetails.getAuthorities()    // Authorities (roles/permissions)
                );

                // Thêm request details (IP, session ID, etc.)
                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );

                // Set Authentication vào SecurityContext
                // Từ đây, Spring Security biết user đã được authenticate
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // Continue với filter tiếp theo trong chain
        filterChain.doFilter(request, response);
    }
}
