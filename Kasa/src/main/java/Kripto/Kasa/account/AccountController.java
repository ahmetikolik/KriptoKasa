package Kripto.Kasa.account;

import Kripto.Kasa.auth.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/account")
public class AccountController {
    private final AuthService authService;
    private final AccountService accountService;

    public AccountController(AuthService authService, AccountService accountService) {
        this.authService = authService;
        this.accountService = accountService;
    }

    @GetMapping("/me")
    public AccountProfileResponse me(@RequestHeader("Authorization") String authorizationHeader) {
        Long userId = authService.requireUserId(authorizationHeader);
        return accountService.profile(userId);
    }

    @PutMapping("/me")
    public AccountProfileResponse update(
            @RequestHeader("Authorization") String authorizationHeader,
            @Valid @RequestBody UpdateAccountRequest request
    ) {
        Long userId = authService.requireUserId(authorizationHeader);
        return accountService.updateProfile(userId, request);
    }

    @PutMapping("/password")
    public AccountProfileResponse changePassword(
            @RequestHeader("Authorization") String authorizationHeader,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        Long userId = authService.requireUserId(authorizationHeader);
        return accountService.changePassword(userId, request);
    }

    @DeleteMapping("/me")
    public void delete(
            @RequestHeader("Authorization") String authorizationHeader,
            @Valid @RequestBody DeleteAccountRequest request
    ) {
        Long userId = authService.requireUserId(authorizationHeader);
        accountService.deleteAccount(userId, request);
        authService.revokeSession(authorizationHeader);
    }
}
