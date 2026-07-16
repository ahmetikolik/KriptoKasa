package Kripto.Kasa.market;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/market")
public class MarketController {
    private final MarketService marketService;

    public MarketController(MarketService marketService) {
        this.marketService = marketService;
    }

    @GetMapping("/prices")
    public List<MarketPrice> prices() {
        return marketService.getLatestPrices();
    }

    @GetMapping("/history/{symbol}")
    public List<PriceHistoryPoint> history(@PathVariable String symbol) {
        return marketService.getPriceHistory(symbol);
    }
}
