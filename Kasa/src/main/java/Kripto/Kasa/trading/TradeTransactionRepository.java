package Kripto.Kasa.trading;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TradeTransactionRepository extends JpaRepository<TradeTransaction, Long> {
    List<TradeTransaction> findTop20ByUserIdOrderByCreatedAtDesc(Long userId);
}
