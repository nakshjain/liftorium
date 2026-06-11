package com.gymhelper.entity;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "workout_plans")
public class WorkoutPlan {

  @Id
  private String id;

  @Indexed(unique = true)
  private String userId;

  @Builder.Default
  private List<PlanDay> days = new ArrayList<>();

  @LastModifiedDate
  private Instant updatedAt;
}
