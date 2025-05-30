import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Group } from '../models/group.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private apiUrl = `${environment.apiUrl}/groups`;
  
  // Données mock temporaires
  private mockGroups: Group[] = [
    { 
      group_id: 1, 
      label: 'Groupe A1 débutants',
      session_id: 1,
      started_at: new Date('2024-01-20'), 
      ended_at: new Date('2024-06-15'),
      more_info: 'Groupe de débutants niveau A1',
      students: []
    },
    { 
      group_id: 2, 
      label: 'Groupe A2 intermédiaires',
      session_id: 1,
      started_at: new Date('2024-01-22'), 
      ended_at: new Date('2024-06-20'),
      more_info: 'Groupe de niveau A2',
      students: []
    },
    { 
      group_id: 3, 
      label: 'Groupe B1 avancés',
      session_id: 2,
      started_at: new Date('2024-02-05'), 
      ended_at: new Date('2024-07-10'),
      more_info: 'Groupe de niveau B1',
      students: []
    }
  ];

  constructor(private http: HttpClient) {}

  getGroups(): Observable<Group[]> {
    // En production, utiliser l'API réelle
    return this.http.get<any>(this.apiUrl)
      .pipe(
        tap(response => {
          console.log('Réponse brute de l\'API pour getGroups:', response);
        }),
        map(response => {
          // Structure spécifique de votre API: response.data.data contient le tableau
          if (response && response.data && response.data.data && Array.isArray(response.data.data)) {
            return response.data.data.map((group: any) => this.convertToFrontendModel(group));
          }
          // Vérifier si la réponse est un tableau
          else if (Array.isArray(response)) {
            return response.map((group: any) => this.convertToFrontendModel(group));
          } 
          // Vérifier si la réponse est un objet avec une propriété data ou items
          else if (response && (response.data || response.items)) {
            const groupsData = response.data || response.items;
            if (Array.isArray(groupsData)) {
              return groupsData.map((group: any) => this.convertToFrontendModel(group));
            }
          }
          // Si c'est un objet unique, le mettre dans un tableau
          else if (response && (response.id || response.group_id)) {
            return [this.convertToFrontendModel(response)];
          }
          
          // Si aucun format reconnu, retourner un tableau vide et logger l'erreur
          console.warn('Format de réponse API inattendu:', response);
          return [];
        }),
        catchError(this.handleError)
      );
    
    // Pour les tests, utiliser les données mock
    // return of(this.mockGroups);
  }
  
  getGroupsBySessionId(sessionId: number): Observable<Group[]> {
    // En production, utiliser l'API réelle
    return this.http.get<any>(`${this.apiUrl}/session/${sessionId}`)
      .pipe(
        tap(response => {
          console.log(`Réponse brute de l'API pour getGroupsBySessionId(${sessionId}):`, response);
        }),
        map(response => {
          // Structure spécifique de votre API: response.data.data contient le tableau OU response.data contient directement le tableau
          if (response && response.data && response.data.data && Array.isArray(response.data.data)) {
            return response.data.data.map((group: any) => this.convertToFrontendModel(group));
          }
          // Si response.data contient directement le tableau
          else if (response && response.data && Array.isArray(response.data)) {
            return response.data.map((group: any) => this.convertToFrontendModel(group));
          }
          // Vérifier si la réponse est un tableau directement
          else if (Array.isArray(response)) {
            return response.map((group: any) => this.convertToFrontendModel(group));
          } 
          // Vérifier si la réponse est un objet avec une propriété data ou items
          else if (response && (response.data || response.items)) {
            const groupsData = response.data || response.items;
            if (Array.isArray(groupsData)) {
              return groupsData.map((group: any) => this.convertToFrontendModel(group));
            }
          }
          // Si c'est un objet unique, le mettre dans un tableau
          else if (response && (response.id || response.group_id)) {
            return [this.convertToFrontendModel(response)];
          }
          
          // Si aucun format reconnu, retourner un tableau vide et logger l'erreur
          console.warn(`Format de réponse API inattendu pour getGroupsBySessionId(${sessionId}):`, response);
          return [];
        }),
        catchError(this.handleError)
      );
    
    // Pour les tests, filtrer les données mock
    // const filteredGroups = this.mockGroups.filter(g => g.session_id === sessionId);
    // return of(filteredGroups);
  }

  getGroupById(id: string | number): Observable<Group> {
    // En production, utiliser l'API réelle
    return this.http.get<any>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(response => {
          console.log('Réponse brute de l\'API pour getGroupById:', response);
        }),
        map(response => {
          // Structure spécifique de votre API: response.data contient l'objet groupe
          if (response && response.data) {
            return this.convertToFrontendModel(response.data);
          }
          // Si la structure est différente, essayer de convertir directement
          else if (response && (response.id || response.group_id)) {
            return this.convertToFrontendModel(response);
          }
          
          // Si aucun format reconnu, logger l'erreur
          console.warn('Format de réponse API inattendu pour getGroupById:', response);
          throw new Error('Format de réponse API inattendu');
        }),
        catchError(this.handleError)
      );
    
    // Pour les tests, utiliser les données mock
    // const group = this.mockGroups.find(g => g.group_id === id);
    // if (group) {
    //   return of(group);
    // }
    // return throwError(() => new Error(`Groupe avec l'ID ${id} non trouvé`));
  }

  createGroup(group: any): Observable<Group> {
    // Convertir les propriétés snake_case en camelCase pour l'API
    const apiGroup = this.convertToApiModel(group);
    
    // Envoyer à l'API
    return this.http.post<any>(this.apiUrl, apiGroup)
      .pipe(
        tap(response => {
          console.log('Réponse brute de l\'API pour createGroup:', response);
        }),
        map(response => {
          // Structure spécifique de votre API: response.data contient l'objet groupe
          if (response && response.data) {
            return this.convertToFrontendModel(response.data);
          }
          // Si la structure est différente, essayer de convertir directement
          else if (response && (response.id || response.group_id)) {
            return this.convertToFrontendModel(response);
          }
          
          // Si aucun format reconnu, logger l'erreur
          console.warn('Format de réponse API inattendu pour createGroup:', response);
          throw new Error('Format de réponse API inattendu');
        }),
        catchError(this.handleError)
      );
    
    // Pour les tests, simuler la création
    // const newGroup: Group = {
    //   ...group,
    //   group_id: this.getNextId(),
    //   students: []
    // };
    // 
    // this.mockGroups.push(newGroup);
    // return of(newGroup);
  }

  updateGroup(id: string | number, group: Partial<Group>): Observable<Group> {
    // Convertir les propriétés snake_case en camelCase pour l'API
    const apiGroup = this.convertToApiModel(group);
    
    // Envoyer à l'API
    return this.http.put<any>(`${this.apiUrl}/${id}`, apiGroup)
      .pipe(
        tap(response => {
          console.log('Réponse brute de l\'API pour updateGroup:', response);
        }),
        map(response => {
          // Structure spécifique de votre API: response.data contient l'objet groupe
          if (response && response.data) {
            return this.convertToFrontendModel(response.data);
          }
          // Si la structure est différente, essayer de convertir directement
          else if (response && (response.id || response.group_id)) {
            return this.convertToFrontendModel(response);
          }
          
          // Si aucun format reconnu, logger l'erreur
          console.warn('Format de réponse API inattendu pour updateGroup:', response);
          throw new Error('Format de réponse API inattendu');
        }),
        catchError(this.handleError)
      );
    
    // Pour les tests, simuler la mise à jour
    // const index = this.mockGroups.findIndex(g => g.group_id === id);
    // if (index !== -1) {
    //   const updatedGroup = {
    //     ...this.mockGroups[index],
    //     ...group,
    //     group_id: id
    //   };
    //   this.mockGroups[index] = updatedGroup;
    //   return of(updatedGroup);
    // }
    // return throwError(() => new Error(`Groupe avec l'ID ${id} non trouvé`));
  }

  deleteGroup(id: string | number): Observable<void> {
    // En production, utiliser l'API réelle
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
    
    // Pour les tests, simuler la suppression
    // const index = this.mockGroups.findIndex(g => g.group_id === id);
    // if (index !== -1) {
    //   this.mockGroups.splice(index, 1);
    //   return of(undefined);
    // }
    // return throwError(() => new Error(`Groupe avec l'ID ${id} non trouvé`));
  }

  private getNextId(): number {
    // Convertir les group_id en nombres avant d'utiliser Math.max
    const ids = this.mockGroups.map(g => {
      const id = g.group_id;
      return typeof id === 'string' ? parseInt(id, 10) : id;
    });
    return Math.max(...ids) + 1;
  }

  private handleError(error: any): Observable<never> {
    console.error('Une erreur est survenue', error);
    return throwError(() => error);
  }

  // Convertir un modèle de groupe de l'API (camelCase) vers le format frontend (snake_case)
  private convertToFrontendModel(apiGroup: any): Group {
    if (!apiGroup) {
      console.warn('Groupe API vide ou null');
      return {} as Group;
    }
    
    // Logging pour debug - afficher tout le contenu de l'objet
    console.log('Groupe API à convertir (contenu complet):', JSON.stringify(apiGroup, null, 2));
    console.log('Toutes les clés de l\'objet API:', Object.keys(apiGroup));
    
    // L'objet apiGroup contient maintenant directement les données du groupe
    const groupId = apiGroup.id || apiGroup.groupId || apiGroup.group_id || 0;
    console.log('group_id trouvé:', groupId, 'type:', typeof groupId);
    
    const sessionId = apiGroup.session_id || apiGroup.sessionId;
    console.log('session_id trouvé:', sessionId, 'type:', typeof sessionId);
    
    return {
      group_id: groupId,
      label: apiGroup.label || '',
      // Convertir les propriétés camelCase en snake_case
      session_id: sessionId,
      started_at: apiGroup.startedAt ? new Date(apiGroup.startedAt) : undefined,
      ended_at: apiGroup.endedAt ? new Date(apiGroup.endedAt) : undefined,
      more_info: apiGroup.moreInfo || apiGroup.more_info,
      external_id: apiGroup.externalId || apiGroup.external_id,
      // Conserver les propriétés de relation
      students: apiGroup.students || [],
      session: apiGroup.session,
      // Ajouter également les propriétés camelCase pour compatibilité
      sessionId: sessionId,
      startedAt: apiGroup.startedAt,
      endedAt: apiGroup.endedAt,
      moreInfo: apiGroup.moreInfo || apiGroup.more_info,
      externalId: apiGroup.externalId || apiGroup.external_id
    };
  }
  
  // Convertir un modèle de groupe du frontend vers le format API
  private convertToApiModel(group: any): any {
    // Simplement passer les données telles quelles
    console.log('Données de groupe envoyées à l\'API (sans transformation):', group);
    return group;
  }

  // Méthode pour ajouter un étudiant au groupe
  addStudentToGroup(groupId: string | number, studentUuid: string): Observable<Group> {
    return this.http.post<Group>(`${this.apiUrl}/${groupId}/students/${studentUuid}`, {});
  }
  
  // Méthode pour retirer un étudiant du groupe
  removeStudentFromGroup(groupId: string | number, studentUuid: string): Observable<Group> {
    return this.http.delete<Group>(`${this.apiUrl}/${groupId}/students/${studentUuid}`);
  }
} 