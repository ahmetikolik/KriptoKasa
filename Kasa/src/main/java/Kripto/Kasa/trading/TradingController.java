package Kripto.Kasa.trading;

import Kripto.Kasa.auth.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/trades")
public class TradingController {
    private final AuthService authService;
    private final TradingService tradingService;

    public TradingController(AuthService authService, TradingService tradingService) {
        this.authService = authService;
        this.tradingService = tradingService;
    }

    @PostMapping
    public TradeResponse execute(
            @RequestHeader("Authorization") String authorizationHeader,
            @Valid @RequestBody TradeOrderRequest request
    ) {
        Long userId = authService.requireUserId(authorizationHeader);
        return tradingService.execute(userId, request);
    }
}
