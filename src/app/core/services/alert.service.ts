import { Injectable } from '@angular/core';

declare var bootstrap: any;

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  constructor() {}

  /**
   * Affiche une confirmation stylée
   * @param message Message à afficher
   * @param title Titre de la modal (optionnel)
   * @returns Promise<boolean> - true si confirmé, false sinon
   */
  confirm(message: string, title: string = 'Confirmation'): Promise<boolean> {
    return new Promise(resolve => {
      this.createConfirmModal(message, title, resolve);
    });
  }

  /**
   * Affiche une alerte de succès
   * @param message Message à afficher
   * @param title Titre de la modal (optionnel)
   * @returns Promise<void>
   */
  success(message: string, title: string = 'Succès'): Promise<void> {
    return new Promise(resolve => {
      this.createAlertModal(message, title, 'success', resolve);
    });
  }

  /**
   * Affiche une alerte d'erreur
   * @param message Message à afficher
   * @param title Titre de la modal (optionnel)
   * @returns Promise<void>
   */
  error(message: string, title: string = 'Erreur'): Promise<void> {
    return new Promise(resolve => {
      this.createAlertModal(message, title, 'danger', resolve);
    });
  }

  /**
   * Affiche une alerte d'information
   * @param message Message à afficher
   * @param title Titre de la modal (optionnel)
   * @returns Promise<void>
   */
  info(message: string, title: string = 'Information'): Promise<void> {
    return new Promise(resolve => {
      this.createAlertModal(message, title, 'info', resolve);
    });
  }

  /**
   * Crée une modal de confirmation
   */
  private createConfirmModal(
    message: string,
    title: string,
    resolve: (value: boolean) => void
  ): void {
    const modalId = 'confirmModal_' + Date.now();

    const modalHtml = `
      <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow">
            <div class="modal-header bg-danger text-white">
              <h5 class="modal-title">
                <i class="fas fa-exclamation-triangle me-2"></i>${title}
              </h5>
            </div>
            <div class="modal-body p-4">
              <p class="mb-0">${message.replace(/\n/g, '<br>')}</p>
            </div>
            <div class="modal-footer border-0 bg-light">
              <button type="button" class="btn btn-secondary" data-action="cancel">
                <i class="fas fa-times me-2"></i>Annuler
              </button>
              <button type="button" class="btn btn-danger" data-action="confirm">
                <i class="fas fa-trash me-2"></i>Supprimer
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Ajouter la modal au DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);

      // Gestion des clics sur les boutons
      modalElement.addEventListener('click', (e: Event) => {
        const target = e.target as HTMLElement;
        const action = target.getAttribute('data-action');

        if (action === 'confirm') {
          resolve(true);
          modal.hide();
        } else if (action === 'cancel') {
          resolve(false);
          modal.hide();
        }
      });

      // Cleanup après fermeture
      modalElement.addEventListener('hidden.bs.modal', () => {
        modalElement.remove();
      });

      modal.show();
    }
  }

  /**
   * Crée une modal d'alerte
   */
  private createAlertModal(
    message: string,
    title: string,
    type: string,
    resolve: () => void
  ): void {
    const modalId = 'alertModal_' + Date.now();

    const typeConfig = {
      success: { icon: 'fa-check-circle', bgClass: 'bg-success' },
      danger: { icon: 'fa-exclamation-circle', bgClass: 'bg-danger' },
      info: { icon: 'fa-info-circle', bgClass: 'bg-info' },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.info;

    const modalHtml = `
      <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow">
            <div class="modal-header ${config.bgClass} text-white">
              <h5 class="modal-title">
                <i class="fas ${config.icon} me-2"></i>${title}
              </h5>
            </div>
            <div class="modal-body p-4">
              <p class="mb-0">${message.replace(/\n/g, '<br>')}</p>
            </div>
            <div class="modal-footer border-0 bg-light">
              <button type="button" class="btn btn-primary" data-action="ok">
                <i class="fas fa-check me-2"></i>OK
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Ajouter la modal au DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);

      // Gestion du clic sur OK
      modalElement.addEventListener('click', (e: Event) => {
        const target = e.target as HTMLElement;
        const action = target.getAttribute('data-action');

        if (action === 'ok') {
          resolve();
          modal.hide();
        }
      });

      // Cleanup après fermeture
      modalElement.addEventListener('hidden.bs.modal', () => {
        modalElement.remove();
      });

      modal.show();
    }
  }
}
