import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { CourseService } from '../../../../core/services/course.service';
import { SessionService } from '../../../../core/services/session.service';
import { Session } from '../../../../core/models/session.model';
import { Course } from '../../../../core/models/course.model';
import { AlertService } from '../../../../core/services/alert.service';

@Component({
  selector: 'app-course-create',
  templateUrl: './course-create.component.html',
  styleUrls: ['./course-create.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule]
})
export class CourseCreateComponent implements OnInit {
  courseForm: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  isEditMode = false;
  courseId?: string | number;
  sessions: Session[] = [];
  
  // Créneaux horaires disponibles
  timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
  ];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private courseService: CourseService,
    private sessionService: SessionService,
    private alertService: AlertService
  ) {
    this.courseForm = this.formBuilder.group({
      session_id: [null, Validators.required],
      day: ['', Validators.required],
      title: ['', [Validators.required, Validators.minLength(3)]],
      start_hour: ['', Validators.required],
      end_hour: ['', Validators.required],
      user_id: [null] // Optionnel pour l'instant
    });
  }

  ngOnInit(): void {
    this.loadSessions();
    
    // Vérifier si nous sommes en mode édition
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.courseId = params['id'];
        if (this.courseId) {
          this.loadCourseDetails(this.courseId);
        }
      } else {
        // En mode création, définir la date d'aujourd'hui par défaut
        const today = new Date().toISOString().split('T')[0];
        this.courseForm.patchValue({
          day: today,
          start_hour: '09:00',
          end_hour: '12:00'
        });
      }
    });
  }

  loadSessions(): void {
    this.sessionService.getSessions().subscribe({
      next: (sessions) => {
        this.sessions = sessions;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des sessions', err);
        this.error = 'Impossible de charger les sessions. Veuillez réessayer plus tard.';
      }
    });
  }

  loadCourseDetails(id: string | number): void {
    this.loading = true;
    this.courseService.getCourseById(id).subscribe({
      next: (course) => {
        this.courseForm.patchValue({
          session_id: course.session_id,
          day: course.day,
          title: course.title,
          start_hour: course.start_hour,
          end_hour: course.end_hour,
          user_id: course.user_id
        });
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des détails du cours', err);
        this.error = 'Impossible de charger les détails du cours. Veuillez réessayer plus tard.';
        this.loading = false;
      }
    });
  }

  get f() { return this.courseForm.controls; }

  onSubmit() {
    this.submitted = true;

    // Stop si formulaire invalide
    if (this.courseForm.invalid) {
      return;
    }

    this.loading = true;
    
    // Préparer les données du formulaire
    const formValue: Partial<Course> = {
      session_id: this.courseForm.value.session_id,
      day: this.courseForm.value.day,
      title: this.courseForm.value.title,
      start_hour: this.courseForm.value.start_hour,
      end_hour: this.courseForm.value.end_hour,
      user_id: this.courseForm.value.user_id
    };

    if (this.isEditMode && this.courseId) {
      // Mode édition
      this.courseService.updateCourse(this.courseId, formValue).subscribe({
        next: () => {
          this.alertService.success('Cours modifié avec succès !').then(() => {
            this.router.navigate(['/dashboard/courses']);
          });
        },
        error: (error) => {
          console.error('Erreur lors de la modification du cours:', error);
          this.error = error?.error?.message || 'Une erreur est survenue lors de la modification';
          this.loading = false;
        }
      });
    } else {
      // Mode création
      this.courseService.createCourse(formValue).subscribe({
        next: () => {
          this.alertService.success('Cours créé avec succès !').then(() => {
            this.router.navigate(['/dashboard/courses']);
          });
        },
        error: (error) => {
          console.error('Erreur lors de la création du cours:', error);
          this.error = error?.error?.message || 'Une erreur est survenue lors de la création';
          this.loading = false;
        }
      });
    }
  }

  // Vérifie si le champ a été touché et est invalide
  isFieldInvalid(fieldName: string): boolean {
    const control = this.courseForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched || this.submitted));
  }

  // Réinitialise le formulaire
  resetForm() {
    const today = new Date().toISOString().split('T')[0];
    this.courseForm.reset({
      day: today,
      title: '',
      start_hour: '09:00',
      end_hour: '12:00'
    });
    this.submitted = false;
    this.error = '';
  }
}
