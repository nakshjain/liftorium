import { Injectable, computed, signal } from '@angular/core';
import { MuscleGroup, PlanDay, PlanTemplate, WorkoutPlan, emptyPlan } from './plan.models';

const STORAGE_KEY = 'gym_workout_plan';

@Injectable({ providedIn: 'root' })
export class PlanStore {
  readonly plan = signal<WorkoutPlan>(this.load());
  readonly activeTemplateId = signal<string | null>(this.detectTemplate());

  readonly activeDayCount = computed(
    () => this.plan().days.filter((d) => !d.rest).length,
  );

  readonly todayDayOfWeek = computed(() => {
    const jsDay = new Date().getDay(); // 0 = Sun
    return jsDay === 0 ? 6 : jsDay - 1; // convert to Mon=0
  });

  applyTemplate(template: PlanTemplate): void {
    this.plan.update((p) => ({ ...p, days: template.days.map((d) => ({ ...d })) }));
    this.activeTemplateId.set(template.id);
    this.persist();
  }

  clearTemplate(): void {
    this.plan.update((p) => ({
      ...p,
      days: p.days.map((d) => ({ ...d, label: '', muscleGroups: [], rest: true })),
    }));
    this.activeTemplateId.set(null);
    this.persist();
  }

  toggleRest(dayOfWeek: number): void {
    this.plan.update((p) => ({
      ...p,
      days: p.days.map((d) =>
        d.dayOfWeek === dayOfWeek
          ? { ...d, rest: !d.rest, muscleGroups: d.rest ? d.muscleGroups : [], label: d.rest ? d.label : '' }
          : d,
      ),
    }));
    this.activeTemplateId.set(null);
    this.persist();
  }

  setLabel(dayOfWeek: number, label: string): void {
    this.plan.update((p) => ({
      ...p,
      days: p.days.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, label } : d)),
    }));
    this.activeTemplateId.set(null);
    this.persist();
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
    this.persist();
  }

  getDay(dayOfWeek: number): PlanDay {
    return this.plan().days.find((d) => d.dayOfWeek === dayOfWeek)!;
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.plan()));
    } catch { /* quota */ }
  }

  private load(): WorkoutPlan {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as WorkoutPlan) : emptyPlan();
    } catch {
      return emptyPlan();
    }
  }

  private detectTemplate(): string | null {
    // Detect if loaded plan matches a known template
    return null;
  }
}
