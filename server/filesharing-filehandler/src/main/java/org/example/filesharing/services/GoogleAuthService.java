package org.example.filesharing.services;

import org.example.filesharing.entities.dtos.auth.UserLoginResponseDto;

public interface GoogleAuthService {

    /**
     * @param credential   ID token JWT tu Google Identity Services
     * @param allowRegister true = goi tu /google/register (cho tao moi neu chua co), false = /google/login (khong tu tao)
     */
    UserLoginResponseDto authenticateWithGoogle(String credential, boolean allowRegister);
}
