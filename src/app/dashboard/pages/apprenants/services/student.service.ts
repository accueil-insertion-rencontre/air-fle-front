import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Student, StudentFilters, StudentListConfig, ApiStudent } from '../models/student.model';
import { environment } from '../../../../../environments/environment';

export interface StudentListResponse {
  students: ApiStudent[];
  total: number;
}

export interface CreateStudentRequest {
  // INFORMATIONS PERSONNELLES OBLIGATOIRES
  firstname: string;
  lastname: string;
  birthdate: string; // Format ISO 8601
  
  // INFORMATIONS PERSONNELLES OPTIONNELLES
  placeOfBirth?: string;
  email?: string;
  phone?: string;
  date_test_initial?: string;
  commentaire?: string;
  date_entree_france?: string; // Format ISO 8601
  date_titre_sejour?: string; // Format ISO 8601
  date_cir?: string; // Format ISO 8601
  
  // IDS OBLIGATOIRES
  gender_id: string;
  initial_level_id: string; // Niveau déterminé par test de positionnement
  nationality_id: string;
  financing_id: string;
  status_id: string;
  
  // IDS OPTIONNELS
  departure_level_id?: string; // Niveau de départ quand il quitte la formation (rempli plus tard)
  current_level_id?: string; // Niveau actuel en cours de formation
  orientation_id?: string;
  exit_reason_id?: string;
}

export interface AssignDisabilitiesRequest {
  disability_ids: string[];
}

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private readonly apiUrl = `${environment.apiUrl}/students`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère la liste des étudiants avec pagination
   * GET /students?skip=0&take=20
   */
  getStudents(config: StudentListConfig): Observable<StudentListResponse> {
    let params = new HttpParams();
    
    // Pagination avec skip et take
    const skip = (config.page - 1) * config.pageSize;
    params = params.set('skip', skip.toString());
    params = params.set('take', config.pageSize.toString());
    
    // Filtres de recherche
    if (config.filters?.firstName) {
      params = params.set('firstname', config.filters.firstName);
    }
    if (config.filters?.lastName) {
      params = params.set('lastname', config.filters.lastName);
    }

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(response => {
        console.log('Réponse API complète:', response);
        
        // Adapter la réponse selon la structure de votre API
        if (response.success && response.data) {
          return {
            students: response.data.students || response.data,
            total: response.data.total || response.data.length
          };
        } else if (Array.isArray(response)) {
          // Si l'API retourne directement un tableau
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
      })
    );
  }

  /**
   * Récupère un étudiant par son ID
   */
  getStudentById(id: string): Observable<ApiStudent> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        } else {
          return response;
        }
      })
    );
  }

  /**
   * Crée un nouvel étudiant selon l'API spécifiée
   * POST /students
   */
  createStudent(studentData: CreateStudentRequest): Observable<Student> {
    return this.http.post<Student>(this.apiUrl, studentData);
  }

  /**
   * Associe des handicaps à un étudiant
   * POST /students/{student_id}/disabilities
   */
  assignDisabilities(studentId: string, disabilityIds: string[]): Observable<any> {
    const data: AssignDisabilitiesRequest = {
      disability_ids: disabilityIds
    };
    return this.http.post(`${this.apiUrl}/${studentId}/disabilities`, data);
  }

  /**
   * Met à jour un étudiant existant
   */
  updateStudent(id: string, student: Partial<Student>): Observable<Student> {
    return this.http.put<Student>(`${this.apiUrl}/${id}`, student);
  }

  /**
   * Supprime un étudiant
   */
  deleteStudent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Recherche des étudiants par nom
   */
  searchStudents(query: string): Observable<Student[]> {
    let params = new HttpParams();
    
    // Si la requête contient un espace, on divise en prénom et nom
    const parts = query.trim().split(' ');
    if (parts.length >= 2) {
      params = params.set('firstname', parts[0]);
      params = params.set('lastname', parts.slice(1).join(' '));
    } else {
      // Sinon on cherche dans le nom de famille
      params = params.set('lastname', query);
    }
    
    return this.http.get<Student[]>(this.apiUrl, { params });
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
} 