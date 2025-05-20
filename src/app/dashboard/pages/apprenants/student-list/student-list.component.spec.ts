import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudentListComponent } from './student-list.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

describe('StudentListComponent', () => {
  let component: StudentListComponent;
  let fixture: ComponentFixture<StudentListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        FormsModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatInputModule,
        MatFormFieldModule,
        MatButtonModule,
        MatIconModule,
        StudentListComponent
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StudentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty search value', () => {
    expect(component.searchValue).toBe('');
  });

  it('should initialize with empty search history', () => {
    expect(component.searchHistory.length).toBe(0);
  });

  it('should add search term to history', () => {
    const searchTerm = 'test search';
    component.addToSearchHistory(searchTerm);
    expect(component.searchHistory).toContain(searchTerm);
  });

  it('should limit search history to 5 items', () => {
    for (let i = 1; i <= 6; i++) {
      component.addToSearchHistory(`test ${i}`);
    }
    expect(component.searchHistory.length).toBe(5);
    expect(component.searchHistory[0]).toBe('test 6');
  });

  it('should not add duplicate search terms to history', () => {
    const searchTerm = 'duplicate test';
    component.addToSearchHistory(searchTerm);
    component.addToSearchHistory(searchTerm);
    expect(component.searchHistory.filter(term => term === searchTerm).length).toBe(1);
  });
}); 