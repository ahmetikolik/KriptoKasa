package Kripto.Kasa.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "cryptopal.auth")
public class AuthProperties {
    private long sessionTtlMinutes = 1440;

    public long getSessionTtlMinutes() {
        return sessionTtlMinutes;
    }

    public void setSessionTtlMinutes(long sessionTtlMinutes) {
        this.sessionTtlMinutes = sessionTtlMinutes;
    }
}
