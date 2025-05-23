import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudentHistoryComponent } from './student-history.component';
import { StatusHistoryEntry } from '../../models/student.model';

describe('StudentHistoryComponent', () => {
  let component: StudentHistoryComponent;
  let fixture: ComponentFixture<StudentHistoryComponent>;

  const mockHistory: StatusHistoryEntry[] = [
    {
      date: new Date('2024-03-15'),
      field: 'status',
      oldValue: 'PENDING',
      newValue: 'ACTIVE',
      comment: 'Activation du compte'
    },
    {
      date: new Date('2024-03-10'),
      field: 'level',
      oldValue: 'A2',
      newValue: 'B1',
      comment: 'Progression de niveau'
    },
    {
      date: new Date('2024-03-01'),
      field: 'status',
      oldValue: '',
      newValue: 'PENDING',
      comment: 'Création du compte'
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentHistoryComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StudentHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty history', () => {
    expect(component.history).toEqual([]);
  });

  it('should display no history message when history is empty', () => {
    const noHistoryElement = fixture.nativeElement.querySelector('.no-history');
    expect(noHistoryElement.textContent.trim()).toBe('Aucun changement enregistré');
  });

  it('should sort history by date in descending order', () => {
    component.history = mockHistory;
    const sortedHistory = component.sortedHistory();
    
    expect(sortedHistory[0].date).toEqual(mockHistory[0].date);
    expect(sortedHistory[2].date).toEqual(mockHistory[2].date);
  });

  it('should display history items when history is not empty', () => {
    component.history = mockHistory;
    fixture.detectChanges();

    const timelineItems = fixture.nativeElement.querySelectorAll('.timeline-item');
    expect(timelineItems.length).toBe(mockHistory.length);
  });

  it('should format dates correctly', () => {
    component.history = mockHistory;
    fixture.detectChanges();

    const dateElement = fixture.nativeElement.querySelector('.timeline-date');
    expect(dateElement.textContent.trim()).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it('should display field changes with correct styling', () => {
    component.history = mockHistory;
    fixture.detectChanges();

    const oldValue = fixture.nativeElement.querySelector('.old-value');
    const newValue = fixture.nativeElement.querySelector('.new-value');
    const arrow = fixture.nativeElement.querySelector('.arrow');

    expect(oldValue).toBeTruthy();
    expect(newValue).toBeTruthy();
    expect(arrow).toBeTruthy();
    expect(arrow.textContent.trim()).toBe('→');
  });

  it('should display comments when available', () => {
    component.history = mockHistory;
    fixture.detectChanges();

    const comments = fixture.nativeElement.querySelectorAll('.timeline-comment');
    expect(comments.length).toBe(mockHistory.length);
    expect(comments[0].textContent.trim()).toBe(mockHistory[0].comment);
  });
}); 