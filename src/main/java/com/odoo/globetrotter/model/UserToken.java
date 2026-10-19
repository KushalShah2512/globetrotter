package com.odoo.globetrotter.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_tokens")
public class UserToken {

    @Id
    private String token;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "expiry_time", nullable = false)
    private LocalDateTime expiryTime;

    // Constructors
    public UserToken() {}

    public UserToken(String token, User user, LocalDateTime expiryTime) {
        this.token = token;
        this.user = user;
        this.expiryTime = expiryTime;
    }

    // Getters and Setters
    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public LocalDateTime getExpiryTime() {
        return expiryTime;
    }

    public void setExpiryTime(LocalDateTime expiryTime) {
        this.expiryTime = expiryTime;
    }
}
