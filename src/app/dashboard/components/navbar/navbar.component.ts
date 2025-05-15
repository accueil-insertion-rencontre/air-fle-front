import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

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
  @Input() userName: string = '';
  @Input() pageTitle: string = 'Index';
  @Input() breadcrumbs: BreadcrumbItem[] = [
    { label: 'Général', path: '/dashboard' },
    { label: 'Utilisateurs', active: true }
  ];
  
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() openTicket = new EventEmitter<void>();
  @Output() openReleaseNotes = new EventEmitter<void>();
  
  showUserMenu: boolean = false;
  
  constructor(private authService: AuthService) {}
  
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
    console.log('Déconnexion initiée depuis le composant navbar');
    this.closeUserMenu();
    this.authService.logout();
  }
  
  onOpenTicket(): void {
    this.openTicket.emit();
  }
  
  onOpenReleaseNotes(): void {
    this.openReleaseNotes.emit();
  }
} 