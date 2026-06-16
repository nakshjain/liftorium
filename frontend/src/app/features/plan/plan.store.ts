import { Injectable, computed, inject, signal } from '@angular/core';
import { MuscleGroup, PlanDay, PlanTemplate, WorkoutPlan, emptyPlan } from './plan.models';
import { PlanService } from './plan.service';

const STORAGE_KEY = 'liftorium_workout_plan';

@Injectable({ providedIn: 'root' })
export class PlanStore {
  private readonly planService = inject(PlanService);

  readonly plan = signal<WorkoutPlan>(this.loadFromStorage());
  readonly activeTemplateId = signal<string | null>(null);
  readonly templates = signal<PlanTemplate[]>([]);
  readonly templatesLoading = signal(true);

  readonly syncing = signal(false);
  readonly syncError = signal(false);
  readonly syncSuccess = signal(false);
  readonly isDirty = signal(false);
  readonly resetting = signal(false);
  readonly resetSuccess = signal(false);
  readonly resetError = signal(false);

  readonly activeDayCount = computed(
    () => this.plan().days.filter((d) => !d.rest).length,
  );

  readonly todayDayOfWeek = computed(() => {
    const jsDay = new Date().getDay();
    return jsDay === 0 ? 6 : jsDay - 1;
  });

  constructor() {
    // Load templates from server
    this.planService.getTemplates().subscribe({
      next: (templates) => {
        this.templates.set(templates);
        this.templatesLoading.set(false);
      },
      error: () => {
        this.templatesLoading.set(false);
      },
    });

    // Load user plan from server — server wins over localStorage
    this.planService.get().subscribe({
      next: (serverPlan) => {
        this.plan.set(serverPlan);
        this.persist(serverPlan);
        this.activeTemplateId.set(serverPlan.templateId ?? null);
        this.isDirty.set(false);
      },
      error: () => { /* offline — keep localStorage copy */ },
    });
  }

  save(): void {
    if (this.syncing()) return;
    this.syncing.set(true);
    this.syncError.set(false);
    this.syncSuccess.set(false);
    this.planService.save(this.plan(), this.activeTemplateId()).subscribe({
      next: (saved) => {
        this.plan.update((p) => ({ ...p, id: saved.id, templateId: saved.templateId }));
        this.persist(this.plan());
        this.syncing.set(false);
        this.syncSuccess.set(true);
        this.isDirty.set(false);
      },
      error: () => {
        this.syncing.set(false);
        this.syncError.set(true);
      },
    });
  }

  reset(): void {
    this.resetting.set(true);
    this.resetSuccess.set(false);
    this.resetError.set(false);
    this.planService.get().subscribe({
      next: (serverPlan) => {
        const planToApply = serverPlan.id ? serverPlan : emptyPlan();
        this.plan.set(planToApply);
        this.persist(planToApply);
        this.activeTemplateId.set(planToApply.templateId ?? null);
        this.isDirty.set(false);
        this.resetting.set(false);
        this.resetSuccess.set(true);
        setTimeout(() => this.resetSuccess.set(false), 2000);
      },
      error: () => {
        const fallback = emptyPlan();
        this.plan.set(fallback);
        this.persist(fallback);
        this.activeTemplateId.set(null);
        this.isDirty.set(false);
        this.resetting.set(false);
        this.resetError.set(true);
        setTimeout(() => this.resetError.set(false), 3000);
      },
    });
  }

  applyTemplate(template: PlanTemplate): void {
    this.plan.update((p) => ({
      ...p,
      days: template.days.map((d) => ({ ...d })),
      templateId: template.id,
    }));
    this.activeTemplateId.set(template.id);
    this.isDirty.set(true);
    this.syncSuccess.set(false);
    this.syncError.set(false);
    this.afterMutation(false);
  }

  clearTemplate(): void {
    this.plan.update((p) => ({
      ...p,
      templateId: null,
      days: p.days.map((d) => ({ ...d, label: '', muscleGroups: [], exercises: [], rest: true })),
    }));
    this.activeTemplateId.set(null);
    this.isDirty.set(true);
    this.syncSuccess.set(false);
    this.syncError.set(false);
    this.afterMutation(false);
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
    this.afterMutation();
  }

  setLabel(dayOfWeek: number, label: string): void {
    this.plan.update((p) => ({
      ...p,
      days: p.days.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, label } : d)),
    }));
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
    this.afterMutation();
  }

  moveExercise(dayOfWeek: number, exerciseIndex: number, direction: 'up' | 'down'): void {
    this.plan.update((p) => ({
      ...p,
      days: p.days.map((d) => {
        if (d.dayOfWeek !== dayOfWeek) return d;
        const exercises = [...d.exercises];
        const targetIndex = direction === 'up' ? exerciseIndex - 1 : exerciseIndex + 1;
        if (targetIndex < 0 || targetIndex >= exercises.length) return d;
        [exercises[exerciseIndex], exercises[targetIndex]] = [exercises[targetIndex], exercises[exerciseIndex]];
        return { ...d, exercises: exercises.map((e, i) => ({ ...e, order: i })) };
      }),
    }));
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
    this.afterMutation();
  }

  getDay(dayOfWeek: number): PlanDay {
    return this.plan().days.find((d) => d.dayOfWeek === dayOfWeek)!;
  }

  /**
   * Mark plan as custom when the user edits it after applying a template.
   * Pass false to skip clearing (e.g. when applying/clearing a template itself).
   */
  private afterMutation(markCustom = true): void {
    if (markCustom) {
      this.activeTemplateId.set(null);
      this.plan.update((p) => ({ ...p, templateId: null }));
    }
    this.isDirty.set(true);
    this.syncSuccess.set(false);
    this.syncError.set(false);
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
