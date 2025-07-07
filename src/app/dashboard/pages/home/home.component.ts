import { Component, AfterViewInit, OnInit, NgZone, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import {
  StudentService,
  TodolistService,
  TodoTask,
  CreateTodoRequest,
  TodoStats,
  CreateTodoWithSubtasksRequest,
  Subtask,
} from '@core/services';
import { CreateTodoModalComponent } from '../../components/create-todo-modal/create-todo-modal.component';
import { TodoItemComponent } from '../../components/todo-item/todo-item.component';
import { Subscription } from 'rxjs';

declare var feather: any;

interface StatCard {
  title: string;
  value: string;
  change: number | null;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, CreateTodoModalComponent, TodoItemComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  private studentCountSubscription?: Subscription;
  private todoSubscription?: Subscription;

  // Cartes statistiques
  statCards: StatCard[] = [
    { title: 'Apprenants', value: '0', change: null, icon: 'user', color: '#4fd1c5' },
    { title: 'Adresses', value: 'Aucune donnée', change: null, icon: 'map-pin', color: '#4fd1c5' },
    { title: 'Période', value: 'Aucune donnée', change: null, icon: 'calendar', color: '#4fd1c5' },
    {
      title: 'Taux de Réussite',
      value: 'Aucune donnée',
      change: null,
      icon: 'bar-chart-2',
      color: '#4fd1c5',
    },
  ];

  // Données pour le graphique (vide pour l'instant)
  chartData = {
    labels: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
    datasets: [],
  };

  // Todo list
  todoItems: TodoTask[] = [];
  todoStats: TodoStats = { total: 0, completed: 0, pending: 0 };
  isLoadingTodos = false;
  todoError: string | null = null;

  // Modal
  isCreateModalOpen = false;
  isCreatingTodo = false;

  // Filtres
  activeFilter: 'all' | 'pending' | 'in_progress' | 'completed' = 'all';
  showFilters = false;

  // Modules de la journée (vide)
  todayModules: any[] = [];

  constructor(
    private router: Router,
    private ngZone: NgZone,
    private studentService: StudentService,
    private todolistService: TodolistService
  ) {}

  ngOnInit() {
    // S'abonner aux événements de navigation pour mettre à jour les icônes
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
      setTimeout(() => {
        this.initFeatherIcons();
      }, 100);
    });

    // S'abonner au nombre d'étudiants
    this.studentCountSubscription = this.studentService.getStudentCount().subscribe(count => {
      this.statCards[0].value = count.toString();
    });

    // Charger les tâches
    this.loadTodos();
  }

  ngAfterViewInit() {
    // Initialiser les icônes après le rendu de la vue
    setTimeout(() => {
      this.initFeatherIcons();
    }, 0);
  }

  ngOnDestroy() {
    if (this.studentCountSubscription) {
      this.studentCountSubscription.unsubscribe();
    }
    if (this.todoSubscription) {
      this.todoSubscription.unsubscribe();
    }
  }

  initFeatherIcons() {
    try {
      if (typeof feather !== 'undefined') {
        this.ngZone.runOutsideAngular(() => {
          feather.replace();
        });
      }
    } catch (error) {
      // Gestion silencieuse de l'erreur
    }
  }

  // Méthodes Todo List
  loadTodos() {
    this.isLoadingTodos = true;
    this.todoError = null;

    this.todoSubscription = this.todolistService.getTodolists().subscribe({
      next: todos => {
        this.todoItems = Array.isArray(todos) ? todos : [];
        this.todoStats = this.todolistService.calculateStats(this.todoItems);
        this.isLoadingTodos = false;
      },
      error: error => {
        this.todoError = 'Erreur lors du chargement des tâches';
        this.todoItems = [];
        this.isLoadingTodos = false;
      },
    });
  }

  openCreateModal() {
    this.isCreateModalOpen = true;
  }

  closeCreateModal() {
    this.isCreateModalOpen = false;
  }

  /**
   * Nettoie les données brutes pour créer un objet sûr à envoyer à l'API
   */
  private sanitizeTodoData(rawData: any): CreateTodoWithSubtasksRequest {
    return {
      title: String(rawData?.title || '').trim(),
      description: rawData?.description ? String(rawData.description).trim() : undefined,
      subtasks: Array.isArray(rawData?.subtasks)
        ? rawData.subtasks
            .map((subtask: any) => ({
              title: String(subtask?.title || '').trim(),
              description: subtask?.description ? String(subtask.description).trim() : undefined,
            }))
            .filter((subtask: any) => subtask.title.length > 0)
        : [],
    };
  }

  /**
   * Valide les données nettoyées
   */
  private validateTodoData(data: CreateTodoWithSubtasksRequest): boolean {
    return !!(data.title && data.subtasks.length > 0);
  }

  onCreateTodo(todoData: any) {
    const cleanData = this.sanitizeTodoData(todoData);

    if (!this.validateTodoData(cleanData)) {
      this.todoError = 'Données invalides: titre et sous-tâches requis';
      return;
    }

    this.isCreatingTodo = true;
    this.todoError = null;

    this.todolistService.createTodoWithSubtasks(cleanData).subscribe({
      next: newTask => {
        this.loadTodos();
        this.closeCreateModal();
      },
      error: error => {
        this.todoError = 'Erreur lors de la création de la tâche';
        this.isCreatingTodo = false;
      },
    });
  }

  onSubtaskUpdated(event: { subtaskId: string; updatedSubtask: TodoTask | Subtask }) {
    // Trouver la tâche parente qui contient cette sous-tâche
    this.todoItems.forEach(parentTask => {
      if (parentTask.subtasks) {
        const subtaskIndex = parentTask.subtasks.findIndex(st => st.id === event.subtaskId);
        if (subtaskIndex !== -1) {
          // Mettre à jour la sous-tâche
          parentTask.subtasks[subtaskIndex] = event.updatedSubtask as any;

          // Recalculer les stats localement
          this.updateParentTaskStats(parentTask);
        }
      }
    });

    // Mettre à jour les statistiques globales
    this.todoStats = this.todolistService.calculateStats(this.todoItems);
  }

  private updateParentTaskStats(parentTask: TodoTask) {
    if (!parentTask.subtasks || parentTask.subtasks.length === 0) return;

    const totalSubtasks = parentTask.subtasks.length;
    const completedSubtasks = parentTask.subtasks.filter(st => st.status === 'completed').length;
    const pendingSubtasks = totalSubtasks - completedSubtasks;

    // Mettre à jour les statistics (nouvelle structure)
    parentTask.statistics = {
      total: totalSubtasks,
      completed: completedSubtasks,
      pending: pendingSubtasks,
      completionPercentage: Math.round((completedSubtasks / totalSubtasks) * 100),
    };

    // Calculer le pourcentage de complétion
    parentTask.completionPercentage = Math.round((completedSubtasks / totalSubtasks) * 100);

    // Déterminer le statut de la tâche parente
    if (completedSubtasks === 0) {
      parentTask.status = 'pending';
    } else if (completedSubtasks === totalSubtasks) {
      parentTask.status = 'completed';
    } else {
      parentTask.status = 'in_progress';
    }
  }

  get parentTasks(): TodoTask[] {
    if (!Array.isArray(this.todoItems)) return [];

    // Toutes les tâches retournées par l'API sont des tâches principales
    let tasks = this.todoItems;

    // Appliquer le filtre
    if (this.activeFilter !== 'all') {
      tasks = tasks.filter(task => task.status === this.activeFilter);
    }

    return tasks;
  }

  // Méthodes pour les filtres
  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  setFilter(filter: 'all' | 'pending' | 'in_progress' | 'completed') {
    this.activeFilter = filter;
    this.showFilters = false;
  }

  getFilterIcon(): string {
    switch (this.activeFilter) {
      case 'pending':
        return '🕒';
      case 'in_progress':
        return '⚡';
      case 'completed':
        return '✅';
      default:
        return '📋';
    }
  }

  getFilterLabel(): string {
    switch (this.activeFilter) {
      case 'pending':
        return 'Pas commencé';
      case 'in_progress':
        return 'En cours';
      case 'completed':
        return 'Terminé';
      default:
        return 'Toutes';
    }
  }

  getFilteredTasksCount(): number {
    return this.parentTasks.length;
  }

  getAllTasksCount(): number {
    return Array.isArray(this.todoItems) ? this.todoItems.length : 0;
  }

  getPendingTasksCount(): number {
    return Array.isArray(this.todoItems)
      ? this.todoItems.filter(t => t.status === 'pending').length
      : 0;
  }

  getInProgressTasksCount(): number {
    return Array.isArray(this.todoItems)
      ? this.todoItems.filter(t => t.status === 'in_progress').length
      : 0;
  }

  getCompletedTasksCount(): number {
    return Array.isArray(this.todoItems)
      ? this.todoItems.filter(t => t.status === 'completed').length
      : 0;
  }
}
