package Kripto.Kasa.portfolio;

import Kripto.Kasa.common.BusinessException;
import Kripto.Kasa.trading.TradeTransactionRepository;
import Kripto.Kasa.wallet.Wallet;
import Kripto.Kasa.wallet.WalletRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PortfolioService {
    private final WalletRepository walletRepository;
    private final HoldingRepository holdingRepository;
    private final TradeTransactionRepository transactionRepository;

    public PortfolioService(
            WalletRepository walletRepository,
            HoldingRepository holdingRepository,
            TradeTransactionRepository transactionRepository
    ) {
        this.walletRepository = walletRepository;
        this.holdingRepository = holdingRepository;
        this.transactionRepository = transactionRepository;
    }

    @Transactional(readOnly = true)
    public PortfolioResponse getPortfolio(Long userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Wallet not found"));

        return new PortfolioResponse(
                wallet.getFiatBalance(),
                holdingRepository.findByUserIdOrderBySymbolAsc(userId)
                        .stream()
                        .map(HoldingResponse::from)
                        .toList(),
                transactionRepository.findTop20ByUserIdOrderByCreatedAtDesc(userId)
                        .stream()
                        .map(TransactionResponse::from)
                        .toList()
        );
    }
}
