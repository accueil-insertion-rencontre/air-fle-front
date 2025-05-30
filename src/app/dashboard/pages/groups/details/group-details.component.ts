import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { GroupService } from '../../../../core/services/group.service';
import { Group } from '../../../../core/models/group.model';
import { AlertService } from '../../../../core/services/alert.service';

@Component({
  selector: 'app-group-details',
  templateUrl: './group-details.component.html',
  styleUrls: ['./group-details.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class GroupDetailsComponent implements OnInit {
  groupId!: string | number;
  group: Group | null = null;
  students: any[] = [];
  loading = true;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private groupService: GroupService,
    private alertService: AlertService
  ) {}
  
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        console.log('ID reçu dans la route:', params['id'], 'type:', typeof params['id']);
        
        // L'ID peut être soit un number soit un string (UUID)
        const rawId = params['id'];
        
        // Essayer de convertir en number si c'est numérique
        if (!isNaN(+rawId) && rawId !== '') {
          this.groupId = +rawId;
          console.log('ID converti en number:', this.groupId);
        } else {
          this.groupId = rawId;
          console.log('ID gardé comme string:', this.groupId);
        }
        
        this.loadGroup();
      }
    });
  }
  
  loadGroup(): void {
    console.log('loadGroup appelée avec groupId:', this.groupId, 'type:', typeof this.groupId);
    
    // Pour l'API, on utilise l'ID tel quel
    const apiId = this.groupId;
    console.log('apiId à envoyer:', apiId);
    
    this.groupService.getGroupById(apiId).subscribe({
      next: (data) => {
        console.log('Données de groupe reçues:', data);
        this.group = data;
        this.loading = false;
        
        // Si le groupe a des étudiants, on les récupère
        if (this.group.students) {
          this.students = this.group.students;
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement du groupe', err);
        this.loading = false;
      }
    });
  }
  
  formatDate(date: any): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  deleteGroup(): void {
    if (!this.group) return;
    
    this.alertService.confirm(
      `Êtes-vous sûr de vouloir supprimer le groupe "${this.group.label}" ?\n\n` +
      'Cette action est irréversible et supprimera également tous les étudiants associés.',
      'Supprimer le groupe'
    ).then((confirmed) => {
      if (confirmed) {
        this.groupService.deleteGroup(this.groupId).subscribe({
          next: () => {
            this.alertService.success('Groupe supprimé avec succès !').then(() => {
              this.router.navigate(['/dashboard/groups']);
            });
          },
          error: (err) => {
            console.error('Erreur lors de la suppression du groupe', err);
            this.alertService.error('Erreur lors de la suppression. Veuillez réessayer.');
          }
        });
      }
    });
  }
} 