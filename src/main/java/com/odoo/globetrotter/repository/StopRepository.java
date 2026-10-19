package com.odoo.globetrotter.repository;

import com.odoo.globetrotter.model.Stop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StopRepository extends JpaRepository<Stop, Long> {
    List<Stop> findByTripIdOrderBySequenceOrderAsc(Long tripId);
    void deleteByTripId(Long tripId);
}
