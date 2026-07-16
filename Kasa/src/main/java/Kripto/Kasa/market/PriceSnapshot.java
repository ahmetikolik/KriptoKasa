package Kripto.Kasa.market;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "price_snapshots")
public class PriceSnapshot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String symbol;

    @Column(nullable = false, length = 30)
    private String pair;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal price;

    @Column(name = "captured_at", nullable = false)
    private Instant capturedAt;

    protected PriceSnapshot() {
    }

    public PriceSnapshot(MarketPrice marketPrice) {
        this.symbol = marketPrice.symbol();
        this.pair = marketPrice.pair();
        this.price = marketPrice.price();
        this.capturedAt = marketPrice.updatedAt();
    }

    public String getSymbol() {
        return symbol;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public Instant getCapturedAt() {
        return capturedAt;
    }
}
