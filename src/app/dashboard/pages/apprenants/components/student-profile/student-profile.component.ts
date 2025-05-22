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
  isReadOnlyMode = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private studentService: StudentService,
    private levelService: LevelService
  ) {}

  ngOnInit(): void {
    const studentId = Number(this.route.snapshot.params['id']);
    if (!isNaN(studentId)) {
      this.loadStudent(studentId);
    } else {
      this.error = "ID d'étudiant invalide";
      console.error("ID d'étudiant invalide dans l'URL");
    }
  }

  private loadStudent(id: number): void {
    this.studentService.getStudentById(id).subscribe({
      next: (student) => {
      if (student) {
        this.student = student;
        this.loadNextLevel(student.level);
      } else {
          this.error = "Étudiant non trouvé";
          console.error(`Aucun étudiant trouvé avec l'ID ${id}`);
          this.router.navigate(['/dashboard/apprenants']);
        }
      },
      error: (err) => {
        this.error = "Erreur lors du chargement de l'étudiant";
        console.error('Erreur lors du chargement de l\'étudiant:', err);
        this.router.navigate(['/dashboard/apprenants']);
      }
    });
  }

  private loadNextLevel(currentLevel: Level): void {
    this.levelService.getNextLevel(currentLevel).subscribe({
      next: (level) => {
      this.nextLevel = level || null;
      },
      error: (err) => {
        console.error('Erreur lors du chargement du niveau suivant:', err);
        this.nextLevel = null;
      }
    });
  }

  editStudent(): void {
    if (this.student) {
      this.router.navigate(['/dashboard/apprenants', this.student.id, 'edit']);
    }
  }

  deleteStudent(): void {
    if (this.student && confirm('Êtes-vous sûr de vouloir supprimer cet apprenant ?')) {
      this.studentService.deleteStudent(this.student.id).subscribe({
        next: () => {
        this.router.navigate(['/dashboard/apprenants']);
        },
        error: (err) => {
          this.error = "Erreur lors de la suppression de l'étudiant";
          console.error('Erreur lors de la suppression de l\'étudiant:', err);
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard/apprenants']);
  }
} 