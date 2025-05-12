import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface BreadcrumbItem {
  label: string;
  path?: string;
  active?: boolean;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  @Input() userName: string = 'messaoud.houri@outlook.fr';
  @Input() pageTitle: string = 'Index';
  @Input() breadcrumbs: BreadcrumbItem[] = [
    { label: 'Général', path: '/dashboard' },
    { label: 'Utilisateurs', active: true }
  ];
  
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() openTicket = new EventEmitter<void>();
  @Output() openReleaseNotes = new EventEmitter<void>();
  
  showUserMenu: boolean = false;
  
  constructor() {}
  
  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }
  
  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }
  
  closeUserMenu(): void {
    this.showUserMenu = false;
  }
  
  logout(): void {
    // Logique de déconnexion à implémenter
    console.log('Déconnexion...');
    this.closeUserMenu();
    // Rediriger vers la page de connexion
    // this.router.navigate(['/auth']);
  }
  
  onOpenTicket(): void {
    this.openTicket.emit();
  }
  
  onOpenReleaseNotes(): void {
    this.openReleaseNotes.emit();
  }
} 