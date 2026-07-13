package Kripto.Kasa.auth;

import java.math.BigDecimal;

public record AuthResponse(
        Long userId,
        String email,
        String token,
        BigDecimal fiatBalance
) {
}
