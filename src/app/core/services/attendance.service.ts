import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AttendanceRecord {
  id?: number;
  student_id: number;
  course_id: number;
  status: 'present' | 'absent' | 'late' | 'excused';
  created_at?: string;
  updated_at?: string;
  comment?: string;
}

export interface AttendanceStatus {
  student_id: number;
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
  private apiUrl = `${environment.apiUrl}/attendance`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère les présences pour un cours spécifique
   */
  getCourseAttendance(courseId: number): Observable<AttendanceRecord[]> {
    return this.http.get<AttendanceRecord[]>(`${this.apiUrl}/course/${courseId}`);
  }

  /**
   * Enregistre les présences pour un cours
   */
  saveCourseAttendance(courseId: number, attendances: AttendanceStatus[]): Observable<AttendanceRecord[]> {
    return this.http.post<AttendanceRecord[]>(`${this.apiUrl}/course/${courseId}`, {
      attendances
    });
  }

  /**
   * Met à jour le statut d'un élève pour un cours
   */
  updateStudentAttendance(courseId: number, studentId: number, status: AttendanceStatus): Observable<AttendanceRecord> {
    return this.http.put<AttendanceRecord>(`${this.apiUrl}/course/${courseId}/student/${studentId}`, status);
  }

  /**
   * Récupère l'historique des absences d'un élève
   */
  getStudentAttendanceHistory(studentId: number): Observable<AttendanceRecord[]> {
    return this.http.get<AttendanceRecord[]>(`${this.apiUrl}/student/${studentId}`);
  }

  /**
   * Récupère les statistiques de présence d'un élève
   */
  getStudentAttendanceStats(studentId: number): Observable<AttendanceStats> {
    return this.http.get<AttendanceStats>(`${this.apiUrl}/student/${studentId}/stats`);
  }

  /**
   * Marque tous les élèves d'un cours comme présents
   */
  markAllPresent(courseId: number, studentIds: number[]): Observable<AttendanceRecord[]> {
    const attendances = studentIds.map(studentId => ({
      student_id: studentId,
      status: 'present' as const
    }));
    return this.saveCourseAttendance(courseId, attendances);
  }

  /**
   * Marque tous les élèves d'un cours comme absents
   */
  markAllAbsent(courseId: number, studentIds: number[]): Observable<AttendanceRecord[]> {
    const attendances = studentIds.map(studentId => ({
      student_id: studentId,
      status: 'absent' as const
    }));
    return this.saveCourseAttendance(courseId, attendances);
  }

  /**
   * Supprime un enregistrement de présence
   */
  deleteAttendanceRecord(recordId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${recordId}`);
  }

  /**
   * Ajoute une absence manuelle pour un élève
   */
  addManualAbsence(studentId: number, courseId: number, comment?: string): Observable<AttendanceRecord> {
    return this.http.post<AttendanceRecord>(`${this.apiUrl}/manual`, {
      student_id: studentId,
      course_id: courseId,
      status: 'absent',
      comment
    });
  }
} 