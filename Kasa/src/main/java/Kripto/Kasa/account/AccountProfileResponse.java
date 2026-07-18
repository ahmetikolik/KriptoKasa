package Kripto.Kasa.account;

import Kripto.Kasa.user.AppUser;

import java.time.Instant;

public record AccountProfileResponse(
        Long userId,
        String email,
        String displayName,
        String phoneNumber,
        Instant createdAt
) {
    public static AccountProfileResponse from(AppUser user) {
        return new AccountProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getPhoneNumber(),
                user.getCreatedAt()
        );
    }
}
