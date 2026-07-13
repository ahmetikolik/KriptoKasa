package Kripto.Kasa.portfolio;

import Kripto.Kasa.trading.TradeTransaction;
import Kripto.Kasa.trading.TradeType;

import java.math.BigDecimal;
import java.time.Instant;

public record TransactionResponse(
        Long id,
        String symbol,
        TradeType type,
        BigDecimal quantity,
        BigDecimal executionPrice,
        BigDecimal totalAmount,
        Instant createdAt
) {
    public static TransactionResponse from(TradeTransaction transaction) {
        return new TransactionResponse(
                transaction.getId(),
                transaction.getSymbol(),
                transaction.getType(),
                transaction.getQuantity(),
                transaction.getExecutionPrice(),
                transaction.getTotalAmount(),
                transaction.getCreatedAt()
        );
    }
}
