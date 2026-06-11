package com.gymhelper.startup;

import com.gymhelper.config.AppProperties;
import com.gymhelper.entity.ExerciseProviderType;
import com.gymhelper.service.ExerciseSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ExerciseSyncStartupRunner implements ApplicationRunner {

  private final ExerciseSyncService exerciseSyncService;
  private final AppProperties appProperties;

  @Override
  public void run(ApplicationArguments args) {
    if (!appProperties.exercises().syncOnStartup()) {
      log.info("Exercise catalog sync on startup is disabled (app.exercises.sync-on-startup=false)");
      return;
    }

    log.info("Starting exercise catalog sync on startup...");
    try {
      ExerciseSyncService.SyncResult result = exerciseSyncService.sync(ExerciseProviderType.ASCEND_API);
      log.info("Exercise catalog sync complete — created={}, updated={}, unchanged={}, deactivated={}",
          result.created(), result.updated(), result.unchanged(), result.deactivated());
    } catch (Exception e) {
      log.error("Exercise catalog sync failed on startup, continuing with existing data", e);
    }
  }
}
