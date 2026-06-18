package com.liftorium.repository;

import com.liftorium.entity.UserSettings;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserSettingsRepository extends MongoRepository<UserSettings, String> {

  Optional<UserSettings> findByUserId(String userId);

  boolean existsByUserId(String userId);

  void deleteByUserId(String userId);
}
