package Kripto.Kasa.account;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record DeleteAccountRequest(
        @NotBlank @Email String emailConfirmation,
        @NotBlank String password
) {
}
