package com.gymhelper.entity;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.TextIndexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "exercises")
@CompoundIndexes({
    @CompoundIndex(name = "category_equipment_idx", def = "{'category': 1, 'equipment': 1}"),
    @CompoundIndex(name = "target_muscles_equipment_idx", def = "{'targetMuscles': 1, 'equipment': 1}")
})
public class Exercise {

  @Id
  private String id;

  @TextIndexed
  private String name;

  private String description;

  @Indexed
  private String category;

  @Indexed
  private String equipment;

  @Indexed
  @Builder.Default
  private List<String> targetMuscles = new ArrayList<>();

  @Indexed
  @Builder.Default
  private List<String> secondaryMuscles = new ArrayList<>();

  @Builder.Default
  private List<String> instructions = new ArrayList<>();

  @Builder.Default
  private List<String> tips = new ArrayList<>();

  private String mediaUrl;

  @CreatedDate
  private Instant createdAt;

  @LastModifiedDate
  private Instant updatedAt;
}
