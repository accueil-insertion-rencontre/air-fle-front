import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StudentService, ReferenceDataService, SanitizationService, ValidationService } from '@core/services';
import { AutoSanitizeDirective } from '@shared/directives';
import {
  CreateStudentRequest,
  Gender,
  Nationality,
  FrenchLevel,
  Financing,
  Status,
  Orientation,
  ExitReason,
  Disability,
} from '@core/models';

// Interface ReferenceData pour les données locales
export interface ReferenceData {
  genders: Gender[];
  nationalities: Nationality[];
  frenchLevels: FrenchLevel[];
  financings: Financing[];
  statuses: Status[];
  orientations: Orientation[];
  exitReasons: ExitReason[];
  disabilities: Disability[];
}
import { finalize, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-student-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AutoSanitizeDirective],
  templateUrl: './student-form.component.html',
  styleUrls: ['./student-form.component.scss'],
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
    private sanitizationService: SanitizationService,
    private validationService: ValidationService,
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
      firstname: ['', [
        Validators.required, 
        Validators.maxLength(100),
        this.validationService.validNameValidator(),
        this.validationService.noHtmlValidator()
      ]],
      lastname: ['', [
        Validators.required, 
        Validators.maxLength(100),
        this.validationService.validNameValidator(),
        this.validationService.noHtmlValidator()
      ]],
      birthdate: ['', [Validators.required]],

      // INFORMATIONS PERSONNELLES OPTIONNELLES
      placeOfBirth: ['', [this.validationService.noHtmlValidator()]],
      email: ['', [
        Validators.email,
        this.validationService.validSanitizedEmailValidator(),
        this.validationService.noHtmlValidator()
      ]],
      phone: ['', [
        Validators.pattern(/^\+?[0-9\s\-\(\)]{8,}$/),
        this.validationService.validSanitizedPhoneValidator(),
        this.validationService.noHtmlValidator()
      ]],
      date_test_initial: [''],
      commentaire: ['', [this.validationService.noHtmlValidator()]],
      date_entree_france: [''],
      date_titre_sejour: [''],
      date_cir: [''],

      // IDS OBLIGATOIRES
      gender_id: ['', [Validators.required]],
      initial_level_id: ['', [Validators.required]], // Niveau déterminé par test de positionnement
      nationality_id: ['', [Validators.required]],
      financing_id: ['', [Validators.required]],
      status_id: ['', [Validators.required]],

      // IDS OPTIONNELS
      current_level_id: [''], // Niveau actuel en cours de formation
      orientation_id: [''],
      exit_reason_id: [''],

      // HANDICAPS
      hasDisability: [false], // Switch pour activer/désactiver la sélection des handicaps
      selectedDisabilities: [[]], // Tableau des handicaps sélectionnés
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
          disabilities: this.disabilities.length,
        });

        this.isLoading = false;
      },
      error: err => {
        this.error = 'Erreur lors du chargement des données de référence';
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
      },
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
        return "Format d'email invalide";
      }
      if (control.errors['pattern']) {
        return 'Format invalide';
      }
      if (control.errors['maxlength']) {
        return `Maximum ${control.errors['maxlength'].requiredLength} caractères`;
      }
      if (control.errors['containsHtml']) {
        return 'Ce champ ne peut pas contenir de code HTML';
      }
      if (control.errors['invalidNameCharacters']) {
        return 'Ce nom contient des caractères non autorisés';
      }
      if (control.errors['invalidSanitizedEmail']) {
        return 'Format d\'email invalide après nettoyage';
      }
      if (control.errors['invalidSanitizedPhone']) {
        return 'Format de téléphone invalide';
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

      // ÉTAPE 1: Sanitiser les données du formulaire
      console.log('=== AVANT SANITISATION ===');
      console.log('Données brutes:', formValue);
      
      const sanitizedFormData = this.sanitizationService.sanitizeStudentFormData(formValue);
      
      console.log('=== APRÈS SANITISATION ===');
      console.log('Données sanitisées:', sanitizedFormData);

      // ÉTAPE 2: Préparer les données selon le schéma Prisma - OBJET PROPRE
      const studentData: any = {
        // INFORMATIONS PERSONNELLES OBLIGATOIRES
        student_firstname: sanitizedFormData.firstname,
        student_lastname: sanitizedFormData.lastname,
        student_birthdate: new Date(sanitizedFormData.birthdate),

        // IDS OBLIGATOIRES selon le schéma Prisma
        gender_uuid: sanitizedFormData.gender_id,
        french_level_uuid: sanitizedFormData.initial_level_id,
        nationality_uuid: sanitizedFormData.nationality_id,
        financing_uuid: sanitizedFormData.financing_id,
        status_uuid: sanitizedFormData.status_id,
      };

      // Ajouter les champs optionnels seulement s'ils ont une valeur NON VIDE
      if (sanitizedFormData.placeOfBirth && sanitizedFormData.placeOfBirth.trim()) {
        studentData.student_place_of_birth = sanitizedFormData.placeOfBirth.trim();
      }
      if (sanitizedFormData.email && sanitizedFormData.email.trim()) {
        studentData.student_mail = sanitizedFormData.email.trim();
      }
      if (sanitizedFormData.phone && sanitizedFormData.phone.trim()) {
        // Nettoyer le téléphone et le convertir en nombre
        const cleanPhone = sanitizedFormData.phone.replace(/[^0-9]/g, '');
        if (cleanPhone) {
          studentData.student_phone = parseInt(cleanPhone);
        }
      }
      if (sanitizedFormData.date_test_initial) {
        studentData.student_date_test_initial = new Date(sanitizedFormData.date_test_initial);
      }
      if (sanitizedFormData.commentaire && sanitizedFormData.commentaire.trim()) {
        studentData.student_commentary = sanitizedFormData.commentaire.trim();
      }
      if (sanitizedFormData.date_entree_france) {
        studentData.student_date_entry_france = new Date(sanitizedFormData.date_entree_france);
      }
      if (sanitizedFormData.date_titre_sejour) {
        studentData.student_date_residence_permit = new Date(sanitizedFormData.date_titre_sejour);
      }
      if (sanitizedFormData.date_cir) {
        studentData.student_date_cir = new Date(sanitizedFormData.date_cir);
      }

      // DEBUG : Voir exactement ce qui est envoyé
      console.log('=== DONNÉES FINALES ENVOYÉES À L\'API ===');
      console.log('Student data:', studentData);
      console.log('Email check:', {
        rawEmail: formValue.email,
        sanitizedEmail: sanitizedFormData.email,
        trimmedEmail: sanitizedFormData.email?.trim(),
        willSend: !!(sanitizedFormData.email && sanitizedFormData.email.trim())
      });

      // Créer l'étudiant puis associer les handicaps si nécessaire
      this.studentService
        .createStudent(studentData)
        .pipe(
          switchMap((createdStudent: any) => {
            // Si des handicaps sont sélectionnés, les associer à l'étudiant
            if (sanitizedFormData.hasDisability && sanitizedFormData.selectedDisabilities.length > 0) {
              return this.studentService
                .assignDisabilities(createdStudent.student_uuid, sanitizedFormData.selectedDisabilities)
                .pipe(switchMap(() => of(createdStudent)));
            }
            return of(createdStudent);
          }),
          finalize(() => (this.isSubmitting = false))
        )
        .subscribe({
          next: response => {
            console.log('Apprenant créé avec succès:', response);
            this.router.navigate(['/dashboard/apprenants']);
          },
          error: err => {
            this.error = "Erreur lors de la création de l'apprenant";
            console.error('Erreur lors de la création:', err);
          },
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
