package Kripto.Kasa.portfolio;

import Kripto.Kasa.user.AppUser;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.math.BigDecimal;

@Entity
@Table(
        name = "holdings",
        uniqueConstraints = @UniqueConstraint(name = "uk_holdings_user_symbol", columnNames = {"user_id", "symbol"})
)
public class Holding {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Column(nullable = false, length = 20)
    private String symbol;

    @Column(nullable = false, precision = 28, scale = 10)
    private BigDecimal quantity = BigDecimal.ZERO;

    protected Holding() {
    }

    public Holding(AppUser user, String symbol) {
        this.user = user;
        this.symbol = symbol;
    }

    public Long getId() {
        return id;
    }

    public AppUser getUser() {
        return user;
    }

    public String getSymbol() {
        return symbol;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void add(BigDecimal amount) {
        quantity = quantity.add(amount);
    }

    public void subtract(BigDecimal amount) {
        quantity = quantity.subtract(amount);
    }
}
