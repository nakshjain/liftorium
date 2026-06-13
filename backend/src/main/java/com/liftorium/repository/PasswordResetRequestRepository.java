package com.liftorium.repository;

import com.liftorium.entity.PasswordResetRequest;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface PasswordResetRequestRepository extends MongoRepository<PasswordResetRequest, String> {

  Optional<PasswordResetRequest> findByEmail(String email);

  void deleteByEmail(String email);
}
