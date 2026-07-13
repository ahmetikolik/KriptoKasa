package Kripto.Kasa.portfolio;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface HoldingRepository extends JpaRepository<Holding, Long> {
    List<Holding> findByUserIdOrderBySymbolAsc(Long userId);

    Optional<Holding> findByUserIdAndSymbol(Long userId, String symbol);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select h from Holding h where h.user.id = :userId and h.symbol = :symbol")
    Optional<Holding> findWithLockByUserIdAndSymbol(Long userId, String symbol);
}
