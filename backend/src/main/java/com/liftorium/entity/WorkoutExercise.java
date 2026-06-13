package com.liftorium.entity;

import java.util.ArrayList;
import java.util.List;
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
public class WorkoutExercise {

  @Builder.Default
  @Field("_id")
  private String id = new ObjectId().toHexString();

  private String exerciseId;
  private int order;

  @Builder.Default
  private List<WorkoutSet> sets = new ArrayList<>();
}
