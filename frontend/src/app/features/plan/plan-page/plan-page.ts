import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DAY_LABELS, MUSCLE_GROUPS, PLAN_TEMPLATES, MuscleGroup } from '../plan.models';
import { PlanStore } from '../plan.store';

@Component({
  selector: 'app-plan-page',
  imports: [RouterLink, FormsModule],
  templateUrl: './plan-page.html',
})
export class PlanPageComponent {
  protected readonly store = inject(PlanStore);

  protected readonly templates = PLAN_TEMPLATES;
  protected readonly muscleGroups = MUSCLE_GROUPS;
  protected readonly dayLabels = DAY_LABELS;

  protected readonly expandedDay = signal<number | null>(null);
  protected readonly todayIndex = this.store.todayDayOfWeek;

  protected readonly activeTemplateDescription = computed(() => {
    const tid = this.store.activeTemplateId();
    if (!tid) return null;
    return this.templates.find((t) => t.id === tid)?.description ?? null;
  });

  protected toggleDay(dayOfWeek: number): void {
    this.expandedDay.update((current) => (current === dayOfWeek ? null : dayOfWeek));
  }

  protected hasMuscleGroup(dayOfWeek: number, group: MuscleGroup): boolean {
    return this.store.getDay(dayOfWeek).muscleGroups.includes(group);
  }

  protected muscleGroupChips(dayOfWeek: number): string {
    const groups = this.store.getDay(dayOfWeek).muscleGroups;
    return groups.length ? groups.join(', ') : '';
  }

  protected getDayLabel(dayOfWeek: number): string {
    return this.store.getDay(dayOfWeek).label;
  }

  protected onLabelChange(dayOfWeek: number, value: string): void {
    this.store.setLabel(dayOfWeek, value);
  }
}
