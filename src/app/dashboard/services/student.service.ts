import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private students: Student[] = [
    { id: 1, firstName: 'Jean', lastName: 'Dupont', email: 'jean.dupont@example.com' },
    { id: 2, firstName: 'Marie', lastName: 'Martin', email: 'marie.martin@example.com' }
  ];

  private studentsSubject = new BehaviorSubject<Student[]>(this.students);

  getStudents(): Observable<Student[]> {
    return this.studentsSubject.asObservable();
  }

  getStudentCount(): Observable<number> {
    return new Observable(observer => {
      this.getStudents().subscribe(students => {
        observer.next(students.length);
      });
    });
  }

  addStudent(student: Student): void {
    this.students = [...this.students, student];
    this.studentsSubject.next(this.students);
  }

  updateStudent(updatedStudent: Student): void {
    this.students = this.students.map(student => 
      student.id === updatedStudent.id ? updatedStudent : student
    );
    this.studentsSubject.next(this.students);
  }

  deleteStudent(id: number): void {
    this.students = this.students.filter(student => student.id !== id);
    this.studentsSubject.next(this.students);
  }
} 