import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { FormSchema } from '../../models/form-schema.models';

export interface FormCardData {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  schema: FormSchema;
}

export interface FormCardAction {
  type: 'edit' | 'preview' | 'export' | 'delete';
  formId: string;
  formData?: FormCardData;
}

@Component({
  selector: 'app-form-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './form-card.component.html',
  styleUrls: ['./form-card.component.scss']
})
export class FormCardComponent {
  @Input() form!: FormCardData;
  @Output() action = new EventEmitter<FormCardAction>();
  @Output() tagClick = new EventEmitter<string>();

  get formTags(): string[] {
    return this.form.schema?.metadata?.tags || [];
  }

  get stepCount(): number {
    if (this.form.schema?.steps && this.form.schema.steps.length > 0) {
      return this.form.schema.steps.length;
    }
    // If no steps are defined, consider it as one implicit step
    return this.form.schema?.fields && this.form.schema.fields.length > 0 ? 1 : 0;
  }

  get fieldCount(): number {
    if (!this.form.schema) return 0;
    
    // Count fields directly from the schema.fields array
    if (this.form.schema.fields && this.form.schema.fields.length > 0) {
      return this.form.schema.fields.length;
    }
    
    // Fallback: count fields from steps if they exist
    if (this.form.schema.steps && this.form.schema.steps.length > 0) {
      return this.form.schema.steps.reduce((total, step) => {
        return total + (step.fields?.length || 0);
      }, 0);
    }
    
    return 0;
  }

  onAction(type: FormCardAction['type']): void {
    this.action.emit({
      type,
      formId: this.form.id,
      formData: type === 'export' ? this.form : undefined
    });
  }

  onTagClick(tag: string): void {
    this.tagClick.emit(tag);
  }
}
