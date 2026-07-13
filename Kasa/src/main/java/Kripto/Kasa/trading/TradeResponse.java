package Kripto.Kasa.trading;

import java.math.BigDecimal;
import java.time.Instant;

public record TradeResponse(
        Long transactionId,
        String symbol,
        TradeType type,
        BigDecimal quantity,
        BigDecimal executionPrice,
        BigDecimal totalAmount,
        BigDecimal fiatBalance,
        Instant createdAt
) {
    public static TradeResponse from(TradeTransaction transaction, BigDecimal fiatBalance) {
        return new TradeResponse(
                transaction.getId(),
                transaction.getSymbol(),
                transaction.getType(),
                transaction.getQuantity(),
                transaction.getExecutionPrice(),
                transaction.getTotalAmount(),
                fiatBalance,
                transaction.getCreatedAt()
        );
    }
}
