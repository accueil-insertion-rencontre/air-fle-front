import { AlertService, GroupService, SessionService } from '@core/services';

import { Session } from '@core/models';

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

declare var bootstrap: any;

@Component({
  selector: 'app-session-details',
  templateUrl: './session-details.component.html',
  styleUrls: ['./session-details.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
})
export class SessionDetailsComponent implements OnInit {
  sessionId!: string | number;
  session: Session | null = null;
  groups: any[] = [];
  loading = true;

  // Propriétés pour la modal de création de groupe
  groupForm: FormGroup;
  groupLoading = false;
  error = '';
  submitted = false;
  modal: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sessionService: SessionService,
    private groupService: GroupService,
    private formBuilder: FormBuilder,
    private alertService: AlertService
  ) {
    // Initialiser le formulaire de groupe
    this.groupForm = this.formBuilder.group({
      label: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        console.log(
          'ID de session reçu dans la route:',
          params['id'],
          'type:',
          typeof params['id']
        );

        // L'ID peut être soit un number soit un string (UUID)
        const rawId = params['id'];

        // Essayer de convertir en number si c'est numérique
        if (!isNaN(+rawId) && rawId !== '') {
          this.sessionId = +rawId;
          console.log('ID de session converti en number:', this.sessionId);
        } else {
          this.sessionId = rawId;
          console.log('ID de session gardé comme string:', this.sessionId);
        }

        this.loadSession();
      }
    });
  }

  loadSession(): void {
    console.log(
      'loadSession appelée avec sessionId:',
      this.sessionId,
      'type:',
      typeof this.sessionId
    );

    // Pour l'API, on utilise l'ID tel quel
    const apiId = this.sessionId;
    console.log('apiId de session à envoyer:', apiId);

    this.sessionService.getSessionById(apiId as number).subscribe({
      next: data => {
        console.log('Données de session reçues:', data);
        this.session = data;

        // Utiliser les groupes inclus dans la session
        if (this.session.groups) {
          this.groups = this.session.groups;
          console.log('Groupes extraits de la session:', this.groups);
        } else {
          this.groups = [];
          console.log('Aucun groupe trouvé dans la session');
        }

        this.loading = false;
      },
      error: err => {
        console.error('Erreur lors du chargement de la session', err);
        this.loading = false;
      },
    });
  }

  // Convertit une date au format string en objet Date
  parseDate(dateValue: string | Date | undefined): Date | null {
    if (!dateValue) return null;

    if (typeof dateValue === 'string') {
      return new Date(dateValue);
    }

    return dateValue;
  }

  // Calcule le nombre de jours entre deux dates
  calculateDuration(): number {
    const startedAt = this.session?.session_started_at || this.session?.started_at;
    const finishedAt = this.session?.session_finished_at || this.session?.finished_at;
    
    if (!startedAt || !finishedAt) return 0;

    const startDate = new Date(startedAt);
    const endDate = new Date(finishedAt);

    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  // Calcule le nombre total d'étudiants dans tous les groupes de la session
  getTotalStudents(): number {
    return this.groups.reduce((total, group) => {
      return total + (group.students ? group.students.length : 0);
    }, 0);
  }

  // Méthodes pour la modal de création de groupe
  openCreateGroupModal(): void {
    this.error = '';
    this.submitted = false;
    this.groupForm.reset();

    // Initialiser la modal Bootstrap
    const modalElement = document.getElementById('createGroupModal');
    if (modalElement) {
      this.modal = new bootstrap.Modal(modalElement);
      this.modal.show();
    }
  }

  onSubmitGroup(): void {
    this.submitted = true;
    this.error = '';

    if (this.groupForm.invalid) {
      return;
    }

    this.groupLoading = true;

    // Préparer les données avec la session pré-sélectionnée (API format)
    const groupData = {
      group_label: this.groupForm.value.label,
      session_uuid: this.session?.session_uuid || this.sessionId,
    };



    this.groupService.createGroup(groupData).subscribe({
      next: response => {
        this.groupLoading = false;
        this.modal.hide();

        // Recharger la session pour récupérer les groupes mis à jour
        this.loadSession();
      },
      error: error => {
        this.error =
          error?.error?.message ||
          error?.message ||
          'Une erreur est survenue lors de la création du groupe';
        this.groupLoading = false;
      },
    });
  }

  // Vérifie si un champ du formulaire est invalide
  isFieldInvalid(fieldName: string): boolean {
    const control = this.groupForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched || this.submitted));
  }

  deleteSession(): void {
    if (!this.session) return;

    this.alertService
      .confirm(
        `Êtes-vous sûr de vouloir supprimer la session "${this.session.session_label || this.session.label}" ?\n\n` +
          'Cette action est irréversible et supprimera également tous les groupes et étudiants associés.',
        'Supprimer la session'
      )
      .then(confirmed => {
        if (confirmed) {
          this.sessionService.deleteSession(this.sessionId).subscribe({
            next: () => {
              this.alertService.success('Session supprimée avec succès !').then(() => {
                this.router.navigate(['/dashboard/sessions']);
              });
            },
            error: err => {
              console.error('Erreur lors de la suppression de la session', err);
              this.alertService.error('Erreur lors de la suppression. Veuillez réessayer.');
            },
          });
        }
      });
  }
}
