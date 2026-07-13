package Kripto.Kasa.market;

import java.util.List;

public interface MarketDataProvider {
    List<MarketPrice> fetchLatestPrices();
}
