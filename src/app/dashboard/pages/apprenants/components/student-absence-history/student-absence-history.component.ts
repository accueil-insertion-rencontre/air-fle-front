import { Absence, AlertService, AttendanceRecord, AttendanceService } from '@core/services';

import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-student-absence-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-absence-history.component.html',
  styleUrls: ['./student-absence-history.component.scss'],
})
export class StudentAbsenceHistoryComponent implements OnInit {
  @Input() studentId!: string | number;
  @Input() studentName!: string;

  absenceHistory: Absence[] = [];
  absenceStats: { total_absences: number; absence_rate?: number } | null = null;
  loading = false;
  error = '';

  constructor(
    private attendanceService: AttendanceService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    if (this.studentId) {
      this.loadAbsenceHistory();
      this.calculateAbsenceStats();
    }
  }

  loadAbsenceHistory(): void {
    this.loading = true;
    this.error = '';

    this.attendanceService.getStudentAbsences(this.studentId.toString()).subscribe({
      next: (absences: Absence[]) => {
        this.absenceHistory = absences.sort(
          (a: Absence, b: Absence) =>
            new Date(b.course?.day || '').getTime() - new Date(a.course?.day || '').getTime()
        );
        this.loading = false;
        this.calculateAbsenceStats();
      },
      error: (error: any) => {
        console.error("Erreur lors du chargement de l'historique des absences:", error);
        this.error = "Impossible de charger l'historique des absences";
        this.loading = false;

        // Si l'API d'absence n'est pas encore implémentée, essayer l'ancienne méthode
        if (error.status === 404) {
          console.log("API d'absence non trouvée, utilisation de l'API legacy...");
          this.loadLegacyAttendanceHistory();
        }
      },
    });
  }

  /**
   * Méthode de fallback pour utiliser l'ancienne API d'attendance
   */
  private loadLegacyAttendanceHistory(): void {
    const numericStudentId =
      typeof this.studentId === 'string' ? parseInt(this.studentId) : this.studentId;

    this.attendanceService.getStudentAttendanceHistory(numericStudentId).subscribe({
      next: (records: AttendanceRecord[]) => {
        // Convertir les AttendanceRecord en Absence pour l'affichage
        this.absenceHistory = records
          .filter((record: AttendanceRecord) => record.status === 'absent')
          .map((record: AttendanceRecord) => ({
            id: record.id?.toString() || 'legacy',
            student_id: this.studentId.toString(),
            course_id: record.course_id.toString(),
            reason: record.comment || 'Absence enregistrée',
            course: {
              course_id: record.course_id.toString(),
              intitule: 'Cours',
              day: record.created_at,
            },
          })) as Absence[];
        this.loading = false;
        this.calculateAbsenceStats();
      },
      error: (legacyError: any) => {
        console.error("Erreur lors du chargement via l'API legacy:", legacyError);
        this.error = "Impossible de charger l'historique des absences";
        this.loading = false;
      },
    });
  }

  calculateAbsenceStats(): void {
    this.absenceStats = {
      total_absences: this.absenceHistory.length,
      absence_rate: 0, // Sera calculé quand on aura le nombre total de cours
    };
  }

  /**
   * Formate une date pour l'affichage
   */
  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Date inconnue';

    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Formate une heure pour l'affichage
   */
  formatTime(dateString: string | undefined): string {
    if (!dateString) return '--:--';

    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Supprime une absence
   */
  deleteAbsence(absence: Absence): void {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer cette absence ?`)) {
      return;
    }

    this.attendanceService.deleteAbsence(absence.id).subscribe({
      next: () => {
        this.absenceHistory = this.absenceHistory.filter(a => a.id !== absence.id);
        this.calculateAbsenceStats();
        this.alertService.success('Absence supprimée avec succès');
      },
      error: (error: any) => {
        console.error('Erreur lors de la suppression:', error);
        this.alertService.error("Erreur lors de la suppression de l'absence");
      },
    });
  }

  /**
   * Modifie la raison d'une absence
   */
  editAbsenceReason(absence: Absence): void {
    const newReason = prompt("Modifier la raison de l'absence:", absence.reason || '');

    if (newReason === null) return; // Annulé

    this.attendanceService.updateAbsence(absence.id, { reason: newReason }).subscribe({
      next: (updatedAbsence: Absence) => {
        const index = this.absenceHistory.findIndex(a => a.id === absence.id);
        if (index > -1) {
          this.absenceHistory[index] = updatedAbsence;
        }
        this.alertService.success("Raison d'absence mise à jour");
      },
      error: (error: any) => {
        console.error('Erreur lors de la modification:', error);
        this.alertService.error('Erreur lors de la modification de la raison');
      },
    });
  }
}
