import { Injectable } from '@angular/core';
import { Observable, combineLatest, map, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

import { 
  StudentProgress, 
  LearningPath, 
  ProgressMilestone, 
  ProgressSummary, 
  ProgressFilters,
  ProgressSortOptions 
} from '../models/student-progress.model';
import { StudentService } from './student.service';
import { ExamService } from './exam.service';
import { CourseService } from './course.service';

@Injectable({
  providedIn: 'root'
})
export class ParcoursService {
  private readonly apiUrl = `${environment.apiUrl}/parcours`;

  constructor(
    private http: HttpClient,
    private studentService: StudentService,
    private examService: ExamService,
    private courseService: CourseService
  ) {}

  /**
   * Récupère tous les parcours d'apprentissage
   */
  getAllStudentProgress(filters?: ProgressFilters): Observable<StudentProgress[]> {
    console.log('🔄 ParcoursService: Récupération de tous les parcours...');
    
    // Pour l'instant, on construit les données à partir des services existants
    return combineLatest([
      this.studentService.getAllStudents(),
      this.examService.getAllExams()
    ]).pipe(
      map(([students, exams]) => {
        console.log('📊 ParcoursService: Construction des parcours pour', students.length, 'étudiants');
        
        return students.map(student => this.buildStudentProgress(student, exams));
      }),
      map(progressList => {
        // Application des filtres
        if (!filters) return progressList;
        
        return this.applyFilters(progressList, filters);
      })
    );
  }

  /**
   * Récupère le parcours d'un étudiant spécifique
   */
  getStudentProgress(studentId: string): Observable<StudentProgress> {
    console.log('🔄 ParcoursService: Récupération du parcours pour étudiant', studentId);
    
    return combineLatest([
      this.studentService.getStudentById(studentId),
      this.examService.getExamsByStudent(studentId)
    ]).pipe(
      map(([student, exams]) => {
        console.log('📊 ParcoursService: Construction du parcours pour', student.student_firstname);
        return this.buildStudentProgress(student, exams);
      })
    );
  }

  /**
   * Récupère un résumé des parcours (statistiques globales)
   */
  getProgressSummary(): Observable<ProgressSummary> {
    console.log('🔄 ParcoursService: Récupération du résumé des parcours...');
    
    return this.getAllStudentProgress().pipe(
      map(progressList => {
        const total = progressList.length;
        const active = progressList.filter(p => p.stats.progress_percentage < 100).length;
        const completed = progressList.filter(p => p.stats.progress_percentage === 100).length;
        const avgProgress = progressList.reduce((sum, p) => sum + p.stats.progress_percentage, 0) / total;

        // Distribution par niveau
        const levelCounts: { [key: string]: number } = {};
        progressList.forEach(p => {
          const level = p.current_french_level.code;
          levelCounts[level] = (levelCounts[level] || 0) + 1;
        });

        const level_distribution = Object.entries(levelCounts).map(([level, count]) => ({
          level,
          count,
          percentage: Math.round((count / total) * 100)
        }));

        // Réussites récentes (examens réussis des 30 derniers jours)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recent_achievements = progressList
          .flatMap(p => 
            p.exam_history
              .filter(exam => exam.is_passed && new Date(exam.exam_date) >= thirtyDaysAgo)
              .map(exam => ({
                student_name: `${p.student_firstname} ${p.student_lastname}`,
                achievement: `Examen "${exam.exam_label}" réussi${exam.level_achieved ? ` - Niveau ${exam.level_achieved}` : ''}`,
                date: exam.exam_date
              }))
          )
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 10);

        return {
          total_students: total,
          active_students: active,
          completed_paths: completed,
          average_progress: Math.round(avgProgress),
          level_distribution,
          recent_achievements
        };
      })
    );
  }

  /**
   * Construit le parcours d'un étudiant à partir des données disponibles
   */
  private buildStudentProgress(student: any, allExams: any[]): StudentProgress {
    // Examens de cet étudiant
    const studentExams = allExams.filter(exam => exam.student_uuid === student.student_uuid);
    
    // Calcul des statistiques
    const totalExams = studentExams.length;
    const passedExams = studentExams.filter(exam => this.isExamPassed(exam.exam_score)).length;
    const failedExams = totalExams - passedExams;
    
    // Calcul du score moyen (uniquement sur les examens avec score numérique)
    const numericScores = studentExams
      .map(exam => this.extractNumericScore(exam.exam_score))
      .filter(score => score !== null) as number[];
    const averageScore = numericScores.length > 0 
      ? Math.round(numericScores.reduce((sum, score) => sum + score, 0) / numericScores.length)
      : undefined;

    // Historique des examens
    const exam_history = studentExams.map(exam => ({
      exam_uuid: exam.exam_uuid,
      exam_label: exam.exam_label,
      exam_date: exam.exam_taked_at,
      exam_score: exam.exam_score,
      is_passed: this.isExamPassed(exam.exam_score),
      level_achieved: this.extractLevel(exam.exam_score)
    })).sort((a, b) => new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime());

    // Génération des jalons
    const milestones = this.generateMilestones(student, exam_history);

    // Calcul de la progression (basé sur les examens réussis et le niveau actuel)
    const progressPercentage = this.calculateProgressPercentage(student, exam_history);

    // Prochaines étapes recommandées
    const next_steps = this.generateNextSteps(student, exam_history, progressPercentage);

    return {
      student_uuid: student.student_uuid,
      student_firstname: student.student_firstname,
      student_lastname: student.student_lastname,
      student_mail: student.student_mail,
      start_date: student.student_created_at,
      current_french_level: {
        code: student.frenchLevel?.french_level_code || 'A1',
        description: student.frenchLevel?.french_level_description || 'Débutant'
      },
      initial_french_level: {
        code: student.frenchLevel?.french_level_code || 'A1',
        description: student.frenchLevel?.french_level_description || 'Débutant'
      },
      target_level: this.determineTargetLevel(student.frenchLevel?.french_level_code),
      stats: {
        total_exams: totalExams,
        passed_exams: passedExams,
        failed_exams: failedExams,
        average_score: averageScore,
        total_courses_hours: 0, // TODO: Calculer quand les données cours seront disponibles
        attendance_rate: 85, // TODO: Calculer la vraie assiduité
        progress_percentage: progressPercentage
      },
      exam_history,
      courses_attended: [], // TODO: Implémenter quand les données cours seront connectées
      milestones,
      next_steps,
      created_at: student.student_created_at,
      updated_at: student.student_updated_at || new Date().toISOString()
    };
  }

  /**
   * Détermine si un examen est réussi
   */
  private isExamPassed(score?: string): boolean {
    if (!score) return false;
    
    // Si c'est un niveau (A1, A2, B1, etc.), c'est considéré comme réussi
    if (/^[ABC][12]/.test(score.toUpperCase())) return true;
    
    // Si c'est une note sur 20
    const numericScore = this.extractNumericScore(score);
    if (numericScore !== null) return numericScore >= 10;
    
    // Si c'est "Réussi", "Validé", etc.
    const positiveKeywords = ['réussi', 'validé', 'acquis', 'obtenu', 'passed'];
    return positiveKeywords.some(keyword => 
      score.toLowerCase().includes(keyword)
    );
  }

  /**
   * Extrait le score numérique d'une chaîne de caractères
   */
  private extractNumericScore(score?: string): number | null {
    if (!score) return null;
    
    // Recherche d'un pattern comme "14/20", "16 sur 20", etc.
    const match = score.match(/(\d+)(?:\s*[\/sur]+\s*(\d+))?/);
    if (match) {
      const numerator = parseInt(match[1]);
      const denominator = match[2] ? parseInt(match[2]) : 20;
      
      // Conversion sur base 20
      return denominator === 20 ? numerator : Math.round((numerator / denominator) * 20);
    }
    
    return null;
  }

  /**
   * Extrait le niveau d'un score d'examen
   */
  private extractLevel(score?: string): string | undefined {
    if (!score) return undefined;
    
    const levelMatch = score.match(/[ABC][12]/i);
    return levelMatch ? levelMatch[0].toUpperCase() : undefined;
  }

  /**
   * Génère les jalons du parcours
   */
  private generateMilestones(student: any, examHistory: any[]): ProgressMilestone[] {
    const milestones: ProgressMilestone[] = [];

    // Jalon de début
    milestones.push({
      id: `start_${student.student_uuid}`,
      date: student.student_created_at,
      type: 'goal_achieved',
      title: 'Début du parcours',
      description: `Inscription en niveau ${student.frenchLevel?.french_level_code || 'A1'}`,
      status: 'completed'
    });

    // Jalons pour chaque examen réussi
    examHistory
      .filter(exam => exam.is_passed)
      .forEach((exam, index) => {
        milestones.push({
          id: `exam_${exam.exam_uuid}`,
          date: exam.exam_date,
          type: 'exam',
          title: `Examen réussi: ${exam.exam_label}`,
          description: exam.level_achieved ? `Niveau ${exam.level_achieved} atteint` : undefined,
          result: exam.exam_score,
          status: 'completed'
        });
      });

    return milestones.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Calcule le pourcentage de progression
   */
  private calculateProgressPercentage(student: any, examHistory: any[]): number {
    const currentLevel = student.frenchLevel?.french_level_code || 'A1';
    const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const currentIndex = levelOrder.indexOf(currentLevel);
    
    // Base: 15% par niveau atteint + bonus examens réussis
    const baseProgress = (currentIndex + 1) * 15;
    const examBonus = examHistory.filter(e => e.is_passed).length * 5;
    
    return Math.min(100, baseProgress + examBonus);
  }

  /**
   * Génère les prochaines étapes recommandées
   */
  private generateNextSteps(student: any, examHistory: any[], progress: number): any[] {
    const steps = [];
    const recentFailedExams = examHistory.filter(e => !e.is_passed).slice(0, 2);
    
    // Si échecs récents, recommander de repasser les examens
    recentFailedExams.forEach(exam => {
      steps.push({
        priority: 'high' as const,
        title: `Repasser l'examen "${exam.exam_label}"`,
        description: 'Examen échoué récemment, préparation recommandée'
      });
    });

    // Recommandations selon le niveau
    const currentLevel = student.frenchLevel?.french_level_code || 'A1';
    if (progress < 50) {
      steps.push({
        priority: 'medium' as const,
        title: 'Renforcer les bases',
        description: `Consolider le niveau ${currentLevel} avant de progresser`
      });
    } else if (progress >= 70) {
      const nextLevel = this.getNextLevel(currentLevel);
      if (nextLevel) {
        steps.push({
          priority: 'medium' as const,
          title: `Préparer le niveau ${nextLevel}`,
          description: `Progression vers le niveau supérieur recommandée`
        });
      }
    }

    return steps.slice(0, 3); // Limiter à 3 recommandations
  }

  /**
   * Détermine le niveau cible selon le niveau actuel
   */
  private determineTargetLevel(currentLevel?: string): string {
    const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const currentIndex = levelOrder.indexOf(currentLevel || 'A1');
    return levelOrder[Math.min(currentIndex + 1, levelOrder.length - 1)];
  }

  /**
   * Obtient le niveau suivant
   */
  private getNextLevel(currentLevel: string): string | null {
    const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const currentIndex = levelOrder.indexOf(currentLevel);
    return currentIndex < levelOrder.length - 1 ? levelOrder[currentIndex + 1] : null;
  }

  /**
   * Applique les filtres sur la liste des parcours
   */
  private applyFilters(progressList: StudentProgress[], filters: ProgressFilters): StudentProgress[] {
    let filtered = [...progressList];

    if (filters.level) {
      filtered = filtered.filter(p => p.current_french_level.code === filters.level);
    }

    if (filters.progress_range) {
      filtered = filtered.filter(p => 
        p.stats.progress_percentage >= filters.progress_range!.min &&
        p.stats.progress_percentage <= filters.progress_range!.max
      );
    }

    if (filters.search_term) {
      const term = filters.search_term.toLowerCase();
      filtered = filtered.filter(p => 
        p.student_firstname.toLowerCase().includes(term) ||
        p.student_lastname.toLowerCase().includes(term) ||
        (p.student_mail && p.student_mail.toLowerCase().includes(term))
      );
    }

    return filtered;
  }

  /**
   * Trie la liste des parcours
   */
  sortProgress(progressList: StudentProgress[], sortOptions: ProgressSortOptions): StudentProgress[] {
    const sorted = [...progressList];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortOptions.field) {
        case 'name':
          comparison = `${a.student_firstname} ${a.student_lastname}`
            .localeCompare(`${b.student_firstname} ${b.student_lastname}`);
          break;
        case 'progress':
          comparison = a.stats.progress_percentage - b.stats.progress_percentage;
          break;
        case 'level':
          const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
          const aIndex = levelOrder.indexOf(a.current_french_level.code);
          const bIndex = levelOrder.indexOf(b.current_french_level.code);
          comparison = aIndex - bIndex;
          break;
        case 'start_date':
          comparison = new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
          break;
        case 'last_exam':
          const aLastExam = a.exam_history[0]?.exam_date || a.start_date;
          const bLastExam = b.exam_history[0]?.exam_date || b.start_date;
          comparison = new Date(aLastExam).getTime() - new Date(bLastExam).getTime();
          break;
      }

      return sortOptions.direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }
} 