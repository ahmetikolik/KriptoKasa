package Kripto.Kasa.account;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateAccountRequest(
        @Size(max = 120) String displayName,
        @Size(max = 32) @Pattern(regexp = "^[+0-9 ()-]*$", message = "must contain only phone characters") String phoneNumber
) {
}
