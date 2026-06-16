import type { DBSchema } from 'idb';
import type { ExerciseType } from '../exercise.models';

/**
 * A cached exercise record stored in IndexedDB.
 * Intentionally excludes `content` (overview, instructions) — those are large
 * and fetched on demand via GET /exercises/:id?includeContent=true.
 */
export interface CachedExercise {
  id: string;
  name: string;
  /** Pre-computed lowercase name for fast in-memory search. */
  normalizedName: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  exerciseType: ExerciseType;
  level: string | null;
  mechanic: string | null;
  slug: string;
  active: boolean;
  updatedAt: string;
}

/**
 * Single metadata record stored in the `metadata` object store.
 * The key is always the literal string `'catalog'`.
 */
export interface CatalogMetadata {
  key: 'catalog';
  /** Opaque version token from the backend (SHA-1 of count:updatedAt). */
  catalogVersion: string;
  exerciseCount: number;
  /** ISO 8601 timestamp of the last successful sync. */
  lastSyncedAt: string;
}

/**
 * IndexedDB schema for ExerciseCacheDB (version 1).
 *
 * Object stores:
 *  - exercises  — keyed by exercise id (string); indexes: by-name, by-type
 *  - metadata   — keyed by 'catalog'; holds a single CatalogMetadata record
 */
export interface ExerciseCacheSchema extends DBSchema {
  exercises: {
    key: string;
    value: CachedExercise;
    indexes: {
      'by-name': string;  // normalizedName
      'by-type': string;  // exerciseType
    };
  };
  metadata: {
    key: string;
    value: CatalogMetadata;
  };
}

/** Reflects the current state of the exercise catalog in the runtime store. */
export type SyncStatus = 'loading' | 'ready' | 'refreshing' | 'error';

/** Optional filters for in-memory exercise search. */
export interface ExerciseFilters {
  muscle?: string;
  equipment?: string;
  exerciseType?: ExerciseType;
  level?: string;
}

/** Response shape of GET /api/v1/exercises/catalog-version */
export interface CatalogVersionResponse {
  version: string;
  exerciseCount: number;
}
