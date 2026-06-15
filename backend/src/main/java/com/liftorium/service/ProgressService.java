package com.liftorium.service;

import com.liftorium.dto.ProgressDtos.ExerciseProgressDetailDto;
import com.liftorium.dto.ProgressDtos.ExerciseProgressHistoryDto;
import com.liftorium.dto.ProgressDtos.ExerciseProgressHistoryEntryDto;
import com.liftorium.dto.ProgressDtos.ExerciseProgressSummaryDto;
import com.liftorium.dto.ProgressDtos.ListExerciseProgressQuery;
import com.liftorium.dto.ProgressDtos.ListPrEventsQuery;
import com.liftorium.dto.ProgressDtos.PaginatedExerciseProgressDto;
import com.liftorium.dto.ProgressDtos.PaginatedPrEventsDto;
import com.liftorium.dto.ProgressDtos.PrEventDto;
import com.liftorium.dto.ProgressDtos.ProgressOverviewDto;
import com.liftorium.dto.ProgressDtos.RepPrDto;
import com.liftorium.dto.ProgressDtos.StrongestExerciseDto;
import com.liftorium.entity.Exercise;
import com.liftorium.entity.progress.ExerciseProgress;
import com.liftorium.entity.progress.PrEvent;
import com.liftorium.entity.progress.PrType;
import com.liftorium.exception.AppException;
import com.liftorium.entity.progress.ExerciseProgressHistory;
import com.liftorium.repository.ExerciseProgressHistoryRepository;
import com.liftorium.repository.ExerciseProgressRepository;
import com.liftorium.repository.ExerciseRepository;
import com.liftorium.repository.PrEventRepository;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProgressService {

  private final ExerciseProgressRepository exerciseProgressRepository;
  private final ExerciseProgressHistoryRepository exerciseProgressHistoryRepository;
  private final PrEventRepository prEventRepository;
  private final ExerciseRepository exerciseRepository;

  // ── Overview ──────────────────────────────────────────────────────────

  public ProgressOverviewDto getOverview(String userId) {
    long totalPrs = prEventRepository.countByUserId(userId);
    long exercisesImproved = exerciseProgressRepository.countByUserId(userId);

    String latestPrDate = prEventRepository.findFirstByUserIdOrderByAchievedAtDesc(userId)
        .map(pr -> pr.getAchievedAt().toString())
        .orElse(null);

    StrongestExerciseDto strongest = exerciseProgressRepository
        .findFirstByUserIdOrderByWeightPrDesc(userId)
        .filter(ep -> ep.getWeightPr() > 0)
        .map(ep -> {
          String name = resolveExerciseName(ep.getExerciseId());
          return new StrongestExerciseDto(ep.getExerciseId(), name, ep.getWeightPr());
        })
        .orElse(null);

    return new ProgressOverviewDto(totalPrs, exercisesImproved, latestPrDate, strongest);
  }

  // ── Exercise progress list ────────────────────────────────────────────

  public PaginatedExerciseProgressDto listExerciseProgress(String userId, ListExerciseProgressQuery query) {
    PageRequest pageRequest = PageRequest.of(
        query.page() - 1,
        query.limit(),
        Sort.by(Sort.Order.desc("lastImprovedAt"))
    );

    Page<ExerciseProgress> page;

    if (query.search() != null && !query.search().isBlank()) {
      // Resolve exercise IDs by name search, then filter progress by those IDs
      String normalised = query.search().trim().toLowerCase();
      List<String> matchingIds = exerciseRepository
          .findByNameContainingIgnoreCase(normalised)
          .stream()
          .map(Exercise::getId)
          .toList();

      if (matchingIds.isEmpty()) {
        return new PaginatedExerciseProgressDto(List.of(), query.page(), query.limit(), 0L, 0);
      }

      page = exerciseProgressRepository.findByUserIdAndExerciseIdIn(userId, matchingIds, pageRequest);
    } else {
      page = exerciseProgressRepository.findByUserId(userId, pageRequest);
    }

    List<String> exerciseIds = page.getContent().stream()
        .map(ExerciseProgress::getExerciseId)
        .toList();
    Map<String, String> nameMap = resolveExerciseNames(exerciseIds);

    List<ExerciseProgressSummaryDto> items = page.getContent().stream()
        .map(ep -> toSummaryDto(ep, nameMap))
        .toList();

    return new PaginatedExerciseProgressDto(
        items,
        query.page(),
        query.limit(),
        page.getTotalElements(),
        page.getTotalPages()
    );
  }

  // ── Exercise progress detail ──────────────────────────────────────────

  public ExerciseProgressDetailDto getExerciseProgress(String userId, String exerciseId) {
    ExerciseProgress ep = exerciseProgressRepository
        .findByUserIdAndExerciseId(userId, exerciseId)
        .orElseThrow(() -> new AppException(
            "EXERCISE_PROGRESS_NOT_FOUND",
            "No progress data found for this exercise",
            HttpStatus.NOT_FOUND
        ));

    String name = resolveExerciseName(exerciseId);
    return toDetailDto(ep, name);
  }

  // ── PR timeline ───────────────────────────────────────────────────────

  public PaginatedPrEventsDto listPrEvents(String userId, ListPrEventsQuery query) {
    PageRequest pageRequest = PageRequest.of(
        query.page() - 1,
        query.limit(),
        Sort.by(Sort.Order.desc("achievedAt"))
    );

    PrType prType = parsePrType(query.prType());
    String exerciseId = query.exerciseId();

    Page<PrEvent> page;
    if (exerciseId != null && !exerciseId.isBlank() && prType != null) {
      page = prEventRepository.findByUserIdAndExerciseIdAndPrType(userId, exerciseId, prType, pageRequest);
    } else if (exerciseId != null && !exerciseId.isBlank()) {
      page = prEventRepository.findByUserIdAndExerciseId(userId, exerciseId, pageRequest);
    } else if (prType != null) {
      page = prEventRepository.findByUserIdAndPrType(userId, prType, pageRequest);
    } else {
      page = prEventRepository.findByUserId(userId, pageRequest);
    }

    List<String> exerciseIds = page.getContent().stream()
        .map(PrEvent::getExerciseId)
        .distinct()
        .toList();
    Map<String, String> nameMap = resolveExerciseNames(exerciseIds);

    List<PrEventDto> items = page.getContent().stream()
        .map(pr -> toPrEventDto(pr, nameMap))
        .toList();

    return new PaginatedPrEventsDto(
        items,
        query.page(),
        query.limit(),
        page.getTotalElements(),
        page.getTotalPages()
    );
  }

  // ── Exercise progress history ─────────────────────────────────────────

  public ExerciseProgressHistoryDto getExerciseProgressHistory(String userId, String exerciseId) {
    // Verify the exercise exists and resolve its name in one shot
    String exerciseName = exerciseRepository.findById(exerciseId)
        .map(Exercise::getName)
        .orElseThrow(() -> new AppException(
            "EXERCISE_NOT_FOUND",
            "Exercise not found",
            HttpStatus.NOT_FOUND
        ));

    List<ExerciseProgressHistory> entries =
        exerciseProgressHistoryRepository
            .findByUserIdAndExerciseIdOrderByPerformedAtAsc(userId, exerciseId);

    List<ExerciseProgressHistoryEntryDto> dtos = entries.stream()
        .map(this::toHistoryEntryDto)
        .toList();

    return new ExerciseProgressHistoryDto(exerciseId, exerciseName, dtos);
  }

  // ── Private helpers ───────────────────────────────────────────────────

  private ExerciseProgressSummaryDto toSummaryDto(ExerciseProgress ep, Map<String, String> nameMap) {
    long sessions = exerciseProgressHistoryRepository
        .countByUserIdAndExerciseId(ep.getUserId(), ep.getExerciseId());
    return new ExerciseProgressSummaryDto(
        ep.getExerciseId(),
        nameMap.getOrDefault(ep.getExerciseId(), "Unknown"),
        ep.getWeightPr(),
        new RepPrDto(ep.getRepPrWeight(), ep.getRepPrReps()),
        roundToTwo(ep.getEstimatedOneRepMaxPr()),
        ep.getTotalPrs(),
        sessions,
        ep.getLastImprovedAt() != null ? ep.getLastImprovedAt().toString() : null
    );
  }

  private ExerciseProgressDetailDto toDetailDto(ExerciseProgress ep, String exerciseName) {
    long sessions = exerciseProgressHistoryRepository
        .countByUserIdAndExerciseId(ep.getUserId(), ep.getExerciseId());
    return new ExerciseProgressDetailDto(
        ep.getExerciseId(),
        exerciseName,
        ep.getFirstWeightPr(),
        ep.getWeightPr(),
        new RepPrDto(ep.getRepPrWeight(), ep.getRepPrReps()),
        ep.getFirstEstimatedOneRepMax(),
        roundToTwo(ep.getEstimatedOneRepMaxPr()),
        ep.getTotalPrs(),
        sessions,
        ep.getLastImprovedAt() != null ? ep.getLastImprovedAt().toString() : null
    );
  }

  private PrEventDto toPrEventDto(PrEvent pr, Map<String, String> nameMap) {
    return new PrEventDto(
        pr.getId(),
        pr.getExerciseId(),
        nameMap.getOrDefault(pr.getExerciseId(), "Unknown"),
        pr.getPrType(),
        pr.getPreviousValue(),
        pr.getNewValue(),
        pr.getPrevRepWeight(),
        pr.getNewRepWeight(),
        pr.getWorkoutId(),
        pr.getAchievedAt().toString()
    );
  }

  private ExerciseProgressHistoryEntryDto toHistoryEntryDto(ExerciseProgressHistory h) {
    return new ExerciseProgressHistoryEntryDto(
        h.getId(),
        h.getWorkoutId(),
        h.getBestWeight(),
        h.getBestSetWeight(),
        h.getBestSetReps(),
        h.getEstimatedOneRepMax(),
        h.getPerformedAt().toString()
    );
  }

  private Map<String, String> resolveExerciseNames(List<String> exerciseIds) {
    return exerciseRepository.findAllById(exerciseIds).stream()
        .collect(Collectors.toMap(Exercise::getId, Exercise::getName));
  }

  private String resolveExerciseName(String exerciseId) {
    return exerciseRepository.findById(exerciseId)
        .map(Exercise::getName)
        .orElse("Unknown");
  }

  private PrType parsePrType(String value) {
    if (value == null || value.isBlank()) return null;
    try {
      return PrType.valueOf(value.toUpperCase());
    } catch (IllegalArgumentException e) {
      throw new AppException(
          "VALIDATION_ERROR",
          "Invalid prType: must be one of WEIGHT, REPS, ESTIMATED_ONE_REP_MAX",
          HttpStatus.UNPROCESSABLE_ENTITY
      );
    }
  }

  private double roundToTwo(double value) {
    return Math.round(value * 100.0) / 100.0;
  }
}
