package com.odoo.globetrotter.security;

import com.odoo.globetrotter.model.UserToken;
import com.odoo.globetrotter.repository.UserTokenRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

@Component
public class TokenAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private UserTokenRepository tokenRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String authHeader = request.getHeader("Authorization");
        
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            Optional<UserToken> userTokenOpt = tokenRepository.findByToken(token);
            
            if (userTokenOpt.isPresent()) {
                UserToken userToken = userTokenOpt.get();
                
                if (userToken.getExpiryTime().isAfter(LocalDateTime.now())) {
                    com.odoo.globetrotter.model.User appUser = userToken.getUser();
                    
                    UserDetails userDetails = new User(
                            appUser.getEmail(),
                            appUser.getPassword(),
                            Collections.emptyList()
                    );
                    
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            appUser, // Set our custom User model as principal
                            null,
                            userDetails.getAuthorities()
                    );
                    
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                } else {
                    // Token expired - clean it up
                    tokenRepository.delete(userToken);
                }
            }
        }
        
        filterChain.doFilter(request, response);
    }
}
