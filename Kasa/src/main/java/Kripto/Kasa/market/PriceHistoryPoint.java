package Kripto.Kasa.market;

import java.math.BigDecimal;
import java.time.Instant;

public record PriceHistoryPoint(
        String symbol,
        BigDecimal price,
        Instant capturedAt
) {
}
