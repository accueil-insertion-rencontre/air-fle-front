import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
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
   * Récupère tous les utilisateurs qui peuvent être professeurs (rôle teacher)
   */
  getTeachers(): Observable<User[]> {
    let params = new HttpParams();
    params = params.set('role', 'teacher');
    
    console.log('=== REQUÊTE POUR RÉCUPÉRER LES PROFESSEURS ===');
    console.log('URL:', this.apiUrl);
    console.log('Paramètres:', params.toString());
    
    return this.http.get<ApiResponse<UsersResponse>>(this.apiUrl, { params })
      .pipe(
        map(response => {
          console.log('Réponse brute de l\'API pour getTeachers:', response);
          
          if (response && response.success && response.data) {
            if (response.data.data && Array.isArray(response.data.data)) {
              // Structure avec meta
              console.log('Structure avec meta détectée, nombre d\'utilisateurs:', response.data.data.length);
              return response.data.data.map((user: any) => this.convertToFrontendModel(user));
            } else if (Array.isArray(response.data)) {
              // Structure directe
              console.log('Structure directe détectée, nombre d\'utilisateurs:', response.data.length);
              return response.data.map((user: any) => this.convertToFrontendModel(user));
            }
          }
          
          // Fallback: si la réponse est directement un tableau
          if (Array.isArray(response)) {
            console.log('Réponse directement un tableau, nombre d\'utilisateurs:', response.length);
            return response.map((user: any) => this.convertToFrontendModel(user));
          }
          
          console.warn('Aucune structure de données reconnue, retour d\'un tableau vide');
          return [];
        }),
        catchError(error => {
          console.error('Erreur lors de la récupération des professeurs avec filtrage API:', error);
          console.log('Tentative de fallback: récupération de tous les utilisateurs et filtrage côté client');
          
          // Fallback: récupérer tous les utilisateurs et filtrer côté client
          return this.getTeachersFallback();
        })
      );
  }

  /**
   * Méthode de fallback : récupère tous les utilisateurs et filtre les teachers côté client
   */
  private getTeachersFallback(): Observable<User[]> {
    console.log('=== FALLBACK: RÉCUPÉRATION DE TOUS LES UTILISATEURS ET FILTRAGE CÔTÉ CLIENT ===');
    
    return this.getAllUsers().pipe(
      map(users => {
        console.log('Tous les utilisateurs récupérés:', users.length);
        const teachers = users.filter(user => {
          const isTeacher = user.role && (
            user.role.toLowerCase() === 'teacher' ||
            user.role.toLowerCase() === 'professeur' ||
            user.role.toLowerCase() === 'formateur'
          );
          console.log(`User ${user.firstname} ${user.lastname} (role: ${user.role}) - Est professeur: ${isTeacher}`);
          return isTeacher;
        });
        
        console.log('Professeurs filtrés côté client:', teachers.length);
        return teachers;
      })
    );
  }

  /**
   * Récupère tous les utilisateurs (pour une sélection plus large)
   */
  getAllUsers(): Observable<User[]> {
    console.log('=== REQUÊTE POUR RÉCUPÉRER TOUS LES UTILISATEURS ===');
    console.log('URL:', this.apiUrl);
    
    return this.http.get<ApiResponse<UsersResponse>>(this.apiUrl)
      .pipe(
        map(response => {
          console.log('Réponse brute de l\'API pour getAllUsers:', response);
          
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
          console.log('Réponse brute de l\'API pour getUserById:', response);
          
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
    console.log('User API à convertir:', apiUser);
    
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
    
    console.log('User converti:', convertedUser);
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