import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { User, UserDisplayInfo } from '../models/user.model';
import { environment } from '../../../environments/environment';

// Service pour la gestion des utilisateurs - dernière modification: 03/06/2025
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

interface Role {
  id: string;
  rolename: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;
  private rolesUrl = `${environment.apiUrl}/auth/roles`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère l'ID du rôle "teacher"
   */
  private getTeacherRoleId(): Observable<string> {
    return this.http.get<ApiResponse<{ roles: Role[] }>>(this.rolesUrl)
      .pipe(
        map(response => {
          if (response && response.success && response.data && response.data.roles) {
            const teacherRole = response.data.roles.find(role => role.rolename === 'teacher');
            if (teacherRole) {
              return teacherRole.id;
            }
          }
          throw new Error('Rôle teacher introuvable');
        }),
        catchError(() => {
          console.warn('Impossible de récupérer le rôle teacher, utilisation du fallback');
          return throwError(() => new Error('Rôle teacher introuvable'));
        })
      );
  }

  /**
   * Récupère tous les utilisateurs qui peuvent être professeurs (rôle teacher)
   */
  getTeachers(): Observable<User[]> {
    console.log('=== RÉCUPÉRATION DES PROFESSEURS VIA API ===');
    
    return this.getTeacherRoleId().pipe(
      switchMap(teacherRoleId => {
        console.log('ID du rôle teacher trouvé:', teacherRoleId);
        
        // Utiliser le filtrage côté API
        const params = new HttpParams().set('role', teacherRoleId);
        
        return this.http.get<ApiResponse<UsersResponse>>(this.apiUrl, { params })
          .pipe(
            map(response => {
              console.log('Réponse API pour les professeurs:', response);
              
              if (response && response.success && response.data) {
                if (response.data.data && Array.isArray(response.data.data)) {
                  return response.data.data.map((user: any) => this.convertToFrontendModel(user));
                } else if (Array.isArray(response.data)) {
                  return response.data.map((user: any) => this.convertToFrontendModel(user));
                }
              }
              
              return [];
            })
          );
      }),
      catchError(error => {
        console.warn('Erreur lors de la récupération des professeurs via API, utilisation du fallback:', error);
        return this.getTeachersFallback();
      })
    );
  }

  /**
   * Méthode de fallback : récupère tous les utilisateurs et filtre les teachers côté client
   */
  private getTeachersFallback(): Observable<User[]> {
    console.log('=== FALLBACK: FILTRAGE CÔTÉ CLIENT ===');
    
    return this.getAllUsers().pipe(
      map(users => {
        const teachers = users.filter(user => {
          const isTeacher = user.role && (
            user.role.toLowerCase() === 'teacher' ||
            user.role.toLowerCase() === 'professeur' ||
            user.role.toLowerCase() === 'formateur'
          );
          return isTeacher;
        });
        
        console.log(`Professeurs trouvés en fallback: ${teachers.length}`);
        return teachers;
      })
    );
  }

  /**
   * Récupère tous les utilisateurs (pour une sélection plus large)
   */
  getAllUsers(): Observable<User[]> {
    return this.http.get<ApiResponse<UsersResponse>>(this.apiUrl)
      .pipe(
        map(response => {
          if (response && response.success && response.data) {
            if (response.data.data && Array.isArray(response.data.data)) {
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
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          if (response && response.success && response.data) {
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
    // Gérer différentes structures de rôles
    let roleName = '';
    if (apiUser.role) {
      if (typeof apiUser.role === 'string') {
        roleName = apiUser.role;
      } else if (apiUser.role.rolename) {
        roleName = apiUser.role.rolename;
      }
    }
    
    const convertedUser: User = {
      id: apiUser.id || apiUser.user_id,
      user_id: apiUser.id || apiUser.user_id,
      firstname: apiUser.firstname || '',
      lastname: apiUser.lastname || '',
      email: apiUser.email || '',
      role: roleName,
      birthdate: apiUser.birthdate,
      isActive: apiUser.isActive,
      created_at: apiUser.created_at || apiUser.createdAt,
      updated_at: apiUser.updated_at || apiUser.updatedAt
    };
    
    return convertedUser;
  }

  /**
   * Gère les erreurs HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Une erreur est survenue dans UserService:', error);
    
    let errorMessage = 'Une erreur est survenue';
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      errorMessage = `Erreur ${error.status}: ${error.message}`;
      if (error.error && error.error.message) {
        errorMessage += ` - ${error.error.message}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
} 