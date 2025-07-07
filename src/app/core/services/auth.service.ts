import { environment } from '@environments/environment';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, catchError } from 'rxjs';
import { CookieService } from './cookie.service';
import { User } from '../models';

export interface AuthResponse {
  success: boolean;
  access_token: string;
  user: User;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private cookieService: CookieService
  ) {}

  login(email: string, password: string): Observable<any> {
    const url = `${this.apiUrl}/auth/login`;
    const payload = { email, password };

    return this.http.post(url, payload).pipe(
      tap((response: any) => {
        try {
          // Vérifier si la réponse contient un token dans data.access_token
          if (response?.data?.access_token) {
            const token = response.data.access_token;

            // Stocker le token dans un cookie sécurisé
            this.cookieService.setSecureToken(token);

            // Mettre à jour l'utilisateur courant
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
          this.clearAuthData();
        },
        error: () => {
          this.clearAuthData();
        },
      });
    } else {
      // Si pas de token, simplement nettoyer les cookies
      this.clearAuthData();
    }
  }

  // Méthode séparée pour nettoyer les cookies
  private clearAuthData(): void {
    // Supprimer le token du cookie
    this.cookieService.deleteToken();

    // Mise à jour du BehaviorSubject
    this.currentUserSubject.next(null);

    // Redirection vers la page de login
    this.router.navigate(['/auth/login']);
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    const token = this.cookieService.getToken();
    return !!token;
  }

  getToken(): string | null {
    return this.cookieService.getToken();
  }

  logTokenToConsole(): void {
    const token = this.getToken();
    console.log('Token actuel:', token);
  }
}
