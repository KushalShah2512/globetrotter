package com.odoo.globetrotter.controller;

import com.odoo.globetrotter.model.Destination;
import com.odoo.globetrotter.repository.DestinationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/destinations")
public class DestinationController {

    @Autowired
    private DestinationRepository destinationRepository;

    @GetMapping
    public ResponseEntity<List<Destination>> getDestinations(@RequestParam(value = "search", required = false) String search) {
        if (search == null || search.trim().isEmpty()) {
            return ResponseEntity.ok(destinationRepository.findAll());
        }
        
        String term = search.trim();
        List<Destination> results = destinationRepository
                .findByNameContainingIgnoreCaseOrCountryContainingIgnoreCaseOrRegionContainingIgnoreCase(term, term, term);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Destination> getDestinationById(@PathVariable Long id) {
        return destinationRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
