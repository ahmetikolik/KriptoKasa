package Kripto.Kasa.portfolio;

import java.math.BigDecimal;
import java.util.List;

public record PortfolioResponse(
        BigDecimal fiatBalance,
        List<HoldingResponse> holdings,
        List<TransactionResponse> recentTransactions
) {
}
