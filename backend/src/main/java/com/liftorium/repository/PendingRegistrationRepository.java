package com.liftorium.repository;

import com.liftorium.entity.PendingRegistration;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface PendingRegistrationRepository extends MongoRepository<PendingRegistration, String> {

  Optional<PendingRegistration> findByEmail(String email);

  void deleteByEmail(String email);
}
