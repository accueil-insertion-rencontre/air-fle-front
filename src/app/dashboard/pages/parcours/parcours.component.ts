import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { 
  StudentProgress, 
  ProgressSummary, 
  ProgressFilters, 
  ProgressSortOptions 
} from '../../../core/models/student-progress.model';
import { ParcoursService } from '../../../core/services/parcours.service';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-parcours',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './parcours.component.html',
  styleUrls: ['./parcours.component.scss']
})
export class ParcoursComponent implements OnInit, OnDestroy {
  // Data
  studentProgressList: StudentProgress[] = [];
  filteredProgressList: StudentProgress[] = [];
  progressSummary: ProgressSummary | null = null;
  selectedStudent: StudentProgress | null = null;

  // UI State
  isLoading = false;
  isLoadingSummary = false;
  error: string | null = null;
  showFilters = false;
  showStudentDetail = false;
  viewMode: 'list' | 'cards' | 'timeline' = 'cards';

  // Forms
  filterForm: FormGroup;
  
  // Sorting and filtering
  currentSort: ProgressSortOptions = {
    field: 'progress',
    direction: 'desc'
  };
  
  // Subscriptions
  private subscriptions: Subscription[] = [];

  // Constants
  readonly frenchLevels = [
    { code: 'A1', label: 'A1 - Débutant' },
    { code: 'A2', label: 'A2 - Élémentaire' },
    { code: 'B1', label: 'B1 - Intermédiaire' },
    { code: 'B2', label: 'B2 - Avancé' },
    { code: 'C1', label: 'C1 - Autonome' },
    { code: 'C2', label: 'C2 - Maîtrise' }
  ];

  constructor(
    private parcoursService: ParcoursService,
    private alertService: AlertService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.createFilterForm();
  }

  ngOnInit(): void {
    console.log('🚀 ParcoursComponent: Initialisation');
    this.loadData();
    this.setupFilterSubscription();
  }

  ngOnDestroy(): void {
    console.log('🔚 ParcoursComponent: Nettoyage des subscriptions');
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Charge toutes les données
   */
  loadData(): void {
    this.loadProgressSummary();
    this.loadStudentProgress();
  }

  /**
   * Charge le résumé des parcours
   */
  loadProgressSummary(): void {
    console.log('🔄 ParcoursComponent: Chargement du résumé...');
    this.isLoadingSummary = true;

    const summarySub = this.parcoursService.getProgressSummary().subscribe({
      next: (summary) => {
        console.log('✅ ParcoursComponent: Résumé chargé', summary);
        this.progressSummary = summary;
        this.isLoadingSummary = false;
      },
      error: (error) => {
        console.error('❌ ParcoursComponent: Erreur lors du chargement du résumé:', error);
        this.alertService.error('Erreur lors du chargement du résumé : ' + error.message);
        this.isLoadingSummary = false;
      }
    });

    this.subscriptions.push(summarySub);
  }

  /**
   * Charge la liste des parcours étudiants
   */
  loadStudentProgress(): void {
    console.log('🔄 ParcoursComponent: Chargement des parcours...');
    this.isLoading = true;
    this.error = null;

    const filters = this.buildFilters();
    
    const progressSub = this.parcoursService.getAllStudentProgress(filters).subscribe({
      next: (progressList) => {
        console.log('✅ ParcoursComponent: Parcours chargés', progressList.length, 'étudiants');
        this.studentProgressList = progressList;
        this.applySort();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ ParcoursComponent: Erreur lors du chargement des parcours:', error);
        this.error = 'Erreur lors du chargement des parcours : ' + error.message;
        this.isLoading = false;
      }
    });

    this.subscriptions.push(progressSub);
  }

  /**
   * Actualise les données
   */
  onRefresh(): void {
    console.log('🔄 ParcoursComponent: Actualisation des données');
    this.loadData();
  }

  /**
   * Affiche les détails d'un étudiant
   */
  showStudentDetails(student: StudentProgress): void {
    console.log('👁️ ParcoursComponent: Affichage des détails pour', student.student_firstname);
    this.selectedStudent = student;
    this.showStudentDetail = true;
  }

  /**
   * Ferme les détails d'un étudiant
   */
  closeStudentDetails(): void {
    this.selectedStudent = null;
    this.showStudentDetail = false;
  }

  /**
   * Change le mode d'affichage
   */
  setViewMode(mode: 'list' | 'cards' | 'timeline'): void {
    console.log('🎨 ParcoursComponent: Changement de vue vers', mode);
    this.viewMode = mode;
  }

  /**
   * Active/désactive les filtres
   */
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  /**
   * Applique un tri
   */
  onSort(field: ProgressSortOptions['field']): void {
    if (this.currentSort.field === field) {
      // Inverser la direction si même champ
      this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
      // Nouveau champ, direction par défaut
      this.currentSort = { field, direction: 'desc' };
    }

    console.log('🔄 ParcoursComponent: Tri appliqué', this.currentSort);
    this.applySort();
  }

  /**
   * Applique le tri courant
   */
  private applySort(): void {
    this.filteredProgressList = this.parcoursService.sortProgress(
      this.studentProgressList, 
      this.currentSort
    );
  }

  /**
   * Crée le formulaire de filtres
   */
  private createFilterForm(): FormGroup {
    return this.fb.group({
      searchTerm: [''],
      level: [''],
      progressMin: [0],
      progressMax: [100],
      status: ['']
    });
  }

  /**
   * Met en place la souscription aux changements de filtres
   */
  private setupFilterSubscription(): void {
    const filterSub = this.filterForm.valueChanges.subscribe(() => {
      this.loadStudentProgress();
    });

    this.subscriptions.push(filterSub);
  }

  /**
   * Construit les filtres à partir du formulaire
   */
  private buildFilters(): ProgressFilters {
    const formValue = this.filterForm.value;
    
    const filters: ProgressFilters = {};

    if (formValue.searchTerm) {
      filters.search_term = formValue.searchTerm;
    }

    if (formValue.level) {
      filters.level = formValue.level;
    }

    if (formValue.progressMin !== 0 || formValue.progressMax !== 100) {
      filters.progress_range = {
        min: formValue.progressMin,
        max: formValue.progressMax
      };
    }

    return filters;
  }

  /**
   * Remet à zéro les filtres
   */
  resetFilters(): void {
    console.log('🔄 ParcoursComponent: Remise à zéro des filtres');
    this.filterForm.reset({
      searchTerm: '',
      level: '',
      progressMin: 0,
      progressMax: 100,
      status: ''
    });
  }

  /**
   * Obtient la couleur selon le pourcentage de progression
   */
  getProgressColor(percentage: number): string {
    if (percentage >= 80) return '#22c55e'; // Vert
    if (percentage >= 60) return '#3b82f6'; // Bleu
    if (percentage >= 40) return '#f59e0b'; // Orange
    if (percentage >= 20) return '#ef4444'; // Rouge
    return '#6b7280'; // Gris
  }

  /**
   * Obtient l'icône selon le type de jalon
   */
  getMilestoneIcon(type: string): string {
    switch (type) {
      case 'exam': return 'fas fa-clipboard-check';
      case 'level_change': return 'fas fa-arrow-up';
      case 'course_completion': return 'fas fa-graduation-cap';
      case 'goal_achieved': return 'fas fa-trophy';
      default: return 'fas fa-circle';
    }
  }

  /**
   * Obtient la couleur selon la priorité
   */
  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return '#ef4444'; // Rouge
      case 'medium': return '#f59e0b'; // Orange
      case 'low': return '#22c55e'; // Vert
      default: return '#6b7280'; // Gris
    }
  }

  /**
   * Formate une date
   */
  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Formate une date avec l'heure
   */
  formatDateTime(date: Date | string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * TrackBy function pour la performance
   */
  trackByStudentId(index: number, student: StudentProgress): string {
    return student.student_uuid;
  }
} 