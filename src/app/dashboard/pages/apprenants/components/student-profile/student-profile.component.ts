import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { StudentService } from '@core/services';
import { ReferenceDataService } from '@core/services';
import { StudentAbsenceHistoryComponent } from '../student-absence-history/student-absence-history.component';
import { DocumentGenerationModalComponent } from '../document-generation-modal/document-generation-modal.component';
import { Student } from '@core/models';
import { Level } from '@core/models';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, StudentAbsenceHistoryComponent, DocumentGenerationModalComponent],
  templateUrl: './student-profile.component.html',
  styleUrls: ['./student-profile.component.scss'],
})
export class StudentProfileComponent implements OnInit {
  student: Student | null = null;
  nextLevel: Level | null = null;
  loading = true;
  error: string | null = null;
  showAbsenceHistory = false;
  showDocumentModal = false;

  // Données de référence pour le mapping
  statuses: any[] = [];
  nationalities: any[] = [];
  frenchLevels: any[] = [];
  genders: any[] = [];
  orientations: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private studentService: StudentService,
    private referenceDataService: ReferenceDataService
  ) {}

  ngOnInit(): void {
    this.loadReferenceData();
    this.loadStudent();
  }

  private loadReferenceData(): void {
    // Charger les données de référence pour les fallbacks
    if (!this.student || !this.student.frenchLevel) {
      console.warn('Étudiant ou niveau français non défini');
      return;
    }
    // Logique de chargement des données de référence si nécessaire
  }

  loadStudent(): void {
    const id = this.route.snapshot.params['id'];
    if (!id) {
      this.error = 'ID étudiant invalide';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = null;

    this.studentService.getStudentById(id).subscribe({
      next: student => {
        console.log('Données étudiant reçues:', student);
        this.student = student;
        this.loadNextLevel();
      },
      error: err => {
        console.error("Erreur lors du chargement de l'étudiant:", err);
        this.error = "Erreur lors du chargement du profil de l'étudiant";
        this.loading = false;
      },
    });
  }

  private loadNextLevel(): void {
    if (!this.student || !this.student.frenchLevel) {
      this.loading = false;
      return;
    }

    // Pour le moment, on désactive le chargement du niveau suivant car l'API
    // ne retourne pas exactement la structure attendée par LevelService
    // TODO: Adapter LevelService pour fonctionner avec la vraie structure de l'API
    this.nextLevel = null;
    this.loading = false;

    /* 
    // Code à réactiver quand LevelService sera adapté
    const currentLevel = this.student.frenchLevel;
    
    this.levelService.getNextLevel(currentLevel).subscribe({
      next: (nextLevel) => {
        this.nextLevel = nextLevel || null;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement du niveau suivant:', err);
        this.nextLevel = null;
        this.loading = false;
      }
    });
    */
  }

  calculateAge(birthdate: string): number {
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  getStudentInitials(): string {
    if (!this.student) return '';
    const firstName = this.student.student_firstname || '';
    const lastName = this.student.student_lastname || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }

  getStatusLabel(): string {
    if (!this.student) return 'Non défini';
    
    if (this.student.status) {
      return this.student.status.status_label;
    }

    // Fallback avec les données de référence si nécessaire
    if (this.student.status_uuid && this.statuses.length > 0) {
      const status = this.statuses.find(s => s.id === this.student!.status_uuid);
      return status?.label || 'Non défini';
    }

    return 'Non défini';
  }

  getNationalityLabel(): string {
    if (!this.student) return 'Non renseignée';
    
    if (this.student.nationality) {
      return this.student.nationality.nationality_label;
    }

    // Fallback avec les données de référence si nécessaire
    if (this.student.nationality_uuid && this.nationalities.length > 0) {
      const nationality = this.nationalities.find(n => n.id === this.student!.nationality_uuid);
      return nationality?.label || 'Non renseignée';
    }

    return 'Non renseignée';
  }

  getGenderLabel(): string {
    if (!this.student) return 'Non renseigné';
    
    if (this.student.gender) {
      return this.student.gender.gender_label;
    }

    // Fallback avec les données de référence si nécessaire
    if (this.student.gender_uuid && this.genders.length > 0) {
      const gender = this.genders.find(g => g.id === this.student!.gender_uuid);
      return gender?.label || 'Non renseigné';
    }

    return 'Non renseigné';
  }

  getOrientationLabel(): string {
    if (!this.student) return 'Non renseignée';
    
    if (this.student.orientation) {
      return this.student.orientation.orientation_type;
    }

    // Fallback avec les données de référence si nécessaire
    if (this.student.orientation_uuid && this.orientations.length > 0) {
      const orientation = this.orientations.find(o => o.id === this.student!.orientation_uuid);
      return orientation?.type || 'Non renseignée';
    }

    return 'Non renseignée';
  }

  getCurrentLevel(): { code: string; description: string } {
    if (!this.student) {
      return { code: '', description: '' };
    }

    // Si l'étudiant a des niveaux de sortie (progression), prendre le dernier
    if (this.student.exit_levels && this.student.exit_levels.length > 0) {
      const latestExitLevel = this.student.exit_levels[this.student.exit_levels.length - 1];
      return {
        code: latestExitLevel.french_level_code || '',
        description: latestExitLevel.french_level_description || ''
      };
    }

    // Sinon, retourner le niveau d'entrée
    if (this.student.frenchLevel) {
      return {
        code: this.student.frenchLevel.french_level_code,
        description: this.student.frenchLevel.french_level_description
      };
    }

    return { code: '', description: '' };
  }

  getRecentActivities() {
    // Pour l'instant, retourner un tableau vide car l'API ne semble pas fournir statusHistory
    return [];
  }

  getActivityIcon(field: string): string {
    const iconMap: { [key: string]: string } = {
      niveau: 'level',
      statut: 'status',
      email: 'contact',
      téléphone: 'contact',
      adresse: 'location',
    };

    return iconMap[field.toLowerCase()] || 'default';
  }

  changeLevel(): void {
    if (this.student) {
      console.log('Changement de niveau pour:', this.student.student_firstname);
      // TODO: Implémenter le changement de niveau
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard/apprenants']);
  }

  editStudent(): void {
    if (this.student) {
      this.router.navigate(['/dashboard/apprenants/edit', this.student.student_uuid]);
    }
  }

  deleteStudent(): void {
    if (!this.student) return;
    
    if (confirm('Êtes-vous sûr de vouloir supprimer cet étudiant ?')) {
      this.studentService.deleteStudent(this.student.student_uuid).subscribe({
        next: () => {
          this.router.navigate(['/dashboard/apprenants']);
        },
        error: (err) => {
          console.error('Erreur lors de la suppression:', err);
          alert('Erreur lors de la suppression de l\'étudiant');
        }
      });
    }
  }

  // Nouvelles méthodes pour les fonctionnalités
  openDocumentModal(): void {
    this.showDocumentModal = true;
  }

  closeDocumentModal(): void {
    this.showDocumentModal = false;
  }

  viewAbsences(): void {
    console.log("Affichage historique des absences pour:", this.student?.student_firstname);
    this.showAbsenceHistory = true;
  }

  addAbsence(): void {
    if (!this.student) return;
    
    const courseId = 'COURS_001'; // À remplacer par la vraie logique
    const absenceData = {
      student_id: this.student.student_uuid,
      course_id: courseId,
      date: new Date(),
      reason: 'Non renseigné'
    };

    console.log("Ajout d'absence pour:", this.student.student_firstname, absenceData);
    
    // Simuler une notification
    alert(`Absence ajoutée:\nÉtudiant: ${this.student.student_firstname} ${this.student.student_lastname}\nCours: ${courseId}\nDate: ${new Date().toLocaleDateString()}`);
  }

  manageAbsences(): void {
    console.log('Basculer la gestion des absences de:', this.student?.student_firstname);
    this.showAbsenceHistory = !this.showAbsenceHistory;
  }

  viewEvaluations(): void {
    console.log('Voir les évaluations de:', this.student?.student_firstname);
  }

  addEvaluation(): void {
    console.log('Ajouter une évaluation pour:', this.student?.student_firstname);
  }

  manageEvaluations(): void {
    console.log('Gérer les évaluations de:', this.student?.student_firstname);
  }

  createParcours(): void {
    if (!this.student || !this.nextLevel) return;

    // TODO: Implémenter la création de suite de parcours
    console.log('Créer un parcours vers le niveau:', this.nextLevel.name);
    alert('Fonctionnalité en cours de développement');
  }
}
