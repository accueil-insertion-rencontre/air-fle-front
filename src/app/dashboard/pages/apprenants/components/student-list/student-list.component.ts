import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { Student, StudentFilters, StudentListConfig, StudentSortConfig, StudentSortField } from '../../models/student.model';
import { StudentSearchComponent } from '../student-search/student-search.component';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [CommonModule, RouterModule, StudentSearchComponent],
  templateUrl: './student-list.component.html',
  styleUrls: ['./student-list.component.scss']
})
export class StudentListComponent implements OnInit {
  students: Student[] = [];
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 1;
  filters: StudentFilters = {
    firstName: '',
    lastName: '',
    email: '',
    level: '',
    status: '',
    nationality: ''
  };
  sortConfig: StudentSortConfig = {
    field: 'personalInfo.lastName',
    direction: 'asc'
  };

  constructor(private studentService: StudentService) {}

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents(): void {
    const config: StudentListConfig = {
      page: this.currentPage,
      pageSize: this.pageSize,
      filters: this.filters,
      sort: this.sortConfig
    };

    this.studentService.getStudents(config).subscribe(result => {
      this.students = result.students;
      this.totalItems = result.total;
      this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    });
  }

  onSearch(searchTerm: string): void {
    this.filters = {
      ...this.filters,
      firstName: searchTerm,
      lastName: searchTerm,
      email: searchTerm
    };
    this.currentPage = 1;
    this.loadStudents();
  }

  onFiltersChange(filters: StudentFilters): void {
    this.filters = filters;
    this.currentPage = 1;
    this.loadStudents();
  }

  sort(field: StudentSortField): void {
    if (this.sortConfig.field === field) {
      this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortConfig = {
        field,
        direction: 'asc'
      };
    }
    this.loadStudents();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadStudents();
    }
  }

  deleteStudent(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet apprenant ?')) {
      this.studentService.deleteStudent(id).subscribe(() => {
        this.loadStudents();
      });
    }
  }
} 