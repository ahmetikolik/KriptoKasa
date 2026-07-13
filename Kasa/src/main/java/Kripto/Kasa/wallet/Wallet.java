package Kripto.Kasa.wallet;

import Kripto.Kasa.user.AppUser;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "wallets")
public class Wallet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private AppUser user;

    @Column(name = "fiat_balance", nullable = false, precision = 19, scale = 2)
    private BigDecimal fiatBalance;

    protected Wallet() {
    }

    public Wallet(AppUser user, BigDecimal fiatBalance) {
        this.user = user;
        this.fiatBalance = fiatBalance;
    }

    public Long getId() {
        return id;
    }

    public AppUser getUser() {
        return user;
    }

    public BigDecimal getFiatBalance() {
        return fiatBalance;
    }

    public void debit(BigDecimal amount) {
        fiatBalance = fiatBalance.subtract(amount);
    }

    public void credit(BigDecimal amount) {
        fiatBalance = fiatBalance.add(amount);
    }
}
