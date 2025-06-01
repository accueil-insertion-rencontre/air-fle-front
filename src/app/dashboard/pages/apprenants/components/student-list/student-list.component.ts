import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StudentService, StudentListResponse } from '../../services/student.service';
import { ReferenceDataService } from '../../../reference-data/services/reference-data.service';
import { Student, StudentFilters, StudentListConfig, StudentSortConfig, StudentSortField } from '../../models/student.model';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './student-list.component.html',
  styleUrls: ['./student-list.component.scss']
})
export class StudentListComponent implements OnInit {
  students: any[] = []; // Utilisation de any[] temporairement pour gérer les différences de structure
  loading = false;
  error: string | null = null;
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 1;
  showCreateModal = false; // Pour gérer l'affichage de la modal
  filters: StudentFilters = {
    firstName: '',
    lastName: '',
    email: '',
    level: '',
    status: '',
    nationality: ''
  };

  // Données de référence pour le mapping
  statuses: any[] = [];
  nationalities: any[] = [];
  frenchLevels: any[] = [];

  constructor(
    private studentService: StudentService,
    private referenceDataService: ReferenceDataService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadReferenceData();
    this.loadStudents();
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
  }

  loadStudents(): void {
    this.loading = true;
    this.error = null;
    
    const config: StudentListConfig = {
      page: this.currentPage,
      pageSize: this.pageSize,
      filters: this.filters,
      sort: undefined
    };

    this.studentService.getStudents(config).subscribe({
      next: (result: StudentListResponse) => {
        console.log('Données reçues de l\'API:', result);
        this.students = result.students || [];
        this.totalItems = result.total || 0;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des apprenants';
        this.loading = false;
        console.error('Erreur:', err);
      }
    });
  }

  getStudentInitials(student: any): string {
    // Utiliser les vraies propriétés de l'API
    const firstName = student.firstname || '';
    const lastName = student.lastname || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }

  getStudentName(student: any): string {
    // Utiliser les vraies propriétés de l'API
    const firstName = student.firstname || '';
    const lastName = student.lastname || '';
    return `${firstName} ${lastName}`.trim();
  }

  getStudentEmail(student: any): string {
    // Utiliser la vraie propriété de l'API
    return student.email || 'Non renseigné';
  }

  getStudentLevel(student: any): string {
    // Utiliser les vraies propriétés de l'API - d'abord chercher les objets complets
    if (student.currentLevel) {
      return `${student.currentLevel.code} - ${student.currentLevel.description}`;
    } else if (student.initialLevel) {
      return `${student.initialLevel.code} - ${student.initialLevel.description}`;
    }
    
    // Si on a seulement les IDs, faire le mapping
    if (student.current_level_id && this.frenchLevels.length > 0) {
      const level = this.frenchLevels.find(l => l.id === student.current_level_id);
      if (level) return `${level.code} - ${level.description}`;
    }
    
    if (student.initial_level_id && this.frenchLevels.length > 0) {
      const level = this.frenchLevels.find(l => l.id === student.initial_level_id);
      if (level) return `${level.code} - ${level.description}`;
    }
    
    return 'Non défini';
  }

  getStudentStatus(student: any): string {
    // Utiliser la vraie propriété de l'API - d'abord l'objet complet
    if (student.status?.label) {
      return student.status.label;
    }
    
    // Si on a seulement l'ID, faire le mapping avec les données de référence chargées
    if (student.status_id && this.statuses.length > 0) {
      const status = this.statuses.find(s => s.id === student.status_id);
      return status?.label || 'Non défini';
    }
    
    return 'Non défini';
  }

  getStudentNationality(student: any): string {
    // Utiliser la vraie propriété de l'API - d'abord l'objet complet
    if (student.nationality?.label) {
      return student.nationality.label;
    }
    
    // Si on a seulement l'ID, faire le mapping
    if (student.nationality_id && this.nationalities.length > 0) {
      const nationality = this.nationalities.find(n => n.id === student.nationality_id);
      return nationality?.label || 'Non renseignée';
    }
    
    return 'Non renseignée';
  }

  // Méthodes de pagination
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadStudents();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.changePage(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.changePage(this.currentPage + 1);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);
    
    // Ajuster le début si on est proche de la fin
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  // Méthodes de recherche et filtrage
  onSearch(searchTerm: string): void {
    this.filters = {
      ...this.filters,
      firstName: searchTerm,
      lastName: searchTerm
    };
    this.currentPage = 1; // Retour à la première page lors d'une recherche
    this.loadStudents();
  }

  clearFilters(): void {
    this.filters = {
      firstName: '',
      lastName: '',
      email: '',
      level: '',
      status: '',
      nationality: ''
    };
    this.currentPage = 1;
    this.loadStudents();
  }

  deleteStudent(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet apprenant ?')) {
      this.studentService.deleteStudent(id).subscribe({
        next: () => {
          // Si on supprime le dernier élément d'une page, revenir à la page précédente
          if (this.students.length === 1 && this.currentPage > 1) {
            this.currentPage--;
          }
          this.loadStudents();
        },
        error: (err) => {
          console.error('Erreur lors de la suppression:', err);
          alert('Erreur lors de la suppression de l\'étudiant');
        }
      });
    }
  }

  // Méthode utilitaire pour l'affichage
  getDisplayRange(): string {
    if (this.totalItems === 0) return '0 résultat';
    
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.totalItems);
    
    return `${start}-${end} sur ${this.totalItems}`;
  }

  // Méthodes pour gérer la modal
  openCreateModal(): void {
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  createSingleStudent(): void {
    this.closeCreateModal();
    this.router.navigate(['/dashboard/apprenants/new']);
  }

  importFromExcel(): void {
    this.closeCreateModal();
    this.router.navigate(['/dashboard/apprenants/import']);
  }
} 