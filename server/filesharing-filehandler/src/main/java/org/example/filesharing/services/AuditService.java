package org.example.filesharing.services;

import org.example.filesharing.entities.models.UserEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class AuditService {

    public UserEntity getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }

        return (UserEntity) authentication.getPrincipal();
    }

    public String getCurrentUserId() {
        return getCurrentUser().getUserId();
    }

    public String getCurrentUserEmail() {
        return getCurrentUser().getEmail();
    }
}