package com.liftorium.entity;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "user_settings")
public class UserSettings {

  @Id
  private String id;

  @Indexed(unique = true)
  private String userId;

  @Builder.Default
  private UnitsSettings units = UnitsSettings.defaults();

  @Builder.Default
  private WorkoutSettings workout = WorkoutSettings.defaults();

  @Builder.Default
  private AppearanceSettings appearance = AppearanceSettings.defaults();

  @CreatedDate
  private Instant createdAt;

  @LastModifiedDate
  private Instant updatedAt;

  // ── Nested value objects ─────────────────────────────────────────────

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class UnitsSettings {
    /** "kg" or "lb" */
    @Builder.Default
    private String weight = "kg";

    /** "km" or "mi" */
    @Builder.Default
    private String distance = "km";

    public static UnitsSettings defaults() {
      return UnitsSettings.builder().build();
    }
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class WorkoutSettings {
    @Builder.Default
    private int defaultRestSeconds = 90;

    @Builder.Default
    private boolean autoStartRestTimer = true;

    public static WorkoutSettings defaults() {
      return WorkoutSettings.builder().build();
    }
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class AppearanceSettings {
    /** "dark" or "system" */
    @Builder.Default
    private String theme = "dark";

    public static AppearanceSettings defaults() {
      return AppearanceSettings.builder().build();
    }
  }

  // ── Factory ───────────────────────────────────────────────────────────

  public static UserSettings createDefaults(String userId) {
    return UserSettings.builder()
        .userId(userId)
        .units(UnitsSettings.defaults())
        .workout(WorkoutSettings.defaults())
        .appearance(AppearanceSettings.defaults())
        .build();
  }
}
