import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { GroupService } from '../../../../core/services/group.service';
import { SessionService } from '../../../../core/services/session.service';
import { Session } from '../../../../core/models/session.model';

@Component({
  selector: 'app-group-create',
  templateUrl: './group-create.component.html',
  styleUrls: ['./group-create.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule]
})
export class GroupCreateComponent implements OnInit {
  groupForm: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  isEditMode = false;
  groupId?: string | number;
  sessions: Session[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private groupService: GroupService,
    private sessionService: SessionService
  ) {
    this.groupForm = this.formBuilder.group({
      label: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
      session_id: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadSessions();
    
    // Vérifier si nous sommes en mode édition
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.groupId = params['id'];
        if (this.groupId !== undefined) {
          this.loadGroupDetails(this.groupId);
        }
      }
    });
  }

  loadSessions(): void {
    this.sessionService.getSessions().subscribe({
      next: (sessions) => {
        this.sessions = sessions;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des sessions', err);
        this.error = 'Impossible de charger les sessions. Veuillez réessayer plus tard.';
      }
    });
  }

  loadGroupDetails(id: string | number): void {
    this.loading = true;
    this.groupService.getGroupById(id).subscribe({
      next: (group) => {
        this.groupForm.patchValue({
          label: group.label,
          session_id: group.session_id
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des détails du groupe', err);
        this.error = 'Impossible de charger les détails du groupe. Veuillez réessayer plus tard.';
        this.loading = false;
      }
    });
  }

  get f() { return this.groupForm.controls; }

  onSubmit() {
    this.submitted = true;

    // Stop si formulaire invalide
    if (this.groupForm.invalid) {
      return;
    }

    this.loading = true;
    
    // Récupérer les données du formulaire
    const formValue = { ...this.groupForm.value };

    if (this.isEditMode && this.groupId) {
      // Mode édition
      this.groupService.updateGroup(this.groupId, formValue).subscribe({
        next: () => {
          this.router.navigate(['/dashboard/groups']);
        },
        error: (error) => {
          this.error = error?.error?.message || error?.message || 'Erreur lors de la mise à jour du groupe';
          this.loading = false;
        }
      });
    } else {
      // Mode création
      this.groupService.createGroup(formValue).subscribe({
        next: () => {
          this.router.navigate(['/dashboard/groups']);
        },
        error: (error) => {
          this.error = error?.error?.message || error?.message || 'Erreur lors de la création du groupe';
          this.loading = false;
        }
      });
    }
  }

  // Vérifie si le champ a été touché et est invalide
  isFieldInvalid(fieldName: string): boolean {
    const control = this.groupForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched || this.submitted));
  }

  // Réinitialise le formulaire
  resetForm() {
    this.groupForm.reset();
    this.submitted = false;
  }
}
