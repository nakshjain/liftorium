import { Component, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LiveWorkout } from './live-workout.models';
import { LiveWorkoutStore } from './live-workout.store';

@Component({
  selector: 'app-live-workout-page',
  imports: [RouterLink],
  template: `
    <main class="min-h-dvh bg-zinc-950 pb-32 text-zinc-50">
      <div class="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-4 sm:px-6">
        <header class="sticky top-0 z-20 -mx-4 border-b border-zinc-900 bg-zinc-950/95 px-4 pb-3 pt-2 backdrop-blur sm:-mx-6 sm:px-6">
          <div class="flex items-center justify-between gap-3">
            <div>
              <a class="text-sm font-medium text-zinc-400 transition hover:text-zinc-200" routerLink="/app">Training hub</a>
              <h1 class="mt-1 text-2xl font-semibold tracking-normal text-zinc-50">Live workout</h1>
            </div>
            @if (store.activeWorkout()) {
              <div class="rounded-lg border border-teal-400/25 bg-teal-400/10 px-3 py-2 text-right">
                <p class="text-xs font-medium uppercase tracking-wide text-teal-200">Elapsed</p>
                <p class="text-lg font-semibold text-teal-100">{{ formatTime(store.elapsedSeconds()) }}</p>
              </div>
            }
          </div>
        </header>

        @if (!store.activeWorkout()) {
          <section class="flex flex-1 flex-col justify-center py-12">
            <div class="border-y border-zinc-800 py-8">
              @if (store.lastFinishedWorkout(); as workout) {
                <p class="text-sm font-medium text-teal-300">Workout finished</p>
                <h2 class="mt-3 text-4xl font-semibold tracking-normal text-zinc-50">{{ completedSetTotal(workout) }} sets logged.</h2>
                <p class="mt-4 max-w-xl text-base leading-7 text-zinc-400">
                  Volume: {{ completedVolume(workout) }} kg across {{ workout.exercises.length }} exercises. Nice clean session.
                </p>
              } @else {
                <p class="text-sm font-medium text-teal-300">Ready when you are</p>
                <h2 class="mt-3 text-4xl font-semibold tracking-normal text-zinc-50">Start, tap, lift, repeat.</h2>
                <p class="mt-4 max-w-xl text-base leading-7 text-zinc-400">
                  A fast logging surface for actual sets: previous numbers are visible, set controls stay thumb-friendly, and rest starts the moment a set is checked off.
                </p>
              }
              <button
                class="mt-8 h-14 w-full rounded-lg bg-teal-400 px-5 text-base font-semibold text-zinc-950 transition active:scale-[0.99] sm:w-auto"
                type="button"
                (click)="store.startNewWorkout()"
              >
                Start workout
              </button>
            </div>
          </section>
        } @else {
          <section class="grid grid-cols-3 gap-2 py-4">
            <div class="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3">
              <p class="text-xs text-zinc-500">Sets</p>
              <p class="mt-1 text-xl font-semibold">{{ store.completedSetCount() }}</p>
            </div>
            <div class="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3">
              <p class="text-xs text-zinc-500">Volume</p>
              <p class="mt-1 text-xl font-semibold">{{ store.totalVolume() }} kg</p>
            </div>
            <div class="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3">
              <p class="text-xs text-zinc-500">Rest</p>
              <p class="mt-1 text-xl font-semibold" [class.text-teal-200]="store.restTimerActive()">
                {{ store.restTimerActive() ? formatTime(store.restRemainingSeconds()) : 'Ready' }}
              </p>
            </div>
          </section>

          <section class="pb-4">
            <div class="mb-3 flex items-center justify-between gap-3">
              <h2 class="text-sm font-semibold uppercase tracking-wide text-zinc-400">Add exercise</h2>
              <p class="text-xs text-zinc-500">{{ availableExerciseCount() }} available</p>
            </div>
            <div class="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
              @for (exercise of store.exercises(); track exercise.id) {
                <button
                  class="min-h-12 shrink-0 rounded-lg border px-4 py-2 text-left transition active:scale-[0.98]"
                  [class.border-teal-400]="isExerciseAdded(exercise.id)"
                  [class.bg-teal-400]="isExerciseAdded(exercise.id)"
                  [class.text-zinc-950]="isExerciseAdded(exercise.id)"
                  [class.border-zinc-800]="!isExerciseAdded(exercise.id)"
                  [class.bg-zinc-900]="!isExerciseAdded(exercise.id)"
                  [class.text-zinc-100]="!isExerciseAdded(exercise.id)"
                  type="button"
                  (click)="store.addExercise(exercise.id)"
                >
                  <span class="block text-sm font-semibold">{{ exercise.name }}</span>
                  <span class="block text-xs opacity-70">{{ exercise.target }}</span>
                </button>
              }
            </div>
          </section>

          <section class="space-y-4">
            @for (exercise of store.activeWorkout()?.exercises; track exercise.id) {
              <article class="rounded-lg border border-zinc-800 bg-zinc-900/70">
                <div class="flex items-start justify-between gap-3 border-b border-zinc-800 p-4">
                  <div>
                    <h2 class="text-lg font-semibold text-zinc-50">{{ exercise.name }}</h2>
                    <p class="mt-1 text-sm text-zinc-400">{{ exercise.target }} / {{ exercise.equipment }}</p>
                  </div>
                  <button
                    class="h-10 rounded-lg border border-zinc-700 px-3 text-sm font-medium text-zinc-300 transition hover:border-rose-400 hover:text-rose-200"
                    type="button"
                    (click)="store.removeExercise(exercise.id)"
                  >
                    Remove
                  </button>
                </div>

                <div class="grid grid-cols-[2.5rem_1fr_1fr_4rem] gap-2 border-b border-zinc-800 px-4 py-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  <span>Set</span>
                  <span>Weight</span>
                  <span>Reps</span>
                  <span class="text-right">Done</span>
                </div>

                <div class="divide-y divide-zinc-800">
                  @for (set of exercise.sets; track set.id) {
                    <div class="grid grid-cols-[2.5rem_1fr_1fr_4rem] items-center gap-2 px-4 py-3" [class.bg-teal-400/5]="set.completed">
                      <div>
                        <p class="text-base font-semibold text-zinc-300">{{ set.order }}</p>
                        <p class="text-xs text-zinc-600">{{ previousSetLabel(exercise.previous, set.order - 1) }}</p>
                      </div>

                      <div class="grid grid-cols-[2.5rem_1fr_2.5rem] overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
                        <button class="h-11 text-lg font-semibold text-zinc-300 active:bg-zinc-800" type="button" (click)="store.adjustSet(exercise.id, set.id, 'weight', -2.5)">-</button>
                        <input
                          class="h-11 min-w-0 bg-transparent text-center text-base font-semibold text-zinc-50 outline-none"
                          inputmode="decimal"
                          type="number"
                          [value]="set.weight"
                          (input)="store.setValue(exercise.id, set.id, 'weight', inputValue($event))"
                        />
                        <button class="h-11 text-lg font-semibold text-zinc-300 active:bg-zinc-800" type="button" (click)="store.adjustSet(exercise.id, set.id, 'weight', 2.5)">+</button>
                      </div>

                      <div class="grid grid-cols-[2.5rem_1fr_2.5rem] overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
                        <button class="h-11 text-lg font-semibold text-zinc-300 active:bg-zinc-800" type="button" (click)="store.adjustSet(exercise.id, set.id, 'reps', -1)">-</button>
                        <input
                          class="h-11 min-w-0 bg-transparent text-center text-base font-semibold text-zinc-50 outline-none"
                          inputmode="numeric"
                          type="number"
                          [value]="set.reps"
                          (input)="store.setValue(exercise.id, set.id, 'reps', inputValue($event))"
                        />
                        <button class="h-11 text-lg font-semibold text-zinc-300 active:bg-zinc-800" type="button" (click)="store.adjustSet(exercise.id, set.id, 'reps', 1)">+</button>
                      </div>

                      <button
                        class="h-11 rounded-lg border text-sm font-bold transition active:scale-95"
                        [class.border-teal-300]="set.completed"
                        [class.bg-teal-300]="set.completed"
                        [class.text-zinc-950]="set.completed"
                        [class.border-zinc-700]="!set.completed"
                        [class.text-zinc-300]="!set.completed"
                        type="button"
                        (click)="store.toggleSetComplete(exercise.id, set.id)"
                      >
                        {{ set.completed ? 'Done' : 'Tap' }}
                      </button>
                    </div>
                  }
                </div>

                <div class="flex gap-2 p-4">
                  <button
                    class="h-12 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 text-sm font-semibold text-zinc-100 transition active:scale-[0.99]"
                    type="button"
                    (click)="store.addSet(exercise.id)"
                  >
                    Add set
                  </button>
                  @if (exercise.sets.length > 1) {
                    <button
                      class="h-12 rounded-lg border border-zinc-700 px-4 text-sm font-semibold text-zinc-300 transition active:scale-[0.99]"
                      type="button"
                      (click)="store.removeSet(exercise.id, exercise.sets[exercise.sets.length - 1].id)"
                    >
                      Remove last
                    </button>
                  }
                </div>
              </article>
            }
          </section>
        }
      </div>

      @if (store.activeWorkout()) {
        <footer class="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur">
          <div class="mx-auto grid max-w-3xl grid-cols-[1fr_auto] gap-3">
            <div class="grid grid-cols-2 gap-2">
              <button
                class="h-12 rounded-lg border border-zinc-700 text-sm font-semibold text-zinc-200 active:bg-zinc-800"
                type="button"
                (click)="store.addRestTime(30)"
              >
                +30s rest
              </button>
              <button
                class="h-12 rounded-lg border border-zinc-700 text-sm font-semibold text-zinc-200 active:bg-zinc-800"
                type="button"
                (click)="store.skipRest()"
              >
                Skip rest
              </button>
            </div>
            <button
              class="h-12 rounded-lg bg-teal-400 px-5 text-sm font-bold text-zinc-950 transition active:scale-[0.99]"
              type="button"
              (click)="store.finishWorkout()"
            >
              Finish
            </button>
          </div>
        </footer>
      }
    </main>
  `
})
export class LiveWorkoutPageComponent implements OnInit, OnDestroy {
  protected readonly store = inject(LiveWorkoutStore);
  private timerId: number | null = null;

  protected readonly addedExerciseIds = computed(
    () => new Set(this.store.activeWorkout()?.exercises.map((exercise) => exercise.exerciseId) ?? [])
  );
  protected readonly availableExerciseCount = computed(
    () => this.store.exercises().filter((exercise) => !this.addedExerciseIds().has(exercise.id)).length
  );

  public ngOnInit(): void {
    this.timerId = window.setInterval(() => this.store.tick(), 1000);
  }

  public ngOnDestroy(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
    }
  }

  protected isExerciseAdded(exerciseId: string): boolean {
    return this.addedExerciseIds().has(exerciseId);
  }

  protected formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  protected inputValue(event: Event): string {
    return event.target instanceof HTMLInputElement ? event.target.value : '';
  }

  protected previousSetLabel(previousSets: readonly { reps: number; weight: number }[], index: number): string {
    const previousSet = previousSets[index];

    return previousSet ? `${previousSet.weight}x${previousSet.reps}` : 'New';
  }

  protected completedSetTotal(workout: LiveWorkout): number {
    return workout.exercises.reduce((count, exercise) => count + exercise.sets.filter((set) => set.completed).length, 0);
  }

  protected completedVolume(workout: LiveWorkout): number {
    return workout.exercises.reduce(
      (total, exercise) =>
        total + exercise.sets.reduce((setTotal, set) => setTotal + (set.completed ? set.reps * set.weight : 0), 0),
      0
    );
  }
}
