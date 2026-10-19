package com.odoo.globetrotter.repository;

import com.odoo.globetrotter.model.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {
    List<Trip> findByUserId(Long userId);
    List<Trip> findByIsPublicTrue();
    List<Trip> findByUserIdAndIsPublicTrue(Long userId);
    long countByIsPublicTrue();
}
