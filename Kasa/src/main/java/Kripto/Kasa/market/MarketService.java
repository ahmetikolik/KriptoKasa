package Kripto.Kasa.market;

import Kripto.Kasa.common.BusinessException;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class MarketService {
    private static final String PRICE_PREFIX = "price:";
    private static final String CHANGE_PREFIX = "price-change-percent:";
    private static final String UPDATED_AT_PREFIX = "price-updated-at:";

    private final MarketDataProvider marketDataProvider;
    private final PriceSnapshotRepository priceSnapshotRepository;
    private final StringRedisTemplate redisTemplate;

    public MarketService(
            MarketDataProvider marketDataProvider,
            PriceSnapshotRepository priceSnapshotRepository,
            StringRedisTemplate redisTemplate
    ) {
        this.marketDataProvider = marketDataProvider;
        this.priceSnapshotRepository = priceSnapshotRepository;
        this.redisTemplate = redisTemplate;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void loadInitialPrices() {
        refreshPricesSafely();
    }

    @Scheduled(fixedDelayString = "${cryptopal.market.refresh-interval-ms}")
    public void scheduledRefresh() {
        refreshPricesSafely();
    }

    public List<MarketPrice> getLatestPrices() {
        List<MarketPrice> prices = cachedPrices();
        if (!prices.isEmpty()) {
            return prices;
        }

        refreshPricesSafely();
        prices = cachedPrices();
        if (prices.isEmpty()) {
            throw new BusinessException(HttpStatus.SERVICE_UNAVAILABLE, "Market prices are not available yet");
        }
        return prices;
    }

    public BigDecimal getLatestPrice(String symbol) {
        String normalizedSymbol = normalizeSymbol(symbol);
        String value = redisTemplate.opsForValue().get(PRICE_PREFIX + normalizedSymbol);
        if (value == null) {
            refreshPricesSafely();
            value = redisTemplate.opsForValue().get(PRICE_PREFIX + normalizedSymbol);
        }
        if (value == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Unsupported or unavailable symbol: " + symbol);
        }
        return new BigDecimal(value);
    }

    public List<PriceHistoryPoint> getPriceHistory(String symbol) {
        String normalizedSymbol = normalizeSymbol(symbol);
        List<PriceSnapshot> snapshots = priceSnapshotRepository
                .findTop50BySymbolOrderByCapturedAtDesc(normalizedSymbol);

        if (snapshots.isEmpty()) {
            refreshPricesSafely();
            snapshots = priceSnapshotRepository.findTop50BySymbolOrderByCapturedAtDesc(normalizedSymbol);
        }

        List<PriceSnapshot> chronologicalSnapshots = new ArrayList<>(snapshots);
        Collections.reverse(chronologicalSnapshots);
        return chronologicalSnapshots.stream()
                .map(snapshot -> new PriceHistoryPoint(
                        snapshot.getSymbol(),
                        snapshot.getPrice(),
                        snapshot.getCapturedAt()
                ))
                .toList();
    }

    @Transactional
    public void refreshPrices() {
        List<MarketPrice> latestPrices = marketDataProvider.fetchLatestPrices();
        for (MarketPrice price : latestPrices) {
            redisTemplate.opsForValue().set(PRICE_PREFIX + price.symbol(), price.price().toPlainString());
            redisTemplate.opsForValue().set(CHANGE_PREFIX + price.symbol(), price.changePercent().toPlainString());
            redisTemplate.opsForValue().set(UPDATED_AT_PREFIX + price.symbol(), price.updatedAt().toString());
            priceSnapshotRepository.save(new PriceSnapshot(price));
        }
    }

    private void refreshPricesSafely() {
        try {
            refreshPrices();
        } catch (Exception ignored) {
            // Market refresh failures should not stop authentication or trading endpoints from starting.
        }
    }

    private List<MarketPrice> cachedPrices() {
        Set<String> keys = redisTemplate.keys(PRICE_PREFIX + "*");
        if (keys == null) {
            return Collections.emptyList();
        }
        return keys
                .stream()
                .sorted()
                .map(key -> key.substring(PRICE_PREFIX.length()))
                .map(this::toCachedPrice)
                .toList();
    }

    private MarketPrice toCachedPrice(String symbol) {
        String price = redisTemplate.opsForValue().get(PRICE_PREFIX + symbol);
        String changePercent = redisTemplate.opsForValue().get(CHANGE_PREFIX + symbol);
        String updatedAt = redisTemplate.opsForValue().get(UPDATED_AT_PREFIX + symbol);
        Instant instant = updatedAt == null ? Instant.now() : Instant.parse(updatedAt);
        return new MarketPrice(
                symbol,
                symbol + "USDT",
                new BigDecimal(price),
                new BigDecimal(changePercent == null ? "0" : changePercent),
                instant
        );
    }

    private String normalizeSymbol(String symbol) {
        return symbol.trim().toUpperCase(Locale.ROOT).replace("USDT", "");
    }
}
