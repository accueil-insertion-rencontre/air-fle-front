import { Component, AfterViewInit, OnInit, NgZone, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { StudentService } from '../apprenants/services/student.service';
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
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  private studentCountSubscription?: Subscription;

  // Cartes statistiques
  statCards: StatCard[] = [
    { title: 'Apprenants', value: '0', change: null, icon: 'user', color: '#4fd1c5' },
    { title: 'Adresses', value: 'Aucune donnée', change: null, icon: 'map-pin', color: '#4fd1c5' },
    { title: 'Période', value: 'Aucune donnée', change: null, icon: 'calendar', color: '#4fd1c5' },
    { title: 'Taux de Réussite', value: 'Aucune donnée', change: null, icon: 'bar-chart-2', color: '#4fd1c5' }
  ];

  // Données pour le graphique (vide pour l'instant)
  chartData = {
    labels: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
    datasets: []
  };

  // Liste des tâches (vide)
  todoItems: any[] = [];

  // Modules de la journée (vide)
  todayModules: any[] = [];

  constructor(
    private router: Router, 
    private ngZone: NgZone,
    private studentService: StudentService
  ) {}
  
  ngOnInit() {
    // S'abonner aux événements de navigation pour mettre à jour les icônes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        setTimeout(() => {
          this.initFeatherIcons();
        }, 100);
      });

    // S'abonner au nombre d'étudiants
    this.studentCountSubscription = this.studentService.getStudentCount()
      .subscribe(count => {
        this.statCards[0].value = count.toString();
      });
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
} 