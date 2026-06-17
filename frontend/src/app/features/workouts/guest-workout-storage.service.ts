import { Injectable, signal } from '@angular/core';
import { openDB, type IDBPDatabase } from 'idb';
import type { LiveWorkout } from './live-workout.models';
import type { GuestCompletedWorkout } from './guest-workout.models';

/** Name and version of the local guest database. */
const DB_NAME = 'liftorium_guest_db';
const DB_VERSION = 1;

/** Object store names. */
const STORE_ACTIVE = 'active_workout';
const STORE_COMPLETED = 'completed_workouts';

/** The single key used for the active-workout record. */
const ACTIVE_KEY = 'current';

/** localStorage key used as fallback for the active workout. */
const LS_ACTIVE_KEY = 'liftorium_active_workout';

/** localStorage key used as fallback for completed workouts. */
const LS_COMPLETED_KEY = 'liftorium_completed_workouts';

// ---------------------------------------------------------------------------
// Typed database schema for idb
// ---------------------------------------------------------------------------
interface GuestDb {
  active_workout: {
    key: string;
    value: LiveWorkout & { key: string };
  };
  completed_workouts: {
    key: string;
    value: GuestCompletedWorkout;
    indexes: {
      synced: boolean;
      startedAt: number;
    };
  };
}

@Injectable({ providedIn: 'root' })
export class GuestWorkoutStorageService {
  /** Exposes which backend is currently active. */
  readonly storageType = signal<'indexeddb' | 'localstorage'>('indexeddb');

  /** Promise that resolves to the open IDB instance, or null on error. */
  private readonly dbPromise: Promise<IDBPDatabase<GuestDb> | null>;

  constructor() {
    this.dbPromise = this.initDb();
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private async initDb(): Promise<IDBPDatabase<GuestDb> | null> {
    try {
      const db = await openDB<GuestDb>(DB_NAME, DB_VERSION, {
        upgrade(database) {
          // active_workout — single record store
          if (!database.objectStoreNames.contains(STORE_ACTIVE)) {
            database.createObjectStore(STORE_ACTIVE, { keyPath: 'key' });
          }

          // completed_workouts — multi-record store with indexes
          if (!database.objectStoreNames.contains(STORE_COMPLETED)) {
            const completedStore = database.createObjectStore(STORE_COMPLETED, {
              keyPath: 'id',
            });
            completedStore.createIndex('synced', 'synced', { unique: false });
            completedStore.createIndex('startedAt', 'startedAt', { unique: false });
          }
        },
      });
      return db;
    } catch {
      // IndexedDB unavailable (private browsing, quota exceeded, etc.)
      this.storageType.set('localstorage');
      return null;
    }
  }

  /** Returns the open DB, or null when falling back to localStorage. */
  private async db(): Promise<IDBPDatabase<GuestDb> | null> {
    return this.dbPromise;
  }

  // -------------------------------------------------------------------------
  // Active workout — IndexedDB path
  // -------------------------------------------------------------------------

  async saveActiveWorkout(workout: LiveWorkout): Promise<void> {
    const db = await this.db();
    if (db) {
      await db.put(STORE_ACTIVE, { ...workout, key: ACTIVE_KEY });
    } else {
      localStorage.setItem(LS_ACTIVE_KEY, JSON.stringify(workout));
    }
  }

  async loadActiveWorkout(): Promise<LiveWorkout | null> {
    const db = await this.db();
    if (db) {
      const record = await db.get(STORE_ACTIVE, ACTIVE_KEY);
      if (!record) return null;
      const { key: _key, ...workout } = record;
      if (this.isStale(workout.startedAt)) {
        await this.autoCompleteStaleWorkout(workout as LiveWorkout);
        return null;
      }
      return workout as LiveWorkout;
    } else {
      const raw = localStorage.getItem(LS_ACTIVE_KEY);
      if (!raw) return null;
      try {
        const workout = JSON.parse(raw) as LiveWorkout;
        if (this.isStale(workout.startedAt)) {
          await this.autoCompleteStaleWorkout(workout);
          return null;
        }
        return workout;
      } catch {
        return null;
      }
    }
  }

  /**
   * Returns true when the given epoch-ms timestamp falls on a calendar day
   * strictly before today (comparison uses local date, not UTC offset).
   */
  private isStale(startedAtMs: number): boolean {
    const startedDate = new Date(startedAtMs);
    const today = new Date();
    // Normalise both dates to midnight so we compare calendar days only
    const startedDay = new Date(
      startedDate.getFullYear(),
      startedDate.getMonth(),
      startedDate.getDate(),
    ).getTime();
    const todayDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    ).getTime();
    return startedDay < todayDay;
  }

  /**
   * Moves a stale active workout into completed_workouts and clears the
   * active slot, so the caller can return null to the consumer.
   */
  private async autoCompleteStaleWorkout(workout: LiveWorkout): Promise<void> {
    const completed: GuestCompletedWorkout = {
      id: crypto.randomUUID(),
      name: workout.name,
      startedAt: workout.startedAt,
      finishedAt: Date.now(), // auto-completed now — workout was never explicitly finished
      accumulatedMs: workout.accumulatedMs,
      exercises: workout.exercises,
      synced: false,
      syncedAt: null,
      createdLocally: new Date().toISOString(),
    };
    await this.saveCompletedWorkout(completed);
    await this.clearActiveWorkout();
  }

  async clearActiveWorkout(): Promise<void> {
    const db = await this.db();
    if (db) {
      await db.delete(STORE_ACTIVE, ACTIVE_KEY);
    } else {
      localStorage.removeItem(LS_ACTIVE_KEY);
    }
  }

  // -------------------------------------------------------------------------
  // Completed workouts — IndexedDB path
  // -------------------------------------------------------------------------

  async saveCompletedWorkout(workout: GuestCompletedWorkout): Promise<void> {
    // Enforce invariants regardless of what the caller passed in
    if (workout.startedAt >= workout.finishedAt) {
      throw new Error(
        `saveCompletedWorkout: startedAt (${workout.startedAt}) must be before finishedAt (${workout.finishedAt})`,
      );
    }

    const record: GuestCompletedWorkout = {
      ...workout,
      id: workout.id || crypto.randomUUID(),
      synced: false,
      syncedAt: null,
    };

    const db = await this.db();
    if (db) {
      await db.put(STORE_COMPLETED, record);
    } else {
      const all = this.lsReadCompleted();
      const idx = all.findIndex(w => w.id === record.id);
      if (idx >= 0) {
        all[idx] = record;
      } else {
        all.push(record);
      }
      localStorage.setItem(LS_COMPLETED_KEY, JSON.stringify(all));
    }
  }

  async getPendingWorkouts(): Promise<GuestCompletedWorkout[]> {
    const db = await this.db();
    if (db) {
      return db.getAllFromIndex(STORE_COMPLETED, 'synced', IDBKeyRange.only(false));
    } else {
      return this.lsReadCompleted().filter(w => !w.synced);
    }
  }

  async markWorkoutsSynced(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const syncedAt = new Date().toISOString();
    const db = await this.db();
    if (db) {
      const tx = db.transaction(STORE_COMPLETED, 'readwrite');
      await Promise.all([
        ...ids.map(async id => {
          const record = await tx.store.get(id);
          if (record && !record.synced) {
            await tx.store.put({ ...record, synced: true, syncedAt });
          }
        }),
        tx.done,
      ]);
    } else {
      const all = this.lsReadCompleted();
      for (const w of all) {
        if (ids.includes(w.id) && !w.synced) {
          w.synced = true;
          w.syncedAt = syncedAt;
        }
      }
      localStorage.setItem(LS_COMPLETED_KEY, JSON.stringify(all));
    }
  }

  async clearSyncedWorkouts(): Promise<void> {
    const db = await this.db();
    if (db) {
      const synced = await db.getAllFromIndex(
        STORE_COMPLETED,
        'synced',
        IDBKeyRange.only(true),
      );
      const tx = db.transaction(STORE_COMPLETED, 'readwrite');
      await Promise.all([
        ...synced.map(w => tx.store.delete(w.id)),
        tx.done,
      ]);
    } else {
      const pending = this.lsReadCompleted().filter(w => !w.synced);
      localStorage.setItem(LS_COMPLETED_KEY, JSON.stringify(pending));
    }
  }

  // -------------------------------------------------------------------------
  // localStorage helpers
  // -------------------------------------------------------------------------

  private lsReadCompleted(): GuestCompletedWorkout[] {
    const raw = localStorage.getItem(LS_COMPLETED_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as GuestCompletedWorkout[];
    } catch {
      return [];
    }
  }
}
