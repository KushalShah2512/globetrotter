package com.odoo.globetrotter.controller;

import com.odoo.globetrotter.model.User;
import com.odoo.globetrotter.model.UserToken;
import com.odoo.globetrotter.repository.UserRepository;
import com.odoo.globetrotter.repository.UserTokenRepository;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserTokenRepository tokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private com.cloudinary.Cloudinary cloudinary;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("File is empty.");
        }
        try {
            java.util.Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), 
                com.cloudinary.utils.ObjectUtils.asMap("resource_type", "auto"));
            
            String secureUrl = (String) uploadResult.get("secure_url");
            return ResponseEntity.ok(Map.of("url", secureUrl));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Cloudinary upload failed: " + e.getMessage());
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email address is already in use.");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setCity(request.getCity());
        user.setCountry(request.getCountry());
        user.setAdditionalInformation(request.getAdditionalInformation());
        user.setPhotoUrl(request.getPhotoUrl());
        user.setLanguagePreference("en");

        User savedUser = userRepository.save(user);
        String token = generateUserToken(savedUser);

        return ResponseEntity.ok(new AuthResponse(token, savedUser));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty() || !passwordEncoder.matches(request.getPassword(), userOpt.get().getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password.");
        }

        User user = userOpt.get();
        String token = generateUserToken(user);

        return ResponseEntity.ok(new AuthResponse(token, user));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader("Authorization") String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            tokenRepository.deleteById(token);
        }
        return ResponseEntity.ok("Logged out successfully.");
    }

    @GetMapping("/me")
    public ResponseEntity<?> getProfile() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User) {
            User currentUser = (User) principal;
            Optional<User> userOpt = userRepository.findById(currentUser.getId());
            if (userOpt.isPresent()) {
                return ResponseEntity.ok(userOpt.get());
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found.");
            }
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated.");
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody ProfileUpdateRequest request) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof User)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated.");
        }

        User currentUser = (User) principal;
        User user = userRepository.findById(currentUser.getId()).orElseThrow();
        
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setCity(request.getCity());
        user.setCountry(request.getCountry());
        user.setAdditionalInformation(request.getAdditionalInformation());
        user.setPhotoUrl(request.getPhotoUrl());
        if (request.getLanguagePreference() != null) {
            user.setLanguagePreference(request.getLanguagePreference());
        }

        User updatedUser = userRepository.save(user);
        return ResponseEntity.ok(updatedUser);
    }

    @DeleteMapping("/account")
    public ResponseEntity<?> deleteAccount() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof User)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated.");
        }

        User currentUser = (User) principal;
        userRepository.deleteById(currentUser.getId());
        return ResponseEntity.ok("Account deleted successfully.");
    }

    private String generateUserToken(User user) {
        String token = UUID.randomUUID().toString();
        UserToken userToken = new UserToken();
        userToken.setToken(token);
        userToken.setUser(user);
        userToken.setExpiryTime(LocalDateTime.now().plusDays(7)); // Valid for 7 days
        tokenRepository.save(userToken);
        return token;
    }

    // DTO Classes
    public static class LoginRequest {
        private String email;
        private String password;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class RegisterRequest {
        private String email;
        private String password;
        private String firstName;
        private String lastName;
        private String phoneNumber;
        private String city;
        private String country;
        private String additionalInformation;
        private String photoUrl;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }
        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }
        public String getPhoneNumber() { return phoneNumber; }
        public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }
        public String getCountry() { return country; }
        public void setCountry(String country) { this.country = country; }
        public String getAdditionalInformation() { return additionalInformation; }
        public void setAdditionalInformation(String additionalInformation) { this.additionalInformation = additionalInformation; }
        public String getPhotoUrl() { return photoUrl; }
        public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
    }

    public static class ProfileUpdateRequest {
        private String firstName;
        private String lastName;
        private String phoneNumber;
        private String city;
        private String country;
        private String additionalInformation;
        private String photoUrl;
        private String languagePreference;

        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }
        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }
        public String getPhoneNumber() { return phoneNumber; }
        public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }
        public String getCountry() { return country; }
        public void setCountry(String country) { this.country = country; }
        public String getAdditionalInformation() { return additionalInformation; }
        public void setAdditionalInformation(String additionalInformation) { this.additionalInformation = additionalInformation; }
        public String getPhotoUrl() { return photoUrl; }
        public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
        public String getLanguagePreference() { return languagePreference; }
        public void setLanguagePreference(String languagePreference) { this.languagePreference = languagePreference; }
    }

    public static class AuthResponse {
        private String token;
        private User user;

        public AuthResponse(String token, User user) {
            this.token = token;
            this.user = user;
        }

        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
        public User getUser() { return user; }
        public void setUser(User user) { this.user = user; }
    }
}
