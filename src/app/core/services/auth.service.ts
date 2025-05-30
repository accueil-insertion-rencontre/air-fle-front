import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  role: string;
}

export interface AuthResponse {
  success: boolean;
  access_token: string;
  user: User;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  // Clé de localStorage pour le token uniquement
  private readonly ACCESS_TOKEN_KEY = 'access_token';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(email: string, password: string): Observable<any> {
    const url = `${this.apiUrl}/auth/login`;
    const payload = { email, password };
    
    return this.http.post(url, payload)
      .pipe(
        tap((response: any) => {
          try {
            // Vérifier si la réponse contient un token dans data.access_token
            if (response?.data?.access_token) {
              const token = response.data.access_token;
              
              // Stockage explicite avec la clé fixe (uniquement le token)
              localStorage.setItem('access_token', token);
              
              // Mettre à jour l'utilisateur courant sans stocker dans localStorage
              if (response.data.user) {
                this.currentUserSubject.next(response.data.user);
              }
            }
          } catch (error) {
            // Gestion silencieuse des erreurs
          }
        })
      );
  }

  logout(): void {
    const url = `${this.apiUrl}/auth/logout`;
    
    // Récupération du token pour l'envoyer au backend
    const token = this.getToken();
    
    if (token) {
      // Appel API pour la déconnexion côté serveur
      this.http.post(url, {}).subscribe({
        next: () => {
          this.clearLocalStorage();
        },
        error: () => {
          this.clearLocalStorage();
        }
      });
    } else {
      // Si pas de token, simplement nettoyer le localStorage
      this.clearLocalStorage();
    }
  }
  
  // Méthode séparée pour nettoyer le localStorage
  private clearLocalStorage(): void {
    // Supprimer uniquement le token
    localStorage.removeItem('access_token');
    
    // Mise à jour du BehaviorSubject
    this.currentUserSubject.next(null);
    
    // Redirection vers la page de login
    this.router.navigate(['/auth/login']);
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    // Utilisation directe de la clé fixe
    const token = localStorage.getItem('access_token');
    return !!token;
  }

  getToken(): string | null {
    // Utiliser directement 'access_token' au lieu de this.ACCESS_TOKEN_KEY
    return localStorage.getItem('access_token');
  }
  
  // Méthode pour faciliter le debugging de l'API
  logTokenToConsole(): void {
    const token = this.getToken();
    console.log('Token actuel:', token);
  }
} 