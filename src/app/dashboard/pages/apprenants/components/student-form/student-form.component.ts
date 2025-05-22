import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { LevelService } from '../../services/level.service';
import { NationalityService } from '../../services/nationality.service';
import { AddressService } from '../../services/address.service';
import { Student, Level, Nationality, Status } from '../../models/student.model';
import { STATUSES } from '../../models/status.model';
import { Observable, forkJoin } from 'rxjs';
import { map, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-student-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './student-form.component.html',
  styleUrls: ['./student-form.component.scss']
})
export class StudentFormComponent implements OnInit {
  studentForm: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  isLoading = true;
  error: string | null = null;
  currentStudent: Student | null = null;
  countries: { code: string; name: string; }[] = [];
  nationalities: Nationality[] = [];
  levels: Level[] = [];
  statuses: Status[] = STATUSES;

  constructor(
    private fb: FormBuilder,
    private studentService: StudentService,
    private levelService: LevelService,
    private nationalityService: NationalityService,
    private addressService: AddressService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.studentForm = this.createForm();
  }

  ngOnInit(): void {
    const studentId = this.route.snapshot.params['id'];
    
    // Charger d'abord les données de référence
    this.loadFormData().subscribe({
      next: () => {
    if (studentId) {
      this.isEditMode = true;
          this.loadStudent(Number(studentId));
        } else {
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.error = "Erreur lors du chargement des données de référence";
        console.error('Erreur lors du chargement des données:', err);
        this.isLoading = false;
    }
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      birthDate: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,}$/)]],
      street: ['', [Validators.required]],
      city: ['', [Validators.required]],
      zipCode: ['', [Validators.required]],
      country: ['', [Validators.required]],
      nationality: ['', [Validators.required]],
      level: ['', [Validators.required]],
      status: ['', [Validators.required]]
    });
  }

  private loadFormData(): Observable<void> {
    return forkJoin({
      countries: this.addressService.getCountries(),
      nationalities: this.nationalityService.getNationalities(),
      levels: this.levelService.getLevels()
    }).pipe(
      map(data => {
      this.countries = data.countries;
      this.nationalities = data.nationalities;
      this.levels = data.levels;
      })
    );
  }

  private loadStudent(id: number): void {
    this.studentService.getStudentById(id).subscribe({
      next: (student) => {
      if (student) {
          this.currentStudent = student;
        this.studentForm.patchValue({
          firstName: student.personalInfo.firstName,
          lastName: student.personalInfo.lastName,
          email: student.personalInfo.email,
          birthDate: this.formatDate(student.personalInfo.birthDate),
          phone: student.personalInfo.phone,
          street: student.address.street,
          city: student.address.city,
          zipCode: student.address.zipCode,
          country: student.address.country,
          nationality: student.nationality.code,
          level: student.level.code,
          status: student.status.code
        });
        } else {
          this.error = "Étudiant non trouvé";
          console.error(`Aucun étudiant trouvé avec l'ID ${id}`);
        }
      },
      error: (err) => {
        this.error = "Erreur lors du chargement de l'étudiant";
        console.error('Erreur lors du chargement de l\'étudiant:', err);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  private formatDate(date: Date): string {
    return new Date(date).toISOString().split('T')[0];
  }

  isFieldInvalid(field: string): boolean {
    const control = this.studentForm.get(field);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  onSubmit(): void {
    if (this.studentForm.valid) {
      this.isSubmitting = true;
      const formValue = this.studentForm.value;

      const studentData = {
        personalInfo: {
          firstName: formValue.firstName,
          lastName: formValue.lastName,
          email: formValue.email,
          birthDate: new Date(formValue.birthDate),
          phone: formValue.phone
        },
        address: {
          street: formValue.street,
          city: formValue.city,
          zipCode: formValue.zipCode,
          country: formValue.country
        },
        nationality: this.nationalities.find(n => n.code === formValue.nationality)!,
        level: this.levels.find(l => l.code === formValue.level)!,
        status: this.statuses.find(s => s.code === formValue.status)!,
        statusHistory: this.isEditMode && this.currentStudent
          ? [
              ...this.currentStudent.statusHistory,
              ...(this.currentStudent.status.code !== formValue.status
                ? [{
                    date: new Date(),
                    field: 'status' as const,
                    oldValue: this.currentStudent.status.code,
                    newValue: formValue.status,
                    comment: 'Mise à jour du statut'
                  }]
                : []),
              ...(this.currentStudent.level.code !== formValue.level
                ? [{
                    date: new Date(),
                    field: 'level' as const,
                    oldValue: this.currentStudent.level.code,
                    newValue: formValue.level,
                    comment: 'Mise à jour du niveau'
                  }]
                : [])
            ]
          : [
          {
            date: new Date(),
            field: 'status' as const,
            oldValue: '',
            newValue: formValue.status,
            comment: 'Statut initial'
          },
          {
            date: new Date(),
            field: 'level' as const,
            oldValue: '',
            newValue: formValue.level,
            comment: 'Niveau initial'
          }
        ]
      };

      const request: Observable<Student> = this.isEditMode
        ? this.studentService.updateStudent(Number(this.route.snapshot.params['id']), studentData)
        : this.studentService.createStudent(studentData);

      request.pipe(
        finalize(() => this.isSubmitting = false)
      ).subscribe({
        next: () => {
          this.router.navigate(['/dashboard/apprenants']);
        },
        error: (err) => {
          this.error = this.isEditMode 
            ? "Erreur lors de la mise à jour de l'étudiant"
            : "Erreur lors de la création de l'étudiant";
          console.error('Erreur lors de la soumission:', err);
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/dashboard/apprenants']);
  }
} 