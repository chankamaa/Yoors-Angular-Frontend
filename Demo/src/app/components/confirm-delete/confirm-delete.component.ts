import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-delete',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-delete.component.html',
  styleUrl: './confirm-delete.component.scss'
})
export class ConfirmDeleteComponent {
  @Input() isVisible = false;
  @Input() title = 'Confirm Delete';
  @Input() message = 'Are you sure you want to delete this item?';
  @Input() itemName = '';
  @Input() confirmText = 'Delete';
  @Input() cancelText = 'Cancel';
  @Input() isLoading = false;
  
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }
}