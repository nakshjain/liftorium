package com.gymhelper.service;

import com.gymhelper.dto.PlanDtos.PlanDayDto;
import com.gymhelper.dto.PlanDtos.PlanDayRequest;
import com.gymhelper.dto.PlanDtos.UpsertPlanRequest;
import com.gymhelper.dto.PlanDtos.WorkoutPlanDto;
import com.gymhelper.entity.PlanDay;
import com.gymhelper.entity.WorkoutPlan;
import com.gymhelper.repository.WorkoutPlanRepository;
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
            .rest(r.rest())
            .build())
        .toList();
  }

  private WorkoutPlanDto toDto(WorkoutPlan plan) {
    List<PlanDayDto> days = plan.getDays().stream()
        .map(d -> new PlanDayDto(d.getDayOfWeek(), d.getLabel(), d.getMuscleGroups(), d.isRest()))
        .toList();
    return new WorkoutPlanDto(plan.getId(), days, plan.getUpdatedAt() == null ? null : plan.getUpdatedAt().toString());
  }

  private WorkoutPlanDto emptyPlanDto() {
    List<PlanDayDto> days = IntStream.range(0, 7)
        .mapToObj(i -> new PlanDayDto(i, "", List.of(), true))
        .toList();
    return new WorkoutPlanDto(null, days, null);
  }
}
