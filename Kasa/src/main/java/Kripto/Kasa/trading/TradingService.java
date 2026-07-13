package Kripto.Kasa.trading;

import Kripto.Kasa.auth.AuthService;
import Kripto.Kasa.common.BusinessException;
import Kripto.Kasa.market.MarketService;
import Kripto.Kasa.portfolio.Holding;
import Kripto.Kasa.portfolio.HoldingRepository;
import Kripto.Kasa.user.AppUser;
import Kripto.Kasa.wallet.Wallet;
import Kripto.Kasa.wallet.WalletRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Locale;

@Service
public class TradingService {
    private final AuthService authService;
    private final MarketService marketService;
    private final WalletRepository walletRepository;
    private final HoldingRepository holdingRepository;
    private final TradeTransactionRepository transactionRepository;

    public TradingService(
            AuthService authService,
            MarketService marketService,
            WalletRepository walletRepository,
            HoldingRepository holdingRepository,
            TradeTransactionRepository transactionRepository
    ) {
        this.authService = authService;
        this.marketService = marketService;
        this.walletRepository = walletRepository;
        this.holdingRepository = holdingRepository;
        this.transactionRepository = transactionRepository;
    }

    @Transactional
    public TradeResponse execute(Long userId, TradeOrderRequest request) {
        AppUser user = authService.requireUser(userId);
        String symbol = normalizeSymbol(request.symbol());
        BigDecimal quantity = request.quantity();
        BigDecimal executionPrice = marketService.getLatestPrice(symbol);
        BigDecimal totalAmount = executionPrice.multiply(quantity).setScale(2, RoundingMode.HALF_UP);
        Wallet wallet = walletRepository.findWithLockByUserId(userId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Wallet not found"));

        TradeTransaction transaction = switch (request.type()) {
            case BUY -> buy(user, wallet, symbol, quantity, executionPrice, totalAmount);
            case SELL -> sell(user, wallet, symbol, quantity, executionPrice, totalAmount);
        };

        return TradeResponse.from(transaction, wallet.getFiatBalance());
    }

    private TradeTransaction buy(
            AppUser user,
            Wallet wallet,
            String symbol,
            BigDecimal quantity,
            BigDecimal executionPrice,
            BigDecimal totalAmount
    ) {
        if (wallet.getFiatBalance().compareTo(totalAmount) < 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Insufficient funds to complete this trade");
        }

        Holding holding = holdingRepository.findWithLockByUserIdAndSymbol(user.getId(), symbol)
                .orElseGet(() -> new Holding(user, symbol));
        wallet.debit(totalAmount);
        holding.add(quantity);
        holdingRepository.save(holding);

        return transactionRepository.save(new TradeTransaction(
                user,
                symbol,
                TradeType.BUY,
                quantity,
                executionPrice,
                totalAmount
        ));
    }

    private TradeTransaction sell(
            AppUser user,
            Wallet wallet,
            String symbol,
            BigDecimal quantity,
            BigDecimal executionPrice,
            BigDecimal totalAmount
    ) {
        Holding holding = holdingRepository.findWithLockByUserIdAndSymbol(user.getId(), symbol)
                .orElseThrow(() -> new BusinessException(HttpStatus.BAD_REQUEST, "You do not hold this asset"));

        if (holding.getQuantity().compareTo(quantity) < 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Insufficient asset balance to complete this trade");
        }

        holding.subtract(quantity);
        wallet.credit(totalAmount);

        return transactionRepository.save(new TradeTransaction(
                user,
                symbol,
                TradeType.SELL,
                quantity,
                executionPrice,
                totalAmount
        ));
    }

    private String normalizeSymbol(String symbol) {
        return symbol.trim().toUpperCase(Locale.ROOT).replace("USDT", "");
    }
}
