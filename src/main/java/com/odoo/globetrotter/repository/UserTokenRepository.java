package com.odoo.globetrotter.repository;

import com.odoo.globetrotter.model.UserToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserTokenRepository extends JpaRepository<UserToken, String> {
    Optional<UserToken> findByToken(String token);
    void deleteByToken(String token);
}
