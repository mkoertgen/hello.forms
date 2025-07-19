import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface EmptyStateAction {
  label: string;
  icon: string;
  color?: 'primary' | 'accent' | 'warn';
  raised?: boolean;
}

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss']
})
export class EmptyStateComponent {
  @Input() icon!: string;
  @Input() title!: string;
  @Input() message!: string;
  @Input() primaryAction?: EmptyStateAction;
  @Input() secondaryAction?: EmptyStateAction;
  @Output() primaryActionClick = new EventEmitter<void>();
  @Output() secondaryActionClick = new EventEmitter<void>();

  onPrimaryAction(): void {
    this.primaryActionClick.emit();
  }

  onSecondaryAction(): void {
    this.secondaryActionClick.emit();
  }
}
