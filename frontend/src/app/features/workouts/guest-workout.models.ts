import type { WorkoutExercise } from './live-workout.models';

// Local data model for a completed guest workout (stored in IndexedDB / localStorage)
export type GuestCompletedWorkout = {
  id: string;              // client-generated UUID
  name: string;
  startedAt: number;       // epoch ms
  finishedAt: number;      // epoch ms
  accumulatedMs: number;
  exercises: WorkoutExercise[];
  synced: boolean;
  syncedAt: string | null; // ISO timestamp
  createdLocally: string;  // ISO timestamp
};

// Individual workout entry in the bulk-sync request payload
export type GuestWorkoutPayload = {
  clientId: string;        // original guest UUID for dedup
  name: string;
  startedAt: string;       // ISO 8601
  finishedAt: string;      // ISO 8601
  durationSeconds: number;
  exercises: {
    exerciseId: string;
    sets: {
      reps: number | null;
      weight: number | null;
      durationSeconds: number | null;
      distanceKm: number | null;
      speed: number | null;
      incline: number | null;
      completedAt: string | null;
    }[];
  }[];
};

// Frontend payload shape sent to POST /api/v1/workouts/sync
export type SyncBulkRequest = {
  workouts: GuestWorkoutPayload[];
};

// Reactive state of the sync flow
export type SyncState = 'idle' | 'checking' | 'pending' | 'syncing' | 'done' | 'error';

// Summary shown in the WorkoutSyncModal before the user confirms
export type SyncPreview = {
  count: number;
  earliestDate: string;
  latestDate: string;
};

// Result returned after a successful sync
export type SyncResult = {
  synced: number;
  skipped: number;
};
