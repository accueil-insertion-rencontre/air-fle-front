import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { User } from './models/user';

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

export interface Role {
  id: string;
  rolename: string;
  description?: string;
}

export interface CreateUserDto {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  birthdate?: string; // Format ISO 8601 (ex: "1990-01-01")
  isActive?: boolean;
  role_id: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;
  private authUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) { }

  getUsers(options: {
    skip?: number;
    take?: number;
    email?: string;
    role?: string;
  } = {}): Observable<{ data: User[], total: number }> {
    let params = new HttpParams();
    
    if (options.skip !== undefined) {
      params = params.set('skip', options.skip.toString());
    }
    
    if (options.take !== undefined) {
      params = params.set('take', options.take.toString());
    }
    
    if (options.email) {
      params = params.set('email', options.email);
    }
    
    if (options.role) {
      params = params.set('role', options.role);
    }
    
    return this.http.get<ApiResponse<UsersResponse>>(this.apiUrl, { params })
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return {
              data: response.data.data,
              total: response.data.meta.total
            };
          } else {
            throw new Error(response.message || 'Erreur inconnue');
          }
        })
      );
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          } else {
            throw new Error(response.message || 'Utilisateur non trouvé');
          }
        })
      );
  }

  getRoles(): Observable<Role[]> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.get<ApiResponse<{roles: Role[], success: boolean}>>(`${this.authUrl}/roles`, { headers })
      .pipe(
        map(response => {
          if (response.success && response.data && response.data.roles) {
            return response.data.roles;
          } else {
            throw new Error(response.message || 'Erreur lors de la récupération des rôles');
          }
        })
      );
  }

  createUser(user: CreateUserDto): Observable<User> {
    // Créer un nouvel objet avec tous les champs nécessaires
    const userData: any = {
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      password: user.password,
      role_id: user.role_id,
      isActive: Boolean(user.isActive)
    };
    
    // Ajouter la date de naissance si elle existe, en s'assurant qu'elle est au format ISO 8601
    if (user.birthdate) {
      // Vérifier si c'est déjà une chaîne au format ISO ou la formater correctement
      try {
        // Si c'est une chaîne qui ressemble à une date ISO, l'utiliser directement
        if (typeof user.birthdate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(user.birthdate)) {
          userData.birthdate = user.birthdate;
        } else {
          // Essayer de convertir en date puis en format ISO
          const date = new Date(user.birthdate as any);
          if (!isNaN(date.getTime())) {
            userData.birthdate = date.toISOString().split('T')[0]; // Format YYYY-MM-DD
          }
        }
      } catch (error) {
        // Ne pas inclure la date si elle ne peut pas être formatée correctement
      }
    }
    
    return this.http.post<ApiResponse<User>>(this.apiUrl, userData)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          } else {
            throw new Error(response.message || 'Erreur lors de la création de l\'utilisateur');
          }
        })
      );
  }

  updateUser(id: string, user: Partial<User>): Observable<User> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    // Filtrer les données pour n'inclure que les propriétés acceptées par l'API
    const filteredData: Partial<User> = {
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role_id: user.role_id,
      isActive: user.isActive
    };
    
    // Traitement spécial pour la date de naissance au format ISO 8601
    if (user.birthdate) {
      try {
        // Si c'est déjà une chaîne au format ISO, l'utiliser directement
        if (typeof user.birthdate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(user.birthdate)) {
          filteredData.birthdate = user.birthdate;
        } else {
          // Essayer de convertir en date puis en format ISO
          const date = new Date(user.birthdate as any);
          if (!isNaN(date.getTime())) {
            filteredData.birthdate = date.toISOString().split('T')[0]; // Format YYYY-MM-DD
          }
        }
      } catch (error) {
        // Ne pas inclure la date si elle ne peut pas être formatée correctement
      }
    }
    
    // Supprimer les propriétés undefined pour éviter d'envoyer des champs vides
    Object.keys(filteredData).forEach(key => {
      if (filteredData[key as keyof Partial<User>] === undefined) {
        delete filteredData[key as keyof Partial<User>];
      }
    });
    
    return this.http.patch<ApiResponse<User>>(`${this.apiUrl}/${id}`, filteredData, { headers })
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          } else {
            throw new Error(response.message || 'Erreur lors de la mise à jour de l\'utilisateur');
          }
        })
      );
  }

  deleteUser(id: string): Observable<void> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`, { headers })
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Erreur lors de la suppression de l\'utilisateur');
          }
        })
      );
  }

  updateUserPassword(data: { currentPassword: string; newPassword: string; confirmPassword: string }): Observable<void> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.post<ApiResponse<void>>(`${environment.apiUrl}/auth/change-password`, data, { headers })
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Erreur lors de la mise à jour du mot de passe');
          }
        })
      );
  }
}
