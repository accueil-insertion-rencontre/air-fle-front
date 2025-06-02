import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { User, UserDisplayInfo } from '../models/user.model';
import { environment } from '../../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  statusCode: number;
  timestamp: string;
}

interface UsersResponse {
  data: User[];
  meta: {
    total: number;
    skip: number;
    take: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère tous les utilisateurs qui peuvent être professeurs
   */
  getTeachers(): Observable<User[]> {
    return this.http.get<any>(`${this.apiUrl}?role=teacher`)
      .pipe(
        map(response => {
          console.log('Réponse brute de l\'API pour getTeachers:', response);
          
          if (response && response.data) {
            if (Array.isArray(response.data.data)) {
              // Structure avec meta
              return response.data.data.map((user: any) => this.convertToFrontendModel(user));
            } else if (Array.isArray(response.data)) {
              // Structure directe
              return response.data.map((user: any) => this.convertToFrontendModel(user));
            }
          }
          
          // Fallback: si la réponse est directement un tableau
          if (Array.isArray(response)) {
            return response.map((user: any) => this.convertToFrontendModel(user));
          }
          
          return [];
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Récupère tous les utilisateurs (pour une sélection plus large)
   */
  getAllUsers(): Observable<User[]> {
    return this.http.get<any>(this.apiUrl)
      .pipe(
        map(response => {
          console.log('Réponse brute de l\'API pour getAllUsers:', response);
          
          if (response && response.data) {
            if (Array.isArray(response.data.data)) {
              // Structure avec meta
              return response.data.data.map((user: any) => this.convertToFrontendModel(user));
            } else if (Array.isArray(response.data)) {
              // Structure directe
              return response.data.map((user: any) => this.convertToFrontendModel(user));
            }
          }
          
          // Fallback: si la réponse est directement un tableau
          if (Array.isArray(response)) {
            return response.map((user: any) => this.convertToFrontendModel(user));
          }
          
          return [];
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Récupère un utilisateur par son ID
   */
  getUserById(id: string | number): Observable<User> {
    return this.http.get<any>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          console.log('Réponse brute de l\'API pour getUserById:', response);
          
          if (response && response.data) {
            return this.convertToFrontendModel(response.data);
          }
          
          throw new Error('Utilisateur non trouvé');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Convertit un utilisateur en format d'affichage pour les sélecteurs
   */
  getUserDisplayInfo(user: User): UserDisplayInfo {
    return {
      id: user.id || user.user_id || '',
      fullName: `${user.firstname} ${user.lastname}`.trim(),
      email: user.email,
      role: user.role
    };
  }

  /**
   * Convertit une liste d'utilisateurs en format d'affichage
   */
  getUsersDisplayInfo(users: User[]): UserDisplayInfo[] {
    return users.map(user => this.getUserDisplayInfo(user));
  }

  /**
   * Convertit les données de l'API vers le modèle frontend
   */
  private convertToFrontendModel(apiUser: any): User {
    console.log('User API à convertir:', apiUser);
    
    return {
      id: apiUser.id || apiUser.user_id,
      user_id: apiUser.id || apiUser.user_id,
      firstname: apiUser.firstname || '',
      lastname: apiUser.lastname || '',
      email: apiUser.email || '',
      role: apiUser.role?.rolename || apiUser.role || '',
      birthdate: apiUser.birthdate,
      isActive: apiUser.isActive,
      created_at: apiUser.created_at || apiUser.createdAt,
      updated_at: apiUser.updated_at || apiUser.updatedAt
    };
  }

  /**
   * Gère les erreurs HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Une erreur est survenue dans UserService:', error);
    return throwError(() => error);
  }
} 