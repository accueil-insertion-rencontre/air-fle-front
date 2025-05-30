import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StudentService, CreateStudentRequest } from '../../services/student.service';
import { ReferenceDataService, ReferenceData, Gender, Nationality, FrenchLevel, Financing, Status, Orientation, ExitReason, Disability } from '../../services/reference-data.service';
import { finalize, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-student-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './student-form.component.html',
  styleUrls: ['./student-form.component.scss']
})
export class StudentFormComponent implements OnInit {
  studentForm: FormGroup;
  isSubmitting = false;
  isLoading = true;
  error: string | null = null;
  
  // Données de référence
  genders: Gender[] = [];
  nationalities: Nationality[] = [];
  frenchLevels: FrenchLevel[] = [];
  financings: Financing[] = [];
  statuses: Status[] = [];
  orientations: Orientation[] = [];
  exitReasons: ExitReason[] = [];
  disabilities: Disability[] = [];

  constructor(
    private fb: FormBuilder,
    private studentService: StudentService,
    private referenceDataService: ReferenceDataService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.studentForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadReferenceData();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      // INFORMATIONS PERSONNELLES OBLIGATOIRES
      firstname: ['', [Validators.required, Validators.maxLength(100)]],
      lastname: ['', [Validators.required, Validators.maxLength(100)]],
      birthdate: ['', [Validators.required]],
      
      // INFORMATIONS PERSONNELLES OPTIONNELLES
      placeOfBirth: [''],
      email: ['', [Validators.email]],
      phone: ['', [Validators.pattern(/^\+?[0-9\s\-\(\)]{8,}$/)]],
      date_test_initial: [''],
      commentaire: [''],
      date_entree_france: [''],
      date_titre_sejour: [''],
      date_cir: [''],
      
      // IDS OBLIGATOIRES
      gender_id: ['', [Validators.required]],
      entry_level_id: ['', [Validators.required]], // Niveau déterminé par test de positionnement
      nationality_id: ['', [Validators.required]],
      financing_id: ['', [Validators.required]],
      status_id: ['', [Validators.required]],
      
      // IDS OPTIONNELS
      current_level_id: [''], // Niveau actuel en cours de formation
      orientation_id: [''],
      exit_reason_id: [''],
      
      // HANDICAPS
      hasDisability: [false], // Switch pour activer/désactiver la sélection des handicaps
      selectedDisabilities: [[]] // Tableau des handicaps sélectionnés
    });
  }

  private loadReferenceData(): void {
    this.referenceDataService.getAllReferenceData().subscribe({
      next: (data: ReferenceData) => {
        // S'assurer que toutes les données sont des tableaux
        this.genders = Array.isArray(data.genders) ? data.genders : [];
        this.nationalities = Array.isArray(data.nationalities) ? data.nationalities : [];
        this.frenchLevels = Array.isArray(data.frenchLevels) ? data.frenchLevels : [];
        this.financings = Array.isArray(data.financings) ? data.financings : [];
        this.statuses = Array.isArray(data.statuses) ? data.statuses : [];
        this.orientations = Array.isArray(data.orientations) ? data.orientations : [];
        this.exitReasons = Array.isArray(data.exitReasons) ? data.exitReasons : [];
        this.disabilities = Array.isArray(data.disabilities) ? data.disabilities : [];
        
        console.log('Données de référence chargées:', {
          genders: this.genders.length,
          nationalities: this.nationalities.length,
          frenchLevels: this.frenchLevels.length,
          financings: this.financings.length,
          statuses: this.statuses.length,
          orientations: this.orientations.length,
          exitReasons: this.exitReasons.length,
          disabilities: this.disabilities.length
        });
        
        this.isLoading = false;
      },
      error: (err) => {
        this.error = "Erreur lors du chargement des données de référence";
        console.error('Erreur lors du chargement des données:', err);
        
        // Initialiser des tableaux vides en cas d'erreur
        this.genders = [];
        this.nationalities = [];
        this.frenchLevels = [];
        this.financings = [];
        this.statuses = [];
        this.orientations = [];
        this.exitReasons = [];
        this.disabilities = [];
        
        this.isLoading = false;
      }
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.studentForm.get(field);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  getFieldError(field: string): string {
    const control = this.studentForm.get(field);
    if (control?.errors) {
      if (control.errors['required']) {
        return 'Ce champ est obligatoire';
      }
      if (control.errors['email']) {
        return 'Format d\'email invalide';
      }
      if (control.errors['pattern']) {
        return 'Format invalide';
      }
      if (control.errors['maxlength']) {
        return `Maximum ${control.errors['maxlength'].requiredLength} caractères`;
      }
    }
    return '';
  }

  onDisabilityToggle(disabilityId: string, isChecked: boolean): void {
    const selectedDisabilities = this.studentForm.get('selectedDisabilities')?.value || [];
    
    if (isChecked) {
      // Ajouter le handicap s'il n'est pas déjà présent
      if (!selectedDisabilities.includes(disabilityId)) {
        selectedDisabilities.push(disabilityId);
      }
    } else {
      // Retirer le handicap
      const index = selectedDisabilities.indexOf(disabilityId);
      if (index > -1) {
        selectedDisabilities.splice(index, 1);
      }
    }
    
    this.studentForm.patchValue({ selectedDisabilities });
  }

  onDisabilityChange(event: Event, disabilityId: string): void {
    const target = event.target as HTMLInputElement;
    this.onDisabilityToggle(disabilityId, target.checked);
  }

  isDisabilitySelected(disabilityId: string): boolean {
    const selectedDisabilities = this.studentForm.get('selectedDisabilities')?.value || [];
    return selectedDisabilities.includes(disabilityId);
  }

  onSubmit(): void {
    if (this.studentForm.valid) {
      this.isSubmitting = true;
      this.error = null;
      
      const formValue = this.studentForm.value;
      
      // Préparer les données selon l'API
      const studentData: CreateStudentRequest = {
        // INFORMATIONS PERSONNELLES OBLIGATOIRES
        firstname: formValue.firstname,
        lastname: formValue.lastname,
        birthdate: new Date(formValue.birthdate).toISOString(),
        
        // IDS OBLIGATOIRES
        gender_id: formValue.gender_id,
        entry_level_id: formValue.entry_level_id,
        nationality_id: formValue.nationality_id,
        financing_id: formValue.financing_id,
        status_id: formValue.status_id
      };

      // Ajouter les champs optionnels seulement s'ils ont une valeur
      if (formValue.placeOfBirth) {
        studentData.placeOfBirth = formValue.placeOfBirth;
      }
      if (formValue.email) {
        studentData.email = formValue.email;
      }
      if (formValue.phone) {
        studentData.phone = formValue.phone;
      }
      if (formValue.date_test_initial) {
        studentData.date_test_initial = formValue.date_test_initial;
      }
      if (formValue.commentaire) {
        studentData.commentaire = formValue.commentaire;
      }
      if (formValue.date_entree_france) {
        studentData.date_entree_france = new Date(formValue.date_entree_france).toISOString();
      }
      if (formValue.date_titre_sejour) {
        studentData.date_titre_sejour = new Date(formValue.date_titre_sejour).toISOString();
      }
      if (formValue.date_cir) {
        studentData.date_cir = new Date(formValue.date_cir).toISOString();
      }
      if (formValue.current_level_id) {
        studentData.current_level_id = formValue.current_level_id;
      }
      if (formValue.orientation_id) {
        studentData.orientation_id = formValue.orientation_id;
      }
      if (formValue.exit_reason_id) {
        studentData.exit_reason_id = formValue.exit_reason_id;
      }

      // Créer l'étudiant puis associer les handicaps si nécessaire
      this.studentService.createStudent(studentData).pipe(
        switchMap((createdStudent: any) => {
          // Si des handicaps sont sélectionnés, les associer à l'étudiant
          if (formValue.hasDisability && formValue.selectedDisabilities.length > 0) {
            return this.studentService.assignDisabilities(createdStudent.id, formValue.selectedDisabilities).pipe(
              switchMap(() => of(createdStudent))
            );
          }
          return of(createdStudent);
        }),
        finalize(() => this.isSubmitting = false)
      ).subscribe({
        next: (response) => {
          console.log('Apprenant créé avec succès:', response);
          this.router.navigate(['/dashboard/apprenants']);
        },
        error: (err) => {
          this.error = "Erreur lors de la création de l'apprenant";
          console.error('Erreur lors de la création:', err);
        }
      });
    } else {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.studentForm.controls).forEach(key => {
        this.studentForm.get(key)?.markAsTouched();
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/dashboard/apprenants']);
  }
} 