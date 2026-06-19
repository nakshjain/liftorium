package com.liftorium.service;

import com.liftorium.dto.PlanDtos.PlanDayDto;
import com.liftorium.dto.PlanDtos.PlanDayRequest;
import com.liftorium.dto.PlanDtos.PlanExerciseDto;
import com.liftorium.dto.PlanDtos.PlanExerciseRequest;
import com.liftorium.dto.PlanDtos.PlanSetDto;
import com.liftorium.dto.PlanDtos.TemplateDto;
import com.liftorium.dto.PlanDtos.UpsertPlanRequest;
import com.liftorium.dto.PlanDtos.WorkoutPlanDto;
import com.liftorium.entity.PlanDay;
import com.liftorium.entity.PlanExercise;
import com.liftorium.entity.PlanSet;
import com.liftorium.entity.WorkoutPlan;
import com.liftorium.repository.WorkoutPlanRepository;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class WorkoutPlanService {

  /** templateId values that identify template plans in the workout_plans collection. */
  private static final List<String> TEMPLATE_IDS =
      List.of("ppl", "upper-lower", "full-body", "ppl-x-2", "bro-split");

  /** Human-readable metadata for each template. */
  private static final Map<String, String[]> TEMPLATE_META = Map.of(
      "ppl",         new String[]{"Push / Pull / Legs", "PPL",  "3 days — high frequency, great for intermediate lifters"},
      "upper-lower", new String[]{"Upper / Lower",      "U/L",  "4 days — balanced volume, good for all levels"},
      "full-body",   new String[]{"Full Body",           "Full", "3 days — efficient, ideal for beginners"},
      "ppl-x-2",     new String[]{"PPL ×2",              "PPL×2","6 days — push/pull/legs twice a week"},
      "bro-split",   new String[]{"Bro Split",           "Bro",  "5 days — one muscle group per day, classic bodybuilding"}
  );

  private final WorkoutPlanRepository planRepository;

  // ── Templates ─────────────────────────────────────────────────────────────

  public List<TemplateDto> getTemplates() {
    return planRepository.findAllByUserIdIn(TEMPLATE_IDS).stream()
        .map(plan -> {
          String[] meta = TEMPLATE_META.getOrDefault(plan.getUserId(), new String[]{plan.getUserId(), plan.getUserId(), ""});
          return new TemplateDto(plan.getUserId(), meta[0], meta[1], meta[2], toDayDtos(plan.getDays()));
        })
        .toList();
  }

  // ── User plan ─────────────────────────────────────────────────────────────

  public WorkoutPlanDto get(String userId) {
    return planRepository.findByUserId(userId)
        .map(this::toDto)
        .orElseGet(this::emptyPlanDto);
  }

  public WorkoutPlanDto upsert(String userId, UpsertPlanRequest input) {
    WorkoutPlan plan = planRepository.findByUserId(userId)
        .orElseGet(() -> WorkoutPlan.builder().userId(userId).build());

    plan.setDays(toDays(input.days()));
    // Only persist templateId as a reference marker — never allow a user plan to use
    // a reserved template document ID (those docs have no userId and are queried separately)
    String templateId = input.templateId();
    plan.setTemplateId(
            templateId != null && TEMPLATE_IDS.contains(templateId)
                    ? templateId
                    : null
    );
    return toDto(planRepository.save(plan));
  }

  // ── Mapping ───────────────────────────────────────────────────────────────

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
        .filter(r -> r != null)
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
    return new WorkoutPlanDto(
        plan.getId(),
        plan.getTemplateId(),
        toDayDtos(plan.getDays()),
        plan.getUpdatedAt() == null ? null : plan.getUpdatedAt().toString()
    );
  }

  private List<PlanDayDto> toDayDtos(List<PlanDay> days) {
    if (days == null) return List.of();
    return days.stream()
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
  }

  private WorkoutPlanDto emptyPlanDto() {
    List<PlanDayDto> days = IntStream.range(0, 7)
        .mapToObj(i -> new PlanDayDto(i, "", List.of(), List.of(), true))
        .toList();
    return new WorkoutPlanDto(null, null, days, null);
  }
}
