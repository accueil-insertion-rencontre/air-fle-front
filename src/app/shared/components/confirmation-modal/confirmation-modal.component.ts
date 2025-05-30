import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationService, ConfirmationConfig } from '../../../core/services/confirmation.service';
import { Subscription } from 'rxjs';

declare var bootstrap: any;

@Component({
  selector: 'app-confirmation-modal',
  templateUrl: './confirmation-modal.component.html',
  styleUrls: ['./confirmation-modal.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ConfirmationModalComponent implements OnInit, OnDestroy {
  config: ConfirmationConfig | null = null;
  modal: any;
  private subscription: Subscription = new Subscription();

  constructor(private confirmationService: ConfirmationService) {}

  ngOnInit(): void {
    this.subscription = this.confirmationService.getConfirmation().subscribe(config => {
      this.config = config;
      if (config) {
        this.showModal();
      } else {
        this.hideModal();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    if (this.modal) {
      this.modal.dispose();
    }
  }

  private showModal(): void {
    if (!this.modal) {
      const modalElement = document.getElementById('confirmationModal');
      if (modalElement) {
        this.modal = new bootstrap.Modal(modalElement);
      }
    }
    if (this.modal) {
      this.modal.show();
    }
  }

  private hideModal(): void {
    if (this.modal) {
      this.modal.hide();
    }
  }

  onConfirm(): void {
    this.confirmationService.resolve(true);
  }

  onCancel(): void {
    this.confirmationService.resolve(false);
  }

  getButtonClass(): string {
    switch (this.config?.type) {
      case 'danger': return 'btn-danger';
      case 'warning': return 'btn-warning';
      case 'info': return 'btn-info';
      case 'primary': return 'btn-primary';
      default: return 'btn-danger';
    }
  }

  getIconClass(): string {
    switch (this.config?.type) {
      case 'danger': return 'fas fa-exclamation-triangle text-danger';
      case 'warning': return 'fas fa-exclamation-circle text-warning';
      case 'info': return 'fas fa-info-circle text-info';
      case 'primary': return 'fas fa-question-circle text-primary';
      default: return 'fas fa-exclamation-triangle text-danger';
    }
  }
} 