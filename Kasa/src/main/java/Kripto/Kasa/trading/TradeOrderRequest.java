package Kripto.Kasa.trading;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record TradeOrderRequest(
        @NotBlank String symbol,
        @NotNull TradeType type,
        @NotNull @DecimalMin(value = "0.0000000001") BigDecimal quantity
) {
}
