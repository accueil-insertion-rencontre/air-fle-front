import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface Gender {
  id: string;
  label: string;
}

export interface Nationality {
  id: string;
  label: string;
}

export interface FrenchLevel {
  id: string;
  code: string;
  description: string;
}

export interface Financing {
  id: string;
  type: string;
}

export interface Status {
  id: string;
  label: string;
}

export interface Orientation {
  id: string;
  label: string;
}

export interface ExitReason {
  id: string;
  label: string;
}

export interface Disability {
  id: string;
  label: string;
}

export interface ReferenceData {
  genders: Gender[];
  nationalities: Nationality[];
  frenchLevels: FrenchLevel[];
  financings: Financing[];
  statuses: Status[];
  orientations: Orientation[];
  exitReasons: ExitReason[];
  disabilities: Disability[];
}

@Injectable({
  providedIn: 'root'
})
export class ReferenceDataService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Méthode utilitaire pour extraire les données de la réponse API
   */
  private extractData<T>(response: any): T[] {
    if (response && response.success && response.data) {
      return Array.isArray(response.data) ? response.data : [];
    } else if (Array.isArray(response)) {
      return response;
    } else {
      return [];
    }
  }

  /**
   * Récupère tous les genres
   */
  getGenders(): Observable<Gender[]> {
    return this.http.get<any>(`${this.baseUrl}/genders`).pipe(
      map(response => this.extractData<Gender>(response)),
      catchError(err => {
        console.error('Erreur lors du chargement des genres:', err);
        return of([]);
      })
    );
  }

  /**
   * Récupère toutes les nationalités
   */
  getNationalities(): Observable<Nationality[]> {
    return this.http.get<any>(`${this.baseUrl}/nationalities`).pipe(
      map(response => this.extractData<Nationality>(response)),
      catchError(err => {
        console.error('Erreur lors du chargement des nationalités:', err);
        return of([]);
      })
    );
  }

  /**
   * Récupère tous les niveaux de français
   */
  getFrenchLevels(): Observable<FrenchLevel[]> {
    return this.http.get<any>(`${this.baseUrl}/french-levels`).pipe(
      map(response => this.extractData<FrenchLevel>(response)),
      catchError(err => {
        console.error('Erreur lors du chargement des niveaux de français:', err);
        return of([]);
      })
    );
  }

  /**
   * Récupère tous les types de financement
   */
  getFinancings(): Observable<Financing[]> {
    return this.http.get<any>(`${this.baseUrl}/financings`).pipe(
      map(response => this.extractData<Financing>(response)),
      catchError(err => {
        console.error('Erreur lors du chargement des financements:', err);
        return of([]);
      })
    );
  }

  /**
   * Récupère tous les statuts
   */
  getStatuses(): Observable<Status[]> {
    return this.http.get<any>(`${this.baseUrl}/statuses`).pipe(
      map(response => this.extractData<Status>(response)),
      catchError(err => {
        console.error('Erreur lors du chargement des statuts:', err);
        return of([]);
      })
    );
  }

  /**
   * Récupère toutes les orientations (optionnel)
   */
  getOrientations(): Observable<Orientation[]> {
    return this.http.get<any>(`${this.baseUrl}/orientations`).pipe(
      map(response => this.extractData<Orientation>(response)),
      catchError(err => {
        console.error('Erreur lors du chargement des orientations:', err);
        return of([]);
      })
    );
  }

  /**
   * Récupère toutes les raisons de sortie (optionnel)
   */
  getExitReasons(): Observable<ExitReason[]> {
    return this.http.get<any>(`${this.baseUrl}/exit-reasons`).pipe(
      map(response => this.extractData<ExitReason>(response)),
      catchError(err => {
        console.error('Erreur lors du chargement des raisons de sortie:', err);
        return of([]);
      })
    );
  }

  /**
   * Récupère tous les handicaps (optionnel)
   */
  getDisabilities(): Observable<Disability[]> {
    return this.http.get<any>(`${this.baseUrl}/disabilities`).pipe(
      map(response => this.extractData<Disability>(response)),
      catchError(err => {
        console.error('Erreur lors du chargement des handicaps:', err);
        return of([]);
      })
    );
  }

  /**
   * Récupère toutes les données de référence en une seule fois
   */
  getAllReferenceData(): Observable<ReferenceData> {
    return forkJoin({
      genders: this.getGenders(),
      nationalities: this.getNationalities(),
      frenchLevels: this.getFrenchLevels(),
      financings: this.getFinancings(),
      statuses: this.getStatuses(),
      orientations: this.getOrientations(),
      exitReasons: this.getExitReasons(),
      disabilities: this.getDisabilities()
    });
  }

  /**
   * Récupère seulement les données obligatoires
   */
  getRequiredReferenceData(): Observable<Partial<ReferenceData>> {
    return forkJoin({
      genders: this.getGenders(),
      nationalities: this.getNationalities(),
      frenchLevels: this.getFrenchLevels(),
      financings: this.getFinancings(),
      statuses: this.getStatuses()
    });
  }
} 