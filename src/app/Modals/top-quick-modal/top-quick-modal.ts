import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-top-quick-modal',
  imports: [CommonModule],
  templateUrl: './top-quick-modal.html',
  styleUrl: './top-quick-modal.css',
})
export class TopQuickModal {
  @Input() isOpen = false;
  @Input() title = 'Quick Message';
  @Input() message = '';
  @Input() type: 'success' | 'error' | 'warning' | 'info' = 'info';

  @Output() closed = new EventEmitter<void>();

  // closeModal() {
  //   this.closed.emit();
  // }

}
