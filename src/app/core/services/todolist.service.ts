import { environment } from '@environments/environment';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { ApiResponse } from '../models/reference-data.model';

export interface Subtask {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'completed';
  createdAt: string;
  updatedAt: string;
  task_id: string;
}

export interface TaskStatistics {
  total: number;
  completed: number;
  pending: number;
  completionPercentage: number;
}

export interface GlobalStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  completionPercentage: number;
}

export interface TodoTask {
  id: string;
  title: string;
  description?: string;
  dueAt?: string;
  status: 'pending' | 'completed' | 'in_progress';
  completionPercentage: number;
  createdAt: string;
  updatedAt: string;
  user_id: string;
  user?: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
    role_id: string;
    isActive: boolean;
  };
  subtasks?: Subtask[];
  statistics?: TaskStatistics;
}

export interface TasksResponse {
  tasks: TodoTask[];
  globalStats: GlobalStats;
}

export interface CreateTodoRequest {
  title: string;
  description?: string;
  dueAt?: string;
  parentTaskId?: string;
}

export interface CreateTodoWithSubtasksRequest {
  title: string;
  description?: string;
  subtasks: SubtaskRequest[];
}

export interface SubtaskRequest {
  title: string;
  description?: string;
}

export interface TodoStats {
  total: number;
  completed: number;
  pending: number;
}

// Réexport de l'interface ApiResponse
export type { ApiResponse } from '../models/reference-data.model';

@Injectable({
  providedIn: 'root',
})
export class TodolistService {
  private apiUrl = `${environment.apiUrl}/tasks`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère toutes les tâches de l'utilisateur connecté (API v1)
   */
  getTodolists(): Observable<TodoTask[]> {
    return this.http.get<ApiResponse<TasksResponse>>(this.apiUrl).pipe(
      map(response => response.data?.tasks || []),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Récupère toutes les tâches avec les statistiques globales
   */
  getTasksWithStats(): Observable<TasksResponse> {
    return this.http.get<ApiResponse<TasksResponse>>(this.apiUrl).pipe(
      map(response => response.data),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Crée une nouvelle tâche (ancienne API - deprecated)
   */
  createTodolist(todo: CreateTodoRequest): Observable<TodoTask> {
    return this.http.post<ApiResponse<TodoTask>>(this.apiUrl, todo).pipe(
      map(response => response.data),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Crée une nouvelle tâche avec sous-tâches (nouvelle API v1)
   */
  createTodoWithSubtasks(todo: CreateTodoWithSubtasksRequest): Observable<TodoTask> {
    return this.http.post<ApiResponse<TodoTask>>(this.apiUrl, todo).pipe(
      map(response => response.data),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Toggle le statut d'une tâche (pending ↔ completed) - API v1
   */
  toggleTaskStatus(taskId: string): Observable<TodoTask> {
    return this.http.put<ApiResponse<TodoTask>>(`${this.apiUrl}/${taskId}/toggle-status`, {}).pipe(
      map(response => response.data),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Toggle le statut d'une sous-tâche (pending ↔ completed) - API v1
   */
  toggleSubtaskStatus(subtaskId: string): Observable<Subtask> {
    const subtaskUrl = `${environment.apiUrl}/tasks/subtasks/${subtaskId}/toggle`;
    return this.http.patch<ApiResponse<Subtask>>(subtaskUrl, {}).pipe(
      map(response => response.data),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Supprime une tâche - API v1
   */
  deleteTodolist(taskId: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${taskId}`).pipe(
      map(() => void 0),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Supprime une sous-tâche - API v1
   */
  deleteSubtask(subtaskId: string): Observable<void> {
    const subtaskUrl = `${environment.apiUrl}/tasks/subtasks/${subtaskId}`;
    return this.http.delete<ApiResponse<void>>(subtaskUrl).pipe(
      map(() => void 0),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Calcule les statistiques des tâches
   */
  calculateStats(tasks: TodoTask[]): TodoStats {
    const total = tasks.length;
    const completed = tasks.filter(task => task.status === 'completed').length;
    const pending = total - completed;

    return { total, completed, pending };
  }
} 