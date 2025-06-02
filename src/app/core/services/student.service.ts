import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Student } from '../models/student.model';
import { environment } from '../../../environments/environment';

export interface StudentSearchResult {
  students: Student[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private readonly apiUrl = `${environment.apiUrl}/students`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère tous les étudiants (pour sélection dans les groupes)
   */
  getAllStudents(): Observable<Student[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(response => {
        console.log('Réponse API étudiants:', response);
        
        let students = [];
        if (response.success && response.data) {
          students = response.data.students || response.data || [];
        } else if (Array.isArray(response)) {
          students = response;
        } else {
          students = [];
        }
        
        // Log de debug pour voir la structure des étudiants
        if (students.length > 0) {
          console.log('Premier étudiant récupéré:', students[0]);
          console.log('Clés disponibles pour le premier étudiant:', Object.keys(students[0]));
        }
        
        return students;
      }),
      catchError(error => {
        console.error('Erreur lors du chargement des étudiants:', error);
        return of([]);
      })
    );
  }

  /**
   * Recherche des étudiants par nom/prénom
   */
  searchStudents(query: string): Observable<Student[]> {
    let params = new HttpParams();
    
    if (query.trim()) {
      // Si la requête contient un espace, on divise en prénom et nom
      const parts = query.trim().split(' ');
      if (parts.length >= 2) {
        params = params.set('firstname', parts[0]);
        params = params.set('lastname', parts.slice(1).join(' '));
      } else {
        // Recherche dans les deux champs
        params = params.set('search', query);
      }
    }
    
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data.students || response.data || [];
        } else if (Array.isArray(response)) {
          return response;
        } else {
          return [];
        }
      }),
      catchError(error => {
        console.error('Erreur lors de la recherche d\'étudiants:', error);
        return of([]);
      })
    );
  }

  /**
   * Récupère un étudiant par son ID
   */
  getStudentById(id: string | number): Observable<Student> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        } else {
          return response;
        }
      }),
      catchError(error => {
        console.error('Erreur lors du chargement de l\'étudiant:', error);
        throw error;
      })
    );
  }

  /**
   * Récupère les étudiants avec pagination
   */
  getStudentsWithPagination(page: number = 1, pageSize: number = 10, search: string = ''): Observable<StudentSearchResult> {
    let params = new HttpParams();
    
    const skip = (page - 1) * pageSize;
    params = params.set('skip', skip.toString());
    params = params.set('take', pageSize.toString());
    
    if (search.trim()) {
      params = params.set('search', search);
    }
    
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(response => {
        if (response.success && response.data) {
          return {
            students: response.data.students || response.data || [],
            total: response.data.total || 0
          };
        } else if (Array.isArray(response)) {
          return {
            students: response,
            total: response.length
          };
        } else {
          return {
            students: [],
            total: 0
          };
        }
      }),
      catchError(error => {
        console.error('Erreur lors du chargement des étudiants:', error);
        return of({ students: [], total: 0 });
      })
    );
  }

  /**
   * Gestion des erreurs HTTP
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      return new Observable(observer => {
        observer.next(result as T);
        observer.complete();
      });
    };
  }
} 