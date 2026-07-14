package Kripto.Kasa.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AiQueryRequest(
        @NotBlank
        @Size(max = 1000)
        String question
) {
}
