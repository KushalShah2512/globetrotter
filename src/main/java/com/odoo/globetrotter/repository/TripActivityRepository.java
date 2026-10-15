package com.odoo.globetrotter.repository;

import com.odoo.globetrotter.model.TripActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TripActivityRepository extends JpaRepository<TripActivity, Long> {
    List<TripActivity> findByTripIdOrderByActivityDateAscSequenceOrderAsc(Long tripId);
    List<TripActivity> findByStopIdOrderByActivityDateAscSequenceOrderAsc(Long stopId);
    void deleteByTripId(Long tripId);
    void deleteByStopId(Long stopId);
}
