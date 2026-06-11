import { Injectable, computed, inject, signal } from '@angular/core';
import { MuscleGroup, PlanDay, PLAN_TEMPLATES, PlanTemplate, WorkoutPlan, emptyPlan } from './plan.models';
import { PlanService } from './plan.service';

const STORAGE_KEY = 'gym_workout_plan';

@Injectable({ providedIn: 'root' })
export class PlanStore {
  private readonly planService = inject(PlanService);

  readonly plan = signal<WorkoutPlan>(this.loadFromStorage());
  readonly activeTemplateId = signal<string | null>(null);
  readonly syncing = signal(false);
  readonly syncError = signal(false);
  readonly syncSuccess = signal(false);
  readonly resetting = signal(false);

  readonly activeDayCount = computed(
    () => this.plan().days.filter((d) => !d.rest).length,
  );

  readonly todayDayOfWeek = computed(() => {
    const jsDay = new Date().getDay();
    return jsDay === 0 ? 6 : jsDay - 1;
  });

  constructor() {
    // Load from server on init — server wins over localStorage
    this.planService.get().subscribe({
      next: (serverPlan) => {
        this.plan.set(serverPlan);
        this.persist(serverPlan);
      },
      error: () => { /* offline — keep localStorage copy */ },
    });
  }

  save(): void {
    if (this.syncing()) return;
    this.syncing.set(true);
    this.syncError.set(false);
    this.syncSuccess.set(false);
    this.planService.save(this.plan()).subscribe({
      next: (saved) => {
        this.plan.update((p) => ({ ...p, id: saved.id }));
        this.persist(this.plan());
        this.syncing.set(false);
        this.syncSuccess.set(true);
        setTimeout(() => this.syncSuccess.set(false), 2000);
      },
      error: () => {
        this.syncing.set(false);
        this.syncError.set(true);
      },
    });
  }

  reset(): void {
    this.resetting.set(true);
    this.planService.get().subscribe({
      next: (serverPlan) => {
        this.plan.set(serverPlan);
        this.persist(serverPlan);
        this.activeTemplateId.set(null);
        this.resetting.set(false);
      },
      error: () => {
        const defaultPlan: WorkoutPlan = {
          ...emptyPlan(),
          days: PLAN_TEMPLATES[0].days.map((d) => ({ ...d })),
        };
        this.plan.set(defaultPlan);
        this.persist(defaultPlan);
        this.activeTemplateId.set(PLAN_TEMPLATES[0].id);
        this.resetting.set(false);
      },
    });
  }

  applyTemplate(template: PlanTemplate): void {
    this.plan.update((p) => ({ ...p, days: template.days.map((d) => ({ ...d })) }));
    this.activeTemplateId.set(template.id);
    this.afterMutation();
  }

  clearTemplate(): void {
    this.plan.update((p) => ({
      ...p,
      days: p.days.map((d) => ({ ...d, label: '', muscleGroups: [], exercises: [], rest: true })),
    }));
    this.activeTemplateId.set(null);
    this.afterMutation();
  }

  toggleRest(dayOfWeek: number): void {
    this.plan.update((p) => ({
      ...p,
      days: p.days.map((d) =>
        d.dayOfWeek === dayOfWeek
          ? { ...d, rest: !d.rest, muscleGroups: d.rest ? d.muscleGroups : [], exercises: d.rest ? d.exercises : [], label: d.rest ? d.label : '' }
          : d,
      ),
    }));
    this.activeTemplateId.set(null);
    this.afterMutation();
  }

  setLabel(dayOfWeek: number, label: string): void {
    this.plan.update((p) => ({
      ...p,
      days: p.days.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, label } : d)),
    }));
    this.activeTemplateId.set(null);
    this.afterMutation();
  }

  toggleMuscleGroup(dayOfWeek: number, group: MuscleGroup): void {
    this.plan.update((p) => ({
      ...p,
      days: p.days.map((d) => {
        if (d.dayOfWeek !== dayOfWeek) return d;
        const has = d.muscleGroups.includes(group);
        return {
          ...d,
          muscleGroups: has
            ? d.muscleGroups.filter((g) => g !== group)
            : [...d.muscleGroups, group],
        };
      }),
    }));
    this.activeTemplateId.set(null);
    this.afterMutation();
  }

  addExercise(dayOfWeek: number, exercise: { exerciseId: string; exerciseName: string }): void {
    this.plan.update((p) => ({
      ...p,
      days: p.days.map((d) => {
        if (d.dayOfWeek !== dayOfWeek) return d;
        const order = d.exercises.length;
        return { ...d, exercises: [...d.exercises, { ...exercise, sets: [{ reps: 10 }], order }] };
      }),
    }));
    this.activeTemplateId.set(null);
    this.afterMutation();
  }

  removeExercise(dayOfWeek: number, exerciseIndex: number): void {
    this.plan.update((p) => ({
      ...p,
      days: p.days.map((d) => {
        if (d.dayOfWeek !== dayOfWeek) return d;
        const exercises = d.exercises
          .filter((_, i) => i !== exerciseIndex)
          .map((e, i) => ({ ...e, order: i }));
        return { ...d, exercises };
      }),
    }));
    this.activeTemplateId.set(null);
    this.afterMutation();
  }

  addSet(dayOfWeek: number, exerciseIndex: number): void {
    this.plan.update((p) => ({
      ...p,
      days: p.days.map((d) => {
        if (d.dayOfWeek !== dayOfWeek) return d;
        const exercises = d.exercises.map((e, i) =>
          i === exerciseIndex ? { ...e, sets: [...e.sets, { reps: 10 }] } : e,
        );
        return { ...d, exercises };
      }),
    }));
    this.activeTemplateId.set(null);
    this.afterMutation();
  }

  removeSet(dayOfWeek: number, exerciseIndex: number, setIndex: number): void {
    this.plan.update((p) => ({
      ...p,
      days: p.days.map((d) => {
        if (d.dayOfWeek !== dayOfWeek) return d;
        const exercises = d.exercises.map((e, i) =>
          i === exerciseIndex ? { ...e, sets: e.sets.filter((_, si) => si !== setIndex) } : e,
        );
        return { ...d, exercises };
      }),
    }));
    this.activeTemplateId.set(null);
    this.afterMutation();
  }

  updateSetReps(dayOfWeek: number, exerciseIndex: number, setIndex: number, reps: number): void {
    this.plan.update((p) => ({
      ...p,
      days: p.days.map((d) => {
        if (d.dayOfWeek !== dayOfWeek) return d;
        const exercises = d.exercises.map((e, i) =>
          i === exerciseIndex
            ? { ...e, sets: e.sets.map((s, si) => (si === setIndex ? { ...s, reps } : s)) }
            : e,
        );
        return { ...d, exercises };
      }),
    }));
    this.activeTemplateId.set(null);
    this.afterMutation();
  }

  getDay(dayOfWeek: number): PlanDay {
    return this.plan().days.find((d) => d.dayOfWeek === dayOfWeek)!;
  }

  private afterMutation(): void {
    this.persist(this.plan());
  }

  private persist(plan: WorkoutPlan): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
    } catch { /* quota */ }
  }

  private loadFromStorage(): WorkoutPlan {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as WorkoutPlan) : emptyPlan();
    } catch {
      return emptyPlan();
    }
  }
}
