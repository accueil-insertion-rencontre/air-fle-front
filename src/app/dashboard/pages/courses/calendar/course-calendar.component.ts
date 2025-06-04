import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { CourseService } from '../../../../core/services/course.service';
import { SessionService } from '../../../../core/services/session.service';
import { GroupService } from '../../../../core/services/group.service';
import { UserService } from '../../../../core/services/user.service';
import { AttendanceService, AttendanceRecord, AttendanceStatus } from '../../../../core/services/attendance.service';
import { AlertService } from '../../../../core/services/alert.service';
import { Course } from '../../../../core/models/course.model';
import { Session } from '../../../../core/models/session.model';
import { Group } from '../../../../core/models/group.model';
import { Student } from '../../../../core/models/student.model';
import { User, UserDisplayInfo } from '../../../../core/models/user.model';

declare var bootstrap: any;

interface WeekDay {
  date: Date;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
}

@Component({
  selector: 'app-course-calendar',
  templateUrl: './course-calendar.component.html',
  styleUrls: ['./course-calendar.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class CourseCalendarComponent implements OnInit {
  currentWeek = new Date();
  weekDays: WeekDay[] = [];
  sessions: Session[] = [];
  groups: Group[] = [];
  teachers: UserDisplayInfo[] = [];
  selectedSessionId: string | number | null = null;
  courses: Course[] = [];
  
  // Modal properties
  courseForm: FormGroup;
  modal: any;
  selectedDate: string = '';
  loading = false;
  error = '';
  
  // Propriétés pour le modal de détail de cours
  detailsModal: any;
  selectedCourse: Course | null = null;
  courseStudents: Student[] = [];
  loadingCourseDetails = false;
  studentAttendanceMap: Map<number | string, 'present' | 'absent' | 'late' | 'excused' | 'unknown'> = new Map();
  attendanceRecords: AttendanceRecord[] = [];
  savingAttendance = false;
  
  // Propriétés pour le modal d'édition de cours
  editModal: any;
  editCourseForm: FormGroup;
  editLoading = false;
  editError = '';
  
  // Propriétés pour la création multi-dates
  isMultiDateMode = false;
  selectedDates: string[] = [];
  recurrenceType: 'none' | 'weekly' | 'custom' = 'none';
  weeklyOccurrences = 1;
  maxWeeklyOccurrences = 10;
  
  // Hours for time selection in modal
  timeOptions = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
  ];

  // Couleurs pour les cours
  courseColors = [
    '#007bff', '#28a745', '#dc3545', '#ffc107', '#6f42c1',
    '#e83e8c', '#20c997', '#fd7e14', '#6610f2', '#17a2b8'
  ];

  // Couleurs prédéfinies pour la sélection utilisateur
  predefinedColors = [
    { name: 'Bleu', value: '#007bff' },
    { name: 'Vert', value: '#28a745' },
    { name: 'Rouge', value: '#dc3545' },
    { name: 'Jaune', value: '#ffc107' },
    { name: 'Violet', value: '#6f42c1' },
    { name: 'Rose', value: '#e83e8c' },
    { name: 'Turquoise', value: '#20c997' },
    { name: 'Orange', value: '#fd7e14' },
    { name: 'Indigo', value: '#6610f2' },
    { name: 'Cyan', value: '#17a2b8' },
    { name: 'Gris', value: '#6c757d' },
    { name: 'Sombre', value: '#343a40' }
  ];

  constructor(
    private courseService: CourseService,
    private sessionService: SessionService,
    private groupService: GroupService,
    private userService: UserService,
    private attendanceService: AttendanceService,
    private alertService: AlertService,
    private formBuilder: FormBuilder
  ) {
    this.courseForm = this.formBuilder.group({
      group_id: ['', Validators.required],
      title: ['', [Validators.required, Validators.minLength(3)]],
      start_hour: ['', Validators.required],
      end_hour: ['', Validators.required],
      user_id: [''], // Optionnel, donc pas de Validators.required
      color: [''], // Couleur optionnelle
      // Nouveaux champs pour multi-dates
      is_multi_date: [false],
      recurrence_type: ['none'],
      weekly_occurrences: [1, [Validators.min(1), Validators.max(10)]],
      custom_dates: [[]]
    });

    this.editCourseForm = this.formBuilder.group({
      group_id: ['', Validators.required],
      title: ['', [Validators.required, Validators.minLength(3)]],
      start_hour: ['', Validators.required],
      end_hour: ['', Validators.required],
      day: ['', Validators.required],
      user_id: [''], // Optionnel, donc pas de Validators.required
      color: [''] // Couleur optionnelle
    });
  }

  ngOnInit(): void {
    console.log('=== INIT COURSE CALENDAR ===');
    
    this.loadSessions();
    this.loadTeachers();
    this.generateWeekView();
    this.loadCourses();
    
    // Surveiller les changements de group_id
    this.courseForm.get('group_id')?.valueChanges.subscribe(value => {
      const group = this.groups.find(g => g.group_id === value || g.id === value);
      console.log('Groupe sélectionné:', group?.label || 'Aucun');
    });
  }

  /**
   * Charge les sessions disponibles
   */
  loadSessions(): void {
    this.sessionService.getSessions().subscribe({
      next: (sessions) => {
        this.sessions = sessions;
        
        // Extraire tous les groupes de toutes les sessions
        this.groups = [];
        sessions.forEach(session => {
          if (session.groups) {
            session.groups.forEach(group => {
              this.groups.push({
                ...group,
                session: session
              });
            });
          }
        });
        
        console.log('=== GROUPES CHARGÉS ===');
        console.log('Nombre de sessions:', sessions.length);
        console.log('Nombre total de groupes:', this.groups.length);
        console.log('Groupes:', this.groups);
        
        // Debug détaillé de chaque groupe
        this.groups.forEach((group, index) => {
          console.log(`Groupe ${index}:`, {
            id: group.id,
            group_id: group.group_id,
            label: group.label,
            session: group.session?.label,
            allProperties: Object.keys(group)
          });
        });
        
        // Sélectionner automatiquement la première session pour le filtrage
        if (sessions.length > 0) {
          this.selectedSessionId = sessions[0].session_id;
          this.loadCourses();
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des sessions:', error);
        this.alertService.error('Impossible de charger les sessions');
      }
    });
  }

  /**
   * Charge les professeurs disponibles
   */
  loadTeachers(): void {
    console.log('=== CHARGEMENT DES PROFESSEURS ===');
    
    this.userService.getTeachers().subscribe({
      next: (teachers) => {
        this.teachers = this.userService.getUsersDisplayInfo(teachers);
        console.log('Professeurs chargés:', this.teachers.length);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des professeurs:', error);
        this.teachers = [];
      }
    });
  }

  /**
   * Génère la vue hebdomadaire
   */
  generateWeekView(): void {
    const startOfWeek = this.getStartOfWeek(this.currentWeek);
    this.weekDays = [];
    
    const today = new Date();
    const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    
    console.log('=== GÉNÉRATION VUE HEBDOMADAIRE ===');
    console.log('Date de départ (currentWeek):', this.currentWeek);
    console.log('Début de semaine calculé:', startOfWeek);
    console.log('Noms des jours:', dayNames);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      
      console.log(`Jour ${i}:`, {
        index: i,
        dayName: dayNames[i],
        date: date,
        dateString: date.toString(),
        dayNumber: date.getDate(),
        formattedForApi: this.formatDateForApi(date)
      });
      
      this.weekDays.push({
        date: new Date(date),
        dayName: dayNames[i],
        dayNumber: date.getDate(),
        isToday: this.isSameDay(date, today)
      });
    }
    
    console.log('Jours générés:', this.weekDays);
  }

  /**
   * Retourne le début de la semaine (lundi)
   */
  getStartOfWeek(date: Date): Date {
    console.log('=== CALCUL DÉBUT SEMAINE ===');
    console.log('Date d\'entrée:', date);
    
    const start = new Date(date);
    const day = start.getDay(); // 0 = dimanche, 1 = lundi, ..., 6 = samedi
    
    console.log('Jour de la semaine (0=dim, 1=lun...):', day);
    
    // Convertir dimanche (0) en 7 pour le calcul
    const dayOfWeek = day === 0 ? 7 : day;
    console.log('Jour normalisé (1=lun, 7=dim):', dayOfWeek);
    
    // Calculer le nombre de jours à soustraire pour arriver au lundi (1)
    const daysToSubtract = dayOfWeek - 1;
    console.log('Jours à soustraire:', daysToSubtract);
    
    start.setDate(start.getDate() - daysToSubtract);
    start.setHours(0, 0, 0, 0);
    
    console.log('Début de semaine calculé:', start);
    return start;
  }

  /**
   * Charge les cours pour la session sélectionnée et la semaine affichée
   */
  loadCourses(): void {
    if (!this.selectedSessionId) return;

    const startOfWeek = this.getStartOfWeek(this.currentWeek);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const startDate = this.formatDateForApi(startOfWeek);
    const endDate = this.formatDateForApi(endOfWeek);

    this.courseService.getCoursesByDateRange(startDate, endDate, this.selectedSessionId).subscribe({
      next: (courses) => {
        this.courses = courses;
        this.updateScheduleWithCourses();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des cours:', error);
        // Continuer même en cas d'erreur
        this.courses = [];
        this.updateScheduleWithCourses();
      }
    });
  }

  /**
   * Met à jour le planning avec les cours chargés
   */
  updateScheduleWithCourses(): void {
    console.log('=== MISE À JOUR PLANNING ===');
    console.log('Cours chargés:', this.courses);
    // Plus besoin de logique complexe avec le nouveau design par colonnes
  }

  /**
   * Vérifie si deux dates sont le même jour
   */
  isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  /**
   * Formate une date pour l'API (YYYY-MM-DD) sans décalage UTC
   */
  formatDateForApi(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Navigation du planning
   */
  previousWeek(): void {
    const newWeek = new Date(this.currentWeek);
    newWeek.setDate(this.currentWeek.getDate() - 7);
    this.currentWeek = newWeek;
    this.generateWeekView();
    this.loadCourses();
  }

  nextWeek(): void {
    const newWeek = new Date(this.currentWeek);
    newWeek.setDate(this.currentWeek.getDate() + 7);
    this.currentWeek = newWeek;
    this.generateWeekView();
    this.loadCourses();
  }

  /**
   * Gestion du changement de session pour le filtrage
   */
  onSessionChange(sessionId: string | number | null): void {
    this.selectedSessionId = sessionId;
    this.loadCourses();
  }

  /**
   * Gestion du clic sur un jour (remplace onTimeSlotClick)
   */
  onDayClick(day: WeekDay): void {
    console.log('=== CLIC SUR JOUR ===');
    console.log('Jour cliqué:', day);
    
    this.selectedDate = this.formatDateForApi(day.date);
    
    // Réinitialiser les propriétés multi-dates
    this.isMultiDateMode = false;
    this.selectedDates = [this.selectedDate];
    this.recurrenceType = 'none';
    this.weeklyOccurrences = 1;
    
    this.courseForm.patchValue({
      group_id: '',
      start_hour: '09:00', // Heure par défaut
      end_hour: '10:00',   // Heure par défaut
      title: '',
      is_multi_date: false,
      recurrence_type: 'none',
      weekly_occurrences: 1,
      custom_dates: [this.selectedDate]
    });
    
    console.log('=== OUVERTURE MODAL ===');
    console.log('Date sélectionnée:', this.selectedDate);
    
    // Ouvrir la modal
    const modalElement = document.getElementById('createCourseModal');
    if (modalElement) {
      this.modal = new bootstrap.Modal(modalElement);
      this.modal.show();
    }
  }

  /**
   * Récupère les cours pour un jour donné
   */
  getCoursesForDay(day: WeekDay): Course[] {
    const dateKey = this.formatDateForApi(day.date);
    const daysCourses = this.courses.filter(course => course.day === dateKey);
    
    // Enrichir chaque cours avec les données complètes
    const enrichedCourses = daysCourses.map(course => this.enrichCourseData(course));
    
    // Trier les cours par heure de début, puis par date de création
    const sortedCourses = enrichedCourses.sort((a, b) => {
      // Première priorité : trier par heure de début (plus tôt en premier)
      if (a.start_hour && b.start_hour) {
        const timeComparison = a.start_hour.localeCompare(b.start_hour);
        if (timeComparison !== 0) {
          return timeComparison;
        }
      }
      
      // Deuxième priorité : trier par date de création (plus ancien en premier)
      if (a.created_at && b.created_at) {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateA.getTime() - dateB.getTime();
      }
      
      // Si pas de date de création, utiliser l'ID comme fallback
      const idA = a.course_id || a.id || 0;
      const idB = b.course_id || b.id || 0;
      return idA.toString().localeCompare(idB.toString());
    });
    
    console.log(`Cours enrichis pour ${dateKey}:`, sortedCourses.map(c => ({
      title: c.title,
      start_hour: c.start_hour,
      teacher: c.user ? `${c.user.firstname} ${c.user.lastname}` : 'Aucun',
      group: c.group?.label || 'Aucun'
    })));
    
    return sortedCourses;
  }

  /**
   * Génère une couleur pour un cours basée sur sa couleur personnalisée ou son groupe
   */
  getCourseColor(course: Course): string {
    // Priorité 1: Couleur personnalisée du cours
    if (course.color) {
      return course.color;
    }

    // Priorité 2: Couleur basée sur le groupe (fallback)
    if (!course.group_id) {
      return this.courseColors[0];
    }
    
    // S'assurer qu'on travaille avec une string
    const groupIdStr = course.group_id.toString();
    
    // Utiliser le hash du group_id pour avoir une couleur consistante
    let hash = 0;
    for (let i = 0; i < groupIdStr.length; i++) {
      const char = groupIdStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertit en entier 32-bit
    }
    
    // S'assurer que le hash est positif
    const positiveHash = Math.abs(hash);
    
    // Sélectionner une couleur basée sur le hash
    const colorIndex = positiveHash % this.courseColors.length;
    return this.courseColors[colorIndex];
  }

  /**
   * Génère une couleur avec opacité pour le background de la carte
   */
  getCourseColorWithOpacity(course: Course): string {
    const originalColor = this.getCourseColor(course);
    return this.hexToRgba(originalColor, 0.4);
  }

  /**
   * Convertit une couleur hex en rgba avec opacité
   */
  private hexToRgba(hex: string, opacity: number): string {
    // Enlever le # si présent
    hex = hex.replace('#', '');
    
    // Convertir en RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  /**
   * TrackBy function pour optimiser le rendu des options
   */
  trackByGroupId(index: number, group: Group): string {
    return group.group_id?.toString() || group.id?.toString() || index.toString();
  }

  /**
   * Bascule le mode multi-dates
   */
  toggleMultiDateMode(): void {
    this.isMultiDateMode = !this.isMultiDateMode;
    
    if (this.isMultiDateMode) {
      this.courseForm.patchValue({
        is_multi_date: true,
        recurrence_type: this.recurrenceType,
        custom_dates: this.selectedDates
      });
    } else {
      this.courseForm.patchValue({
        is_multi_date: false,
        recurrence_type: 'none',
        custom_dates: [this.selectedDate]
      });
      this.selectedDates = [this.selectedDate];
      this.recurrenceType = 'none';
    }
    
    console.log('Mode multi-dates:', this.isMultiDateMode);
  }

  /**
   * Change le type de récurrence
   */
  onRecurrenceTypeChange(type: 'none' | 'weekly' | 'custom'): void {
    this.recurrenceType = type;
    
    if (type === 'weekly') {
      this.generateWeeklyDates();
    } else if (type === 'custom') {
      this.selectedDates = [this.selectedDate];
    } else {
      this.selectedDates = [this.selectedDate];
    }
    
    this.courseForm.patchValue({
      recurrence_type: type,
      custom_dates: this.selectedDates
    });
    
    console.log('Type de récurrence changé:', type, 'Dates:', this.selectedDates);
  }

  /**
   * Génère les dates pour la récurrence hebdomadaire
   */
  generateWeeklyDates(): void {
    this.selectedDates = [];
    const startDate = new Date(this.selectedDate);
    
    for (let i = 0; i < this.weeklyOccurrences; i++) {
      const newDate = new Date(startDate);
      newDate.setDate(startDate.getDate() + (i * 7));
      this.selectedDates.push(this.formatDateForApi(newDate));
    }
    
    this.courseForm.patchValue({
      custom_dates: this.selectedDates
    });
    
    console.log(`${this.weeklyOccurrences} occurrences hebdomadaires générées:`, this.selectedDates);
  }

  /**
   * Change le nombre d'occurrences hebdomadaires
   */
  onWeeklyOccurrencesChange(occurrences: number): void {
    this.weeklyOccurrences = Math.max(1, Math.min(occurrences, this.maxWeeklyOccurrences));
    
    if (this.recurrenceType === 'weekly') {
      this.generateWeeklyDates();
    }
    
    this.courseForm.patchValue({
      weekly_occurrences: this.weeklyOccurrences
    });
  }

  /**
   * Ajoute une date personnalisée
   */
  addCustomDate(dateString: string): void {
    if (dateString && !this.selectedDates.includes(dateString)) {
      this.selectedDates.push(dateString);
      this.selectedDates.sort(); // Trier les dates
      
      this.courseForm.patchValue({
        custom_dates: this.selectedDates
      });
      
      console.log('Date ajoutée:', dateString, 'Total:', this.selectedDates.length);
    }
  }

  /**
   * Supprime une date personnalisée
   */
  removeCustomDate(dateString: string): void {
    const index = this.selectedDates.indexOf(dateString);
    if (index > -1) {
      this.selectedDates.splice(index, 1);
      
      this.courseForm.patchValue({
        custom_dates: this.selectedDates
      });
      
      console.log('Date supprimée:', dateString, 'Restantes:', this.selectedDates.length);
    }
  }

  /**
   * Formate une date pour l'affichage utilisateur
   */
  formatDateForDisplay(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Soumet le formulaire de création de cours
   */
  onSubmitCourse(): void {
    if (this.courseForm.invalid) return;
    
    this.loading = true;
    this.error = '';
    
    console.log('=== CREATION DE COURS ===');
    
    const baseCourseData = {
      title: this.courseForm.value.title,
      start_hour: this.courseForm.value.start_hour,
      end_hour: this.courseForm.value.end_hour,
      group_id: this.courseForm.value.group_id,
      user_id: this.courseForm.value.user_id,
      color: this.courseForm.value.color
    };
    
    // Déterminer les dates à créer
    const datesToCreate = this.isMultiDateMode ? this.selectedDates : [this.selectedDate];
    
    console.log('Données de cours de base:', baseCourseData);
    console.log('Dates à créer:', datesToCreate);
    
    // Créer les cours pour chaque date
    this.createCoursesForDates(baseCourseData, datesToCreate);
  }

  /**
   * Crée les cours pour toutes les dates sélectionnées
   */
  private createCoursesForDates(baseCourseData: any, dates: string[]): void {
    const courseCreationPromises: Promise<any>[] = [];
    
    dates.forEach(date => {
      const courseData = {
        ...baseCourseData,
        day: date
      };
      
      const promise = new Promise((resolve, reject) => {
        this.courseService.createCourse(courseData).subscribe({
          next: (course) => resolve(course),
          error: (error) => reject(error)
        });
      });
      
      courseCreationPromises.push(promise);
    });
    
    // Attendre que tous les cours soient créés
    Promise.allSettled(courseCreationPromises).then(results => {
      this.loading = false;
      
      const successful = results.filter(result => result.status === 'fulfilled');
      const failed = results.filter(result => result.status === 'rejected');
      
      if (successful.length > 0) {
        const message = dates.length === 1 
          ? 'Cours créé avec succès !'
          : `${successful.length} cours créés avec succès${failed.length > 0 ? `, ${failed.length} échecs` : ''} !`;
        
        this.alertService.success(message);
        this.modal.hide();
        
        // Recharger le planning pour afficher les nouveaux cours
        this.loadCourses();
        
        // Réinitialiser le formulaire
        this.resetCourseForm();
      }
      
      if (failed.length > 0) {
        console.error('Erreurs lors de la création:', failed);
        
        if (successful.length === 0) {
          this.error = 'Erreur lors de la création des cours';
        } else {
          this.alertService.error(`${failed.length} cours n'ont pas pu être créés`);
        }
      }
    }).catch(error => {
      this.loading = false;
      console.error('Erreur générale lors de la création des cours:', error);
      this.error = 'Une erreur est survenue lors de la création des cours';
    });
  }

  /**
   * Réinitialise le formulaire de cours
   */
  private resetCourseForm(): void {
    this.courseForm.reset({
      group_id: '',
      title: '',
      start_hour: '',
      end_hour: '',
      user_id: null,
      color: '',
      is_multi_date: false,
      recurrence_type: 'none',
      weekly_occurrences: 1,
      custom_dates: []
    });
    
    this.isMultiDateMode = false;
    this.selectedDates = [];
    this.recurrenceType = 'none';
    this.weeklyOccurrences = 1;
  }

  /**
   * Annule la création de cours
   */
  onCancelCourse(): void {
    this.resetCourseForm();
    this.error = '';
    this.modal?.hide();
  }

  /**
   * Vérifie si un champ est invalide
   */
  isFieldInvalid(fieldName: string): boolean {
    const control = this.courseForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  /**
   * Formate la date pour l'affichage
   */
  getWeekDisplay(): string {
    const startOfWeek = this.getStartOfWeek(this.currentWeek);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return `${startOfWeek.toLocaleDateString('fr-FR')} - ${endOfWeek.toLocaleDateString('fr-FR')}`;
  }

  // ========== MÉTHODES POUR LE MODAL DE DÉTAIL DE COURS ==========

  /**
   * Gestion du clic sur un cours (ouvre le modal de détail)
   */
  onCourseClick(event: Event, course: Course): void {
    // Empêcher la propagation vers le clic sur le jour
    event.stopPropagation();
    
    console.log('=== CLIC SUR COURS ===');
    console.log('Cours cliqué:', course);
    
    // Enrichir les données du cours avec les informations complètes
    const enrichedCourse = this.enrichCourseData(course);
    console.log('Cours enrichi:', enrichedCourse);
    
    this.selectedCourse = enrichedCourse;
    this.loadCourseStudents();
    
    // Ouvrir le modal de détail
    const modalElement = document.getElementById('courseDetailsModal');
    if (modalElement) {
      this.detailsModal = new bootstrap.Modal(modalElement);
      this.detailsModal.show();
    }
  }

  /**
   * Enrichit les données d'un cours avec les informations complètes du groupe et de la session
   */
  private enrichCourseData(course: Course): Course {
    // Trouver le groupe complet correspondant
    const fullGroup = this.groups.find(g => 
      g.group_id === course.group_id || 
      g.id === course.group_id
    );
    
    console.log('Recherche groupe pour course.group_id:', course.group_id);
    console.log('Groupe trouvé:', fullGroup);
    
    // Récupérer la session à partir du groupe (relation: Cours → Groupe → Session)
    let fullSession = null;
    if (fullGroup) {
      // La session peut être directement dans le groupe ou il faut la chercher par ID
      if (fullGroup.session) {
        fullSession = fullGroup.session;
        console.log('Session trouvée via group.session:', fullSession);
      } else if (fullGroup.session_id) {
        // Chercher la session complète par son ID
        fullSession = this.sessions.find(s => 
          s.session_id === fullGroup.session_id || 
          s.id === fullGroup.session_id
        );
        console.log('Session trouvée via group.session_id:', fullSession);
      }
    } else {
      console.warn('Aucun groupe trouvé pour ce cours, impossible de déterminer la session');
    }

    // Extraire l'user_id depuis l'array users de l'API
    let assignedUserId = course.user_id; // Valeur par défaut

    // Si le cours a un array users (structure API), extraire le premier professeur
    if ((course as any).users && Array.isArray((course as any).users) && (course as any).users.length > 0) {
      const firstUser = (course as any).users[0];
      if (firstUser && firstUser.user_id) {
        assignedUserId = firstUser.user_id;
        console.log('User ID extrait depuis API users array:', assignedUserId);
      } else if (firstUser && firstUser.user && firstUser.user.id) {
        assignedUserId = firstUser.user.id;
        console.log('User ID extrait depuis API users[].user.id:', assignedUserId);
      }
    }

    // Enrichir avec les données complètes du professeur
    let fullUser: { user_id?: string | number; firstname?: string; lastname?: string; email?: string } | undefined = undefined;
    if (assignedUserId) {
      const teacher = this.getTeacherById(assignedUserId);
      if (teacher) {
        fullUser = {
          user_id: teacher.id,
          firstname: teacher.fullName.split(' ')[0] || '',
          lastname: teacher.fullName.split(' ').slice(1).join(' ') || '',
          email: teacher.email
        };
        console.log('Professeur enrichi:', fullUser);
      } else {
        console.warn('Professeur non trouvé dans la liste pour user_id:', assignedUserId);
      }
    }
    
    return {
      ...course,
      user_id: assignedUserId, // Assigner l'user_id extrait
      user: fullUser, // Ajouter les données complètes du professeur
      group: fullGroup ? {
        group_id: fullGroup.group_id,
        label: fullGroup.label
      } : course.group,
      session: fullSession ? {
        session_id: fullSession.session_id,
        label: fullSession.label
      } : course.session
    };
  }

  /**
   * Charge les élèves du groupe associé au cours
   */
  loadCourseStudents(): void {
    if (!this.selectedCourse?.group_id) {
      console.warn('Aucun groupe associé au cours');
      this.courseStudents = [];
      return;
    }

    this.loadingCourseDetails = true;
    console.log('Chargement des élèves pour le groupe:', this.selectedCourse.group_id);

    this.groupService.getGroupById(this.selectedCourse.group_id).subscribe({
      next: (group) => {
        console.log('Groupe chargé:', group);
        this.courseStudents = group.students || [];
        
        // Initialiser les statuts de présence (par défaut : inconnu)
        this.courseStudents.forEach(student => {
          if (!this.studentAttendanceMap.has(student.student_id)) {
            this.studentAttendanceMap.set(student.student_id, 'unknown');
          }
        });
        
        // Charger les présences existantes pour ce cours
        this.loadExistingAttendance();
        
        console.log('Élèves du cours:', this.courseStudents);
      },
      error: (error) => {
        console.error('Erreur lors du chargement du groupe:', error);
        this.courseStudents = [];
        this.loadingCourseDetails = false;
        this.alertService.error('Impossible de charger les élèves du groupe');
      }
    });
  }

  /**
   * Charge les présences existantes pour le cours sélectionné
   */
  loadExistingAttendance(): void {
    if (!this.selectedCourse?.course_id && !this.selectedCourse?.id) {
      this.loadingCourseDetails = false;
      return;
    }

    const courseId = this.selectedCourse.course_id || this.selectedCourse.id;
    
    this.attendanceService.getCourseAttendance(courseId).subscribe({
      next: (records) => {
        this.attendanceRecords = records;
        
        // Mettre à jour la map des présences avec les données existantes
        records.forEach(record => {
          this.studentAttendanceMap.set(record.student_id, record.status);
        });
        
        this.loadingCourseDetails = false;
        console.log('Présences chargées:', records);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des présences:', error);
        this.loadingCourseDetails = false;
        // Ne pas afficher d'erreur si l'API n'existe pas encore
        if (error.status !== 404) {
          console.warn('API des présences non disponible ou cours sans présences enregistrées');
        }
      }
    });
  }

  /**
   * Ferme le modal de détail
   */
  onCloseDetailsModal(): void {
    this.selectedCourse = null;
    this.courseStudents = [];
    this.studentAttendanceMap.clear();
    this.detailsModal?.hide();
  }

  /**
   * Bouton "Modifier le cours"
   */
  onEditCourse(): void {
    if (!this.selectedCourse) return;
    
    console.log('=== EDITION DU COURS ===');
    console.log('Cours sélectionné:', this.selectedCourse.title, '| User ID:', this.selectedCourse.user_id, '| Couleur:', this.selectedCourse.color);
    
    // Si pas de professeurs, essayer de les recharger
    if (this.teachers.length === 0) {
      console.log('Rechargement des professeurs...');
      this.loadTeachers();
    }
    
    // Normaliser user_id pour correspondre aux IDs des professeurs
    let selectedUserId = this.selectedCourse.user_id;

    // Pré-remplir le formulaire d'édition avec les données actuelles du cours
    this.editCourseForm.patchValue({
      group_id: this.selectedCourse.group_id || '',
      title: this.selectedCourse.title || '',
      start_hour: this.selectedCourse.start_hour || '',
      end_hour: this.selectedCourse.end_hour || '',
      day: this.selectedCourse.day || '',
      user_id: selectedUserId || null,
      color: this.selectedCourse.color || ''
    });

    console.log('Professeur pré-sélectionné dans le formulaire:', this.editCourseForm.get('user_id')?.value);
    console.log('Couleur pré-sélectionnée dans le formulaire:', this.editCourseForm.get('color')?.value);

    // Réinitialiser les erreurs
    this.editError = '';
    
    // Fermer le modal de détail
    this.detailsModal?.hide();
    
    // Ouvrir le modal d'édition
    setTimeout(() => {
      const modalElement = document.getElementById('editCourseModal');
      if (modalElement) {
        this.editModal = new bootstrap.Modal(modalElement);
        this.editModal.show();
      }
    }, 300); // Petit délai pour laisser le temps au modal de détail de se fermer
  }

  /**
   * Bouton "Supprimer le cours"
   */
  onDeleteCourse(): void {
    if (!this.selectedCourse) return;
    
    const courseTitle = this.selectedCourse.title;
    const courseDate = this.selectedCourse.day;
    const courseTime = `${this.selectedCourse.start_hour} - ${this.selectedCourse.end_hour}`;
    
    console.log('=== DEMANDE DE SUPPRESSION DE COURS ===');
    console.log('Cours à supprimer:', this.selectedCourse);
    
    // Demander confirmation à l'utilisateur
    const confirmMessage = `Êtes-vous sûr de vouloir supprimer ce cours ?\n\n` +
                          `📚 ${courseTitle}\n` +
                          `📅 ${courseDate}\n` +
                          `🕐 ${courseTime}\n\n` +
                          `Cette action est irréversible et ne supprimera que le cours, ` +
                          `pas le groupe, les élèves ou le professeur.`;
    
    if (confirm(confirmMessage)) {
      const courseId = this.selectedCourse.course_id || this.selectedCourse.id;
      
      if (!courseId) {
        this.alertService.error('Impossible de déterminer l\'ID du cours à supprimer');
        return;
      }
      
      console.log('Suppression confirmée, ID du cours:', courseId);
      
      this.courseService.deleteCourse(courseId).subscribe({
        next: () => {
          console.log('Cours supprimé avec succès');
          
          // Fermer le modal de détail
          this.onCloseDetailsModal();
          
          // Afficher un message de succès
          this.alertService.success('Cours supprimé avec succès !');
          
          // Recharger le planning pour refléter la suppression
          this.loadCourses();
        },
        error: (error) => {
          console.error('Erreur lors de la suppression du cours:', error);
          this.alertService.error('Erreur lors de la suppression du cours. Veuillez réessayer.');
        }
      });
    } else {
      console.log('Suppression annulée par l\'utilisateur');
    }
  }

  // ========== MÉTHODES POUR LA GESTION DES PRÉSENCES ==========

  /**
   * TrackBy function pour optimiser le rendu des étudiants
   */
  trackByStudentId(index: number, student: Student): number | string {
    return student.student_id;
  }

  /**
   * Marque un élève comme présent
   */
  markStudentPresent(student: Student): void {
    this.studentAttendanceMap.set(student.student_id, 'present');
    console.log(`Élève ${student.firstname} ${student.lastname} marqué présent`);
  }

  /**
   * Marque un élève comme absent
   */
  markStudentAbsent(student: Student): void {
    this.studentAttendanceMap.set(student.student_id, 'absent');
    console.log(`Élève ${student.firstname} ${student.lastname} marqué absent`);
  }

  /**
   * Marque un élève en retard
   */
  markStudentLate(student: Student): void {
    this.studentAttendanceMap.set(student.student_id, 'late');
    console.log(`Élève ${student.firstname} ${student.lastname} marqué en retard`);
  }

  /**
   * Marque un élève comme absent excusé
   */
  markStudentExcused(student: Student): void {
    this.studentAttendanceMap.set(student.student_id, 'excused');
    console.log(`Élève ${student.firstname} ${student.lastname} marqué absent excusé`);
  }

  /**
   * Vérifie si un élève est marqué présent
   */
  isStudentPresent(student: Student): boolean {
    return this.studentAttendanceMap.get(student.student_id) === 'present';
  }

  /**
   * Vérifie si un élève est marqué absent
   */
  isStudentAbsent(student: Student): boolean {
    return this.studentAttendanceMap.get(student.student_id) === 'absent';
  }

  /**
   * Vérifie si un élève est marqué en retard
   */
  isStudentLate(student: Student): boolean {
    return this.studentAttendanceMap.get(student.student_id) === 'late';
  }

  /**
   * Vérifie si un élève est marqué absent excusé
   */
  isStudentExcused(student: Student): boolean {
    return this.studentAttendanceMap.get(student.student_id) === 'excused';
  }

  /**
   * Retourne le libellé du statut d'un élève
   */
  getStudentStatusLabel(student: Student): string {
    const status = this.studentAttendanceMap.get(student.student_id);
    switch (status) {
      case 'present': return 'Présent';
      case 'absent': return 'Absent';
      case 'late': return 'En retard';
      case 'excused': return 'Absent excusé';
      default: return 'Non défini';
    }
  }

  /**
   * Retourne la classe CSS pour le badge de statut
   */
  getStudentStatusBadgeClass(student: Student): string {
    const status = this.studentAttendanceMap.get(student.student_id);
    switch (status) {
      case 'present': return 'badge bg-success';
      case 'absent': return 'badge bg-danger';
      case 'late': return 'badge bg-warning';
      case 'excused': return 'badge bg-secondary';
      default: return 'badge bg-secondary';
    }
  }

  /**
   * Retourne l'icône pour le statut d'un élève
   */
  getStudentStatusIcon(student: Student): string {
    const status = this.studentAttendanceMap.get(student.student_id);
    switch (status) {
      case 'present': return 'fas fa-check';
      case 'absent': return 'fas fa-times';
      case 'late': return 'fas fa-clock';
      case 'excused': return 'fas fa-times-circle';
      default: return 'fas fa-question';
    }
  }

  /**
   * Compte le nombre d'élèves présents
   */
  getPresentStudentsCount(): number {
    return this.courseStudents.filter(student => 
      this.studentAttendanceMap.get(student.student_id) === 'present'
    ).length;
  }

  /**
   * Compte le nombre d'élèves absents
   */
  getAbsentStudentsCount(): number {
    return this.courseStudents.filter(student => 
      this.studentAttendanceMap.get(student.student_id) === 'absent'
    ).length;
  }

  /**
   * Compte le nombre d'élèves en retard
   */
  getLateStudentsCount(): number {
    return this.courseStudents.filter(student => 
      this.studentAttendanceMap.get(student.student_id) === 'late'
    ).length;
  }

  /**
   * Compte le nombre d'élèves absents excusés
   */
  getExcusedStudentsCount(): number {
    return this.courseStudents.filter(student => 
      this.studentAttendanceMap.get(student.student_id) === 'excused'
    ).length;
  }

  // ========== MÉTHODES POUR LE MODAL D'ÉDITION DE COURS ==========

  /**
   * Soumet le formulaire d'édition de cours
   */
  onSubmitEditCourse(): void {
    if (this.editCourseForm.invalid || !this.selectedCourse) return;
    
    this.editLoading = true;
    this.editError = '';
    
    console.log('=== DIAGNOSTIC FORMULAIRE D\'ÉDITION ===');
    console.log('Form value:', this.editCourseForm.value);
    console.log('Form valid:', this.editCourseForm.valid);
    console.log('Course à modifier:', this.selectedCourse);
    
    const courseData = {
      title: this.editCourseForm.value.title,
      day: this.editCourseForm.value.day,
      start_hour: this.editCourseForm.value.start_hour,
      end_hour: this.editCourseForm.value.end_hour,
      group_id: this.editCourseForm.value.group_id,
      user_id: this.editCourseForm.value.user_id,
      color: this.editCourseForm.value.color
    };
    
    console.log('Données de cours à modifier:', courseData);
    
    const courseId = this.selectedCourse.course_id || this.selectedCourse.id;
    
    if (!courseId) {
      this.editLoading = false;
      this.editError = 'Impossible de déterminer l\'ID du cours à modifier';
      return;
    }
    
    this.courseService.updateCourse(courseId, courseData).subscribe({
      next: (updatedCourse) => {
        this.editLoading = false;
        this.editModal?.hide();
        this.alertService.success('Cours modifié avec succès !');
        console.log('Cours modifié:', updatedCourse);
        
        // Mettre à jour le cours sélectionné avec les nouvelles données
        this.selectedCourse = { ...this.selectedCourse, ...updatedCourse };
        
        // Recharger le planning pour afficher les modifications
        this.loadCourses();
        
        // Réinitialiser le formulaire
        this.editCourseForm.reset();
      },
      error: (error) => {
        console.error('Erreur lors de la modification du cours:', error);
        
        // Si l'update standard échoue, essayer la méthode alternative
        if (error.status === 405 || (error.message && error.message.includes('Cannot PUT'))) {
          console.log('Tentative de mise à jour alternative...');
          
          this.courseService.updateCourseAlternative(courseId, courseData).subscribe({
            next: (updatedCourse) => {
              this.editLoading = false;
              this.editModal?.hide();
              this.alertService.success('Cours modifié avec succès (méthode alternative) !');
              console.log('Cours modifié via méthode alternative:', updatedCourse);
              
              // Mettre à jour le cours sélectionné avec les nouvelles données
              this.selectedCourse = { ...this.selectedCourse, ...updatedCourse };
              
              // Recharger le planning pour afficher les modifications
              this.loadCourses();
              
              // Réinitialiser le formulaire
              this.editCourseForm.reset();
            },
            error: (alternativeError) => {
              this.editLoading = false;
              console.error('Erreur lors de la modification alternative:', alternativeError);
              this.editError = alternativeError?.message || 'Une erreur est survenue lors de la modification du cours';
            }
          });
        } else {
          this.editLoading = false;
          this.editError = error?.message || 'Une erreur est survenue lors de la modification du cours';
        }
      }
    });
  }

  /**
   * Annule l'édition de cours
   */
  onCancelEditCourse(): void {
    this.editCourseForm.reset();
    this.editError = '';
    this.editModal?.hide();
  }

  /**
   * Vérifie si un champ du formulaire d'édition est invalide
   */
  isEditFieldInvalid(fieldName: string): boolean {
    const control = this.editCourseForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  /**
   * Récupère les informations d'un professeur par son ID
   */
  getTeacherById(teacherId: string | number | null | undefined): UserDisplayInfo | null {
    if (!teacherId) return null;
    
    return this.teachers.find(teacher => 
      teacher.id.toString() === teacherId.toString()
    ) || null;
  }

  /**
   * Retourne le nom complet d'un professeur ou 'Non assigné'
   */
  getTeacherFullName(teacherId: string | number | null | undefined): string {
    const teacher = this.getTeacherById(teacherId);
    return teacher ? teacher.fullName : 'Non assigné';
  }

  /**
   * Sauvegarde toutes les présences du cours
   */
  saveAllAttendances(): void {
    if (!this.selectedCourse?.course_id && !this.selectedCourse?.id) {
      this.alertService.error('Aucun cours sélectionné');
      return;
    }

    const courseId = this.selectedCourse.course_id || this.selectedCourse.id;
    
    if (!courseId) {
      this.alertService.error('ID de cours invalide');
      return;
    }
    
    const attendances: AttendanceStatus[] = [];

    // Préparer les données de présence pour tous les élèves avec un statut défini
    this.courseStudents.forEach(student => {
      const status = this.studentAttendanceMap.get(student.student_id);
      if (status && status !== 'unknown') {
        attendances.push({
          student_id: student.student_id,
          status: status as 'present' | 'absent' | 'late' | 'excused'
        });
      }
    });

    if (attendances.length === 0) {
      this.alertService.error('Aucune présence à enregistrer');
      return;
    }

    this.savingAttendance = true;

    this.attendanceService.saveCourseAttendance(Number(courseId), attendances).subscribe({
      next: (records) => {
        this.savingAttendance = false;
        this.attendanceRecords = records;
        this.alertService.success(`${records.length} présence(s) enregistrée(s) avec succès !`);
        console.log('Présences sauvegardées:', records);
      },
      error: (error) => {
        this.savingAttendance = false;
        console.error('Erreur lors de la sauvegarde des présences:', error);
        this.alertService.error('Erreur lors de l\'enregistrement des présences');
      }
    });
  }

  /**
   * Marque tous les élèves comme présents
   */
  markAllStudentsPresent(): void {
    this.courseStudents.forEach(student => {
      this.studentAttendanceMap.set(student.student_id, 'present');
    });
    console.log('Tous les élèves marqués présents');
  }

  /**
   * Marque tous les élèves comme absents
   */
  markAllStudentsAbsent(): void {
    this.courseStudents.forEach(student => {
      this.studentAttendanceMap.set(student.student_id, 'absent');
    });
    console.log('Tous les élèves marqués absents');
  }
} 