package Kripto.Kasa.market;

public record BinanceTickerResponse(
        String symbol,
        String lastPrice,
        String priceChangePercent
) {
}
