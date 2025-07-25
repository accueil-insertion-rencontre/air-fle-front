// Modèles pour le suivi des parcours d'apprentissage des étudiants

export interface ProgressMilestone {
  id: string;
  date: Date | string;
  type: 'exam' | 'level_change' | 'course_completion' | 'goal_achieved';
  title: string;
  description?: string;
  result?: string; // Note d'examen, nouveau niveau atteint, etc.
  status: 'completed' | 'in_progress' | 'pending' | 'failed';
}

export interface LearningPath {
  studentId: string;
  studentName: string;
  startDate: Date | string;
  currentLevel: string;
  initialLevel?: string;
  targetLevel?: string;
  totalExams: number;
  passedExams: number;
  totalCourses: number;
  completedCourses: number;
  progressPercentage: number;
  milestones: ProgressMilestone[];
  nextObjectives: string[];
}

export interface StudentProgress {
  student_uuid: string;
  student_firstname: string;
  student_lastname: string;
  student_mail?: string;
  
  // Informations de parcours
  start_date: Date | string;
  current_french_level: {
    code: string;
    description: string;
  };
  initial_french_level?: {
    code: string;
    description: string;
  };
  target_level?: string;
  
  // Statistiques
  stats: {
    total_exams: number;
    passed_exams: number;
    failed_exams: number;
    average_score?: number;
    total_courses_hours: number;
    attendance_rate: number;
    progress_percentage: number;
  };
  
  // Historique des examens
  exam_history: {
    exam_uuid: string;
    exam_label: string;
    exam_date: Date | string;
    exam_score?: string;
    is_passed: boolean;
    level_achieved?: string;
  }[];
  
  // Cours suivis
  courses_attended: {
    course_uuid: string;
    course_name: string;
    course_date: Date | string;
    session_label: string;
    group_label: string;
    hours: number;
  }[];
  
  // Jalons du parcours
  milestones: ProgressMilestone[];
  
  // Prochaines étapes recommandées
  next_steps: {
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    due_date?: Date | string;
  }[];
  
  // Dates importantes
  created_at: Date | string;
  updated_at: Date | string;
}

export interface ProgressSummary {
  total_students: number;
  active_students: number;
  completed_paths: number;
  average_progress: number;
  level_distribution: {
    level: string;
    count: number;
    percentage: number;
  }[];
  recent_achievements: {
    student_name: string;
    achievement: string;
    date: Date | string;
  }[];
}

// Types pour les filtres et le tri
export interface ProgressFilters {
  level?: string;
  status?: 'active' | 'completed' | 'inactive';
  progress_range?: {
    min: number;
    max: number;
  };
  date_range?: {
    start: Date | string;
    end: Date | string;
  };
  search_term?: string;
}

export interface ProgressSortOptions {
  field: 'name' | 'progress' | 'level' | 'start_date' | 'last_exam';
  direction: 'asc' | 'desc';
}

// DTO pour les requêtes API
export interface CreateProgressTrackingRequest {
  student_uuid: string;
  initial_level?: string;
  target_level?: string;
  objectives?: string[];
}

export interface UpdateProgressRequest {
  student_uuid: string;
  current_level?: string;
  target_level?: string;
  notes?: string;
} 