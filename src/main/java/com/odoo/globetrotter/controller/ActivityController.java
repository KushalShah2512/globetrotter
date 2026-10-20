package com.odoo.globetrotter.controller;

import com.odoo.globetrotter.model.Activity;
import com.odoo.globetrotter.repository.ActivityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/activities")
public class ActivityController {

    @Autowired
    private ActivityRepository activityRepository;

    @GetMapping
    public ResponseEntity<List<Activity>> getActivities(
            @RequestParam("destinationId") Long destinationId,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "category", required = false) String category) {
        
        List<Activity> results;
        
        if (category != null && !category.trim().isEmpty()) {
            results = activityRepository.findByDestinationIdAndCategory(destinationId, category.trim());
        } else if (search != null && !search.trim().isEmpty()) {
            results = activityRepository.findByDestinationIdAndNameContainingIgnoreCase(destinationId, search.trim());
        } else {
            results = activityRepository.findByDestinationId(destinationId);
        }
        
        return ResponseEntity.ok(results);
    }
}
