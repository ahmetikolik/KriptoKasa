package Kripto.Kasa.market;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Component
public class CoinGeckoMarketDataProvider implements MarketDataProvider {
    private static final ParameterizedTypeReference<Map<String, Map<String, BigDecimal>>> PRICE_RESPONSE_TYPE =
            new ParameterizedTypeReference<>() {
            };

    private static final Map<String, String> COIN_IDS = Map.ofEntries(
            Map.entry("BTC", "bitcoin"),
            Map.entry("ETH", "ethereum"),
            Map.entry("BNB", "binancecoin"),
            Map.entry("SOL", "solana"),
            Map.entry("XRP", "ripple"),
            Map.entry("ADA", "cardano"),
            Map.entry("DOGE", "dogecoin"),
            Map.entry("AVAX", "avalanche-2"),
            Map.entry("DOT", "polkadot"),
            Map.entry("LINK", "chainlink"),
            Map.entry("TRX", "tron"),
            Map.entry("LTC", "litecoin"),
            Map.entry("BCH", "bitcoin-cash"),
            Map.entry("ATOM", "cosmos"),
            Map.entry("UNI", "uniswap"),
            Map.entry("ETC", "ethereum-classic"),
            Map.entry("FIL", "filecoin"),
            Map.entry("APT", "aptos"),
            Map.entry("ARB", "arbitrum"),
            Map.entry("NEAR", "near")
    );

    private final WebClient marketWebClient;
    private final MarketProperties properties;

    public CoinGeckoMarketDataProvider(WebClient marketWebClient, MarketProperties properties) {
        this.marketWebClient = marketWebClient;
        this.properties = properties;
    }

    @Override
    public List<MarketPrice> fetchLatestPrices() {
        Map<String, String> symbolsToIds = configuredSymbols();
        String ids = String.join(",", symbolsToIds.values());
        Map<String, Map<String, BigDecimal>> response = marketWebClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/api/v3/simple/price")
                        .queryParam("ids", ids)
                        .queryParam("vs_currencies", "usd")
                        .queryParam("include_24hr_change", "true")
                        .build())
                .retrieve()
                .bodyToMono(PRICE_RESPONSE_TYPE)
                .block(Duration.ofSeconds(10));

        Instant updatedAt = Instant.now();
        return symbolsToIds.entrySet()
                .stream()
                .filter(entry -> response != null && response.containsKey(entry.getValue()))
                .map(entry -> toMarketPrice(entry.getKey(), entry.getValue(), response.get(entry.getValue()), updatedAt))
                .toList();
    }

    private MarketPrice toMarketPrice(String symbol, String coinId, Map<String, BigDecimal> values, Instant updatedAt) {
        BigDecimal price = values.getOrDefault("usd", BigDecimal.ZERO);
        BigDecimal changePercent = values.getOrDefault("usd_24h_change", BigDecimal.ZERO);

        return new MarketPrice(symbol, coinId, price, changePercent, updatedAt);
    }

    private Map<String, String> configuredSymbols() {
        Map<String, String> symbolsToIds = new LinkedHashMap<>();
        for (String pair : properties.getSymbols()) {
            String symbol = toAssetSymbol(pair);
            String coinId = COIN_IDS.get(symbol);
            if (coinId != null) {
                symbolsToIds.put(symbol, coinId);
            }
        }
        return symbolsToIds;
    }

    private String toAssetSymbol(String pair) {
        String normalized = pair.trim().toUpperCase(Locale.ROOT);
        if (normalized.endsWith("USDT")) {
            return normalized.substring(0, normalized.length() - 4);
        }
        return normalized;
    }
}
