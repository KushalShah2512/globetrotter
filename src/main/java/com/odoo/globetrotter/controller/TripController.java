package com.odoo.globetrotter.controller;

import com.odoo.globetrotter.model.*;
import com.odoo.globetrotter.repository.*;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/trips")
public class TripController {

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private StopRepository stopRepository;

    @Autowired
    private TripActivityRepository tripActivityRepository;

    @Autowired
    private DestinationRepository destinationRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private UserRepository userRepository;

    // Retrieve current user from Security Context
    private User getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User) {
            return (User) principal;
        }
        throw new RuntimeException("User not authenticated");
    }

    // ==========================================
    // TRIP CRUD ENDPOINTS
    // ==========================================

    @GetMapping
    public ResponseEntity<List<Trip>> getUserTrips() {
        User user = getCurrentUser();
        List<Trip> trips = tripRepository.findByUserId(user.getId());
        return ResponseEntity.ok(trips);
    }

    @PostMapping
    public ResponseEntity<?> createTrip(@RequestBody TripRequest request) {
        User user = getCurrentUser();

        Trip trip = new Trip();
        trip.setUser(user);
        trip.setName(request.getName());
        trip.setDescription(request.getDescription());
        trip.setStartDate(request.getStartDate());
        trip.setEndDate(request.getEndDate());
        trip.setBudget(request.getBudget() != null ? request.getBudget() : 0.0);
        trip.setCoverPhoto(request.getCoverPhoto());
        trip.setIsPublic(request.getIsPublic() != null ? request.getIsPublic() : false);

        Trip savedTrip = tripRepository.save(trip);
        return ResponseEntity.ok(savedTrip);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTripById(@PathVariable Long id) {
        Optional<Trip> tripOpt = tripRepository.findById(id);
        if (tripOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Trip trip = tripOpt.get();
        User user = getCurrentUser();

        // Allow owner to view, or anyone if the trip is public
        if (!trip.getUser().getId().equals(user.getId()) && !trip.getIsPublic()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied.");
        }

        return ResponseEntity.ok(trip);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTrip(@PathVariable Long id, @RequestBody TripRequest request) {
        Optional<Trip> tripOpt = tripRepository.findById(id);
        if (tripOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Trip trip = tripOpt.get();
        User user = getCurrentUser();

        if (!trip.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied.");
        }

        trip.setName(request.getName());
        trip.setDescription(request.getDescription());
        trip.setStartDate(request.getStartDate());
        trip.setEndDate(request.getEndDate());
        if (request.getBudget() != null) {
            trip.setBudget(request.getBudget());
        }
        trip.setCoverPhoto(request.getCoverPhoto());
        if (request.getIsPublic() != null) {
            trip.setIsPublic(request.getIsPublic());
        }

        Trip updatedTrip = tripRepository.save(trip);
        return ResponseEntity.ok(updatedTrip);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteTrip(@PathVariable Long id) {
        Optional<Trip> tripOpt = tripRepository.findById(id);
        if (tripOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Trip trip = tripOpt.get();
        User user = getCurrentUser();

        if (!trip.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied.");
        }

        // Delete associated records due to JPA mappings (optional cascade, but manual is safer here)
        tripActivityRepository.deleteByTripId(id);
        stopRepository.deleteByTripId(id);
        tripRepository.delete(trip);

        return ResponseEntity.ok("Trip deleted successfully.");
    }

    // ==========================================
    // TRIP STOPS (MULTI-CITY SECTIONS)
    // ==========================================

    @GetMapping("/{id}/stops")
    public ResponseEntity<?> getTripStops(@PathVariable Long id) {
        Optional<Trip> tripOpt = tripRepository.findById(id);
        if (tripOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Trip trip = tripOpt.get();
        User user = getCurrentUser();

        if (!trip.getUser().getId().equals(user.getId()) && !trip.getIsPublic()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied.");
        }

        List<Stop> stops = stopRepository.findByTripIdOrderBySequenceOrderAsc(id);
        return ResponseEntity.ok(stops);
    }

    @PostMapping("/{id}/stops")
    public ResponseEntity<?> addTripStop(@PathVariable Long id, @RequestBody StopRequest request) {
        Optional<Trip> tripOpt = tripRepository.findById(id);
        if (tripOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Trip trip = tripOpt.get();
        User user = getCurrentUser();

        if (!trip.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied.");
        }

        Optional<Destination> destOpt = destinationRepository.findById(request.getDestinationId());
        if (destOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Destination city not found.");
        }

        List<Stop> existingStops = stopRepository.findByTripIdOrderBySequenceOrderAsc(id);
        int nextOrder = existingStops.size() + 1;

        Stop stop = new Stop();
        stop.setTrip(trip);
        stop.setDestination(destOpt.get());
        stop.setArrivalDate(request.getArrivalDate());
        stop.setDepartureDate(request.getDepartureDate());
        stop.setSequenceOrder(nextOrder);

        Stop savedStop = stopRepository.save(stop);
        return ResponseEntity.ok(savedStop);
    }

    @PutMapping("/{id}/stops/{stopId}")
    public ResponseEntity<?> updateTripStop(@PathVariable Long id, @PathVariable Long stopId, @RequestBody StopRequest request) {
        Optional<Trip> tripOpt = tripRepository.findById(id);
        Optional<Stop> stopOpt = stopRepository.findById(stopId);

        if (tripOpt.isEmpty() || stopOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Trip trip = tripOpt.get();
        Stop stop = stopOpt.get();
        User user = getCurrentUser();

        if (!trip.getUser().getId().equals(user.getId()) || !stop.getTrip().getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied.");
        }

        stop.setArrivalDate(request.getArrivalDate());
        stop.setDepartureDate(request.getDepartureDate());
        if (request.getSequenceOrder() != null) {
            stop.setSequenceOrder(request.getSequenceOrder());
        }

        Stop updatedStop = stopRepository.save(stop);
        return ResponseEntity.ok(updatedStop);
    }

    @DeleteMapping("/{id}/stops/{stopId}")
    @Transactional
    public ResponseEntity<?> deleteTripStop(@PathVariable Long id, @PathVariable Long stopId) {
        Optional<Trip> tripOpt = tripRepository.findById(id);
        Optional<Stop> stopOpt = stopRepository.findById(stopId);

        if (tripOpt.isEmpty() || stopOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Trip trip = tripOpt.get();
        Stop stop = stopOpt.get();
        User user = getCurrentUser();

        if (!trip.getUser().getId().equals(user.getId()) || !stop.getTrip().getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied.");
        }

        // Delete activities bound to this stop
        tripActivityRepository.deleteByStopId(stopId);
        stopRepository.delete(stop);

        // Re-sequence remaining stops
        List<Stop> remaining = stopRepository.findByTripIdOrderBySequenceOrderAsc(id);
        for (int i = 0; i < remaining.size(); i++) {
            Stop s = remaining.get(i);
            s.setSequenceOrder(i + 1);
            stopRepository.save(s);
        }

        return ResponseEntity.ok("Stop removed successfully.");
    }

    @PutMapping("/{id}/stops/reorder")
    @Transactional
    public ResponseEntity<?> reorderStops(@PathVariable Long id, @RequestBody List<Long> stopIds) {
        Optional<Trip> tripOpt = tripRepository.findById(id);
        if (tripOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Trip trip = tripOpt.get();
        User user = getCurrentUser();

        if (!trip.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied.");
        }

        for (int i = 0; i < stopIds.size(); i++) {
            Long stopId = stopIds.get(i);
            Optional<Stop> sOpt = stopRepository.findById(stopId);
            if (sOpt.isPresent() && sOpt.get().getTrip().getId().equals(id)) {
                Stop s = sOpt.get();
                s.setSequenceOrder(i + 1);
                stopRepository.save(s);
            }
        }

        return ResponseEntity.ok("Stops reordered successfully.");
    }

    // ==========================================
    // TRIP ACTIVITIES ENDPOINTS
    // ==========================================

    @GetMapping("/{id}/activities")
    public ResponseEntity<?> getTripActivities(@PathVariable Long id) {
        Optional<Trip> tripOpt = tripRepository.findById(id);
        if (tripOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Trip trip = tripOpt.get();
        User user = getCurrentUser();

        if (!trip.getUser().getId().equals(user.getId()) && !trip.getIsPublic()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied.");
        }

        List<TripActivity> activities = tripActivityRepository.findByTripIdOrderByActivityDateAscSequenceOrderAsc(id);
        return ResponseEntity.ok(activities);
    }

    @PostMapping("/{id}/activities")
    public ResponseEntity<?> addTripActivity(@PathVariable Long id, @RequestBody TripActivityRequest request) {
        Optional<Trip> tripOpt = tripRepository.findById(id);
        if (tripOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Trip trip = tripOpt.get();
        User user = getCurrentUser();

        if (!trip.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied.");
        }

        Stop stop = null;
        if (request.getStopId() != null) {
            Optional<Stop> stopOpt = stopRepository.findById(request.getStopId());
            if (stopOpt.isPresent() && stopOpt.get().getTrip().getId().equals(id)) {
                stop = stopOpt.get();
            }
        }

        Activity preloadedActivity = null;
        if (request.getActivityId() != null) {
            Optional<Activity> actOpt = activityRepository.findById(request.getActivityId());
            if (actOpt.isPresent()) {
                preloadedActivity = actOpt.get();
            }
        }

        List<TripActivity> current = tripActivityRepository.findByTripIdOrderByActivityDateAscSequenceOrderAsc(id);
        int nextOrder = current.size() + 1;

        TripActivity tripActivity = new TripActivity();
        tripActivity.setTrip(trip);
        tripActivity.setStop(stop);
        tripActivity.setActivity(preloadedActivity);
        tripActivity.setName(request.getName());
        tripActivity.setCategory(request.getCategory());
        tripActivity.setCost(request.getCost());
        tripActivity.setDurationMinutes(request.getDurationMinutes());
        tripActivity.setActivityDate(request.getActivityDate());
        if (request.getActivityTime() != null) {
            tripActivity.setActivityTime(LocalTime.parse(request.getActivityTime()));
        }
        tripActivity.setNotes(request.getNotes());
        tripActivity.setSequenceOrder(nextOrder);

        TripActivity saved = tripActivityRepository.save(tripActivity);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/activities/{tripActivityId}")
    public ResponseEntity<?> updateTripActivity(@PathVariable Long id, @PathVariable Long tripActivityId, @RequestBody TripActivityRequest request) {
        Optional<Trip> tripOpt = tripRepository.findById(id);
        Optional<TripActivity> taOpt = tripActivityRepository.findById(tripActivityId);

        if (tripOpt.isEmpty() || taOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Trip trip = tripOpt.get();
        TripActivity ta = taOpt.get();
        User user = getCurrentUser();

        if (!trip.getUser().getId().equals(user.getId()) || !ta.getTrip().getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied.");
        }

        ta.setName(request.getName());
        ta.setCategory(request.getCategory());
        ta.setCost(request.getCost());
        ta.setDurationMinutes(request.getDurationMinutes());
        ta.setActivityDate(request.getActivityDate());
        if (request.getActivityTime() != null) {
            ta.setActivityTime(LocalTime.parse(request.getActivityTime()));
        } else {
            ta.setActivityTime(null);
        }
        ta.setNotes(request.getNotes());
        if (request.getSequenceOrder() != null) {
            ta.setSequenceOrder(request.getSequenceOrder());
        }

        TripActivity updated = tripActivityRepository.save(ta);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}/activities/{tripActivityId}")
    public ResponseEntity<?> deleteTripActivity(@PathVariable Long id, @PathVariable Long tripActivityId) {
        Optional<Trip> tripOpt = tripRepository.findById(id);
        Optional<TripActivity> taOpt = tripActivityRepository.findById(tripActivityId);

        if (tripOpt.isEmpty() || taOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Trip trip = tripOpt.get();
        TripActivity ta = taOpt.get();
        User user = getCurrentUser();

        if (!trip.getUser().getId().equals(user.getId()) || !ta.getTrip().getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied.");
        }

        tripActivityRepository.delete(ta);
        return ResponseEntity.ok("Activity removed successfully.");
    }

    // ==========================================
    // COMMUNITY / PUBLIC SHARING & COPYING
    // ==========================================

    @GetMapping("/public")
    public ResponseEntity<List<TripResponse>> getPublicTrips() {
        List<Trip> trips = tripRepository.findByIsPublicTrue();
        List<TripResponse> responses = new ArrayList<>();
        
        for (Trip trip : trips) {
            // Count number of stops/destinations in trip
            List<Stop> stops = stopRepository.findByTripIdOrderBySequenceOrderAsc(trip.getId());
            TripResponse r = new TripResponse();
            r.setTrip(trip);
            r.setDestinationCount(stops.size());
            r.setCreatorName(trip.getUser().getFirstName() + " " + trip.getUser().getLastName());
            r.setCreatorPhoto(trip.getUser().getPhotoUrl());
            responses.add(r);
        }
        
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/public/{id}")
    public ResponseEntity<?> getPublicTripById(@PathVariable Long id) {
        Optional<Trip> tripOpt = tripRepository.findById(id);
        if (tripOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Trip trip = tripOpt.get();
        if (!trip.getIsPublic()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("This trip is not shared publicly.");
        }

        PublicTripDetail details = new PublicTripDetail();
        details.setTrip(trip);
        details.setStops(stopRepository.findByTripIdOrderBySequenceOrderAsc(id));
        details.setActivities(tripActivityRepository.findByTripIdOrderByActivityDateAscSequenceOrderAsc(id));
        details.setCreatorName(trip.getUser().getFirstName() + " " + trip.getUser().getLastName());
        details.setCreatorPhoto(trip.getUser().getPhotoUrl());

        return ResponseEntity.ok(details);
    }

    @PostMapping("/public/{id}/copy")
    @Transactional
    public ResponseEntity<?> copyPublicTrip(@PathVariable Long id) {
        Optional<Trip> tripOpt = tripRepository.findById(id);
        if (tripOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Trip sourceTrip = tripOpt.get();
        if (!sourceTrip.getIsPublic()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Cannot copy private trip.");
        }

        User currentUser = getCurrentUser();

        // 1. Copy Trip Header
        Trip cloneTrip = new Trip();
        cloneTrip.setUser(currentUser);
        cloneTrip.setName("Copy of " + sourceTrip.getName());
        cloneTrip.setDescription(sourceTrip.getDescription());
        cloneTrip.setStartDate(sourceTrip.getStartDate());
        cloneTrip.setEndDate(sourceTrip.getEndDate());
        cloneTrip.setBudget(sourceTrip.getBudget());
        cloneTrip.setCoverPhoto(sourceTrip.getCoverPhoto());
        cloneTrip.setIsPublic(false); // Make private by default

        Trip savedClone = tripRepository.save(cloneTrip);

        // Map old stop IDs to new stop IDs to re-link activities
        List<Stop> sourceStops = stopRepository.findByTripIdOrderBySequenceOrderAsc(id);
        for (Stop sourceStop : sourceStops) {
            Stop cloneStop = new Stop();
            cloneStop.setTrip(savedClone);
            cloneStop.setDestination(sourceStop.getDestination());
            cloneStop.setArrivalDate(sourceStop.getArrivalDate());
            cloneStop.setDepartureDate(sourceStop.getDepartureDate());
            cloneStop.setSequenceOrder(sourceStop.getSequenceOrder());
            Stop savedCloneStop = stopRepository.save(cloneStop);

            // Copy activities for this stop
            List<TripActivity> sourceActivities = tripActivityRepository.findByStopIdOrderByActivityDateAscSequenceOrderAsc(sourceStop.getId());
            for (TripActivity sourceAct : sourceActivities) {
                TripActivity cloneAct = new TripActivity();
                cloneAct.setTrip(savedClone);
                cloneAct.setStop(savedCloneStop);
                cloneAct.setActivity(sourceAct.getActivity());
                cloneAct.setName(sourceAct.getName());
                cloneAct.setCategory(sourceAct.getCategory());
                cloneAct.setCost(sourceAct.getCost());
                cloneAct.setDurationMinutes(sourceAct.getDurationMinutes());
                cloneAct.setActivityDate(sourceAct.getActivityDate());
                cloneAct.setActivityTime(sourceAct.getActivityTime());
                cloneAct.setNotes(sourceAct.getNotes());
                cloneAct.setSequenceOrder(sourceAct.getSequenceOrder());
                tripActivityRepository.save(cloneAct);
            }
        }

        return ResponseEntity.ok(savedClone);
    }

    // ==========================================
    // DTO REQUESTS / RESPONSES
    // ==========================================

    public static class TripRequest {
        private String name;
        private String description;
        private LocalDate startDate;
        private LocalDate endDate;
        private Double budget;
        private String coverPhoto;
        private Boolean isPublic;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public LocalDate getStartDate() { return startDate; }
        public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
        public LocalDate getEndDate() { return endDate; }
        public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
        public Double getBudget() { return budget; }
        public void setBudget(Double budget) { this.budget = budget; }
        public String getCoverPhoto() { return coverPhoto; }
        public void setCoverPhoto(String coverPhoto) { this.coverPhoto = coverPhoto; }
        public Boolean getIsPublic() { return isPublic; }
        public void setIsPublic(Boolean isPublic) { this.isPublic = isPublic; }
    }

    public static class StopRequest {
        private Long destinationId;
        private LocalDate arrivalDate;
        private LocalDate departureDate;
        private Integer sequenceOrder;

        public Long getDestinationId() { return destinationId; }
        public void setDestinationId(Long destinationId) { this.destinationId = destinationId; }
        public LocalDate getArrivalDate() { return arrivalDate; }
        public void setArrivalDate(LocalDate arrivalDate) { this.arrivalDate = arrivalDate; }
        public LocalDate getDepartureDate() { return departureDate; }
        public void setDepartureDate(LocalDate departureDate) { this.departureDate = departureDate; }
        public Integer getSequenceOrder() { return sequenceOrder; }
        public void setSequenceOrder(Integer sequenceOrder) { this.sequenceOrder = sequenceOrder; }
    }

    public static class TripActivityRequest {
        private Long stopId;
        private Long activityId;
        private String name;
        private String category;
        private Double cost;
        private Integer durationMinutes;
        private LocalDate activityDate;
        private String activityTime; // format: HH:mm
        private String notes;
        private Integer sequenceOrder;

        public Long getStopId() { return stopId; }
        public void setStopId(Long stopId) { this.stopId = stopId; }
        public Long getActivityId() { return activityId; }
        public void setActivityId(Long activityId) { this.activityId = activityId; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        public Double getCost() { return cost; }
        public void setCost(Double cost) { this.cost = cost; }
        public Integer getDurationMinutes() { return durationMinutes; }
        public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
        public LocalDate getActivityDate() { return activityDate; }
        public void setActivityDate(LocalDate activityDate) { this.activityDate = activityDate; }
        public String getActivityTime() { return activityTime; }
        public void setActivityTime(String activityTime) { this.activityTime = activityTime; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
        public Integer getSequenceOrder() { return sequenceOrder; }
        public void setSequenceOrder(Integer sequenceOrder) { this.sequenceOrder = sequenceOrder; }
    }

    public static class TripResponse {
        private Trip trip;
        private int destinationCount;
        private String creatorName;
        private String creatorPhoto;

        public Trip getTrip() { return trip; }
        public void setTrip(Trip trip) { this.trip = trip; }
        public int getDestinationCount() { return destinationCount; }
        public void setDestinationCount(int destinationCount) { this.destinationCount = destinationCount; }
        public String getCreatorName() { return creatorName; }
        public void setCreatorName(String creatorName) { this.creatorName = creatorName; }
        public String getCreatorPhoto() { return creatorPhoto; }
        public void setCreatorPhoto(String creatorPhoto) { this.creatorPhoto = creatorPhoto; }
    }

    public static class PublicTripDetail {
        private Trip trip;
        private List<Stop> stops;
        private List<TripActivity> activities;
        private String creatorName;
        private String creatorPhoto;

        public Trip getTrip() { return trip; }
        public void setTrip(Trip trip) { this.trip = trip; }
        public List<Stop> getStops() { return stops; }
        public void setStops(List<Stop> stops) { this.stops = stops; }
        public List<TripActivity> getActivities() { return activities; }
        public void setActivities(List<TripActivity> activities) { this.activities = activities; }
        public String getCreatorName() { return creatorName; }
        public void setCreatorName(String creatorName) { this.creatorName = creatorName; }
        public String getCreatorPhoto() { return creatorPhoto; }
        public void setCreatorPhoto(String creatorPhoto) { this.creatorPhoto = creatorPhoto; }
    }
}
