import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Interface représentant un étudiant
 * @interface Student
 * @property {number} id - Identifiant unique de l'étudiant
 * @property {string} firstName - Prénom de l'étudiant
 * @property {string} lastName - Nom de l'étudiant
 * @property {string} email - Adresse email de l'étudiant
 */
interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

/**
 * Interface représentant les filtres de recherche avancée
 * @interface Filters
 * @property {string} firstName - Filtre sur le prénom
 * @property {string} lastName - Filtre sur le nom
 * @property {string} email - Filtre sur l'email
 */
interface Filters {
  firstName: string;
  lastName: string;
  email: string;
}

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-list.component.html',
  styleUrls: ['./student-list.component.scss']
})
export class StudentListComponent implements OnInit {
  students: Student[] = [];
  filteredStudents: Student[] = [];
  searchValue: string = '';
  searchHistory: string[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 10;
  sortColumn: keyof Student = 'id';
  sortDirection: 'asc' | 'desc' = 'asc';
  /** État d'affichage des filtres avancés */
  showFilters: boolean = false;
  /** État des filtres avancés */
  filters: Filters = {
    firstName: '',
    lastName: '',
    email: ''
  };

  constructor() {}

  ngOnInit(): void {
    // Données de test (à remplacer par un appel API)
    this.students = [
      { id: 1, firstName: 'Jean', lastName: 'Dupont', email: 'jean.dupont@example.com' },
      { id: 2, firstName: 'Marie', lastName: 'Martin', email: 'marie.martin@example.com' }
    ];
    this.filteredStudents = [...this.students];
  }

  /**
   * Bascule l'affichage des filtres avancés
   * @returns {void}
   */
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  /**
   * Applique le filtre de recherche global
   * @param {Event} event - Événement de saisie
   * @returns {void}
   */
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.addToSearchHistory(filterValue);
    this.applyFilters();
  }

  /**
   * Applique tous les filtres (recherche globale et filtres avancés)
   * @returns {void}
   */
  applyFilters(): void {
    this.filteredStudents = this.students.filter(student => {
      const matchesSearch = !this.searchValue || 
        student.firstName.toLowerCase().includes(this.searchValue.toLowerCase()) ||
        student.lastName.toLowerCase().includes(this.searchValue.toLowerCase()) ||
        student.email.toLowerCase().includes(this.searchValue.toLowerCase());

      const matchesFirstName = !this.filters.firstName || 
        student.firstName.toLowerCase().includes(this.filters.firstName.toLowerCase());
      
      const matchesLastName = !this.filters.lastName || 
        student.lastName.toLowerCase().includes(this.filters.lastName.toLowerCase());
      
      const matchesEmail = !this.filters.email || 
        student.email.toLowerCase().includes(this.filters.email.toLowerCase());

      return matchesSearch && matchesFirstName && matchesLastName && matchesEmail;
    });

    this.currentPage = 1;
  }

  /**
   * Réinitialise tous les filtres avancés
   * @returns {void}
   */
  clearFilters(): void {
    this.filters = {
      firstName: '',
      lastName: '',
      email: ''
    };
    this.applyFilters();
  }

  addToSearchHistory(searchTerm: string): void {
    if (searchTerm && !this.searchHistory.includes(searchTerm)) {
      this.searchHistory.unshift(searchTerm);
      if (this.searchHistory.length > 5) {
        this.searchHistory.pop();
      }
    }
  }

  sortData(column: keyof Student): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredStudents.sort((a, b) => {
      const valueA = a[column];
      const valueB = b[column];
      const direction = this.sortDirection === 'asc' ? 1 : -1;
      
      if (valueA < valueB) return -1 * direction;
      if (valueA > valueB) return 1 * direction;
      return 0;
    });
  }

  get paginatedStudents(): Student[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredStudents.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredStudents.length / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  /**
   * Exporte les données au format CSV
   * @returns {void}
   */
  exportToCsv(): void {
    this.exportData('csv');
  }

  /**
   * Exporte les données au format Excel
   * @returns {void}
   */
  exportToExcel(): void {
    this.exportData('excel');
  }

  /**
   * Exporte les données dans le format spécifié
   * @param {'csv' | 'excel'} format - Format d'export souhaité
   * @returns {void}
   * @private
   */
  private exportData(format: 'csv' | 'excel'): void {
    const headers = ['ID', 'Prénom', 'Nom', 'Email'];
    const data = this.filteredStudents.map(student => 
      [student.id, student.firstName, student.lastName, student.email]
    );

    if (format === 'csv') {
      const csvContent = [
        headers.join(','),
        ...data.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'students.csv';
      link.click();
    } else {
      // Format Excel (XLSX)
      const workbook = {
        SheetNames: ['Students'],
        Sheets: {
          'Students': {
            '!ref': `A1:D${data.length + 1}`,
            // En-têtes
            A1: { v: headers[0] }, B1: { v: headers[1] },
            C1: { v: headers[2] }, D1: { v: headers[3] },
            // Données
            ...data.reduce((acc, row, idx) => {
              const rowNumber = idx + 2;
              return {
                ...acc,
                [`A${rowNumber}`]: { v: row[0] },
                [`B${rowNumber}`]: { v: row[1] },
                [`C${rowNumber}`]: { v: row[2] },
                [`D${rowNumber}`]: { v: row[3] }
              };
            }, {})
          }
        }
      };

      const s2ab = (s: string) => {
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
      };

      const wbout = this.workbookToXLSX(workbook);
      const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'students.xlsx';
      link.click();
    }
  }

  /**
   * Convertit un workbook en format XLSX
   * @param {any} workbook - Workbook à convertir
   * @returns {string} - Chaîne JSON du workbook
   * @private
   */
  private workbookToXLSX(workbook: any): string {
    // Cette fonction est une version simplifiée pour la démonstration
    // En production, nous utiliserions une bibliothèque comme xlsx
    return JSON.stringify(workbook);
  }
} 