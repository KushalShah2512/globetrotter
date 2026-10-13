package com.odoo.globetrotter.repository;

import com.odoo.globetrotter.model.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {
    List<Activity> findByDestinationId(Long destinationId);
    List<Activity> findByDestinationIdAndNameContainingIgnoreCase(Long destinationId, String name);
    List<Activity> findByDestinationIdAndCategory(Long destinationId, String category);
    boolean existsByDestinationIdAndName(Long destinationId, String name);
}
