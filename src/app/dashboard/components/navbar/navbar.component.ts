import { AuthService } from '@core/services';

import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';
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
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  @Input() userName: string = '';
  @Input() pageTitle: string = 'Index';
  @Input() breadcrumbs: BreadcrumbItem[] = [
    { label: 'Général', path: '/dashboard' },
    { label: 'Utilisateurs', active: true },
  ];

  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() openTicket = new EventEmitter<void>();
  @Output() openReleaseNotes = new EventEmitter<void>();

  showUserMenu: boolean = false;
  currentUserId: string = '';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Obtenir l'ID de l'utilisateur connecté
    this.authService.currentUser$.subscribe(user => {
      if (user && user.user_uuid) {
        this.currentUserId = user.user_uuid;
      }
    });
  }

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
