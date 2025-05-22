import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService } from '../user.service';
import { User } from '../models/user';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {
  user: User | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const userId = params.get('id');
      if (userId) {
        this.loadUser(userId);
      } else {
        this.error = 'ID utilisateur manquant';
        this.loading = false;
      }
    });
  }

  loadUser(id: string): void {
    this.loading = true;
    this.error = null;
    
    this.userService.getUserById(id).subscribe({
      next: (user) => {
        this.user = user;
        if (this.user.birthdate) {
          this.user.age = this.calculateAge(this.user.birthdate);
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = `Erreur: ${error.message || 'Impossible de charger les détails de l\'utilisateur'}`;
        this.loading = false;
      }
    });
  }

  calculateAge(birthdate: string): number {
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  getInitials(firstName?: string, lastName?: string): string {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  }

  goBack(): void {
    this.router.navigate(['dashboard', 'users']);
  }
}
