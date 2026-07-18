package Kripto.Kasa.account;

import Kripto.Kasa.auth.AuthService;
import Kripto.Kasa.common.BusinessException;
import Kripto.Kasa.user.AppUser;
import Kripto.Kasa.user.AppUserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountService {
    private final AppUserRepository userRepository;
    private final AuthService authService;
    private final PasswordEncoder passwordEncoder;

    public AccountService(
            AppUserRepository userRepository,
            AuthService authService,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.authService = authService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public AccountProfileResponse profile(Long userId) {
        return AccountProfileResponse.from(authService.requireUser(userId));
    }

    @Transactional
    public AccountProfileResponse updateProfile(Long userId, UpdateAccountRequest request) {
        AppUser user = authService.requireUser(userId);
        user.setDisplayName(normalizeBlank(request.displayName()));
        user.setPhoneNumber(normalizeBlank(request.phoneNumber()));
        return AccountProfileResponse.from(user);
    }

    @Transactional
    public AccountProfileResponse changePassword(Long userId, ChangePasswordRequest request) {
        AppUser user = authService.requireUser(userId);
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }
        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "New password must be different");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        return AccountProfileResponse.from(user);
    }

    @Transactional
    public void deleteAccount(Long userId, DeleteAccountRequest request) {
        AppUser user = authService.requireUser(userId);
        if (!user.getEmail().equalsIgnoreCase(request.emailConfirmation())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Email confirmation does not match");
        }
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Password is incorrect");
        }
        userRepository.delete(user);
    }

    private String normalizeBlank(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
