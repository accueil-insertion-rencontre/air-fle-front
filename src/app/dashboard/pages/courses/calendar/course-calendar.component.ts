import {
  AlertService,
  AttendanceRecord,
  AttendanceService,
  AttendanceStatus,
  AuthService,
  CourseService,
  GroupService,
  SessionService,
  UserService,
} from '@core/services';

import { Course, Group, Session, Student, User, UserDisplayInfo } from '@core/models';

import { environment } from '@environments/environment';

import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from '@angular/forms';

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
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
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
  studentAttendanceMap: Map<
    number | string,
    'present' | 'absent' | 'late' | 'excused' | 'unknown'
  > = new Map();
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
    '08:00',
    '08:30',
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '12:00',
    '12:30',
    '13:00',
    '13:30',
    '14:00',
    '14:30',
    '15:00',
    '15:30',
    '16:00',
    '16:30',
    '17:00',
    '17:30',
    '18:00',
    '18:30',
    '19:00',
    '19:30',
  ];

  // Couleurs pour les cours
  courseColors = [
    '#007bff',
    '#28a745',
    '#dc3545',
    '#ffc107',
    '#6f42c1',
    '#e83e8c',
    '#20c997',
    '#fd7e14',
    '#6610f2',
    '#17a2b8',
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
    { name: 'Sombre', value: '#343a40' },
  ];

  // Cache pour éviter les appels répétés
  private coursesCache = new Map<string, Course[]>();
  private lastCoursesUpdate = 0;

  constructor(
    private courseService: CourseService,
    private sessionService: SessionService,
    private groupService: GroupService,
    private userService: UserService,
    private attendanceService: AttendanceService,
    private alertService: AlertService,
    private authService: AuthService,
    private formBuilder: FormBuilder
  ) {
    this.courseForm = this.formBuilder.group({
      group_uuid: ['', Validators.required],
      course_name: ['', [Validators.required, Validators.minLength(3)]],
      course_start_hour: ['', Validators.required],
      course_end_hour: ['', Validators.required],
      user_uuid: [''], // Optionnel, donc pas de Validators.required
      course_color: [''], // Couleur optionnelle
      // Nouveaux champs pour multi-dates
      is_multi_date: [false],
      recurrence_type: ['none'],
      weekly_occurrences: [1, [Validators.min(1), Validators.max(10)]],
      custom_dates: [[]],
    });

    this.editCourseForm = this.formBuilder.group({
      group_uuid: ['', Validators.required],
      course_name: ['', [Validators.required, Validators.minLength(3)]],
      course_start_hour: ['', Validators.required],
      course_end_hour: ['', Validators.required],
      user_uuid: [''], // 🔧 Fix: ajout du champ manquant
      course_color: [''],
    });
  }

  ngOnInit(): void {
    console.log('🌟 === DÉBUT ngOnInit() ===');
    console.log('🔄 Appel loadSessions()...');
    this.loadSessions();
    console.log('🔄 Appel loadTeachers()...');
    this.loadTeachers();
    console.log('🔄 Appel generateWeekView()...');
    this.generateWeekView();
    console.log('🔄 Appel loadCourses()...');
    this.loadCourses();
    console.log('🌟 === FIN ngOnInit() ===');
  }

  /**
   * Charge les sessions disponibles
   */
  loadSessions(): void {
    this.sessionService.getSessions().subscribe({
      next: sessions => {
        this.sessions = sessions;

        // Extraire tous les groupes de toutes les sessions
        this.groups = [];
        sessions.forEach(session => {
          if (session.groups) {
            session.groups.forEach(group => {
              this.groups.push({
                ...group,
                session: session,
              });
            });
          }
        });

        // Sélectionner automatiquement la première session pour le filtrage
        if (sessions.length > 0) {
          this.selectedSessionId = sessions[0].session_uuid || sessions[0].id || null;
          this.loadCourses();
        }
      },
      error: error => {
        this.error = 'Impossible de charger les sessions';
      },
    });
  }

  /**
   * Charge les professeurs disponibles
   */
  loadTeachers(): void {
    this.userService.getTeachers().subscribe({
      next: teachers => {
        this.teachers = teachers;
      },
      error: error => {
        this.error = 'Impossible de charger les professeurs';
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

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);

      this.weekDays.push({
        date: new Date(date),
        dayName: dayNames[i],
        dayNumber: date.getDate(),
        isToday: this.isSameDay(date, today),
      });
    }
  }

  /**
   * Retourne le début de la semaine (lundi)
   */
  getStartOfWeek(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay(); // 0 = dimanche, 1 = lundi, ..., 6 = samedi

    // Convertir dimanche (0) en 7 pour le calcul
    const dayOfWeek = day === 0 ? 7 : day;

    // Calculer le nombre de jours à soustraire pour arriver au lundi (1)
    const daysToSubtract = dayOfWeek - 1;

    start.setDate(start.getDate() - daysToSubtract);
    start.setHours(0, 0, 0, 0);

    return start;
  }

  /**
   * Vérifie si deux dates sont le même jour
   */
  isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /**
   * Charge TOUS les cours puis filtre côté frontend
   */
  loadCourses(): void {
    console.log('🚀 === DÉBUT loadCourses() ===');
    console.log('🔍 Chargement de TOUS les cours (pas de filtrage API)');
    console.log('🎯 Session sélectionnée:', this.selectedSessionId);

    // 🔧 DEBUG: Vérifier le token d'authentification
    const token = this.authService.getToken();
    console.log('🔑 Token présent:', !!token);
    console.log('🔑 Token (10 premiers chars):', token ? token.substring(0, 10) + '...' : 'null');

    console.log('🌐 Appel API courseService.getCourses()...');

    // 🔧 FIX: Récupérer TOUS les cours, puis filtrer côté frontend
    this.courseService.getCourses().subscribe({
      next: allCourses => {
        console.log('✅ === RÉPONSE REÇUE ===');
        console.log('📚 TOUS les cours reçus de l\'API:', allCourses);
        console.log('📊 Nombre total de cours:', allCourses.length);
        
        // Log détaillé des premiers cours
        if (allCourses.length > 0) {
          console.log('📖 Exemple de cours reçu:', allCourses[0]);
          allCourses.slice(0, 3).forEach((course, index) => {
            console.log(`📝 Cours ${index + 1}:`, {
              nom: course.course_name || course.title,
              date: course.course_day || course.day,
              session: course.session?.session_uuid || course.session_id
            });
          });
        }

        // Filtrer côté frontend par session si nécessaire
        let filteredCourses = allCourses;
        
        if (this.selectedSessionId) {
          console.log(`🔍 Filtrage pour session: ${this.selectedSessionId}`);
          
          filteredCourses = allCourses.filter(course => {
            // ✅ Utiliser seulement course.session (course.group.session n'existe pas dans le modèle)
            const courseSessionId = course.session?.session_uuid || 
                                  course.session?.session_id ||
                                  course.session_id; // Fallback pour anciens champs
            
            const match = courseSessionId?.toString() === this.selectedSessionId?.toString();
            
            if (course.course_name || course.title) {
              console.log(`📋 Cours "${course.course_name || course.title}": session=${courseSessionId}, match=${match}`);
            }
            
            return match;
          });
          
          console.log(`🎯 Cours filtrés pour la session ${this.selectedSessionId}:`, filteredCourses.length);
        } else {
          console.log('ℹ️ Aucune session sélectionnée, on garde tous les cours');
        }

        // Assigner tous les cours (on filtrera par date dans getCoursesForDay)
        this.courses = filteredCourses;
        
        // Vider le cache et mettre à jour le timestamp
        this.clearCoursesCache();
        
        if (filteredCourses.length > 0) {
          console.log('📖 Premier cours filtré:', filteredCourses[0]);
        } else {
          console.log('⚠️ Aucun cours après filtrage !');
        }
        
        console.log('🔄 Appel updateScheduleWithCourses()...');
        this.updateScheduleWithCourses();
        console.log('🏁 === FIN loadCourses() SUCCESS ===');
      },
      error: error => {
        console.error('❌ === ERREUR loadCourses() ===');
        console.error('❌ Erreur lors du chargement des cours:', error);
        console.error('❌ Status code:', error.status);
        console.error('❌ Message:', error.message);
        this.error = 'Impossible de charger les cours';
        this.courses = [];
        this.clearCoursesCache();
        this.updateScheduleWithCourses();
        console.log('🏁 === FIN loadCourses() ERROR ===');
      },
    });

    console.log('📡 Appel API lancé, en attente de réponse...');
  }

  /**
   * Met à jour le planning avec les cours chargés
   */
  updateScheduleWithCourses(): void {
    // Plus besoin de logique complexe avec le nouveau design par colonnes
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
    this.selectedDate = this.formatDateForApi(day.date);
    this.selectedDates = [this.selectedDate];
    this.isMultiDateMode = false;
    this.openCreateCourseModal();
  }

  /**
   * Récupère les cours pour un jour donné
   */
  getCoursesForDay(day: WeekDay): Course[] {
    const dateKey = this.formatDateForApi(day.date);
    
    // Vérifier le cache si les données n'ont pas changé
    const cacheKey = `${dateKey}-${this.courses.length}-${this.lastCoursesUpdate}`;
    if (this.coursesCache.has(cacheKey)) {
      return this.coursesCache.get(cacheKey)!;
    }

    console.log(`🗓️ Recherche cours pour ${dateKey}`);
    
    const daysCourses = this.courses.filter(course => {
      const courseDate = course.course_day || course.day;
      
      // Log pour debug seulement sur la première recherche
      if (!this.coursesCache.has(cacheKey) && course) {
        console.log(`📝 Cours "${course.course_name || course.title}": date=${courseDate}, match=${courseDate === dateKey}`);
      }
      
      return courseDate === dateKey;
    });

    console.log(`📅 Cours trouvés pour ${dateKey}:`, daysCourses.length);

    // Enrichir chaque cours avec les données complètes
    const enrichedCourses = daysCourses.map(course => this.enrichCourseData(course));

    // Trier les cours par heure de début, puis par date de création
    const sortedCourses = enrichedCourses.sort((a, b) => {
      // Première priorité : trier par heure de début (plus tôt en premier)
      const startHourA = a.course_start_hour || a.start_hour;
      const startHourB = b.course_start_hour || b.start_hour;
      
      if (startHourA && startHourB) {
        const timeComparison = startHourA.localeCompare(startHourB);
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
      const idA = a.course_uuid || a.course_id || 0;
      const idB = b.course_uuid || b.course_id || 0;
      return idA.toString().localeCompare(idB.toString());
    });

    // Mettre en cache
    this.coursesCache.set(cacheKey, sortedCourses);

    return sortedCourses;
  }

  /**
   * Génère une couleur pour un cours basée sur sa couleur personnalisée ou son groupe
   */
  getCourseColor(course: Course): string {
    // Priorité 1: Couleur personnalisée du cours
    if (course.course_color) {
      return course.course_color;
    }

    // Priorité 2: Couleur basée sur le groupe (fallback)
    if (!course.group_uuid) {
      return this.courseColors[0];
    }

    // S'assurer qu'on travaille avec une string
    const groupIdStr = course.group_uuid.toString();

    // Utiliser le hash du group_uuid pour avoir une couleur consistante
    let hash = 0;
    for (let i = 0; i < groupIdStr.length; i++) {
      const char = groupIdStr.charCodeAt(i);
      hash = (hash << 5) - hash + char;
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
    return (group.group_uuid || group.group_id || group.id || index.toString()).toString();
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
        custom_dates: this.selectedDates,
      });
    } else {
      this.courseForm.patchValue({
        is_multi_date: false,
        recurrence_type: 'none',
        custom_dates: [this.selectedDate],
      });
      this.selectedDates = [this.selectedDate];
    }
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
      custom_dates: this.selectedDates,
    });
  }

  /**
   * Génère les dates pour la récurrence hebdomadaire
   */
  generateWeeklyDates(): void {
    this.selectedDates = [];
    const startDate = new Date(this.selectedDate);

    for (let i = 0; i < this.weeklyOccurrences; i++) {
      const newDate = new Date(startDate);
      newDate.setDate(startDate.getDate() + i * 7);
      this.selectedDates.push(this.formatDateForApi(newDate));
    }

    this.courseForm.patchValue({
      custom_dates: this.selectedDates,
    });
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
      weekly_occurrences: this.weeklyOccurrences,
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
        custom_dates: this.selectedDates,
      });
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
        custom_dates: this.selectedDates,
      });
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
      day: 'numeric',
    });
  }

  /**
   * Soumet le formulaire de création de cours
   */
  onSubmitCourse(): void {
    if (this.courseForm.invalid) {
      console.log('❌ Formulaire invalide:', this.courseForm.errors);
      console.log('État des champs:', {
        group_uuid: this.courseForm.get('group_uuid')?.value,
        course_name: this.courseForm.get('course_name')?.value,
        course_start_hour: this.courseForm.get('course_start_hour')?.value,
        course_end_hour: this.courseForm.get('course_end_hour')?.value,
        user_uuid: this.courseForm.get('user_uuid')?.value,
      });
      return;
    }

    this.loading = true;
    this.error = '';

    const baseCourseData = {
      course_name: this.courseForm.value.course_name,
      course_start_hour: this.courseForm.value.course_start_hour,
      course_end_hour: this.courseForm.value.course_end_hour,
      group_uuid: this.courseForm.value.group_uuid,
      user_uuid: this.courseForm.value.user_uuid,
      course_color: this.courseForm.value.course_color,
    };

    console.log('📊 Données du cours à créer:', baseCourseData);
    console.log('📅 Date sélectionnée:', this.selectedDate);

    // Déterminer les dates à créer
    const datesToCreate = this.isMultiDateMode ? this.selectedDates : [this.selectedDate];

    console.log('📅 Dates à créer:', datesToCreate);

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
        course_day: date,
        course_start_hour: this.convertTimeToDate(baseCourseData.course_start_hour),
        course_end_hour: this.convertTimeToDate(baseCourseData.course_end_hour),
      };

      console.log('🔧 Données finales envoyées à l\'API:', courseData);

      const promise = new Promise((resolve, reject) => {
        this.courseService.createCourse(courseData).subscribe({
          next: course => {
            console.log('✅ Cours créé avec succès:', course);
            resolve(course);
          },
          error: error => {
            console.error('❌ Erreur API lors de la création:', error);
            console.error('❌ Détails de l\'erreur:', {
              status: error.status,
              message: error.message,
              error: error.error
            });
            reject(error);
          },
        });
      });

      courseCreationPromises.push(promise);
    });

    // Attendre que tous les cours soient créés
    Promise.allSettled(courseCreationPromises)
      .then(results => {
        this.loading = false;

        const successful = results.filter(result => result.status === 'fulfilled');
        const failed = results.filter(result => result.status === 'rejected');

        console.log('📊 Résultats:', { successful: successful.length, failed: failed.length });

        if (failed.length > 0) {
          console.log('❌ Erreurs détaillées:', failed.map(f => (f as any).reason));
        }

        if (successful.length > 0) {
          const message =
            dates.length === 1
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
          this.error = 'Erreur lors de la création des cours';
        }
      })
      .catch(error => {
        this.loading = false;
        console.error('💥 Erreur globale:', error);
        this.error = 'Une erreur est survenue lors de la création des cours';
      });
  }

  /**
   * 🔧 FIX: Convertit une heure string "HH:MM" en objet Date
   */
  private convertTimeToDate(timeString: string): Date {
    if (!timeString) return new Date();
    
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  /**
   * Réinitialise le formulaire de cours
   */
  private resetCourseForm(): void {
    this.courseForm.reset({
      group_uuid: '',
      course_name: '',
      course_start_hour: '09:00', // Heure par défaut
      course_end_hour: '10:00', // Heure par défaut
      user_uuid: '',
      course_color: '',
      is_multi_date: false,
      recurrence_type: 'none',
      weekly_occurrences: 1,
      custom_dates: [this.selectedDate],
    });

    // Réinitialiser les états
    this.isMultiDateMode = false;
    this.selectedDates = [this.selectedDate];
    this.recurrenceType = 'none';
    this.weeklyOccurrences = 1;
    this.error = '';
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

    this.selectedCourse = this.enrichCourseData(course);
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
    const fullGroup = this.groups.find(
      g => g.group_uuid === course.group_uuid || g.group_id === course.group_id
    );

    // Récupérer la session à partir du groupe (relation: Cours → Groupe → Session)
    let fullSession = null;
    if (fullGroup) {
      if (fullGroup.session) {
        fullSession = fullGroup.session;
      } else if (fullGroup.session_uuid || fullGroup.session_id) {
        // Chercher la session complète par son ID
        fullSession = this.sessions.find(
          s => s.session_uuid === fullGroup.session_uuid || s.id === fullGroup.session_id
        );
      }
    }

    // Extraire l'user_uuid depuis l'array users de l'API
    let assignedUserUuid = course.user?.user_uuid || course.user_uuid; // Valeur par défaut

    // Si le cours a un array users (structure API), extraire le premier professeur
    if (
      (course as any).users &&
      Array.isArray((course as any).users) &&
      (course as any).users.length > 0
    ) {
      const firstUser = (course as any).users[0];
      if (firstUser && firstUser.user_uuid) {
        assignedUserUuid = firstUser.user_uuid;
      } else if (firstUser && firstUser.user && firstUser.user.user_uuid) {
        assignedUserUuid = firstUser.user.user_uuid;
      }
    }

    // Enrichir avec les données complètes du professeur
    let fullUser = undefined;
    if (assignedUserUuid) {
      const teacher = this.getTeacherById(assignedUserUuid);
      if (teacher) {
        fullUser = {
          user_uuid: teacher.user_uuid,
          user_firstname: teacher.user_firstname,
          user_lastname: teacher.user_lastname,
          user_mail: teacher.user_mail,
          user_id: teacher.user_uuid || teacher.id,
          firstname: teacher.firstname,
          lastname: teacher.lastname,
          email: teacher.email,
        };
      }
    }

    return {
      ...course,
      user_uuid: assignedUserUuid, // Assigner l'user_uuid extrait
      user: fullUser, // Ajouter les données complètes du professeur
      group: fullGroup
        ? {
            group_uuid: fullGroup.group_uuid,
            group_id: fullGroup.group_id,
            group_label: fullGroup.group_label || fullGroup.label,
            label: fullGroup.group_label || fullGroup.label,
          }
        : course.group,
      session: fullSession
        ? {
            session_uuid: fullSession.session_uuid || fullSession.id,
            session_label: fullSession.session_label || fullSession.label,
            session_id: fullSession.session_uuid || fullSession.id,
            label: fullSession.session_label || fullSession.label,
          }
        : course.session,
    };
  }

  /**
   * Charge les élèves du groupe associé au cours
   */
  loadCourseStudents(): void {
    if (!this.selectedCourse?.group_uuid && !this.selectedCourse?.group_id) {
      this.courseStudents = [];
      return;
    }

    const groupId = this.selectedCourse.group_uuid || this.selectedCourse.group_id;
    
    if (!groupId) {
      this.courseStudents = [];
      return;
    }

    this.groupService.getGroupById(groupId).subscribe({
      next: group => {
        if (group.students && Array.isArray(group.students)) {
          this.courseStudents = group.students.map((student: any) => ({
            student_uuid: student.student_uuid,
            student_firstname: student.student_firstname,
            student_lastname: student.student_lastname,
            student_mail: student.student_mail,
            student_phone: student.student_phone || '',
            student_birthdate: student.student_birthdate || new Date(),
            student_created_at: student.student_created_at || new Date(),
            nationality_uuid: student.nationality_uuid || '',
            gender_uuid: student.gender_uuid || '',
            status_uuid: student.status_uuid || '',
            french_level_uuid: student.french_level_uuid || '',
            financing_uuid: student.financing_uuid || '',
            // Fallback pour compatibilité
            id: student.student_uuid,
            firstname: student.student_firstname,
            lastname: student.student_lastname,
            email: student.student_mail,
          }));
        } else {
          this.courseStudents = [];
        }
      },
      error: error => {
        this.error = 'Impossible de charger les étudiants du groupe';
        this.courseStudents = [];
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

    this.editCourseForm.patchValue({
      course_name: this.selectedCourse.course_name || this.selectedCourse.title || this.selectedCourse.intitule,
      course_start_hour: this.selectedCourse.course_start_hour || this.selectedCourse.course_start_hour || this.selectedCourse.start_hour,
      course_end_hour: this.selectedCourse.course_end_hour || this.selectedCourse.course_end_hour || this.selectedCourse.end_hour,
      course_color: this.selectedCourse.course_color || this.selectedCourse.course_color || this.selectedCourse.color,
    });

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

    const courseTitle = this.selectedCourse.course_name || this.selectedCourse.title || this.selectedCourse.intitule;
    const courseDate = this.selectedCourse.course_day || this.selectedCourse.day;
    const courseTime = `${this.selectedCourse.course_start_hour || this.selectedCourse.start_hour} - ${this.selectedCourse.course_end_hour || this.selectedCourse.end_hour}`;

    if (confirm(`Êtes-vous sûr de vouloir supprimer ce cours ?\n\n` +
      `📚 ${courseTitle}\n` +
      `📅 ${courseDate}\n` +
      `🕐 ${courseTime}\n\n` +
      `Cette action est irréversible et ne supprimera que le cours, ` +
      `pas le groupe, les élèves ou le professeur.`)) {
      const courseUuid = this.selectedCourse.course_uuid || this.selectedCourse.course_id || this.selectedCourse.id;

      if (!courseUuid) {
        this.alertService.error("Impossible de déterminer l'ID du cours à supprimer");
        return;
      }

      this.courseService.deleteCourse(courseUuid).subscribe({
        next: () => {
          this.alertService.success('Cours supprimé avec succès !');
          this.onCloseDetailsModal();
          this.loadCourses();
        },
        error: error => {
          console.error('Erreur lors de la suppression du cours:', error);
          this.error = 'Erreur lors de la suppression du cours. Veuillez réessayer.';
        },
      });
    } else {
      console.log("Suppression annulée par l'utilisateur");
    }
  }

  // ========== MÉTHODES POUR LA GESTION DES PRÉSENCES ==========

  /**
   * Obtient l'identifiant de l'étudiant (student_uuid ou id selon l'API)
   */
  private getStudentKey(student: Student): number | string {
    return student.student_uuid || student.student_uuid || 0;
  }

  /**
   * TrackBy function pour optimiser le rendu des étudiants
   */
  trackByStudentId = (index: number, student: Student): number | string => {
    return student.student_uuid || student.student_uuid || index;
  };

  /**
   * Marque un élève comme présent
   */
  markStudentPresent(student: Student): void {
    const studentKey = this.getStudentKey(student);
    this.studentAttendanceMap.set(studentKey, 'present');
  }

  /**
   * Marque un élève comme absent
   */
  markStudentAbsent(student: Student): void {
    const studentKey = this.getStudentKey(student);
    this.studentAttendanceMap.set(studentKey, 'absent');
  }

  /**
   * Marque un élève en retard
   */
  markStudentLate(student: Student): void {
    const studentKey = this.getStudentKey(student);
    this.studentAttendanceMap.set(studentKey, 'late');
  }

  /**
   * Marque un élève comme absent excusé
   */
  markStudentExcused(student: Student): void {
    const studentKey = this.getStudentKey(student);
    this.studentAttendanceMap.set(studentKey, 'excused');
  }

  /**
   * Vérifie si un élève est marqué présent
   */
  isStudentPresent(student: Student): boolean {
    const studentKey = this.getStudentKey(student);
    return this.studentAttendanceMap.get(studentKey) === 'present';
  }

  /**
   * Vérifie si un élève est marqué absent
   */
  isStudentAbsent(student: Student): boolean {
    const studentKey = this.getStudentKey(student);
    return this.studentAttendanceMap.get(studentKey) === 'absent';
  }

  /**
   * Vérifie si un élève est marqué en retard
   */
  isStudentLate(student: Student): boolean {
    const studentKey = this.getStudentKey(student);
    return this.studentAttendanceMap.get(studentKey) === 'late';
  }

  /**
   * Vérifie si un élève est marqué absent excusé
   */
  isStudentExcused(student: Student): boolean {
    const studentKey = this.getStudentKey(student);
    return this.studentAttendanceMap.get(studentKey) === 'excused';
  }

  /**
   * Retourne le libellé du statut d'un élève
   */
  getStudentStatusLabel(student: Student): string {
    const studentKey = this.getStudentKey(student);
    const status = this.studentAttendanceMap.get(studentKey);
    switch (status) {
      case 'present':
        return 'Présent';
      case 'absent':
        return 'Absent';
      case 'late':
        return 'En retard';
      case 'excused':
        return 'Absent excusé';
      default:
        return 'Non défini';
    }
  }

  /**
   * Retourne la classe CSS pour le badge de statut
   */
  getStudentStatusBadgeClass(student: Student): string {
    const studentKey = this.getStudentKey(student);
    const status = this.studentAttendanceMap.get(studentKey);
    switch (status) {
      case 'present':
        return 'badge bg-success';
      case 'absent':
        return 'badge bg-danger';
      case 'late':
        return 'badge bg-warning';
      case 'excused':
        return 'badge bg-secondary';
      default:
        return 'badge bg-secondary';
    }
  }

  /**
   * Retourne l'icône pour le statut d'un élève
   */
  getStudentStatusIcon(student: Student): string {
    const studentKey = this.getStudentKey(student);
    const status = this.studentAttendanceMap.get(studentKey);
    switch (status) {
      case 'present':
        return 'fas fa-check';
      case 'absent':
        return 'fas fa-times';
      case 'late':
        return 'fas fa-clock';
      case 'excused':
        return 'fas fa-times-circle';
      default:
        return 'fas fa-question';
    }
  }

  /**
   * Compte le nombre d'élèves présents
   */
  getPresentStudentsCount(): number {
    return this.courseStudents.filter(student => {
      const studentKey = this.getStudentKey(student);
      return this.studentAttendanceMap.get(studentKey) === 'present';
    }).length;
  }

  /**
   * Compte le nombre d'élèves absents
   */
  getAbsentStudentsCount(): number {
    return this.courseStudents.filter(student => {
      const studentKey = this.getStudentKey(student);
      return this.studentAttendanceMap.get(studentKey) === 'absent';
    }).length;
  }

  /**
   * Compte le nombre d'élèves en retard
   */
  getLateStudentsCount(): number {
    return this.courseStudents.filter(student => {
      const studentKey = this.getStudentKey(student);
      return this.studentAttendanceMap.get(studentKey) === 'late';
    }).length;
  }

  /**
   * Compte le nombre d'élèves absents excusés
   */
  getExcusedStudentsCount(): number {
    return this.courseStudents.filter(student => {
      const studentKey = this.getStudentKey(student);
      return this.studentAttendanceMap.get(studentKey) === 'excused';
    }).length;
  }

  // ========== MÉTHODES POUR LE MODAL D'ÉDITION DE COURS ==========

  /**
   * Soumet le formulaire d'édition de cours
   */
  onSubmitEditCourse(): void {
    if (this.editCourseForm.invalid || !this.selectedCourse) return;

    this.editLoading = true;
    this.editError = '';

    const courseData = {
      course_name: this.editCourseForm.value.course_name,
      course_start_hour: this.editCourseForm.value.course_start_hour,
      course_end_hour: this.editCourseForm.value.course_end_hour,
      course_color: this.editCourseForm.value.course_color,
    };

    const courseUuid = this.selectedCourse.course_uuid || this.selectedCourse.course_id || this.selectedCourse.id;

    if (!courseUuid) {
      this.editLoading = false;
      this.editError = "Impossible de déterminer l'ID du cours à modifier";
      return;
    }

    this.courseService.updateCourse(courseUuid, courseData).subscribe({
      next: updatedCourse => {
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
      error: error => {
        console.error('Erreur lors de la modification du cours:', error);

        // Si l'update standard échoue, essayer la méthode alternative
        if (error.status === 405 || (error.message && error.message.includes('Cannot PUT'))) {
          console.log('Tentative de mise à jour alternative...');

          this.courseService.updateCourseAlternative(courseUuid, courseData).subscribe({
            next: updatedCourse => {
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
            error: alternativeError => {
              this.editLoading = false;
              console.error('Erreur lors de la modification alternative:', alternativeError);
              this.editError =
                alternativeError?.message ||
                'Une erreur est survenue lors de la modification du cours';
            },
          });
        } else {
          this.editLoading = false;
          this.editError =
            error?.message || 'Une erreur est survenue lors de la modification du cours';
        }
      },
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

    return this.teachers.find(teacher => teacher.id?.toString() === teacherId.toString()) || null;
  }

  /**
   * Retourne le nom complet d'un professeur ou 'Non assigné'
   */
  getTeacherFullName(teacherId: string | number | null | undefined): string {
    const teacher = this.getTeacherById(teacherId);
    return teacher ? teacher.fullName : 'Non assigné';
  }

  /**
   * Sauvegarde toutes les présences du cours en utilisant l'API d'absences
   */
  saveAllAttendances(): void {
    if (!this.selectedCourse?.course_uuid && !this.selectedCourse?.course_id) {
      this.alertService.error('Aucun cours sélectionné');
      return;
    }

    const courseUuid = this.selectedCourse.course_uuid || this.selectedCourse.course_id;

    if (!courseUuid) {
      this.alertService.error('ID de cours invalide');
      return;
    }

    console.log('=== SAUVEGARDE DES PRÉSENCES (VERSION SIMPLIFIÉE) ===');
    console.log('Course ID:', courseUuid, 'type:', typeof courseUuid);
    console.log("Nombre d'étudiants dans le cours:", this.courseStudents.length);
    console.log('Map des présences actuelle:', Array.from(this.studentAttendanceMap.entries()));

    // Analyser les statuts des étudiants avec logs détaillés
    const studentsDetails: Array<{ student: any; key: any; status: any }> = [];
    this.courseStudents.forEach((student, index) => {
      const studentKey = this.getStudentKey(student);
      const status = this.studentAttendanceMap.get(studentKey);

      console.log(`=== ÉLÈVE ${index + 1}: ${student.student_firstname} ${student.student_lastname} ===`);
      console.log('  - Student object:', student);
      console.log('  - student.student_uuid:', student.student_uuid);
      console.log('  - studentKey (calculé):', studentKey, 'type:', typeof studentKey);
      console.log('  - status dans la Map:', status);

      studentsDetails.push({ student, key: studentKey, status });
    });

    // Identifier les absences à créer
    const absencesToCreate: any[] = [];
    studentsDetails.forEach(({ student, key, status }) => {
      if (status === 'absent') {
        absencesToCreate.push({
          student_uuid: key.toString(),
          course_uuid: courseUuid.toString(),
          reason: 'Absence enregistrée',
        });
      } else if (status === 'late') {
        absencesToCreate.push({
          student_uuid: key.toString(),
          course_uuid: courseUuid.toString(),
          reason: 'Retard',
        });
      } else if (status === 'excused') {
        absencesToCreate.push({
          student_uuid: key.toString(),
          course_uuid: courseUuid.toString(),
          reason: 'Absence excusée',
        });
      } else if (status === 'present') {
        console.log(`✓ PRÉSENT: ${student.student_firstname} ${student.student_lastname} (pas d'absence)`);
      }
    });

    console.log('=== RÉSUMÉ FINAL ===');
    console.log('Total étudiants:', studentsDetails.length);
    console.log('Absences à créer:', absencesToCreate.length);
    console.log("Données d'absences:", absencesToCreate);

    if (absencesToCreate.length === 0) {
      this.alertService.success('Tous les étudiants sont présents ! Aucune absence à enregistrer.');
      return;
    }

    this.savingAttendance = true;
    console.log('=== DÉBUT CRÉATION DES ABSENCES ===');

    // Créer toutes les absences en parallèle
    const createPromises = absencesToCreate.map((absenceData, index) => {
      console.log(`Création absence ${index + 1}:`, absenceData);
      return this.attendanceService.createAbsence(absenceData).toPromise();
    });

    Promise.allSettled(createPromises)
      .then(results => {
        this.savingAttendance = false;

        const successful = results.filter(result => result.status === 'fulfilled');
        const failed = results.filter(result => result.status === 'rejected');

        console.log('=== RÉSULTATS DE LA SAUVEGARDE ===');
        console.log('✅ Absences créées avec succès:', successful.length);
        console.log('❌ Échecs:', failed.length);

        if (failed.length > 0) {
          console.error(
            'Détail des échecs:',
            failed.map(f => (f as any).reason)
          );
        }

        if (successful.length > 0) {
          const presentCount = studentsDetails.length - successful.length;
          const message = `Présences enregistrées ! ${presentCount} présent(s), ${successful.length} absence(s)`;
          this.alertService.success(message);

          // Présences sauvegardées avec succès
        }

        if (failed.length > 0 && successful.length === 0) {
          this.alertService.error("Erreur lors de l'enregistrement des absences");
        } else if (failed.length > 0) {
          this.alertService.error(`${failed.length} absence(s) n'ont pas pu être enregistrées`);
        }
      })
      .catch(error => {
        this.savingAttendance = false;
        console.error('❌ ERREUR GLOBALE lors de la sauvegarde:', error);
        this.alertService.error("Erreur lors de l'enregistrement des présences");
      });
  }

  /**
   * Marque tous les élèves comme présents
   */
  markAllStudentsPresent(): void {
    this.courseStudents.forEach(student => {
      this.studentAttendanceMap.set(this.getStudentKey(student), 'present');
    });
  }

  /**
   * Marque tous les élèves comme absents
   */
  markAllStudentsAbsent(): void {
    this.courseStudents.forEach(student => {
      this.studentAttendanceMap.set(this.getStudentKey(student), 'absent');
    });
  }

  openCreateCourseModal(): void {
    this.resetCourseForm();
    const modalElement = document.getElementById('createCourseModal');
    if (modalElement) {
      this.modal = new bootstrap.Modal(modalElement);
      this.modal.show();
    }
  }

  private clearCoursesCache(): void {
    this.coursesCache.clear();
    this.lastCoursesUpdate = Date.now();
  }
}
