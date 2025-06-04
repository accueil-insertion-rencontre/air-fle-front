import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Group } from '../../../../core/models/group.model';
import { GroupService } from '../../../../core/services/group.service';
import { SessionService } from '../../../../core/services/session.service';
import { CourseService } from '../../../../core/services/course.service';
import { AlertService } from '../../../../core/services/alert.service';
import { Session } from '../../../../core/models/session.model';

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
    private courseService: CourseService,
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
    // Récupérer d'abord les informations du groupe pour connaître les étudiants
    this.groupService.getGroupById(id).subscribe({
      next: (group) => {
        const studentsCount = group.students ? group.students.length : 0;
        
        const confirmMessage = studentsCount > 0 
          ? `Êtes-vous sûr de vouloir supprimer le groupe "${group.label}" ?\n\n` +
            `Ce groupe contient ${studentsCount} étudiant(s). Ils seront retirés du groupe mais ne seront pas supprimés.\n` +
            `Tous les cours associés à ce groupe seront également supprimés.\n` +
            `La session ne sera pas affectée.\n\n` +
            'Cette action est irréversible.'
          : `Êtes-vous sûr de vouloir supprimer le groupe "${group.label}" ?\n\n` +
            `Tous les cours associés à ce groupe seront également supprimés.\n` +
            `La session ne sera pas affectée.\n\n` +
            'Cette action est irréversible.';
        
        this.alertService.confirm(confirmMessage).then((confirmed) => {
          if (confirmed) {
            this.startGroupDeletion(id, group);
          }
        });
      },
      error: (err) => {
        console.error('Erreur lors du chargement des informations du groupe', err);
        this.alertService.error('Erreur lors du chargement des informations du groupe.');
      }
    });
  }

  /**
   * Retire tous les étudiants du groupe
   */
  private async removeAllStudentsFromGroup(groupId: string | number, students: any[]): Promise<void> {
    console.log(`Suppression de ${students.length} étudiants du groupe avant suppression`);
    
    const removePromises = students.map(relation => {
      // Extraire l'ID de l'étudiant depuis l'objet relation
      const studentId = relation.student ? relation.student.id : relation.id;
      console.log('Retrait de l\'étudiant avec ID:', studentId, 'du groupe:', groupId);
      return this.groupService.removeStudentFromGroup(groupId, studentId.toString()).toPromise();
    });

    await Promise.all(removePromises);
    console.log('Tous les étudiants ont été retirés du groupe');
  }

  /**
   * Vérifie que le groupe est vide puis le supprime
   */
  private verifyAndDeleteGroup(id: string | number): void {
    console.log('Vérification finale avant suppression du groupe ID:', id);
    
    // Re-charger les informations du groupe pour vérifier qu'il est vide
    this.groupService.getGroupById(id).subscribe({
      next: (group) => {
        const remainingStudents = group.students ? group.students.length : 0;
        console.log('Étudiants restants dans le groupe:', remainingStudents);
        
        if (remainingStudents > 0) {
          console.warn('Il reste encore des étudiants dans le groupe, abandon de la suppression');
          this.alertService.error('Erreur : Il reste encore des étudiants dans le groupe. Suppression annulée.');
        } else {
          console.log('Groupe confirmé vide, procédure de suppression');
          this.performGroupDeletion(id);
        }
      },
      error: (err) => {
        console.error('Erreur lors de la vérification du groupe:', err);
        // Si on ne peut pas vérifier, on essaie quand même de supprimer
        console.log('Tentative de suppression malgré l\'erreur de vérification');
        this.performGroupDeletion(id);
      }
    });
  }

  /**
   * Effectue la suppression du groupe
   */
  private performGroupDeletion(id: string | number): void {
    console.log('Tentative de suppression du groupe ID:', id);
    
    this.groupService.deleteGroup(id).subscribe({
      next: () => {
        console.log('Groupe supprimé avec succès');
        this.groups = this.groups.filter(g => g.group_id !== id);
        if ($('#groupTable').bootstrapTable) {
          $('#groupTable').bootstrapTable('load', this.groups);
        }
        
        const successMessage = `Groupe supprimé avec succès !\n\n` +
                              `✅ Cours associés supprimés\n` +
                              `✅ Étudiants retirés du groupe (mais non supprimés)\n` +
                              `✅ Groupe supprimé\n` +
                              `ℹ️ La session reste intacte`;
        
        this.alertService.success(successMessage);
      },
      error: (err) => {
        console.error('Erreur lors de la suppression du groupe', err);
        console.error('Détails de l\'erreur:', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          errorDetails: err.error
        });
        
        // Afficher les détails complets de l'erreur pour debug
        if (err.error) {
          console.error('Contenu de err.error:', JSON.stringify(err.error, null, 2));
        }
        
        // Message d'erreur plus informatif
        let errorMessage = 'Erreur lors de la suppression du groupe.';
        
        if (err.status === 500) {
        if (err.error && err.error.message) {
            if (err.error.message.includes('constraint') || err.error.message.includes('foreign key')) {
              errorMessage = 'Impossible de supprimer le groupe : il est encore lié à d\'autres éléments dans la base de données.\n\n' +
                           'Causes possibles :\n' +
                           '• Des cours sont encore associés au groupe\n' +
                           '• Des étudiants sont encore liés au groupe\n' +
                           '• D\'autres références existent dans le système\n\n' +
                           'L\'administrateur doit vérifier manuellement la base de données.';
            } else {
              errorMessage = `Erreur serveur interne: ${err.error.message}\n\n` +
                           'Cette erreur nécessite une intervention technique.';
            }
          } else {
            errorMessage = 'Erreur 500 - Erreur serveur interne.\n\n' +
                         'Causes possibles :\n' +
                         '• Problème de base de données\n' +
                         '• Erreur dans l\'API backend\n' +
                         '• Contraintes de clés étrangères non résolues\n\n' +
                         'Veuillez contacter l\'administrateur.';
          }
        } else if (err.status === 404) {
          errorMessage = 'Le groupe à supprimer n\'a pas été trouvé. Il a peut-être déjà été supprimé.';
        } else if (err.status === 403) {
          errorMessage = 'Vous n\'avez pas les permissions nécessaires pour supprimer ce groupe.';
        } else if (err.error && err.error.message) {
            errorMessage = `Erreur API: ${err.error.message}`;
        }
        
        this.alertService.error(errorMessage);
      }
    });
  }

  /**
   * Démarre le processus de suppression du groupe avec l'ordre correct
   */
  private async startGroupDeletion(groupId: string | number, group: any): Promise<void> {
    try {
      console.log('=== DÉBUT DU PROCESSUS DE SUPPRESSION DU GROUPE ===');
      console.log('Groupe à supprimer:', group.label);
      
      // Étape 1: Supprimer tous les cours associés au groupe
      await this.deleteAllGroupCourses(groupId);
      
      // Étape 2: Retirer tous les étudiants du groupe
      if (group.students && group.students.length > 0) {
        await this.removeAllStudentsFromGroup(groupId, group.students);
      }
      
      // Étape 3: Supprimer le groupe lui-même
      this.performGroupDeletion(groupId);
      
    } catch (error) {
      console.error('Erreur lors du processus de suppression:', error);
      this.alertService.error('Erreur lors de la suppression. Certaines étapes ont peut-être échoué.');
    }
  }

  /**
   * Supprime tous les cours associés au groupe
   */
  private async deleteAllGroupCourses(groupId: string | number): Promise<void> {
    console.log('Suppression des cours associés au groupe:', groupId);
    
    try {
      // Récupérer tous les cours du groupe
      const courses = await this.courseService.getCoursesByGroupId(groupId).toPromise();
      
      if (!courses || courses.length === 0) {
        console.log('Aucun cours trouvé pour ce groupe');
        return;
      }
      
      console.log(`${courses.length} cours trouvés à supprimer:`, courses.map(c => c.title));
      
      // Supprimer tous les cours individuellement avec gestion d'erreur par cours
      const deleteResults = await Promise.allSettled(
        courses.map(async course => {
        const courseId = course.course_id || course.id;
        if (courseId) {
          console.log('Suppression du cours:', course.title, 'ID:', courseId);
            try {
              await this.courseService.deleteCourse(courseId).toPromise();
              console.log('✅ Cours supprimé avec succès:', course.title);
              return { success: true, course: course.title };
            } catch (error) {
              console.error('❌ Erreur lors de la suppression du cours:', course.title, error);
              return { success: false, course: course.title, error };
            }
        } else {
          console.warn('Cours sans ID trouvé:', course);
            return { success: false, course: course.title || 'Cours sans nom', error: 'Pas d\'ID' };
        }
        })
      );
      
      // Analyser les résultats
      const successful = deleteResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = deleteResults.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;
      
      console.log(`Résultats suppression cours: ${successful} réussis, ${failed} échoués`);
      
      if (failed > 0) {
        console.warn(`${failed} cours n'ont pas pu être supprimés, mais on continue avec la suppression du groupe`);
        // On continue quand même avec la suppression du groupe
      } else {
      console.log('Tous les cours ont été supprimés avec succès');
      }
      
    } catch (error) {
      console.error('Erreur lors de la récupération des cours du groupe:', error);
      console.warn('Impossible de récupérer les cours, on continue avec la suppression du groupe');
      // On continue quand même le processus, même si on ne peut pas récupérer les cours
    }
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