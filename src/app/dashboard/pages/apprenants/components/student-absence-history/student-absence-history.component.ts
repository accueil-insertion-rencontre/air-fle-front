import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttendanceService, AttendanceRecord, AttendanceStats } from '../../../../../core/services/attendance.service';
import { AlertService } from '../../../../../core/services/alert.service';

@Component({
  selector: 'app-student-absence-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-absence-history.component.html',
  styleUrls: ['./student-absence-history.component.scss']
})
export class StudentAbsenceHistoryComponent implements OnInit {
  @Input() studentId!: number;
  @Input() studentName!: string;

  attendanceHistory: AttendanceRecord[] = [];
  attendanceStats: AttendanceStats | null = null;
  loading = false;
  error = '';

  constructor(
    private attendanceService: AttendanceService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    if (this.studentId) {
      this.loadAttendanceHistory();
      this.loadAttendanceStats();
    }
  }

  loadAttendanceHistory(): void {
    this.loading = true;
    this.error = '';

    this.attendanceService.getStudentAttendanceHistory(this.studentId).subscribe({
      next: (history) => {
        this.attendanceHistory = history.sort((a, b) => 
          new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
        );
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement de l\'historique:', error);
        this.error = 'Impossible de charger l\'historique des présences';
        this.loading = false;
      }
    });
  }

  loadAttendanceStats(): void {
    this.attendanceService.getStudentAttendanceStats(this.studentId).subscribe({
      next: (stats) => {
        this.attendanceStats = stats;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques:', error);
      }
    });
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'present': return 'Présent';
      case 'absent': return 'Absent';
      case 'late': return 'En retard';
      case 'excused': return 'Absent excusé';
      default: return 'Non défini';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'present': return 'badge bg-success';
      case 'absent': return 'badge bg-danger';
      case 'late': return 'badge bg-warning text-dark';
      case 'excused': return 'badge bg-secondary';
      default: return 'badge bg-light text-dark';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'present': return 'fas fa-check';
      case 'absent': return 'fas fa-times';
      case 'late': return 'fas fa-clock';
      case 'excused': return 'fas fa-times-circle';
      default: return 'fas fa-question';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
} 