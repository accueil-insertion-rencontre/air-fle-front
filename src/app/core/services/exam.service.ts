import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Exam, CreateExamDto, UpdateExamDto, ExamDisplayInfo } from '../models/exam.model';

@Injectable({
  providedIn: 'root',
})
export class ExamService {
  private readonly apiUrl = `${environment.apiUrl}/exams`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère tous les examens
   */
  getAllExams(): Observable<Exam[]> {
    console.log('🔍 ExamService: Récupération de tous les examens');
    return this.http.get<any>(this.apiUrl).pipe(
      map(response => {
        console.log('✅ ExamService: Réponse brute API:', response);
        
        // L'API peut retourner les données dans différents formats
        let examsData: any[];
        
        if (Array.isArray(response)) {
          // Cas 1: Tableau direct
          examsData = response;
        } else if (response && response.data && Array.isArray(response.data.data)) {
          // Cas 2: Structure { data: { data: [...], meta: {...} } } - C'EST NOTRE CAS !
          examsData = response.data.data;
          console.log('📊 Meta données:', response.data.meta);
        } else if (response && Array.isArray(response.data)) {
          // Cas 3: Structure { data: [...] }
          examsData = response.data;
        } else if (response && Array.isArray(response.exams)) {
          // Cas 4: Structure { exams: [...] }
          examsData = response.exams;
        } else {
          console.warn('⚠️ ExamService: Format de réponse inattendu:', response);
          console.warn('Structure détectée:', {
            isArray: Array.isArray(response),
            hasData: !!response?.data,
            dataIsArray: Array.isArray(response?.data),
            hasDataData: !!response?.data?.data,
            dataDataIsArray: Array.isArray(response?.data?.data)
          });
          examsData = [];
        }
        
        console.log('📋 ExamService: Examens extraits:', examsData);
        return examsData;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère un examen par son ID
   */
  getExamById(id: string): Observable<Exam> {
    console.log('🔍 ExamService: Récupération de l\'examen:', id);
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        console.log('✅ ExamService: Examen récupéré:', response);
        
        // Extraire les données de l'examen depuis response.data
        if (response && response.data) {
          return response.data;
        } else if (response && response.exam_uuid) {
          return response;
        } else {
          console.warn('⚠️ Format de réponse inattendu pour getExamById:', response);
          return response;
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère les examens d'un étudiant spécifique
   */
  getExamsByStudent(studentId: string): Observable<Exam[]> {
    console.log('🔍 ExamService: Récupération des examens pour l\'étudiant:', studentId);
    // Note: Pour l'instant on utilise getAllExams et on filtre côté client
    // Plus tard on pourra ajouter un endpoint spécifique dans l'API
    return this.getAllExams().pipe(
      map(exams => exams.filter(exam => exam.student_uuid === studentId)),
      map(filteredExams => {
        console.log('✅ ExamService: Examens filtrés pour l\'étudiant:', filteredExams);
        return filteredExams;
      })
    );
  }

  /**
   * Crée un nouvel examen
   */
  createExam(examData: CreateExamDto): Observable<Exam> {
    console.log('🚀 ExamService: Création d\'un nouvel examen:', examData);
    return this.http.post<any>(this.apiUrl, examData).pipe(
      map(response => {
        console.log('✅ ExamService: Examen créé avec succès:', response);
        
        // L'API retourne { data: {...}, success: true, ... }
        // On doit extraire les données de l'examen depuis response.data
        if (response && response.data) {
          return response.data; // Retourner directement les données de l'examen
        } else if (response && response.exam_uuid) {
          return response; // Si les données sont directement dans response
        } else {
          console.warn('⚠️ Format de réponse inattendu pour createExam:', response);
          return response;
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Met à jour un examen existant
   */
  updateExam(id: string, examData: UpdateExamDto): Observable<Exam> {
    console.log('🔄 ExamService: Mise à jour de l\'examen:', id, examData);
    return this.http.patch<any>(`${this.apiUrl}/${id}`, examData).pipe(
      map(response => {
        console.log('✅ ExamService: Examen mis à jour avec succès:', response);
        
        // Extraire les données de l'examen depuis response.data
        if (response && response.data) {
          return response.data;
        } else if (response && response.exam_uuid) {
          return response;
        } else {
          console.warn('⚠️ Format de réponse inattendu pour updateExam:', response);
          return response;
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Supprime un examen
   */
  deleteExam(id: string): Observable<Exam> {
    console.log('🗑️ ExamService: Suppression de l\'examen:', id);
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        console.log('✅ ExamService: Examen supprimé avec succès:', response);
        
        // Extraire les données de l'examen depuis response.data si disponible
        if (response && response.data) {
          return response.data;
        } else if (response && response.exam_uuid) {
          return response;
        } else {
          console.warn('⚠️ Format de réponse inattendu pour deleteExam:', response);
          return response;
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Convertit un examen en format d'affichage
   */
  getExamDisplayInfo(exam: Exam): ExamDisplayInfo {
    console.log('🔍 Exam data for display:', exam); // Debug pour voir la structure
    
    // Conversion pour accès flexible aux propriétés
    const examData = exam as any;
    
    // Extraction flexible du nom de l'étudiant
    let studentName = 'Étudiant inconnu';
    if (examData.student) {
      const student = examData.student as any;
      console.log('👤 Student data:', student);
      
      // Essayer différents noms de propriétés
      const firstName = student.student_firstname || student.firstname || student.first_name || student.prenom || '';
      const lastName = student.student_lastname || student.lastname || student.last_name || student.nom || '';
      
      if (firstName || lastName) {
        studentName = `${firstName} ${lastName}`.trim();
      } else {
        console.warn('⚠️ Propriétés nom/prénom non trouvées dans:', student);
        studentName = `Étudiant (ID: ${examData.student_uuid})`;
      }
    } else {
      studentName = `Étudiant inconnu (ID: ${examData.student_uuid})`;
    }
    
    // Extraction flexible de la note
    const score = examData.exam_score || examData.score || undefined;
    
    // Extraction flexible du libellé
    const label = examData.exam_label || examData.label || examData.title || 'Examen sans titre';
    
    console.log('📝 Exam display data:', { label, studentName, score });
    
    return {
      id: examData.exam_uuid || examData.id || '',
      label: label,
      date: this.formatDate(examData.exam_taked_at || examData.date || examData.taken_at),
      score: score,
      studentName: studentName,
      studentEmail: examData.student?.student_mail || examData.student?.email || examData.student?.mail
    };
  }

  /**
   * Convertit une liste d'examens en format d'affichage
   */
  getExamsDisplayInfo(exams: Exam[]): ExamDisplayInfo[] {
    if (!Array.isArray(exams)) {
      console.warn('getExamsDisplayInfo: exams n\'est pas un tableau:', exams);
      return [];
    }
    return exams.map(exam => this.getExamDisplayInfo(exam));
  }

  /**
   * Formate une date pour l'affichage
   */
  private formatDate(date: Date | string): string {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Gestion des erreurs HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('❌ ExamService: Erreur HTTP:', error);
    
    let errorMessage = 'Une erreur inconnue s\'est produite';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur côté client: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      switch (error.status) {
        case 400:
          errorMessage = 'Données invalides. Veuillez vérifier votre saisie.';
          break;
        case 401:
          errorMessage = 'Vous devez être connecté pour effectuer cette action.';
          break;
        case 403:
          errorMessage = 'Vous n\'avez pas les droits pour effectuer cette action.';
          break;
        case 404:
          errorMessage = 'Examen non trouvé.';
          break;
        case 500:
          errorMessage = 'Erreur interne du serveur. Veuillez réessayer plus tard.';
          break;
        default:
          errorMessage = `Erreur ${error.status}: ${error.error?.message || error.message}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
} 