import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusHistoryEntry } from '../../models/student.model';

@Component({
  selector: 'app-student-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-history.component.html',
  styleUrls: ['./student-history.component.scss']
})
export class StudentHistoryComponent {
  @Input() history: StatusHistoryEntry[] = [];

  sortedHistory(): StatusHistoryEntry[] {
    return [...this.history].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }
} 