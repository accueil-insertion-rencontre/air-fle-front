import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { LevelService } from '../../services/level.service';
import { ReferenceDataService } from '../../../reference-data/services/reference-data.service';
import { StudentAbsenceHistoryComponent } from '../student-absence-history/student-absence-history.component';
import { ApiStudent } from '../../models/student.model';
import { Level } from '../../models/level.model';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, StudentAbsenceHistoryComponent],
  templateUrl: './student-profile.component.html',
  styleUrls: ['./student-profile.component.scss']
})
export class StudentProfileComponent implements OnInit {
  student: ApiStudent | null = null;
  nextLevel: Level | null = null;
  loading = true;
  error: string | null = null;
  showAbsenceHistory = false;

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
    private levelService: LevelService,
    private referenceDataService: ReferenceDataService
  ) {}

  ngOnInit(): void {
    this.loadReferenceData();
    this.loadStudent();
  }

  private loadReferenceData(): void {
    // Charger les données de référence pour faire le mapping
    this.referenceDataService.getStatuses().subscribe(data => {
      this.statuses = data;
    });
    
    this.referenceDataService.getNationalities().subscribe(data => {
      this.nationalities = data;
    });
    
    this.referenceDataService.getFrenchLevels().subscribe(data => {
      this.frenchLevels = data;
    });

    this.referenceDataService.getGenders().subscribe(data => {
      this.genders = data;
    });

    this.referenceDataService.getOrientations().subscribe(data => {
      this.orientations = data;
    });
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
      next: (student) => {
        console.log('Données étudiant reçues:', student);
        this.student = student;
        this.loadNextLevel();
      },
      error: (err) => {
        console.error('Erreur lors du chargement de l\'étudiant:', err);
        this.error = 'Erreur lors du chargement du profil de l\'étudiant';
        this.loading = false;
      }
    });
  }

  private loadNextLevel(): void {
    if (!this.student || !this.student.initialLevel) {
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
    const currentLevel = this.student.currentLevel || this.student.initialLevel;
    
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

  calculateAge(birthDate: string): number {
    if (!birthDate) return 0;
    
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  // Méthodes pour faire le mapping avec les données de référence
  getStudentStatus(): string {
    if (!this.student) return 'Non défini';
    
    // D'abord essayer l'objet complet
    if (this.student.status?.label) {
      return this.student.status.label;
    }
    
    // Sinon faire le mapping avec l'ID
    if (this.student.status_id && this.statuses.length > 0) {
      const status = this.statuses.find(s => s.id === this.student!.status_id);
      return status?.label || 'Non défini';
    }
    
    return 'Non défini';
  }

  getStudentNationality(): string {
    if (!this.student) return 'Non renseignée';
    
    // D'abord essayer l'objet complet
    if (this.student.nationality?.label) {
      return this.student.nationality.label;
    }
    
    // Sinon faire le mapping avec l'ID
    if (this.student.nationality_id && this.nationalities.length > 0) {
      const nationality = this.nationalities.find(n => n.id === this.student!.nationality_id);
      return nationality?.label || 'Non renseignée';
    }
    
    return 'Non renseignée';
  }

  getStudentGender(): string {
    if (!this.student) return 'Non défini';
    
    // D'abord essayer l'objet complet
    if (this.student.gender?.label) {
      return this.student.gender.label;
    }
    
    // Sinon faire le mapping avec l'ID
    if (this.student.gender_id && this.genders.length > 0) {
      const gender = this.genders.find(g => g.id === this.student!.gender_id);
      return gender?.label || 'Non défini';
    }
    
    return 'Non défini';
  }

  getStudentOrientation(): string {
    if (!this.student) return 'Non définie';
    
    // D'abord essayer l'objet complet
    if (this.student.orientation?.type) {
      return this.student.orientation.type;
    }
    
    // Sinon faire le mapping avec l'ID
    if (this.student.orientation_id && this.orientations.length > 0) {
      const orientation = this.orientations.find(o => o.id === this.student!.orientation_id);
      return orientation?.type || 'Non définie';
    }
    
    return 'Non définie';
  }

  getRecentActivities() {
    // Pour l'instant, retourner un tableau vide car l'API ne semble pas fournir statusHistory
    return [];
  }

  getActivityIcon(field: string): string {
    const iconMap: { [key: string]: string } = {
      'niveau': 'level',
      'statut': 'status',
      'email': 'contact',
      'téléphone': 'contact',
      'adresse': 'location'
    };
    
    return iconMap[field.toLowerCase()] || 'default';
  }

  changeLevel(): void {
    if (this.student) {
      console.log('Changement de niveau pour:', this.student.firstname);
      // TODO: Implémenter le changement de niveau
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard/apprenants']);
  }

  editStudent(): void {
    if (this.student) {
      this.router.navigate(['/dashboard/apprenants/edit', this.student.id]);
    }
  }

  deleteStudent(): void {
    if (!this.student) return;

    const confirmDelete = confirm(
      `Êtes-vous sûr de vouloir supprimer l'étudiant ${this.student.firstname} ${this.student.lastname} ?`
    );

    if (confirmDelete) {
      this.studentService.deleteStudent(this.student.id).subscribe({
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
  generateAttestation(): void {
    // TODO: Implémenter la génération d'attestation
    console.log('Génération d\'attestation pour:', this.student?.firstname);
    alert('Fonctionnalité en cours de développement');
  }

  viewAbsences(): void {
    this.showAbsenceHistory = true;
    console.log('Affichage historique des absences pour:', this.student?.firstname);
  }

  addAbsence(): void {
    // TODO: Implémenter l'ajout d'absence manuelle
    console.log('Ajouter une absence pour:', this.student?.firstname);
    alert('Fonctionnalité d\'ajout d\'absence en cours de développement');
  }

  manageAbsences(): void {
    // Basculer vers la vue de gestion des absences
    this.showAbsenceHistory = !this.showAbsenceHistory;
    console.log('Basculer la gestion des absences de:', this.student?.firstname);
  }

  viewEvaluations(): void {
    // TODO: Naviguer vers la page des évaluations
    console.log('Voir les évaluations de:', this.student?.firstname);
    alert('Fonctionnalité en cours de développement');
  }

  addEvaluation(): void {
    // TODO: Ouvrir le formulaire d'ajout d'évaluation
    console.log('Ajouter une évaluation pour:', this.student?.firstname);
    alert('Fonctionnalité en cours de développement');
  }

  manageEvaluations(): void {
    // TODO: Naviguer vers la gestion des évaluations
    console.log('Gérer les évaluations de:', this.student?.firstname);
    alert('Fonctionnalité en cours de développement');
  }

  createParcours(): void {
    if (!this.student || !this.nextLevel) return;
    
    // TODO: Implémenter la création de suite de parcours
    console.log('Créer un parcours vers le niveau:', this.nextLevel.name);
    alert('Fonctionnalité en cours de développement');
  }
} 