import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

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

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  statusCode: number;
  timestamp: string;
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

@Injectable({
  providedIn: 'root'
})
export class TodolistService {
  private apiUrl = `${environment.apiUrl}/tasks`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère toutes les tâches de l'utilisateur connecté (API v1)
   */
  getTodolists(): Observable<TodoTask[]> {
    console.log('🔄 GET Tasks V1 - URL:', this.apiUrl);
    return this.http.get<ApiResponse<TasksResponse>>(this.apiUrl).pipe(
      tap(response => console.log('✅ GET Tasks V1 - Response:', response)),
      map(response => response.data?.tasks || []),
      catchError(error => {
        console.error('❌ GET Tasks V1 - Error:', error);
        throw error;
      })
    );
  }

  /**
   * Récupère toutes les tâches avec les statistiques globales
   */
  getTasksWithStats(): Observable<TasksResponse> {
    console.log('🔄 GET Tasks with Stats V1 - URL:', this.apiUrl);
    return this.http.get<ApiResponse<TasksResponse>>(this.apiUrl).pipe(
      tap(response => console.log('✅ GET Tasks with Stats V1 - Response:', response)),
      map(response => response.data),
      catchError(error => {
        console.error('❌ GET Tasks with Stats V1 - Error:', error);
        throw error;
      })
    );
  }

  /**
   * Crée une nouvelle tâche (ancienne API - deprecated)
   */
  createTodolist(todo: CreateTodoRequest): Observable<TodoTask> {
    console.log('🔄 POST Create Task V1 - URL:', this.apiUrl);
    console.log('🔄 POST Create Task V1 - Data:', todo);
    console.log('🔄 POST Create Task V1 - Headers check:', {
      'Content-Type': 'application/json'
    });
    
    return this.http.post<ApiResponse<TodoTask>>(this.apiUrl, todo).pipe(
      tap(response => console.log('✅ POST Create Task V1 - Response:', response)),
      map(response => response.data),
      catchError(error => {
        console.error('❌ POST Create Task V1 - Error:', error);
        console.error('❌ POST Create Task V1 - Error status:', error.status);
        console.error('❌ POST Create Task V1 - Error message:', error.message);
        console.error('❌ POST Create Task V1 - Error body:', error.error);
        throw error;
      })
    );
  }

  /**
   * Crée une nouvelle tâche avec sous-tâches (nouvelle API v1)
   */
  createTodoWithSubtasks(todo: CreateTodoWithSubtasksRequest): Observable<TodoTask> {
    console.log('🔄 POST Create Task with Subtasks V1 - URL:', this.apiUrl);
    console.log('🔄 POST Create Task with Subtasks V1 - Data:', todo);
    
    return this.http.post<ApiResponse<TodoTask>>(this.apiUrl, todo).pipe(
      tap(response => console.log('✅ POST Create Task with Subtasks V1 - Response:', response)),
      map(response => response.data),
      catchError(error => {
        console.error('❌ POST Create Task with Subtasks V1 - Error status:', error.status);
        console.error('❌ POST Create Task with Subtasks V1 - Error message:', error.message);
        console.error('❌ POST Create Task with Subtasks V1 - Error body:', error.error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Toggle le statut d'une tâche (pending ↔ completed) - API v1
   */
  toggleTaskStatus(taskId: string): Observable<TodoTask> {
    console.log('🔄 PUT Toggle Task Status V1 - URL:', `${this.apiUrl}/${taskId}/toggle-status`);
    
    return this.http.put<ApiResponse<TodoTask>>(`${this.apiUrl}/${taskId}/toggle-status`, {}).pipe(
      tap(response => console.log('✅ PUT Toggle Task Status V1 - Response:', response)),
      map(response => response.data),
      catchError(error => {
        console.error('❌ PUT Toggle Task Status V1 - Error:', error);
        throw error;
      })
    );
  }

  /**
   * Toggle le statut d'une sous-tâche (pending ↔ completed) - API v1
   */
  toggleSubtaskStatus(subtaskId: string): Observable<Subtask> {
    const subtaskUrl = `${environment.apiUrl}/tasks/subtasks/${subtaskId}/toggle`;
    console.log('🔄 PATCH Toggle Subtask Status V1 - URL:', subtaskUrl);
    
    return this.http.patch<ApiResponse<Subtask>>(subtaskUrl, {}).pipe(
      tap(response => console.log('✅ PATCH Toggle Subtask Status V1 - Response:', response)),
      map(response => response.data),
      catchError(error => {
        console.error('❌ PATCH Toggle Subtask Status V1 - Error:', error);
        throw error;
      })
    );
  }

  /**
   * Calcule les statistiques des tâches
   */
  calculateStats(tasks: TodoTask[]): TodoStats {
    if (!Array.isArray(tasks)) {
      return { total: 0, completed: 0, pending: 0 };
    }
    
    const total = tasks.length;
    const completed = tasks.filter(task => task.status === 'completed').length;
    const pending = total - completed;

    return { total, completed, pending };
  }
} 