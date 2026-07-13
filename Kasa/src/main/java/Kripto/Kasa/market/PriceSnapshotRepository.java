package Kripto.Kasa.market;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PriceSnapshotRepository extends JpaRepository<PriceSnapshot, Long> {
    List<PriceSnapshot> findTop50BySymbolOrderByCapturedAtDesc(String symbol);
}
