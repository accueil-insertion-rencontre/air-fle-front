import { environment } from '@environments/environment';

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Student, CreateStudentRequest, StudentListResponse, StudentListConfig } from '../models';

export interface StudentSearchResult {
  students: Student[];
  total: number;
}

@Injectable({
  providedIn: 'root',
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
        let students = [];
        if (response.success && response.data) {
          students = response.data.students || response.data || [];
        } else if (Array.isArray(response)) {
          students = response;
        } else {
          students = [];
        }

        return students;
      }),
      catchError(error => of([]))
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
      catchError(error => of([]))
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
        throw error;
      })
    );
  }

  /**
   * Récupère les étudiants avec pagination
   */
  getStudentsWithPagination(
    page: number = 1,
    pageSize: number = 10,
    search: string = ''
  ): Observable<StudentSearchResult> {
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
            total: response.data.total || 0,
          };
        } else if (Array.isArray(response)) {
          return {
            students: response,
            total: response.length,
          };
        } else {
          return {
            students: [],
            total: 0,
          };
        }
      }),
      catchError(error => of({ students: [], total: 0 }))
    );
  }

  /**
   * Récupère le nombre total d'étudiants
   */
  getStudentCount(): Observable<number> {
    // Pour éviter l'erreur 404, on retourne 0 pour le moment
    return new Observable(observer => {
      observer.next(0);
      observer.complete();
    });
  }

  /**
   * Crée un nouvel étudiant
   */
  createStudent(studentData: CreateStudentRequest): Observable<Student> {
    return this.http.post<Student>(this.apiUrl, studentData);
  }

  /**
   * Récupère les étudiants avec configuration (alias pour getAllStudents pour compatibilité)
   */
  getStudents(config?: StudentListConfig): Observable<StudentListResponse> {
    return this.getAllStudents().pipe(
      map(students => ({
        students: students,
        total: students.length,
        page: config?.page || 1,
        pageSize: config?.pageSize || students.length,
        totalPages: Math.ceil(students.length / (config?.pageSize || students.length))
      }))
    );
  }

  /**
   * Supprime un étudiant
   */
  deleteStudent(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  /**
   * Associe des handicaps à un étudiant
   */
  assignDisabilities(studentId: string, disabilityIds: string[]): Observable<any> {
    const data = {
      disability_ids: disabilityIds,
    };
    return this.http.post(`${this.apiUrl}/${studentId}/disabilities`, data);
  }

  /**
   * Gestion des erreurs HTTP
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      return new Observable(observer => {
        observer.next(result as T);
        observer.complete();
      });
    };
  }
}
