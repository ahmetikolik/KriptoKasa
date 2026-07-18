package Kripto.Kasa.auth;

import Kripto.Kasa.common.BusinessException;
import Kripto.Kasa.user.AppUser;
import Kripto.Kasa.user.AppUserRepository;
import Kripto.Kasa.wallet.Wallet;
import Kripto.Kasa.wallet.WalletRepository;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class AuthService {
    private static final String SESSION_PREFIX = "session:";

    private final AppUserRepository userRepository;
    private final WalletRepository walletRepository;
    private final PasswordEncoder passwordEncoder;
    private final StringRedisTemplate redisTemplate;
    private final AuthProperties authProperties;

    public AuthService(
            AppUserRepository userRepository,
            WalletRepository walletRepository,
            PasswordEncoder passwordEncoder,
            StringRedisTemplate redisTemplate,
            AuthProperties authProperties
    ) {
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
        this.passwordEncoder = passwordEncoder;
        this.redisTemplate = redisTemplate;
        this.authProperties = authProperties;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Email is already registered");
        }

        AppUser user = userRepository.save(new AppUser(email, passwordEncoder.encode(request.password())));
        BigDecimal initialBalance = randomInitialBalance();
        walletRepository.save(new Wallet(user, initialBalance));

        String token = createSession(user.getId());
        return new AuthResponse(user.getId(), user.getEmail(), token, initialBalance);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        AppUser user = userRepository.findByEmailIgnoreCase(normalizeEmail(request.email()))
                .orElseThrow(() -> new BusinessException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        Wallet wallet = walletRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR, "Wallet not found"));
        String token = createSession(user.getId());
        return new AuthResponse(user.getId(), user.getEmail(), token, wallet.getFiatBalance());
    }

    public Long requireUserId(String authorizationHeader) {
        String token = extractToken(authorizationHeader);
        String value = redisTemplate.opsForValue().get(SESSION_PREFIX + token);
        if (!StringUtils.hasText(value)) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "Invalid or expired session");
        }
        return Long.valueOf(value);
    }

    public void revokeSession(String authorizationHeader) {
        String token = extractToken(authorizationHeader);
        redisTemplate.delete(SESSION_PREFIX + token);
    }

    @Transactional(readOnly = true)
    public AppUser requireUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private String createSession(Long userId) {
        String token = UUID.randomUUID().toString();
        Duration ttl = Duration.ofMinutes(authProperties.getSessionTtlMinutes());
        redisTemplate.opsForValue().set(SESSION_PREFIX + token, userId.toString(), ttl);
        return token;
    }

    private String extractToken(String authorizationHeader) {
        if (!StringUtils.hasText(authorizationHeader)) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "Authorization header is required");
        }
        if (authorizationHeader.startsWith("Bearer ")) {
            return authorizationHeader.substring(7);
        }
        return authorizationHeader;
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private BigDecimal randomInitialBalance() {
        double amount = ThreadLocalRandom.current().nextDouble(1000, 10000);
        return BigDecimal.valueOf(amount).setScale(2, RoundingMode.HALF_UP);
    }
}
