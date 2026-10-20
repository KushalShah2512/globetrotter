package com.odoo.globetrotter.controller;

import com.odoo.globetrotter.model.*;
import com.odoo.globetrotter.repository.*;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private StopRepository stopRepository;

    @Autowired
    private TripActivityRepository tripActivityRepository;

    @Autowired
    private DestinationRepository destinationRepository;

    @GetMapping("/stats")
    public ResponseEntity<AdminStats> getAdminStats() {
        AdminStats stats = new AdminStats();

        // 1. Core counters
        long userCount = userRepository.count();
        long tripCount = tripRepository.count();
        long destinationCount = destinationRepository.count();
        stats.setTotalUsers(userCount);
        stats.setTotalTrips(tripCount);
        stats.setTotalDestinations(destinationCount);

        // 2. Popular cities (destination counts in stops)
        List<Stop> allStops = stopRepository.findAll();
        Map<String, Long> cityCounts = allStops.stream()
                .collect(Collectors.groupingBy(s -> s.getDestination().getName(), Collectors.counting()));
        
        List<MetricItem> popularCities = cityCounts.entrySet().stream()
                .map(e -> new MetricItem(e.getKey(), e.getValue()))
                .sorted(Comparator.comparing(MetricItem::getValue).reversed())
                .limit(5)
                .collect(Collectors.toList());
        
        // Seed default destinations if no stops created yet to show mock charts
        if (popularCities.isEmpty()) {
            popularCities.add(new MetricItem("Paris", 12L));
            popularCities.add(new MetricItem("Tokyo", 9L));
            popularCities.add(new MetricItem("New York", 7L));
            popularCities.add(new MetricItem("Rome", 6L));
            popularCities.add(new MetricItem("Bali", 4L));
        }
        stats.setPopularCities(popularCities);

        // 3. Popular activities (activity occurrences)
        List<TripActivity> allActivities = tripActivityRepository.findAll();
        Map<String, Long> activityCounts = allActivities.stream()
                .collect(Collectors.groupingBy(TripActivity::getName, Collectors.counting()));
        
        List<MetricItem> popularActivities = activityCounts.entrySet().stream()
                .map(e -> new MetricItem(e.getKey(), e.getValue()))
                .sorted(Comparator.comparing(MetricItem::getValue).reversed())
                .limit(5)
                .collect(Collectors.toList());

        if (popularActivities.isEmpty()) {
            popularActivities.add(new MetricItem("Eiffel Tower Visit", 18L));
            popularActivities.add(new MetricItem("Sushi Masterclass", 14L));
            popularActivities.add(new MetricItem("Broadway Show", 10L));
            popularActivities.add(new MetricItem("Colosseum Tour", 8L));
            popularActivities.add(new MetricItem("Ubud Monkey Forest", 5L));
        }
        stats.setPopularActivities(popularActivities);

        // 4. User engagement stats (trips per user)
        List<User> users = userRepository.findAll();
        List<UserMetric> userMetrics = users.stream().map(u -> {
            List<Trip> userTrips = tripRepository.findByUserId(u.getId());
            UserMetric m = new UserMetric();
            m.setUserId(u.getId());
            m.setEmail(u.getEmail());
            m.setName(u.getFirstName() + " " + u.getLastName());
            m.setTripCount(userTrips.size());
            m.setCity(u.getCity() != null ? u.getCity() : "Unknown");
            m.setCountry(u.getCountry() != null ? u.getCountry() : "Unknown");
            return m;
        }).collect(Collectors.toList());
        stats.setUserList(userMetrics);

        // 5. User Trends / Trips over time (grouped by month/year)
        List<Trip> trips = tripRepository.findAll();
        Map<String, Long> trendsMap = trips.stream()
                .collect(Collectors.groupingBy(t -> {
                    LocalDate d = t.getStartDate();
                    return d.getYear() + "-" + String.format("%02d", d.getMonthValue());
                }, Collectors.counting()));

        List<MetricItem> trends = trendsMap.entrySet().stream()
                .map(e -> new MetricItem(e.getKey(), e.getValue()))
                .sorted(Comparator.comparing(MetricItem::getName))
                .collect(Collectors.toList());

        if (trends.isEmpty()) {
            trends.add(new MetricItem("2026-04", 5L));
            trends.add(new MetricItem("2026-05", 8L));
            trends.add(new MetricItem("2026-06", 15L));
            trends.add(new MetricItem("2026-07", 22L));
            trends.add(new MetricItem("2026-08", 30L));
        }
        stats.setUserTrends(trends);

        // 6. Expense Category Distribution (for charts)
        Map<String, Double> expensesMap = allActivities.stream()
                .collect(Collectors.groupingBy(TripActivity::getCategory, Collectors.summingDouble(TripActivity::getCost)));
        
        List<MetricItem> categoryExpenses = expensesMap.entrySet().stream()
                .map(e -> new MetricItem(e.getKey(), e.getValue().longValue()))
                .collect(Collectors.toList());
        
        if (categoryExpenses.isEmpty()) {
            categoryExpenses.add(new MetricItem("activities", 1200L));
            categoryExpenses.add(new MetricItem("stay", 2500L));
            categoryExpenses.add(new MetricItem("meals", 800L));
            categoryExpenses.add(new MetricItem("transport", 600L));
        }
        stats.setExpenseBreakdown(categoryExpenses);

        return ResponseEntity.ok(stats);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok("User account deleted by admin.");
    }

    public static class AdminStats {
        private long totalUsers;
        private long totalTrips;
        private long totalDestinations;
        private List<MetricItem> popularCities;
        private List<MetricItem> popularActivities;
        private List<MetricItem> userTrends;
        private List<MetricItem> expenseBreakdown;
        private List<UserMetric> userList;

        public long getTotalUsers() { return totalUsers; }
        public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }
        public long getTotalTrips() { return totalTrips; }
        public void setTotalTrips(long totalTrips) { this.totalTrips = totalTrips; }
        public long getTotalDestinations() { return totalDestinations; }
        public void setTotalDestinations(long totalDestinations) { this.totalDestinations = totalDestinations; }
        public List<MetricItem> getPopularCities() { return popularCities; }
        public void setPopularCities(List<MetricItem> popularCities) { this.popularCities = popularCities; }
        public List<MetricItem> getPopularActivities() { return popularActivities; }
        public void setPopularActivities(List<MetricItem> popularActivities) { this.popularActivities = popularActivities; }
        public List<MetricItem> getUserTrends() { return userTrends; }
        public void setUserTrends(List<MetricItem> userTrends) { this.userTrends = userTrends; }
        public List<MetricItem> getExpenseBreakdown() { return expenseBreakdown; }
        public void setExpenseBreakdown(List<MetricItem> expenseBreakdown) { this.expenseBreakdown = expenseBreakdown; }
        public List<UserMetric> getUserList() { return userList; }
        public void setUserList(List<UserMetric> userList) { this.userList = userList; }
    }

    public static class MetricItem {
        private String name;
        private Long value;

        public MetricItem(String name, Long value) {
            this.name = name;
            this.value = value;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public Long getValue() { return value; }
        public void setValue(Long value) { this.value = value; }
    }

    public static class UserMetric {
        private Long userId;
        private String email;
        private String name;
        private int tripCount;
        private String city;
        private String country;

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public int getTripCount() { return tripCount; }
        public void setTripCount(int tripCount) { this.tripCount = tripCount; }
        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }
        public String getCountry() { return country; }
        public void setCountry(String country) { this.country = country; }
    }
}
