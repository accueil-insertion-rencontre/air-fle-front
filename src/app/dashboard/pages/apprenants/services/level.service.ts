import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Level, LEVELS } from '../models/level.model';

@Injectable({
  providedIn: 'root'
})
export class LevelService {
  constructor() {}

  /**
   * Récupère la liste des niveaux
   */
  getLevels(): Observable<Level[]> {
    return of(LEVELS);
  }

  /**
   * Récupère un niveau par son code
   */
  getLevelByCode(code: string): Observable<Level | undefined> {
    return of(LEVELS.find(l => l.code === code));
  }

  /**
   * Récupère le niveau suivant dans la progression
   */
  getNextLevel(currentLevel: Level): Observable<Level | undefined> {
    const currentIndex = LEVELS.findIndex(l => l.code === currentLevel.code);
    if (currentIndex === -1 || currentIndex === LEVELS.length - 1) {
      return of(undefined);
    }
    return of(LEVELS[currentIndex + 1]);
  }

  /**
   * Récupère le niveau précédent dans la progression
   */
  getPreviousLevel(currentLevel: Level): Observable<Level | undefined> {
    const currentIndex = LEVELS.findIndex(l => l.code === currentLevel.code);
    if (currentIndex <= 0) {
      return of(undefined);
    }
    return of(LEVELS[currentIndex - 1]);
  }

  /**
   * Vérifie si un niveau est supérieur à un autre
   */
  isLevelHigher(level1: Level, level2: Level): boolean {
    return level1.order > level2.order;
  }

  /**
   * Vérifie si un niveau est inférieur à un autre
   */
  isLevelLower(level1: Level, level2: Level): boolean {
    return level1.order < level2.order;
  }

  /**
   * Calcule la différence de niveaux entre deux niveaux
   */
  getLevelDifference(level1: Level, level2: Level): number {
    return level1.order - level2.order;
  }
} 