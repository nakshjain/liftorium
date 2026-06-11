package com.gymhelper.entity;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.mapping.Field;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutSet {

  @Builder.Default
  @Field("_id")
  private String id = new ObjectId().toHexString();

  private int order;
  private int reps;
  private double weight;
  private Instant completedAt;
}
