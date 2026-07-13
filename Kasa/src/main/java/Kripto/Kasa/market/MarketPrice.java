package Kripto.Kasa.market;

import java.math.BigDecimal;
import java.time.Instant;

public record MarketPrice(
        String symbol,
        String pair,
        BigDecimal price,
        BigDecimal changePercent,
        Instant updatedAt
) {
}
