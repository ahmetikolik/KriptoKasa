package Kripto.Kasa.portfolio;

import java.math.BigDecimal;

public record HoldingResponse(
        String symbol,
        BigDecimal quantity
) {
    public static HoldingResponse from(Holding holding) {
        return new HoldingResponse(holding.getSymbol(), holding.getQuantity());
    }
}
