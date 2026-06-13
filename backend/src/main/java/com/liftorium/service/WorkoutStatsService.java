package com.liftorium.service;

import com.liftorium.dto.WorkoutDtos.PersonalRecordDto;
import com.liftorium.dto.WorkoutDtos.WorkoutStatsDto;
import com.liftorium.entity.Exercise;
import com.liftorium.entity.Workout;
import com.liftorium.entity.WorkoutExercise;
import com.liftorium.entity.WorkoutSet;
import com.liftorium.entity.WorkoutStatus;
import com.liftorium.repository.ExerciseRepository;
import com.liftorium.repository.WorkoutRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class WorkoutStatsService {

  private final WorkoutRepository workoutRepository;
  private final ExerciseRepository exerciseRepository;

  public WorkoutStatsDto getStats(String userId, YearMonth month) {
    Instant monthStart = month.atDay(1).atStartOfDay().toInstant(ZoneOffset.UTC);
    Instant monthEnd = month.plusMonths(1).atDay(1).atStartOfDay().toInstant(ZoneOffset.UTC);

    List<Workout> monthWorkouts = workoutRepository.findByUserIdAndStatusAndStartedAtBetween(
        userId, WorkoutStatus.completed, monthStart, monthEnd);

    int sessions = monthWorkouts.size();
    double totalVolume = calculateVolume(monthWorkouts);
    int totalSets = calculateSets(monthWorkouts);

    YearMonth prevMonth = month.minusMonths(1);
    Instant prevStart = prevMonth.atDay(1).atStartOfDay().toInstant(ZoneOffset.UTC);
    Instant prevEnd = month.atDay(1).atStartOfDay().toInstant(ZoneOffset.UTC);
    List<Workout> prevWorkouts = workoutRepository.findByUserIdAndStatusAndStartedAtBetween(
        userId, WorkoutStatus.completed, prevStart, prevEnd);
    double previousMonthVolume = calculateVolume(prevWorkouts);

    int streak = calculateStreak(userId);
    List<PersonalRecordDto> prs = findPersonalRecords(userId, monthWorkouts);

    return new WorkoutStatsDto(sessions, totalVolume, totalSets, streak, previousMonthVolume, prs);
  }

  private double calculateVolume(List<Workout> workouts) {
    double volume = 0;
    for (Workout w : workouts) {
      for (WorkoutExercise ex : w.getExercises()) {
        for (WorkoutSet set : ex.getSets()) {
          volume += set.getReps() * set.getWeight();
        }
      }
    }
    return volume;
  }

  private int calculateSets(List<Workout> workouts) {
    int count = 0;
    for (Workout w : workouts) {
      for (WorkoutExercise ex : w.getExercises()) {
        count += ex.getSets().size();
      }
    }
    return count;
  }

  private int calculateStreak(String userId) {
    List<Workout> all = workoutRepository.findByUserIdAndStatusOrderByStartedAtDesc(
        userId, WorkoutStatus.completed);
    if (all.isEmpty()) return 0;

    LocalDate today = LocalDate.now(ZoneOffset.UTC);
    LocalDate lastWorkoutDate = all.getFirst().getStartedAt().atZone(ZoneOffset.UTC).toLocalDate();

    if (!lastWorkoutDate.equals(today) && !lastWorkoutDate.equals(today.minusDays(1))) {
      return 0;
    }

    int streak = 1;
    LocalDate prev = lastWorkoutDate;
    for (int i = 1; i < all.size(); i++) {
      LocalDate date = all.get(i).getStartedAt().atZone(ZoneOffset.UTC).toLocalDate();
      if (date.equals(prev)) continue;
      if (date.equals(prev.minusDays(1))) {
        streak++;
        prev = date;
      } else {
        break;
      }
    }
    return streak;
  }

  private List<PersonalRecordDto> findPersonalRecords(String userId, List<Workout> monthWorkouts) {
    List<Workout> allWorkouts = workoutRepository.findByUserIdAndStatusOrderByStartedAtDesc(
        userId, WorkoutStatus.completed);

    Map<String, Double> allTimeBest = new HashMap<>();
    for (Workout w : allWorkouts) {
      for (WorkoutExercise ex : w.getExercises()) {
        for (WorkoutSet set : ex.getSets()) {
          double vol = set.getReps() * set.getWeight();
          allTimeBest.merge(ex.getExerciseId(), vol, Math::max);
        }
      }
    }

    Map<String, WorkoutSet> monthBest = new HashMap<>();
    Map<String, Instant> monthBestTime = new HashMap<>();
    for (Workout w : monthWorkouts) {
      for (WorkoutExercise ex : w.getExercises()) {
        for (WorkoutSet set : ex.getSets()) {
          double vol = set.getReps() * set.getWeight();
          String key = ex.getExerciseId();
          if (!monthBest.containsKey(key) || vol > monthBest.get(key).getReps() * (double) monthBest.get(key).getWeight()) {
            monthBest.put(key, set);
            monthBestTime.put(key, w.getStartedAt());
          }
        }
      }
    }

    List<PersonalRecordDto> prs = new ArrayList<>();
    for (Map.Entry<String, WorkoutSet> entry : monthBest.entrySet()) {
      String exerciseId = entry.getKey();
      WorkoutSet set = entry.getValue();
      double setVol = set.getReps() * set.getWeight();
      Double best = allTimeBest.get(exerciseId);
      if (best != null && setVol >= best) {
        String name = exerciseRepository.findById(exerciseId)
            .map(Exercise::getName)
            .orElse("Unknown");
        prs.add(new PersonalRecordDto(
            exerciseId, name, set.getWeight(), set.getReps(),
            monthBestTime.get(exerciseId).toString()
        ));
      }
    }

    prs.sort(Comparator.comparing(PersonalRecordDto::achievedAt).reversed());
    return prs;
  }
}
