import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  active: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  @Input() isOpen: boolean = true;
  @Output() isOpenChange = new EventEmitter<boolean>();
  
  menuItems: MenuItem[] = [
    { 
      label: 'Dashboard', 
      icon: 'dashboard-icon', 
      route: '/dashboard', 
      active: false 
    },
    { 
      label: 'Apprenants', 
      icon: 'students-icon', 
      route: '/dashboard/apprenants', 
      active: false 
    },
    { 
      label: 'Utilisateurs', 
      icon: 'users-icon', 
      route: '/dashboard/users', 
      active: false 
    },
    { 
      label: 'Périodes', 
      icon: 'periods-icon', 
      route: '/dashboard/periodes', 
      active: false 
    },
    { 
      label: 'Heures travaillées', 
      icon: 'hours-icon', 
      route: '/dashboard/heures', 
      active: false 
    },
    { 
      label: 'Adresses', 
      icon: 'address-icon', 
      route: '/dashboard/adresses', 
      active: false 
    },
    { 
      label: 'Examens', 
      icon: 'exam-icon', 
      route: '/dashboard/examens', 
      active: false 
    },
    { 
      label: 'Suivi de parcours', 
      icon: 'progress-icon', 
      route: '/dashboard/parcours', 
      active: false 
    },
    { 
      label: 'Profil', 
      icon: 'profile-icon', 
      route: '/dashboard/profile', 
      active: false 
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Initialiser la route active au chargement
    this.setActiveRoute(this.router.url);
    
    // S'abonner aux changements de route
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.setActiveRoute(event.url);
    });
  }

  // Définir la route active
  setActiveRoute(url: string): void {
    this.menuItems.forEach(item => {
      // Marquer comme actif si la route correspond exactement ou si c'est une sous-route
      item.active = url === item.route || 
                    (item.route !== '/dashboard' && url.startsWith(item.route));
    });
  }
  
  // Toggle la sidebar et émet l'événement au composant parent
  toggleSidebar(): void {
    this.isOpen = !this.isOpen;
    this.isOpenChange.emit(this.isOpen);
  }
} 