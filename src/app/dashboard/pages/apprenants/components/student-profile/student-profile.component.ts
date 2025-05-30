import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { LevelService } from '../../services/level.service';
import { Student } from '../../models/student.model';
import { Level } from '../../models/level.model';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './student-profile.component.html',
  styleUrls: ['./student-profile.component.scss']
})
export class StudentProfileComponent implements OnInit {
  student: Student | null = null;
  nextLevel: Level | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private studentService: StudentService,
    private levelService: LevelService
  ) {}

  ngOnInit(): void {
    this.loadStudent();
  }

  loadStudent(): void {
    const id = Number(this.route.snapshot.params['id']);
    if (!id) {
      this.error = 'ID étudiant invalide';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = null;

    this.studentService.getStudentById(id).subscribe({
      next: (student) => {
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
    if (!this.student) {
      this.loading = false;
      return;
    }

    this.levelService.getNextLevel(this.student.level).subscribe({
      next: (nextLevel) => {
        this.nextLevel = nextLevel || null;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement du niveau suivant:', err);
        // On continue même si on ne peut pas charger le niveau suivant
        this.nextLevel = null;
        this.loading = false;
      }
    });
  }

  calculateAge(birthDate: Date): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  getRecentActivities() {
    if (!this.student || !this.student.statusHistory) {
      return [];
    }
    
    // Retourne les 3 dernières activités
    return this.student.statusHistory
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
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
      // Ici vous pourriez ouvrir un modal ou naviguer vers une page de changement de niveau
      console.log('Changement de niveau pour:', this.student.personalInfo.firstName);
      // Exemple: this.router.navigate(['/dashboard/apprenants', this.student.id, 'change-level']);
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
      `Êtes-vous sûr de vouloir supprimer l'étudiant ${this.student.personalInfo.firstName} ${this.student.personalInfo.lastName} ?`
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
    console.log('Génération d\'attestation pour:', this.student?.personalInfo.firstName);
    alert('Fonctionnalité en cours de développement');
  }

  viewAbsences(): void {
    // TODO: Naviguer vers la page des absences
    console.log('Voir les absences de:', this.student?.personalInfo.firstName);
    alert('Fonctionnalité en cours de développement');
  }

  addAbsence(): void {
    // TODO: Ouvrir le formulaire d'ajout d'absence
    console.log('Ajouter une absence pour:', this.student?.personalInfo.firstName);
    alert('Fonctionnalité en cours de développement');
  }

  manageAbsences(): void {
    // TODO: Naviguer vers la gestion des absences
    console.log('Gérer les absences de:', this.student?.personalInfo.firstName);
    alert('Fonctionnalité en cours de développement');
  }

  viewEvaluations(): void {
    // TODO: Naviguer vers la page des évaluations
    console.log('Voir les évaluations de:', this.student?.personalInfo.firstName);
    alert('Fonctionnalité en cours de développement');
  }

  addEvaluation(): void {
    // TODO: Ouvrir le formulaire d'ajout d'évaluation
    console.log('Ajouter une évaluation pour:', this.student?.personalInfo.firstName);
    alert('Fonctionnalité en cours de développement');
  }

  manageEvaluations(): void {
    // TODO: Naviguer vers la gestion des évaluations
    console.log('Gérer les évaluations de:', this.student?.personalInfo.firstName);
    alert('Fonctionnalité en cours de développement');
  }

  createParcours(): void {
    if (!this.student || !this.nextLevel) return;
    
    // TODO: Implémenter la création de suite de parcours
    console.log('Créer un parcours vers le niveau:', this.nextLevel.name);
    alert('Fonctionnalité en cours de développement');
  }
} 