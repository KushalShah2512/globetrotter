package com.odoo.globetrotter.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "trip_activities")
public class TripActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stop_id")
    private Stop stop;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "activity_id")
    private Activity activity;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String category; // transport, stay, activities, meals

    @Column(nullable = false)
    private Double cost;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "activity_date", nullable = false)
    private LocalDate activityDate;

    @Column(name = "activity_time")
    private LocalTime activityTime;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "sequence_order", nullable = false)
    private Integer sequenceOrder;

    // Constructors
    public TripActivity() {}

    public TripActivity(Long id, Trip trip, Stop stop, Activity activity, String name, String category, Double cost, Integer durationMinutes, LocalDate activityDate, LocalTime activityTime, String notes, Integer sequenceOrder) {
        this.id = id;
        this.trip = trip;
        this.stop = stop;
        this.activity = activity;
        this.name = name;
        this.category = category;
        this.cost = cost;
        this.durationMinutes = durationMinutes;
        this.activityDate = activityDate;
        this.activityTime = activityTime;
        this.notes = notes;
        this.sequenceOrder = sequenceOrder;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Trip getTrip() {
        return trip;
    }

    public void setTrip(Trip trip) {
        this.trip = trip;
    }

    public Stop getStop() {
        return stop;
    }

    public void setStop(Stop stop) {
        this.stop = stop;
    }

    public Activity getActivity() {
        return activity;
    }

    public void setActivity(Activity activity) {
        this.activity = activity;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Double getCost() {
        return cost;
    }

    public void setCost(Double cost) {
        this.cost = cost;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public LocalDate getActivityDate() {
        return activityDate;
    }

    public void setActivityDate(LocalDate activityDate) {
        this.activityDate = activityDate;
    }

    public LocalTime getActivityTime() {
        return activityTime;
    }

    public void setActivityTime(LocalTime activityTime) {
        this.activityTime = activityTime;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Integer getSequenceOrder() {
        return sequenceOrder;
    }

    public void setSequenceOrder(Integer sequenceOrder) {
        this.sequenceOrder = sequenceOrder;
    }
}
