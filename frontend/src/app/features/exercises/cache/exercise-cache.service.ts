import { Injectable } from '@angular/core';
import { IDBPDatabase, openDB } from 'idb';
import type { CachedExercise, CatalogMetadata, ExerciseCacheSchema } from './exercise-cache.models';

@Injectable({ providedIn: 'root' })
export class ExerciseCacheService {
  private db: IDBPDatabase<ExerciseCacheSchema> | undefined;

  async initialize(): Promise<void> {
    this.db = await openDB<ExerciseCacheSchema>('ExerciseCacheDB', 1, {
      upgrade(db) {
        const exerciseStore = db.createObjectStore('exercises', { keyPath: 'id' });
        exerciseStore.createIndex('by-name', 'normalizedName');
        exerciseStore.createIndex('by-type', 'exerciseType');

        db.createObjectStore('metadata', { keyPath: 'key' });
      },
    });
  }

  async getAllExercises(): Promise<CachedExercise[]> {
    if (!this.db) {
      return [];
    }
    return this.db.getAll('exercises');
  }

  async replaceAll(exercises: CachedExercise[], metadata: CatalogMetadata): Promise<void> {
    if (!this.db) {
      return;
    }

    const tx = this.db.transaction(['exercises', 'metadata'], 'readwrite');
    const exerciseStore = tx.objectStore('exercises');

    await exerciseStore.clear();

    for (const exercise of exercises) {
      await exerciseStore.put({
        ...exercise,
        normalizedName: exercise.normalizedName ?? exercise.name.toLowerCase(),
      });
    }

    await tx.objectStore('metadata').put(metadata);
    await tx.done;
  }

  async getMetadata(): Promise<CatalogMetadata | null> {
    if (!this.db) {
      return null;
    }
    return (await this.db.get('metadata', 'catalog')) ?? null;
  }
}
