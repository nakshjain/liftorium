package com.liftorium.service;

import com.liftorium.dto.PlanDtos.PlanDayDto;
import com.liftorium.dto.PlanDtos.PlanDayRequest;
import com.liftorium.dto.PlanDtos.PlanExerciseDto;
import com.liftorium.dto.PlanDtos.PlanExerciseRequest;
import com.liftorium.dto.PlanDtos.PlanSetDto;
import com.liftorium.dto.PlanDtos.UpsertPlanRequest;
import com.liftorium.dto.PlanDtos.WorkoutPlanDto;
import com.liftorium.entity.PlanDay;
import com.liftorium.entity.PlanExercise;
import com.liftorium.entity.PlanSet;
import com.liftorium.entity.WorkoutPlan;
import com.liftorium.repository.WorkoutPlanRepository;
import java.util.List;
import java.util.stream.IntStream;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class WorkoutPlanService {

  private final WorkoutPlanRepository planRepository;

  public WorkoutPlanDto get(String userId) {
    return planRepository.findByUserId(userId)
        .map(this::toDto)
        .orElseGet(() -> emptyPlanDto());
  }

  public WorkoutPlanDto upsert(String userId, UpsertPlanRequest input) {
    WorkoutPlan plan = planRepository.findByUserId(userId)
        .orElseGet(() -> WorkoutPlan.builder().userId(userId).build());

    plan.setDays(toDays(input.days()));
    return toDto(planRepository.save(plan));
  }

  private List<PlanDay> toDays(List<PlanDayRequest> requests) {
    return requests.stream()
        .map(r -> PlanDay.builder()
            .dayOfWeek(r.dayOfWeek())
            .label(r.label() == null ? "" : r.label().trim())
            .muscleGroups(r.muscleGroups())
            .exercises(toExercises(r.exercises()))
            .rest(r.rest())
            .build())
        .toList();
  }

  private List<PlanExercise> toExercises(List<PlanExerciseRequest> requests) {
    if (requests == null) return List.of();
    return requests.stream()
        .map(r -> PlanExercise.builder()
            .exerciseId(r.exerciseId())
            .exerciseName(r.exerciseName())
            .sets(r.sets().stream()
                .map(s -> PlanSet.builder().reps(s.reps()).build())
                .toList())
            .order(r.order())
            .build())
        .toList();
  }

  private WorkoutPlanDto toDto(WorkoutPlan plan) {
    List<PlanDayDto> days = plan.getDays().stream()
        .map(d -> new PlanDayDto(
            d.getDayOfWeek(),
            d.getLabel(),
            d.getMuscleGroups(),
            d.getExercises() == null ? List.of() : d.getExercises().stream()
                .map(e -> new PlanExerciseDto(
                    e.getExerciseId(),
                    e.getExerciseName(),
                    e.getSets() == null ? List.of() : e.getSets().stream()
                        .map(s -> new PlanSetDto(s.getReps()))
                        .toList(),
                    e.getOrder()))
                .toList(),
            d.isRest()))
        .toList();
    return new WorkoutPlanDto(plan.getId(), days, plan.getUpdatedAt() == null ? null : plan.getUpdatedAt().toString());
  }

  private WorkoutPlanDto emptyPlanDto() {
    List<PlanDayDto> days = IntStream.range(0, 7)
        .mapToObj(i -> new PlanDayDto(i, "", List.of(), List.of(), true))
        .toList();
    return new WorkoutPlanDto(null, days, null);
  }
}
