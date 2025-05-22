import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Student, StudentFilters, StudentListConfig, StudentSortConfig } from '../models/student.model';
import { LEVELS, Level } from '../models/level.model';
import { STATUSES, Status } from '../models/status.model';

const STORAGE_KEY = 'students';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private students: Student[] = [];
  private studentsSubject = new BehaviorSubject<Student[]>([]);

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Charge les données depuis le localStorage
   */
  private loadFromStorage(): void {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        // Conversion des dates string en objets Date
        this.students = parsedData.map((student: any) => ({
          ...student,
          personalInfo: {
            ...student.personalInfo,
            birthDate: new Date(student.personalInfo.birthDate)
          },
          statusHistory: student.statusHistory.map((entry: any) => ({
            ...entry,
            date: new Date(entry.date)
          })),
          createdAt: new Date(student.createdAt),
          updatedAt: new Date(student.updatedAt)
        }));
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        this.loadMockData();
      }
    } else {
      this.loadMockData();
    }
    this.studentsSubject.next(this.students);
  }

  /**
   * Sauvegarde les données dans le localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.students));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données:', error);
    }
  }

  /**
   * Récupère la liste des étudiants avec pagination, tri et filtres
   */
  getStudents(config: StudentListConfig): Observable<{
    students: Student[];
    total: number;
  }> {
    let filteredStudents = this.applyFilters(this.students, config.filters);
    
    if (config.sort) {
      filteredStudents = this.sortStudents(filteredStudents, config.sort);
    }

    const start = (config.page - 1) * config.pageSize;
    const paginatedStudents = filteredStudents.slice(start, start + config.pageSize);

    return of({
      students: paginatedStudents,
      total: filteredStudents.length
    });
  }

  /**
   * Récupère un étudiant par son ID
   */
  getStudentById(id: number): Observable<Student | undefined> {
    return of(this.students.find(s => s.id === id));
  }

  /**
   * Crée un nouvel étudiant
   */
  createStudent(student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Observable<Student> {
    const newStudent: Student = {
      ...student,
      id: this.getNextId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.students.push(newStudent);
    this.studentsSubject.next(this.students);
    this.saveToStorage();
    return of(newStudent);
  }

  /**
   * Met à jour un étudiant existant
   */
  updateStudent(id: number, student: Partial<Student>): Observable<Student> {
    const index = this.students.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error(`Student with id ${id} not found`);
    }

    const updatedStudent: Student = {
      ...this.students[index],
      ...student,
      updatedAt: new Date()
    };

    this.students[index] = updatedStudent;
    this.studentsSubject.next(this.students);
    this.saveToStorage();
    return of(updatedStudent);
  }

  /**
   * Supprime un étudiant
   */
  deleteStudent(id: number): Observable<void> {
    const index = this.students.findIndex(s => s.id === id);
    if (index !== -1) {
      this.students.splice(index, 1);
      this.studentsSubject.next(this.students);
      this.saveToStorage();
    }
    return of(void 0);
  }

  /**
   * Récupère les changements de la liste des étudiants
   */
  getStudentsChanges(): Observable<Student[]> {
    return this.studentsSubject.asObservable();
  }

  /**
   * Récupère le nombre total d'étudiants
   */
  getStudentCount(): Observable<number> {
    return this.studentsSubject.pipe(
      map(students => students.length)
    );
  }

  /**
   * Applique les filtres sur la liste des étudiants
   */
  private applyFilters(students: Student[], filters?: StudentFilters): Student[] {
    if (!filters) return students;

    return students.filter(student => {
      const matchFirstName = !filters.firstName || 
        student.personalInfo.firstName.toLowerCase().includes(filters.firstName.toLowerCase());
      
      const matchLastName = !filters.lastName || 
        student.personalInfo.lastName.toLowerCase().includes(filters.lastName.toLowerCase());
      
      const matchEmail = !filters.email || 
        student.personalInfo.email.toLowerCase().includes(filters.email.toLowerCase());
      
      const matchLevel = !filters.level || 
        student.level.code === filters.level;
      
      const matchStatus = !filters.status || 
        student.status.code === filters.status;
      
      const matchNationality = !filters.nationality || 
        student.nationality.code === filters.nationality;

      return matchFirstName && matchLastName && matchEmail && 
             matchLevel && matchStatus && matchNationality;
    });
  }

  /**
   * Trie la liste des étudiants
   */
  private sortStudents(students: Student[], sort: StudentSortConfig): Student[] {
    return [...students].sort((a, b) => {
      let valueA: any;
      let valueB: any;

      if (sort.field.includes('.')) {
        const [parent, child] = sort.field.split('.');
        const parentObjA = a[parent as keyof Student];
        const parentObjB = b[parent as keyof Student];
        
        if (typeof parentObjA === 'object' && parentObjA !== null && child in parentObjA) {
          valueA = (parentObjA as any)[child];
        }
        if (typeof parentObjB === 'object' && parentObjB !== null && child in parentObjB) {
          valueB = (parentObjB as any)[child];
        }
      } else {
        valueA = a[sort.field as keyof Student];
        valueB = b[sort.field as keyof Student];
      }

      if (valueA < valueB) return sort.direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  /**
   * Génère le prochain ID disponible
   */
  private getNextId(): number {
    return Math.max(0, ...this.students.map(s => s.id)) + 1;
  }

  /**
   * Charge des données de test
   */
  private loadMockData(): void {
    this.students = [
      {
        id: 1,
        personalInfo: {
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean.dupont@example.com',
          birthDate: new Date('1990-01-01'),
          phone: '+33612345678'
        },
        address: {
          street: '123 rue de la Paix',
          city: 'Paris',
          zipCode: '75001',
          country: 'France'
        },
        nationality: {
          code: 'FR',
          name: 'Française',
          countryCode: 'FR'
        },
        level: LEVELS[3], // B2
        status: STATUSES[0], // ACTIVE
        statusHistory: [
          {
            date: new Date('2023-01-01'),
            field: 'level',
            oldValue: 'B1',
            newValue: 'B2',
            comment: 'Progression suite à l\'examen'
          }
        ],
        createdAt: new Date('2022-09-01'),
        updatedAt: new Date('2023-01-01')
      }
    ];
    this.saveToStorage();
  }
} 