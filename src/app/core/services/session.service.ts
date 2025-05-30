import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Session } from '../models/session.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private apiUrl = `${environment.apiUrl}/sessions`;
  
  // Données mock temporaires
  private mockSessions: Session[] = [
    { 
      session_id: 1, 
      label: 'Session FLE A1-A2 Paris', 
      started_at: new Date('2024-01-15'), 
      finished_at: new Date('2024-06-30'),
      external_id: 'EXT001',
      groups: []
    },
    { 
      session_id: 2, 
      label: 'Session FLE B1-B2 Lyon', 
      started_at: new Date('2024-02-01'), 
      finished_at: new Date('2024-07-15'),
      external_id: 'EXT002',
      groups: []
    },
    { 
      session_id: 3, 
      label: 'Session FLE C1-C2 Marseille', 
      started_at: new Date('2024-03-01'), 
      finished_at: new Date('2024-08-31'),
      external_id: 'EXT003',
      groups: []
    }
  ];

  constructor(private http: HttpClient) {}

  getSessions(): Observable<Session[]> {
    // En production, utiliser l'API réelle
    return this.http.get<any>(this.apiUrl)
      .pipe(
        tap(response => {
          console.log('Réponse brute de l\'API pour getSessions:', response);
        }),
        // Vérifier et adapter le format de la réponse
        map(response => {
          // Structure spécifique de votre API: response.data.data contient le tableau
          if (response && response.data && response.data.data && Array.isArray(response.data.data)) {
            return response.data.data.map((session: any) => this.convertToFrontendModel(session));
          }
          // Vérifier si la réponse est un tableau
          else if (Array.isArray(response)) {
            return response.map((session: any) => this.convertToFrontendModel(session));
          } 
          // Vérifier si la réponse est un objet avec une propriété data ou items
          else if (response && (response.data || response.items)) {
            const sessionsData = response.data || response.items;
            if (Array.isArray(sessionsData)) {
              return sessionsData.map((session: any) => this.convertToFrontendModel(session));
            }
          }
          // Si c'est un objet unique, le mettre dans un tableau
          else if (response && (response.id || response.session_id)) {
            return [this.convertToFrontendModel(response)];
          }
          
          // Si aucun format reconnu, retourner un tableau vide et logger l'erreur
          console.warn('Format de réponse API inattendu:', response);
          return [];
        }),
        catchError(this.handleError)
      );
    
    // Pour les tests, utiliser les données mock
    // return of(this.mockSessions);
  }

  getSessionById(id: number): Observable<Session> {
    // En production, utiliser l'API réelle
    return this.http.get<any>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(response => {
          console.log('Réponse brute de l\'API pour getSessionById:', response);
        }),
        map(response => {
          // Structure spécifique de votre API: response.data contient l'objet session
          if (response && response.data) {
            return this.convertToFrontendModel(response.data);
          }
          // Si la structure est différente, essayer de convertir directement
          else if (response && (response.id || response.session_id)) {
            return this.convertToFrontendModel(response);
          }
          
          // Si aucun format reconnu, logger l'erreur
          console.warn('Format de réponse API inattendu pour getSessionById:', response);
          throw new Error('Format de réponse API inattendu');
        }),
        catchError(this.handleError)
      );
    
    // Pour les tests, utiliser les données mock
    // const session = this.mockSessions.find(s => s.session_id === id);
    // if (session) {
    //   return of(session);
    // }
    // return throwError(() => new Error(`Session avec l'ID ${id} non trouvée`));
  }

  createSession(session: any): Observable<Session> {
    // Convertir les propriétés snake_case en camelCase pour l'API
    const apiSession = this.convertToApiModel(session);
    
    // Envoyer à l'API
    return this.http.post<Session>(this.apiUrl, apiSession)
      .pipe(
        map(session => this.convertToFrontendModel(session)),
        catchError(this.handleError)
      );
    
    // Pour les tests, simuler la création
    // const newSession: Session = {
    //   ...session,
    //   session_id: this.getNextId(),
    //   groups: []
    // };
    // 
    // this.mockSessions.push(newSession);
    // return of(newSession);
  }

  updateSession(id: number | string, session: Partial<Session>): Observable<Session> {
    // Convertir les propriétés snake_case en camelCase pour l'API
    const apiSession = this.convertToApiModel(session);
    
    console.log('Tentative de mise à jour de session, ID:', id, 'données:', apiSession);
    
    // Essayer PATCH au lieu de PUT (certaines APIs utilisent PATCH pour les mises à jour partielles)
    return this.http.patch<any>(`${this.apiUrl}/${id}`, apiSession)
      .pipe(
        tap(response => {
          console.log('Réponse brute de l\'API pour updateSession:', response);
        }),
        map(response => {
          // Structure spécifique de votre API: response.data contient l'objet session
          if (response && response.data) {
            return this.convertToFrontendModel(response.data);
          }
          // Si la structure est différente, essayer de convertir directement
          else if (response && (response.id || response.session_id)) {
            return this.convertToFrontendModel(response);
          }
          
          // Si aucun format reconnu, logger l'erreur
          console.warn('Format de réponse API inattendu pour updateSession:', response);
          throw new Error('Format de réponse API inattendu');
        }),
        catchError((error) => {
          console.error('Erreur API lors de la mise à jour:', error);
          
          // Si l'API n'existe pas encore (404), utiliser le mode mock temporairement
          if (error.status === 404) {
            console.warn('API updateSession non disponible, utilisation du mode mock temporaire');
            
            // Simuler la mise à jour en utilisant les données actuelles
            return this.getSessionById(id as number).pipe(
              map(existingSession => {
                // Fusionner les nouvelles données avec les existantes
                const updatedSession = {
                  ...existingSession,
                  ...session,
                  session_id: id,
                  // Maintenir les groupes existants
                  groups: existingSession.groups
                };
                
                console.log('Session mise à jour (mode mock):', updatedSession);
                return updatedSession;
              })
            );
          }
          
          return throwError(() => error);
        })
      );
  }

  deleteSession(id: string | number): Observable<void> {
    // En production, utiliser l'API réelle
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
    
    // Pour les tests, simuler la suppression
    // const index = this.mockSessions.findIndex(s => s.session_id === id);
    // if (index !== -1) {
    //   this.mockSessions.splice(index, 1);
    //   return of(undefined);
    // }
    // return throwError(() => new Error(`Session avec l'ID ${id} non trouvée`));
  }

  private getNextId(): number {
    // Convertir les session_id en nombres avant d'utiliser Math.max
    const ids = this.mockSessions.map(s => {
      const id = s.session_id;
      return typeof id === 'string' ? parseInt(id, 10) : id;
    });
    return Math.max(...ids) + 1;
  }

  private handleError(error: any): Observable<never> {
    console.error('Une erreur est survenue', error);
    return throwError(() => error);
  }

  // Convertir un modèle de session de l'API (camelCase) vers le format frontend (snake_case)
  private convertToFrontendModel(apiSession: any): Session {
    if (!apiSession) {
      console.warn('Session API vide ou null');
      return {} as Session;
    }
    
    // Logging pour debug
    console.log('Session API à convertir (contenu complet):', JSON.stringify(apiSession, null, 2));
    console.log('Toutes les clés de l\'objet API:', Object.keys(apiSession));
    
    // L'objet apiSession contient maintenant directement les données de la session
    const sessionId = apiSession.id || apiSession.sessionId || apiSession.session_id || 0;
    console.log('session_id trouvé:', sessionId, 'type:', typeof sessionId);
    
    // Traiter les groupes s'ils sont présents
    let groups = [];
    if (apiSession.groups && Array.isArray(apiSession.groups)) {
      groups = apiSession.groups.map((group: any) => ({
        group_id: group.id || group.group_id,
        label: group.label,
        session_id: group.session_id || sessionId,
        students: group.students || []
      }));
      console.log('Groupes convertis:', groups);
    }
    
    return {
      session_id: sessionId,
      id: apiSession.id,
      sessionId: sessionId,
      label: apiSession.label || '',
      // Convertir les propriétés camelCase en snake_case
      started_at: apiSession.startedAt ? new Date(apiSession.startedAt) : undefined,
      finished_at: apiSession.finishedAt ? new Date(apiSession.finishedAt) : undefined,
      external_id: apiSession.externalId || apiSession.external_id,
      // Conserver les propriétés de relation
      groups: groups,
      // Ajouter également les propriétés camelCase pour compatibilité
      startedAt: apiSession.startedAt,
      finishedAt: apiSession.finishedAt,
      externalId: apiSession.externalId || apiSession.external_id
    };
  }
  
  // Convertir un modèle de session du frontend vers le format API
  private convertToApiModel(session: any): any {
    // Conversion explicite des propriétés snake_case en camelCase pour l'API
    const apiSession: any = {
      label: session.label
    };
    
    // Traiter les dates pour s'assurer qu'elles sont au format ISO 8601
    if (session.startedAt || session.started_at) {
      const startedAt = session.startedAt || session.started_at;
      apiSession.startedAt = this.formatDateToISO(startedAt);
    }
    
    if (session.finishedAt || session.finished_at) {
      const finishedAt = session.finishedAt || session.finished_at;
      apiSession.finishedAt = this.formatDateToISO(finishedAt);
    }
    
    // Ajouter l'ID externe s'il existe
    if (session.externalId || session.external_id) {
      apiSession.externalId = session.externalId || session.external_id;
    }
    
    // Logging pour debug
    console.log('Données de session envoyées à l\'API après transformation:', apiSession);
    return apiSession;
  }
  
  // Formater une date au format ISO 8601 string
  private formatDateToISO(date: string | Date): string {
    if (!date) return '';
    
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // Essayer de convertir la chaîne en date
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }
    
    // Vérifier si la date est valide
    if (isNaN(dateObj.getTime())) {
      console.warn('Date invalide détectée:', date);
      return '';
    }
    
    // Formater au format ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
    return dateObj.toISOString();
  }

  // Récupérer les sessions pour une période donnée
  getSessionsByDateRange(start: Date, end: Date): Observable<Session[]> {
    return this.http.get<Session[]>(`${this.apiUrl}/range?start=${start.toISOString()}&end=${end.toISOString()}`);
  }
  
  // Récupérer les groupes d'une session
  getSessionGroups(sessionId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${sessionId}/groups`);
  }
} 