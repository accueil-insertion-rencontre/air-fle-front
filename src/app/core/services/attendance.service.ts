import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Interface pour le modèle Absence de l'API backend
export interface Absence {
  id: string;
  student_id: string;
  course_id: string;
  reason?: string;
  student?: {
    id: string;
    firstname: string;
    lastname: string;
    email?: string;
  };
  course?: {
    course_id: string;
    intitule?: string;
    day?: string;
    start_hour?: string;
    end_hour?: string;
  };
}

// Interface pour créer une absence
export interface CreateAbsenceDto {
  student_id: string;
  course_id: string;
  reason?: string;
}

// Interface pour mettre à jour une absence
export interface UpdateAbsenceDto {
  student_id?: string;
  course_id?: string;
  reason?: string;
}

// Interface pour les statistiques d'absences (à implémenter côté backend si nécessaire)
export interface AbsenceStats {
  total_absences: number;
  total_courses: number;
  absence_rate: number;
}

// ===== INTERFACES LEGACY POUR LA COMPATIBILITÉ =====
// Ces interfaces restent pour ne pas casser le code existant
export interface AttendanceRecord {
  id?: number;
  student_id: number | string;
  course_id: number;
  status: 'present' | 'absent' | 'late' | 'excused';
  created_at?: string;
  updated_at?: string;
  comment?: string;
}

export interface AttendanceStatus {
  student_id: number | string;
  status: 'present' | 'absent' | 'late' | 'excused';
  comment?: string;
}

export interface AttendanceStats {
  total_sessions: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  excused_count: number;
  attendance_rate: number;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private absenceApiUrl = `${environment.apiUrl}/absences`;
  private attendanceApiUrl = `${environment.apiUrl}/attendance`; // URL legacy pour compatibilité

  constructor(private http: HttpClient) {}

  // ===== MÉTHODES POUR LA GESTION DES ABSENCES (API BACKEND RÉELLE) =====

  /**
   * Récupère toutes les absences
   */
  getAllAbsences(): Observable<{ data: Absence[]; meta: any }> {
    return this.http.get<{ data: Absence[]; meta: any }>(this.absenceApiUrl);
  }

  /**
   * Récupère une absence par son ID
   */
  getAbsenceById(id: string): Observable<Absence> {
    return this.http.get<Absence>(`${this.absenceApiUrl}/${id}`);
  }

  /**
   * Crée une nouvelle absence
   */
  createAbsence(absenceData: CreateAbsenceDto): Observable<Absence> {
    return this.http.post<Absence>(this.absenceApiUrl, absenceData);
  }

  /**
   * Met à jour une absence existante
   */
  updateAbsence(id: string, absenceData: UpdateAbsenceDto): Observable<Absence> {
    return this.http.patch<Absence>(`${this.absenceApiUrl}/${id}`, absenceData);
  }

  /**
   * Supprime une absence
   */
  deleteAbsence(id: string): Observable<void> {
    return this.http.delete<void>(`${this.absenceApiUrl}/${id}`);
  }

  /**
   * Récupère les absences d'un étudiant spécifique
   */
  getStudentAbsences(studentId: string): Observable<Absence[]> {
    return this.http.get<Absence[]>(`${this.absenceApiUrl}?student_id=${studentId}`);
  }

  /**
   * Récupère les absences pour un cours spécifique
   */
  getCourseAbsences(courseId: string): Observable<Absence[]> {
    return this.http.get<Absence[]>(`${this.absenceApiUrl}?course_id=${courseId}`);
  }

  /**
   * Supprime toutes les absences pour un cours spécifique
   */
  deleteCourseAbsences(courseId: string): Observable<any> {
    return this.http.delete<any>(`${this.absenceApiUrl}/course/${courseId}`);
  }

  // ===== MÉTHODES LEGACY POUR LA COMPATIBILITÉ =====
  // Ces méthodes restent pour ne pas casser le code existant

  /**
   * Récupère les présences pour un cours spécifique (méthode legacy)
   */
  getCourseAttendance(courseId: number): Observable<AttendanceRecord[]> {
    return this.http.get<AttendanceRecord[]>(`${this.attendanceApiUrl}/course/${courseId}`);
  }

  /**
   * Enregistre les présences pour un cours (méthode legacy)
   */
  saveCourseAttendance(courseId: number, attendances: AttendanceStatus[]): Observable<AttendanceRecord[]> {
    return this.http.post<AttendanceRecord[]>(`${this.attendanceApiUrl}/course/${courseId}`, {
      attendances
    });
  }

  /**
   * Met à jour le statut d'un élève pour un cours (méthode legacy)
   */
  updateStudentAttendance(courseId: number, studentId: number, status: AttendanceStatus): Observable<AttendanceRecord> {
    return this.http.put<AttendanceRecord>(`${this.attendanceApiUrl}/course/${courseId}/student/${studentId}`, status);
  }

  /**
   * Récupère l'historique des absences d'un élève (méthode legacy)
   */
  getStudentAttendanceHistory(studentId: number): Observable<AttendanceRecord[]> {
    return this.http.get<AttendanceRecord[]>(`${this.attendanceApiUrl}/student/${studentId}`);
  }

  /**
   * Récupère les statistiques de présence d'un élève (méthode legacy)
   */
  getStudentAttendanceStats(studentId: number): Observable<AttendanceStats> {
    return this.http.get<AttendanceStats>(`${this.attendanceApiUrl}/student/${studentId}/stats`);
  }

  /**
   * Marque tous les élèves d'un cours comme présents (méthode legacy)
   */
  markAllPresent(courseId: number, studentIds: number[]): Observable<AttendanceRecord[]> {
    const attendances = studentIds.map(studentId => ({
      student_id: studentId,
      status: 'present' as const
    }));
    return this.saveCourseAttendance(courseId, attendances);
  }

  /**
   * Marque tous les élèves d'un cours comme absents (méthode legacy)
   */
  markAllAbsent(courseId: number, studentIds: number[]): Observable<AttendanceRecord[]> {
    const attendances = studentIds.map(studentId => ({
      student_id: studentId,
      status: 'absent' as const
    }));
    return this.saveCourseAttendance(courseId, attendances);
  }

  /**
   * Supprime un enregistrement de présence (méthode legacy)
   */
  deleteAttendanceRecord(recordId: number): Observable<void> {
    return this.http.delete<void>(`${this.attendanceApiUrl}/${recordId}`);
  }

  /**
   * Ajoute une absence manuelle pour un élève (méthode legacy)
   */
  addManualAbsence(studentId: number, courseId: number, comment?: string): Observable<AttendanceRecord> {
    return this.http.post<AttendanceRecord>(`${this.attendanceApiUrl}/manual`, {
      student_id: studentId,
      course_id: courseId,
      status: 'absent',
      comment
    });
  }
} 