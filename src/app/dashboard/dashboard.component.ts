import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { Subscription } from 'rxjs';

interface BreadcrumbItem {
  label: string;
  path?: string;
  active?: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, NavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  isSidebarOpen = true;
  isMobile = false;
  readonly mobileBreakpoint = 768;
  readonly smallScreenBreakpoint = 480;
  private routerSubscription: Subscription | null = null;
  
  userName = 'messaoud.houri@outlook.fr';
  pageTitle = 'Index';
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Général', path: '/dashboard' },
    { label: 'Utilisateurs', active: true }
  ];

  constructor(private router: Router) {
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < this.smallScreenBreakpoint;
    
    // Seulement changer l'état si on passe de mobile à desktop ou vice versa
    if (wasMobile !== this.isMobile) {
      if (this.isMobile) {
        // Passer en mode mobile - fermer la sidebar
        this.isSidebarOpen = false;
      } else {
        // Passer en mode desktop - ouvrir la sidebar
        this.isSidebarOpen = true;
      }
    }
  }

  ngOnInit(): void {
    // Initialiser la route active au chargement
    this.updateBreadcrumbs();
    
    // S'abonner aux changements de route
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateBreadcrumbs();
      
      // Fermer la sidebar sur changement de route en mode mobile
      if (this.isMobile) {
        this.isSidebarOpen = false;
      }
    });
  }
  
  ngOnDestroy(): void {
    // Nettoyer l'abonnement au router
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  toggleSidebar(): void {
    // Permettre le toggle quand le bouton est visible et cliqué
    this.isSidebarOpen = !this.isSidebarOpen;
  }
  
  handleOpenTicket(): void {
    console.log('Ouverture d\'un ticket');
    // Implémenter la logique d'ouverture de ticket
    // Par exemple, ouvrir un modal ou naviguer vers une page de ticket
    // this.router.navigate(['/dashboard/ticket/new']);
  }
  
  handleOpenReleaseNotes(): void {
    console.log('Ouverture des notes de mise à jour');
    // Implémenter la logique d'ouverture des notes de mise à jour
    // Par exemple, ouvrir un modal ou naviguer vers une page de notes
    // this.router.navigate(['/dashboard/release-notes']);
  }
  
  private updateBreadcrumbs(): void {
    // Ici, vous pouvez implémenter une logique pour mettre à jour 
    // dynamiquement le fil d'Ariane en fonction de la route actuelle
    const url = this.router.url;
    
    if (url.includes('/users')) {
      this.pageTitle = 'Utilisateurs';
      this.breadcrumbs = [
        { label: 'Général', path: '/dashboard' },
        { label: 'Utilisateurs', active: true }
      ];
    } else if (url.includes('/profile')) {
      this.pageTitle = 'Profil';
      this.breadcrumbs = [
        { label: 'Général', path: '/dashboard' },
        { label: 'Profil', active: true }
      ];
    } else if (url.includes('/apprenants')) {
      this.pageTitle = 'Apprenants';
      this.breadcrumbs = [
        { label: 'Général', path: '/dashboard' },
        { label: 'Apprenants', active: true }
      ];
    } else if (url.includes('/periodes')) {
      this.pageTitle = 'Périodes';
      this.breadcrumbs = [
        { label: 'Général', path: '/dashboard' },
        { label: 'Périodes', active: true }
      ];
    } else if (url.includes('/heures')) {
      this.pageTitle = 'Heures travaillées';
      this.breadcrumbs = [
        { label: 'Général', path: '/dashboard' },
        { label: 'Heures travaillées', active: true }
      ];
    } else if (url.includes('/adresses')) {
      this.pageTitle = 'Adresses';
      this.breadcrumbs = [
        { label: 'Général', path: '/dashboard' },
        { label: 'Adresses', active: true }
      ];
    } else if (url.includes('/examens')) {
      this.pageTitle = 'Examens';
      this.breadcrumbs = [
        { label: 'Général', path: '/dashboard' },
        { label: 'Examens', active: true }
      ];
    } else if (url.includes('/parcours')) {
      this.pageTitle = 'Suivi de parcours';
      this.breadcrumbs = [
        { label: 'Général', path: '/dashboard' },
        { label: 'Suivi de parcours', active: true }
      ];
    } else {
      this.pageTitle = 'Dashboard';
      this.breadcrumbs = [
        { label: 'Général', active: true }
      ];
    }
  }
} 