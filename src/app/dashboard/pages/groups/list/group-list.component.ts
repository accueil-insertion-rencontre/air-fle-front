import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Group } from '../../../../core/models/group.model';
import { GroupService } from '../../../../core/services/group.service';
import { SessionService } from '../../../../core/services/session.service';
import { Session } from '../../../../core/models/session.model';
import { AlertService } from '../../../../core/services/alert.service';

// Déclaration de jQuery qui est maintenant disponible globalement
declare var $: any;
declare var bootstrap: any;

@Component({
  selector: 'app-group-list',
  templateUrl: './group-list.component.html',
  styleUrls: ['./group-list.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule]
})
export class GroupListComponent implements OnInit, AfterViewInit {
  groups: Group[] = [];
  sessions: Session[] = [];
  loading = true;
  groupForm: FormGroup;
  submitted = false;
  error = '';
  modal: any;

  constructor(
    private groupService: GroupService, 
    private sessionService: SessionService,
    private formBuilder: FormBuilder,
    private alertService: AlertService
  ) {
    this.groupForm = this.formBuilder.group({
      label: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
      session_id: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadGroups();
    this.loadSessions();
  }

  ngAfterViewInit(): void {
    this.initializeTable();
    // Initialiser le modal
    const modalElement = document.getElementById('createGroupModal');
    if (modalElement) {
      this.modal = new bootstrap.Modal(modalElement);
    }
  }

  loadGroups(): void {
    this.loading = true;
    this.groupService.getGroups().subscribe({
      next: (groups) => {
        this.groups = groups;
        this.loading = false;
        
        // Initialiser ou rafraîchir le tableau après chargement des données
        setTimeout(() => {
          if ($('#groupTable').bootstrapTable) {
            $('#groupTable').bootstrapTable('refreshOptions', {
              data: this.groups
            });
          }
        }, 0);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des groupes', err);
        this.loading = false;
      }
    });
  }

  loadSessions(): void {
    this.sessionService.getSessions().subscribe({
      next: (sessions) => {
        this.sessions = sessions;
        // Log détaillé pour comprendre la structure
        console.log('Sessions chargées:', sessions);
        if (sessions.length > 0) {
          console.log('Exemple de session:', sessions[0]);
          console.log('session_id:', sessions[0].session_id);
          console.log('id:', sessions[0].id);
          console.log('sessionId:', sessions[0].sessionId);
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement des sessions', err);
        this.error = 'Impossible de charger les sessions. Veuillez réessayer plus tard.';
      }
    });
  }

  openCreateModal(): void {
    this.resetForm();
    this.modal.show();
  }

  initializeTable(): void {
    setTimeout(() => {
      $('#groupTable').bootstrapTable({
        search: true,
        searchAlign: 'right',
        pagination: true,
        pageSize: 10,
        pageList: [10, 25, 50, 100, 'all'],
        sortable: true,
        showRefresh: true,
        showToggle: true,
        showColumns: true,
        showExport: true,
        buttonsPrefix: 'btn',
        buttonsClass: 'btn-sm',
        iconsPrefix: 'fas',
        icons: {
          refresh: 'fa-sync',
          toggleOn: 'fa-table-cells',
          toggleOff: 'fa-table-list',
          columns: 'fa-columns',
          export: 'fa-download',
          paginationSwitchDown: 'fa-caret-down',
          paginationSwitchUp: 'fa-caret-up',
          detailOpen: 'fa-plus',
          detailClose: 'fa-minus'
        },
        classes: 'table table-bordered table-hover',
        theadClasses: 'thead-light',
        headerStyle: function(): { css: Record<string, string> } {
          return {
            css: { 
              'font-weight': 'bold',
              'text-transform': 'uppercase',
              'font-size': '0.75rem'
            }
          };
        },
        columns: [
          { 
            field: 'group_id', 
            title: 'ID',
            sortable: true,
            align: 'center',
            width: 80,
            visible: false
          },
          { 
            field: 'label', 
            title: 'Label',
            sortable: true
          },
          { 
            field: 'session', 
            title: 'Session',
            sortable: true,
            formatter: (value: any) => {
              return value?.label || 'AUTRES FORMATIONS PROFESSIONNELLES';
            }
          },
          { 
            field: 'student_count', 
            title: 'Étudiants',
            align: 'center',
            width: 100,
            formatter: (value: any, row: Group) => {
              return row.students ? row.students.length : 0;
            }
          },
          {
            field: 'operate',
            title: 'Actions',
            align: 'center',
            width: 120,
            clickToSelect: false,
            formatter: this.operateFormatter
          }
        ],
        data: this.groups,
        locale: 'fr-FR',
        formatShowingRows: function (pageFrom: number, pageTo: number, totalRows: number): string {
          return `Affiche de ${pageFrom} à ${pageTo} sur ${totalRows} lignes`;
        },
        formatRecordsPerPage: function(pageNumber: number): string {
          return `${pageNumber} lignes par page`;
        },
        formatNoMatches: function(): string {
          return 'Aucun résultat trouvé';
        }
      });

      // Gérer les clics sur les boutons d'action
      $(document).on('click', '.btn-group-view', (e: Event) => {
        const id = $(e.target).closest('button').data('id');
        window.location.href = `/dashboard/groups/${id}`;
      });
      
      $(document).on('click', '.btn-group-edit', (e: Event) => {
        const id = $(e.target).closest('button').data('id');
        window.location.href = `/dashboard/groups/edit/${id}`;
      });
      
      $(document).on('click', '.btn-group-delete', (e: Event) => {
        const id = $(e.target).closest('button').data('id');
        this.deleteGroup(id);
      });
    }, 0);
  }

  dateFormatter(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleDateString('fr-FR');
  }

  operateFormatter(value: any, row: any): string {
    return [
      `<div class="btn-group" role="group">`,
      `<button type="button" class="btn btn-sm btn-info btn-group-view" data-id="${row.group_id}">`,
      `<i class="fas fa-eye"></i>`,
      `</button>`,
      `<button type="button" class="btn btn-sm btn-warning btn-group-edit" data-id="${row.group_id}">`,
      `<i class="fas fa-edit"></i>`,
      `</button>`,
      `<button type="button" class="btn btn-sm btn-danger btn-group-delete" data-id="${row.group_id}">`,
      `<i class="fas fa-trash"></i>`,
      `</button>`,
      `</div>`
    ].join('');
  }

  deleteGroup(id: string | number): void {
    this.alertService.confirm(
      'Êtes-vous sûr de vouloir supprimer ce groupe ?\n\n' +
      'Cette action est irréversible et supprimera également tous les étudiants associés.'
    ).then((confirmed) => {
      if (confirmed) {
        this.groupService.deleteGroup(id).subscribe({
          next: () => {
            this.groups = this.groups.filter(g => g.group_id !== id);
            if ($('#groupTable').bootstrapTable) {
              $('#groupTable').bootstrapTable('load', this.groups);
            }
            this.alertService.success('Groupe supprimé avec succès !');
          },
          error: (err) => {
            console.error('Erreur lors de la suppression du groupe', err);
            this.alertService.error('Erreur lors de la suppression. Veuillez réessayer.');
          }
        });
      }
    });
  }

  // Méthodes pour le formulaire
  get f() { return this.groupForm.controls; }

  onSubmit() {
    this.submitted = true;

    // Stop si formulaire invalide
    if (this.groupForm.invalid) {
      return;
    }

    this.loading = true;
    
    // Récupérer les valeurs du formulaire
    const formValues = this.groupForm.value;
    console.log('Valeurs du formulaire:', formValues);
    
    // Examiner la structure de session_id en détail
    console.log('session_id type:', typeof formValues.session_id);
    console.log('session_id value:', formValues.session_id);
    console.log('session_id JSON:', JSON.stringify(formValues.session_id));
    
    // Préparer les données avec les champs obligatoires
    const formData = {
      label: formValues.label,
      session_id: formValues.session_id
      // Aucun autre champ n'est envoyé à l'API
    };
    
    // Afficher les données dans la console pour debug
    console.log('Données de groupe à envoyer:', formData);

    // Création du groupe
    this.groupService.createGroup(formData).subscribe({
      next: (response) => {
        console.log('Réponse de création de groupe:', response);
        this.modal.hide();
        this.loadGroups(); // Recharger la liste des groupes
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur complète:', error);
        // Afficher l'erreur détaillée pour comprendre le problème
        if (error.error && error.error.message) {
          console.error('Message d\'erreur API:', error.error.message);
        }
        if (error.status) {
          console.error('Statut HTTP:', error.status);
        }
        this.error = error?.error?.message || error?.message || 'Une erreur est survenue';
        this.loading = false;
      }
    });
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
    this.error = '';
  }
} 