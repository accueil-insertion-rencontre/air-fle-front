import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Course } from '../models/course.model';
import { Schedule } from '../models/course.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private apiUrl = `${environment.apiUrl}/courses`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère tous les cours
   */
  getCourses(): Observable<Course[]> {
    return this.http.get<any>(`${this.apiUrl}`)
      .pipe(
        map(response => {
          console.log('Réponse brute de l\'API pour getCourses:', response);
          
          if (response && response.data && Array.isArray(response.data)) {
            return response.data.map((course: any) => this.convertToFrontendModel(course));
          }
          
          return [];
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Récupère un cours par son ID
   */
  getCourseById(id: string | number): Observable<Course> {
    return this.http.get<any>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          console.log('Réponse brute de l\'API pour getCourseById:', response);
          
          if (response && response.data) {
            return this.convertToFrontendModel(response.data);
          }
          
          throw new Error('Cours non trouvé');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Récupère les cours d'une session
   */
  getCoursesBySessionId(sessionId: string | number): Observable<Course[]> {
    return this.http.get<any>(`${this.apiUrl}/session/${sessionId}`)
      .pipe(
        map(response => {
          console.log('Réponse brute de l\'API pour getCoursesBySessionId:', response);
          
          if (response && response.data && Array.isArray(response.data)) {
            return response.data.map((course: any) => this.convertToFrontendModel(course));
          }
          
          return [];
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Récupère les cours d'une période donnée
   */
  getCoursesByDateRange(startDate: string, endDate: string, sessionId?: string | number): Observable<Course[]> {
    // Essayer différents endpoints possibles
    let url = `${this.apiUrl}`;
    
    // Option 1: Essayer l'endpoint simple avec query params
    if (sessionId) {
      url += `?session_id=${sessionId}&start_date=${startDate}&end_date=${endDate}`;
    } else {
      url += `?start_date=${startDate}&end_date=${endDate}`;
    }
    
    console.log('=== CHARGEMENT COURS PAR DATE ===');
    console.log('URL essayée:', url);
    
    return this.http.get<any>(url)
      .pipe(
        map(response => {
          console.log('Réponse brute de l\'API pour getCoursesByDateRange:', response);
          
          if (response && response.data && Array.isArray(response.data)) {
            return response.data.map((course: any) => this.convertToFrontendModel(course));
          }
          
          return [];
        }),
        catchError((error) => {
          console.warn('Endpoint avec query params non trouvé, essai avec getCourses() simple:', error);
          
          // Fallback: essayer l'endpoint simple pour récupérer tous les cours
          return this.getCourses().pipe(
            map((allCourses: Course[]) => {
              console.log('Tous les cours récupérés:', allCourses);
              
              // Filtrer les cours par date et session côté client
              return allCourses.filter(course => {
                const courseDate = course.day;
                const isInDateRange = courseDate >= startDate && courseDate <= endDate;
                const isInSession = !sessionId || course.session_id?.toString() === sessionId?.toString();
                
                console.log(`Cours ${course.title}: date=${courseDate}, inRange=${isInDateRange}, inSession=${isInSession}`);
                
                return isInDateRange && isInSession;
              });
            }),
            catchError(() => {
              console.warn('Aucun endpoint de cours disponible, retour tableau vide');
              return new Observable<Course[]>(observer => {
                observer.next([]);
                observer.complete();
              });
            })
          );
        })
      );
  }

  /**
   * Crée un nouveau cours
   */
  createCourse(course: Partial<Course>): Observable<Course> {
    const apiCourse = this.convertToApiModel(course);
    console.log('Données de cours à envoyer à l\'API:', apiCourse);
    
    return this.http.post<any>(this.apiUrl, apiCourse)
      .pipe(
        map(response => {
          console.log('Réponse de création de cours:', response);
          
          if (response && response.data) {
            return this.convertToFrontendModel(response.data);
          }
          
          throw new Error('Erreur lors de la création du cours');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Met à jour un cours
   */
  updateCourse(id: string | number, course: Partial<Course>): Observable<Course> {
    const apiCourse = this.convertToApiModel(course);
    console.log('Données de cours à mettre à jour:', apiCourse);
    console.log('URL de mise à jour:', `${this.apiUrl}/${id}`);
    
    // Essayer d'abord PATCH (plus courant pour les updates partielles)
    return this.http.patch<any>(`${this.apiUrl}/${id}`, apiCourse)
      .pipe(
        map(response => {
          console.log('Réponse de mise à jour de cours (PATCH):', response);
          
          if (response && response.data) {
            return this.convertToFrontendModel(response.data);
          }
          
          throw new Error('Erreur lors de la mise à jour du cours');
        }),
        catchError((patchError) => {
          console.warn('PATCH non supporté, essai avec PUT:', patchError);
          
          // Fallback avec PUT
          return this.http.put<any>(`${this.apiUrl}/${id}`, apiCourse)
            .pipe(
              map(response => {
                console.log('Réponse de mise à jour de cours (PUT):', response);
                
                if (response && response.data) {
                  return this.convertToFrontendModel(response.data);
                }
                
                throw new Error('Erreur lors de la mise à jour du cours');
              }),
              catchError((putError) => {
                console.error('Erreur avec PUT également:', putError);
                
                // Si ni PATCH ni PUT ne fonctionnent, vérifier le type d'erreur
                if (putError.status === 404) {
                  throw new Error(`Le cours avec l'ID ${id} n'a pas été trouvé`);
                } else if (putError.status === 405) {
                  throw new Error('La modification de cours n\'est pas supportée par l\'API');
                } else {
                  throw new Error(`Erreur lors de la mise à jour: ${putError.message || 'Erreur inconnue'}`);
                }
              })
            );
        })
      );
  }

  /**
   * Met à jour un cours (alternative: supprime et recrée)
   * À utiliser si l'endpoint PUT/PATCH n'est pas disponible
   */
  updateCourseAlternative(id: string | number, course: Partial<Course>): Observable<Course> {
    console.log('Tentative de mise à jour alternative (supprimer + créer)');
    
    // D'abord supprimer l'ancien cours
    return this.deleteCourse(id).pipe(
      switchMap(() => {
        // Puis créer le nouveau cours avec les données mises à jour
        console.log('Cours supprimé, création du nouveau cours');
        return this.createCourse(course);
      }),
      catchError((error) => {
        console.error('Erreur dans la mise à jour alternative:', error);
        throw new Error('Impossible de modifier le cours (suppression/création échouée)');
      })
    );
  }

  /**
   * Supprime un cours
   */
  deleteCourse(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Récupère les cours par groupe
   */
  getCoursesByGroupId(groupId: string | number): Observable<Course[]> {
    console.log('Tentative de récupération des cours pour le groupe:', groupId);
    
    // L'endpoint direct n'existe pas, essayons plusieurs approches
    return this.http.get<any>(`${this.apiUrl}/group/${groupId}`)
      .pipe(
        map(response => {
          console.log('Réponse brute de l\'API pour getCoursesByGroupId (endpoint direct):', response);
          
          if (response && response.data && Array.isArray(response.data)) {
            return response.data.map((course: any) => this.convertToFrontendModel(course));
          }
          
          // Fallback: si la réponse est directement un tableau
          if (Array.isArray(response)) {
            return response.map((course: any) => this.convertToFrontendModel(course));
          }
          
          console.warn('Aucun cours trouvé pour le groupe ou format inattendu:', response);
          return [];
        }),
        catchError((error) => {
          console.warn('Endpoint /courses/group/{id} non disponible (404), tentative de fallback:', error);
          
          // Fallback: récupérer tous les cours et filtrer côté client
          return this.getCourses().pipe(
            map((allCourses: Course[]) => {
              console.log('Filtrage côté client des cours pour group_id:', groupId);
              console.log('Tous les cours récupérés:', allCourses);
              
              const filteredCourses = allCourses.filter(course => {
                const courseGroupId = course.group_id;
                const match = courseGroupId?.toString() === groupId?.toString();
                
                if (match) {
                  console.log('Cours trouvé pour le groupe:', course.title, 'group_id:', courseGroupId);
                }
                
                return match;
              });
              
              console.log(`${filteredCourses.length} cours trouvés pour le groupe ${groupId}`);
              return filteredCourses;
            }),
            catchError((fallbackError) => {
              console.error('Échec du fallback également:', fallbackError);
              
              // Dernier recours: retourner un tableau vide
              console.warn('Retour d\'un tableau vide car aucune méthode n\'a fonctionné');
              return new Observable<Course[]>(observer => {
                observer.next([]);
                observer.complete();
              });
            })
          );
        })
      );
  }

  /**
   * Récupère le planning pour le calendrier
   */
  getSchedule(start: Date, end: Date): Observable<Schedule[]> {
    return this.http.get<Schedule[]>(`${this.apiUrl}/schedule?start=${start.toISOString()}&end=${end.toISOString()}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Convertit les données de l'API vers le modèle frontend
   */
  private convertToFrontendModel(apiCourse: any): Course {
    console.log('Course API à convertir:', apiCourse);
    
    // Gérer la conversion de la date
    let dayFormatted = '';
    if (apiCourse.day) {
      if (typeof apiCourse.day === 'string' && apiCourse.day.includes('T')) {
        // Format ISO complet, extraire seulement la date
        dayFormatted = apiCourse.day.split('T')[0];
      } else {
        dayFormatted = apiCourse.day;
      }
    }
    
    console.log(`Jour converti: "${apiCourse.day}" -> "${dayFormatted}"`);
    
    // Extraire l'user_id depuis l'array users de l'API
    let extractedUserId = apiCourse.user_id || apiCourse.userId;
    
    if (apiCourse.users && Array.isArray(apiCourse.users) && apiCourse.users.length > 0) {
      const firstUser = apiCourse.users[0];
      if (firstUser && firstUser.user_id) {
        extractedUserId = firstUser.user_id;
        console.log('User ID extrait depuis API users array:', extractedUserId);
      } else if (firstUser && firstUser.user && firstUser.user.id) {
        extractedUserId = firstUser.user.id;
        console.log('User ID extrait depuis API users[].user.id:', extractedUserId);
      }
    }
    
    return {
      course_id: apiCourse.course_id || apiCourse.id,
      id: apiCourse.course_id || apiCourse.id,
      session_id: apiCourse.session_id || apiCourse.sessionId,
      group_id: apiCourse.group_id || apiCourse.groupId,
      day: dayFormatted,
      start_hour: apiCourse.start_hour ? this.extractTimeFromDate(apiCourse.start_hour) : apiCourse.startHour,
      end_hour: apiCourse.end_hour ? this.extractTimeFromDate(apiCourse.end_hour) : apiCourse.endHour,
      title: apiCourse.intitule || apiCourse.title,
      user_id: extractedUserId, // Utiliser l'user_id extrait
      session: apiCourse.session ? {
        session_id: apiCourse.session.id || apiCourse.session.session_id,
        label: apiCourse.session.label
      } : undefined,
      group: apiCourse.group ? {
        group_id: apiCourse.group.id || apiCourse.group.group_id,
        label: apiCourse.group.label
      } : undefined,
      user: apiCourse.user ? {
        user_id: apiCourse.user.id || apiCourse.user.user_id,
        firstname: apiCourse.user.firstname,
        lastname: apiCourse.user.lastname,
        email: apiCourse.user.email
      } : undefined,
      created_at: apiCourse.created_at || apiCourse.createdAt,
      updated_at: apiCourse.updated_at || apiCourse.updatedAt
    };
  }

  /**
   * Extrait l'heure au format HH:MM d'un objet Date ou string
   */
  private extractTimeFromDate(dateInput: string | Date): string {
    if (!dateInput) return '';
    
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Convertit les données du frontend vers le format API
   */
  private convertToApiModel(course: Partial<Course>): any {
    if (!course.start_hour || !course.end_hour || !course.day) {
      throw new Error('Données de cours incomplètes');
    }
    
    // Vérifier que group_id est un UUID valide
    if (!course.group_id) {
      throw new Error('group_id est requis');
    }
    
    // Regex pour valider un UUID v4
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(course.group_id as string)) {
      console.error('group_id invalid:', course.group_id, 'type:', typeof course.group_id);
      throw new Error(`group_id doit être un UUID valide: ${course.group_id}`);
    }
    
    // Créer des objets Date pour les heures
    const dayDate = new Date(course.day + 'T00:00:00');
    
    const startParts = course.start_hour.split(':');
    const startDate = new Date(dayDate);
    startDate.setHours(parseInt(startParts[0], 10), parseInt(startParts[1], 10), 0);
    
    const endParts = course.end_hour.split(':');
    const endDate = new Date(dayDate);
    endDate.setHours(parseInt(endParts[0], 10), parseInt(endParts[1], 10), 0);
    
    const result: any = {
      intitule: course.title,
      day: course.day,
      start_hour: startDate,
      end_hour: endDate,
      group_id: course.group_id
    };
    
    // Ajouter user_id si fourni (optionnel)
    if (course.user_id) {
      result.user_id = course.user_id;
      console.log('Professeur assigné:', course.user_id);
    }
    
    return result;
  }

  /**
   * Gère les erreurs HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Une erreur est survenue', error);
    return throwError(error);
  }
} 