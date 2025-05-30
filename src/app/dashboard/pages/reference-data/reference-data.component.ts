import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ReferenceDataType, ReferenceDataConfig } from './models/reference-data.model';

@Component({
  selector: 'app-reference-data',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './reference-data.component.html',
  styleUrls: ['./reference-data.component.scss']
})
export class ReferenceDataComponent implements OnInit, OnDestroy {
  
  isChildRouteActive = false;
  private routerSubscription: Subscription | null = null;

  // Configuration de chaque type de données de référence
  referenceDataConfigs: ReferenceDataConfig[] = [
    {
      type: ReferenceDataType.NATIONALITIES,
      endpoint: 'nationalities',
      displayName: 'Nationalités',
      icon: '🌍',
      columns: [
        { key: 'label', label: 'Libellé', sortable: true }
      ]
    },
    {
      type: ReferenceDataType.FRENCH_LEVELS,
      endpoint: 'french-levels',
      displayName: 'Niveaux de Français',
      icon: '📚',
      columns: [
        { key: 'code', label: 'Code', sortable: true },
        { key: 'description', label: 'Description', sortable: true }
      ]
    },
    {
      type: ReferenceDataType.GENDERS,
      endpoint: 'genders',
      displayName: 'Genres',
      icon: '👥',
      columns: [
        { key: 'label', label: 'Libellé', sortable: true }
      ]
    },
    {
      type: ReferenceDataType.EXIT_REASONS,
      endpoint: 'exit-reasons',
      displayName: 'Raisons de Sortie',
      icon: '📤',
      columns: [
        { key: 'reason', label: 'Raison', sortable: true }
      ]
    },
    {
      type: ReferenceDataType.ORIENTATIONS,
      endpoint: 'orientations',
      displayName: 'Orientations',
      icon: '🎯',
      columns: [
        { key: 'type', label: 'Type', sortable: true },
        { key: 'description', label: 'Description', sortable: false }
      ]
    },
    {
      type: ReferenceDataType.STATUSES,
      endpoint: 'statuses',
      displayName: 'Statuts',
      icon: '📊',
      columns: [
        { key: 'label', label: 'Libellé', sortable: true }
      ]
    },
    {
      type: ReferenceDataType.FINANCINGS,
      endpoint: 'financings',
      displayName: 'Types de Financement',
      icon: '💰',
      columns: [
        { key: 'type', label: 'Type', sortable: true }
      ]
    },
    {
      type: ReferenceDataType.DISABILITIES,
      endpoint: 'disabilities',
      displayName: 'Handicaps',
      icon: '♿',
      columns: [
        { key: 'label', label: 'Libellé', sortable: true },
        { key: 'description', label: 'Description', sortable: false }
      ]
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Vérifier l'état initial
    this.checkChildRouteStatus();
    
    // Écouter les changements de navigation
    this.routerSubscription = this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkChildRouteStatus();
    });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  // Vérifier si on est dans une route enfant
  private checkChildRouteStatus(): void {
    const url = this.router.url;
    this.isChildRouteActive = url !== '/dashboard/reference-data' && url.startsWith('/dashboard/reference-data/');
  }

  // Navigation vers une section spécifique
  navigateToSection(config: ReferenceDataConfig): void {
    this.router.navigate(['/dashboard/reference-data', config.type]);
  }
} 