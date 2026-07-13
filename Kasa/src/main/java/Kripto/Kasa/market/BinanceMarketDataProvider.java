package Kripto.Kasa.market;

import Kripto.Kasa.common.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.Objects;
import java.util.List;
import java.util.Locale;

public class BinanceMarketDataProvider implements MarketDataProvider {
    private final WebClient marketWebClient;
    private final MarketProperties properties;

    public BinanceMarketDataProvider(WebClient marketWebClient, MarketProperties properties) {
        this.marketWebClient = marketWebClient;
        this.properties = properties;
    }

    @Override
    public List<MarketPrice> fetchLatestPrices() {
        return properties.getSymbols()
                .stream()
                .map(this::fetchPrice)
                .filter(Objects::nonNull)
                .toList();
    }

    private MarketPrice fetchPrice(String pair) {
        String normalizedPair = pair.trim().toUpperCase(Locale.ROOT);
        BinanceTickerResponse response;
        try {
            response = marketWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/v3/ticker/24hr")
                            .queryParam("symbol", normalizedPair)
                            .build())
                    .retrieve()
                    .bodyToMono(BinanceTickerResponse.class)
                    .block(Duration.ofSeconds(5));
        } catch (Exception ignored) {
            return null;
        }

        if (response == null || response.lastPrice() == null) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY, "Market provider returned an empty price");
        }

        return new MarketPrice(
                toAssetSymbol(response.symbol()),
                response.symbol(),
                new BigDecimal(response.lastPrice()),
                new BigDecimal(response.priceChangePercent()),
                Instant.now()
        );
    }

    private String toAssetSymbol(String pair) {
        if (pair.endsWith("USDT")) {
            return pair.substring(0, pair.length() - 4);
        }
        return pair;
    }
}
