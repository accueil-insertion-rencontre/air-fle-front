import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

import { ExamService, StudentService, AlertService } from '@core/services';
import { Exam, ExamDisplayInfo, CreateExamDto, Student } from '@core/models';

@Component({
  selector: 'app-examens',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './examens.component.html',
  styleUrls: ['./examens.component.scss']
})
export class ExamensComponent implements OnInit, OnDestroy {
  // Loading states
  isLoading = true;
  isCreating = false;
  isDeleting = false;
  isUpdating = false;

  // Data
  exams: Exam[] = [];
  students: Student[] = [];
  filteredExams: ExamDisplayInfo[] = [];

  // UI state
  showCreateForm = false;
  showEditForm = false;
  showDeleteConfirm = false;
  selectedExam: Exam | null = null;
  examToDelete: ExamDisplayInfo | null = null;
  searchTerm = '';
  sortBy: 'date' | 'student' | 'score' = 'date';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Forms
  examForm: FormGroup;
  editForm: FormGroup;

  // Error handling
  error: string | null = null;

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    private examService: ExamService,
    private studentService: StudentService,
    private alertService: AlertService,
    private fb: FormBuilder
  ) {
    this.examForm = this.createExamForm();
    this.editForm = this.createEditForm();
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Charge les données initiales
   */
  private loadInitialData(): void {
    this.isLoading = true;
    this.error = null;

    // Charger les examens et les étudiants en parallèle
    const examsSub = this.examService.getAllExams().subscribe({
      next: (response) => {
        console.log('📚 ExamensComponent: Examens chargés:', response);
        // L'API peut retourner un objet avec une propriété contenant le tableau
        const responseData = response as any; // Assertion de type pour éviter les erreurs TypeScript
        
        if (Array.isArray(responseData)) {
          this.exams = responseData;
        } else if (responseData && Array.isArray(responseData.data)) {
          this.exams = responseData.data;
        } else if (responseData && Array.isArray(responseData.exams)) {
          this.exams = responseData.exams;
        } else {
          console.warn('Format de réponse inattendu pour les examens:', responseData);
          this.exams = [];
        }
        this.updateFilteredExams();
      },
      error: (error) => {
        console.error('❌ ExamensComponent: Erreur lors du chargement des examens:', error);
        this.error = 'Impossible de charger les examens. ' + error.message;
        this.isLoading = false;
      }
    });

    const studentsSub = this.studentService.getStudents().subscribe({
      next: (response) => {
        console.log('👥 ExamensComponent: Étudiants chargés:', response);
        this.students = response.students || [];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ ExamensComponent: Erreur lors du chargement des étudiants:', error);
        this.alertService.error('Impossible de charger la liste des étudiants');
        this.isLoading = false;
      }
    });

    this.subscriptions.push(examsSub, studentsSub);
  }

  /**
   * Met à jour la liste filtrée des examens
   */
  private updateFilteredExams(): void {
    if (!Array.isArray(this.exams)) {
      console.warn('Les examens ne sont pas un tableau:', this.exams);
      this.filteredExams = [];
      return;
    }
    
    // Enrichir les examens avec les données des étudiants si nécessaire
    const enrichedExams = this.exams.map(exam => {
      if (!exam.student && exam.student_uuid) {
        const student = this.students.find(s => s.student_uuid === exam.student_uuid);
        if (student) {
          exam.student = {
            student_uuid: student.student_uuid,
            student_firstname: student.student_firstname,
            student_lastname: student.student_lastname,
            student_mail: student.student_mail
          };
        }
      }
      return exam;
    });
    
    let filtered = this.examService.getExamsDisplayInfo(enrichedExams);

    // Filtrage par terme de recherche
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(exam => 
        exam.label.toLowerCase().includes(term) ||
        exam.studentName.toLowerCase().includes(term) ||
        (exam.score && exam.score.toLowerCase().includes(term))
      );
    }

    // Tri
    filtered.sort((a, b) => {
      let compareValue = 0;
      
      switch (this.sortBy) {
        case 'date':
          compareValue = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'student':
          compareValue = a.studentName.localeCompare(b.studentName);
          break;
        case 'score':
          const scoreA = a.score || '';
          const scoreB = b.score || '';
          compareValue = scoreA.localeCompare(scoreB);
          break;
      }

      return this.sortDirection === 'desc' ? -compareValue : compareValue;
    });

    this.filteredExams = filtered;
  }

  /**
   * Crée le formulaire d'examen
   */
  private createExamForm(): FormGroup {
    return this.fb.group({
      exam_label: ['', [Validators.required, Validators.minLength(3)]],
      exam_taked_at: ['', Validators.required],
      exam_score: [''],
      student_uuid: ['', Validators.required]
    });
  }

  /**
   * Crée le formulaire d'édition simplifié
   */
  private createEditForm(): FormGroup {
    return this.fb.group({
      exam_label: ['', [Validators.required, Validators.minLength(3)]],
      exam_score: ['']
    });
  }

  /**
   * Gère le changement de terme de recherche
   */
  onSearchChange(): void {
    this.updateFilteredExams();
  }

  /**
   * Change le tri
   */
  onSortChange(field: 'date' | 'student' | 'score'): void {
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDirection = 'desc';
    }
    this.updateFilteredExams();
  }

  /**
   * Affiche le formulaire de création
   */
  showCreateExamForm(): void {
    this.showCreateForm = true;
    this.showEditForm = false;
    this.examForm.reset();
    this.selectedExam = null;
    this.error = null;
  }

  /**
   * Cache le formulaire de création
   */
  hideCreateForm(): void {
    this.showCreateForm = false;
    this.examForm.reset();
    this.selectedExam = null;
    this.error = null;
  }

  /**
   * Affiche le formulaire d'édition
   */
  showEditExamForm(exam: ExamDisplayInfo): void {
    const originalExam = this.exams.find(e => e.exam_uuid === exam.id);
    if (!originalExam) return;

    this.selectedExam = originalExam;
    this.showEditForm = true;
    this.showCreateForm = false;
    this.error = null;

    // Pré-remplir seulement les champs modifiables
    this.editForm.patchValue({
      exam_label: originalExam.exam_label,
      exam_score: originalExam.exam_score || ''
    });
  }

  /**
   * Cache le formulaire d'édition
   */
  hideEditForm(): void {
    this.showEditForm = false;
    this.editForm.reset();
    this.selectedExam = null;
    this.error = null;
  }

  /**
   * Crée un nouvel examen
   */
  onCreateExam(): void {
    if (this.examForm.valid && !this.isCreating) {
      this.isCreating = true;
      this.error = null;

      const examData: CreateExamDto = {
        exam_label: this.examForm.value.exam_label,
        exam_taked_at: new Date(this.examForm.value.exam_taked_at),
        exam_score: this.examForm.value.exam_score || null,
        student_uuid: this.examForm.value.student_uuid
      };

      console.log('🚀 ExamensComponent: Création d\'un nouvel examen:', examData);

      const createSub = this.examService.createExam(examData).subscribe({
        next: (newExam) => {
          console.log('✅ ExamensComponent: Examen créé avec succès:', newExam);
          this.exams.push(newExam);
          this.updateFilteredExams();
          this.hideCreateForm();
          this.alertService.success('Examen créé avec succès !');
          this.isCreating = false;
        },
        error: (error) => {
          console.error('❌ ExamensComponent: Erreur lors de la création:', error);
          this.error = error.message;
          this.isCreating = false;
        }
      });

      this.subscriptions.push(createSub);
    } else {
      this.markFormGroupTouched(this.examForm);
    }
  }

  /**
   * Met à jour un examen existant
   */
  onUpdateExam(): void {
    if (this.editForm.valid && !this.isUpdating && this.selectedExam) {
      this.isUpdating = true;
      this.error = null;

      // On ne met à jour que les champs modifiables, en gardant les valeurs originales pour les autres
      const examData: CreateExamDto = {
        exam_label: this.editForm.value.exam_label,
        exam_taked_at: this.selectedExam.exam_taked_at, // Garder la date originale
        exam_score: this.editForm.value.exam_score || null,
        student_uuid: this.selectedExam.student_uuid // Garder l'étudiant original
      };

      console.log('🔄 ExamensComponent: Mise à jour de l\'examen (champs modifiables seulement):', examData);

      const updateSub = this.examService.updateExam(this.selectedExam.exam_uuid, examData).subscribe({
        next: (updatedExam) => {
          console.log('✅ ExamensComponent: Examen mis à jour avec succès:', updatedExam);
          const index = this.exams.findIndex(e => e.exam_uuid === updatedExam.exam_uuid);
          if (index !== -1) {
            this.exams[index] = updatedExam;
          }
          this.updateFilteredExams();
          this.hideEditForm();
          this.alertService.success('Examen mis à jour avec succès !');
          this.isUpdating = false;
        },
        error: (error) => {
          console.error('❌ ExamensComponent: Erreur lors de la mise à jour:', error);
          this.error = error.message;
          this.isUpdating = false;
        }
      });

      this.subscriptions.push(updateSub);
    } else {
      this.markFormGroupTouched(this.editForm);
    }
  }

  /**
   * Supprime un examen
   */
  onDeleteExam(exam: ExamDisplayInfo): void {
    this.examToDelete = exam;
    this.showDeleteConfirm = true;
  }

  /**
   * Confirme la suppression d'un examen
   */
  confirmDelete(): void {
    if (this.examToDelete) {
      this.isDeleting = true;

      const deleteSub = this.examService.deleteExam(this.examToDelete.id).subscribe({
        next: () => {
          console.log('✅ ExamensComponent: Examen supprimé avec succès');
          this.exams = this.exams.filter(e => e.exam_uuid !== this.examToDelete!.id);
          this.updateFilteredExams();
          this.alertService.success('Examen supprimé avec succès !');
          this.isDeleting = false;
          this.examToDelete = null;
          this.showDeleteConfirm = false;
        },
        error: (error) => {
          console.error('❌ ExamensComponent: Erreur lors de la suppression:', error);
          this.alertService.error('Erreur lors de la suppression : ' + error.message);
          this.isDeleting = false;
          this.examToDelete = null;
          this.showDeleteConfirm = false;
        }
      });

      this.subscriptions.push(deleteSub);
    }
  }

  /**
   * Annule la suppression d'un examen
   */
  cancelDelete(): void {
    this.examToDelete = null;
    this.showDeleteConfirm = false;
  }

  /**
   * Rafraîchit les données
   */
  onRefresh(): void {
    this.loadInitialData();
  }

  /**
   * Obtient le nom d'un étudiant à partir de son UUID
   */
  getStudentName(studentUuid: string): string {
    const student = this.students.find(s => s.student_uuid === studentUuid);
    return student ? `${student.student_firstname} ${student.student_lastname}` : 'Étudiant inconnu';
  }

  /**
   * Obtient le nombre total d'examens
   */
  getTotalExams(): number {
    if (!Array.isArray(this.exams)) {
      return 0;
    }
    return this.exams.length;
  }

  /**
   * Obtient le nombre d'examens avec notes
   */
  getExamsWithScores(): number {
    if (!Array.isArray(this.exams)) {
      return 0;
    }
    return this.exams.filter(exam => exam.exam_score && exam.exam_score.trim()).length;
  }

  /**
   * Obtient le nom affiché de l'étudiant sélectionné pour l'édition
   */
  getStudentDisplayName(): string {
    if (!this.selectedExam) return 'Aucun étudiant sélectionné';
    
    // Chercher l'étudiant dans la liste
    const student = this.students.find(s => s.student_uuid === this.selectedExam!.student_uuid);
    if (student) {
      return `${student.student_firstname} ${student.student_lastname}`;
    }
    
    // Si pas trouvé dans la liste, utiliser les données de l'examen si disponibles
    if (this.selectedExam.student) {
      return `${this.selectedExam.student.student_firstname} ${this.selectedExam.student.student_lastname}`;
    }
    
    return `Étudiant (ID: ${this.selectedExam.student_uuid})`;
  }

  /**
   * Marque tous les champs du formulaire comme touchés
   */
  private markFormGroupTouched(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      form.get(key)?.markAsTouched();
    });
  }

  /**
   * Vérifie si un champ du formulaire a une erreur
   */
  hasFieldError(fieldName: string, form: FormGroup = this.examForm): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  /**
   * Obtient le message d'erreur pour un champ
   */
  getFieldError(fieldName: string, form: FormGroup = this.examForm): string {
    const field = form.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return 'Ce champ est obligatoire';
      }
      if (field.errors['minlength']) {
        return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
      }
    }
    return '';
  }

  /**
   * TrackBy function pour optimiser le rendu de la liste
   */
  trackByExamId(index: number, exam: ExamDisplayInfo): string {
    return exam.id;
  }
} 