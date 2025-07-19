import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule, AbstractControl } from '@angular/forms';
// Core Material modules (lightweight)
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
// Only import heavy modules when needed
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { FormField, ValidationRule } from '../../models/form-schema.models';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatRadioModule
  ],
  templateUrl: './form-field.component.html',
  styleUrl: './form-field.component.scss'
})
export class FormFieldComponent {
  @Input() field!: FormField;
  @Input() formGroup!: FormGroup;
  @Input() validationRules: ValidationRule[] = [];

  get control(): AbstractControl | null {
    return this.formGroup.get(this.field.name);
  }

  getValidationMessage(): string {
    const control = this.control;
    if (!control || !control.errors) return '';

    // Check for custom validation message first
    if (this.field.validation?.customMessage) {
      return this.field.validation.customMessage;
    }

    // Get the first error and find corresponding validation rule
    const errorKey = Object.keys(control.errors)[0];
    const errorValue = control.errors[errorKey];

    // Find validation rule for this error
    if (this.field.validation?.rules) {
      for (const ruleId of this.field.validation.rules) {
        const rule = this.validationRules.find(r => r.id === ruleId);
        if (rule && this.matchesValidationType(rule.type, errorKey)) {
          return rule.message;
        }
      }
    }

    // Fallback to default messages
    return this.getDefaultErrorMessage(errorKey, errorValue);
  }

  private matchesValidationType(validationType: string, errorKey: string): boolean {
    const mapping: { [key: string]: string[] } = {
      'required': ['required'],
      'min_length': ['minlength'],
      'max_length': ['maxlength'],
      'pattern': ['pattern'],
      'email': ['email'],
      'url': ['url'],
      'numeric': ['pattern'],
      'min_value': ['min'],
      'max_value': ['max']
    };
    
    return mapping[validationType]?.includes(errorKey) || false;
  }

  private getDefaultErrorMessage(errorKey: string, errorValue: any): string {
    const messages: { [key: string]: string } = {
      'required': `${this.field.label} is required`,
      'email': 'Please enter a valid email address',
      'url': 'Please enter a valid URL',
      'minlength': `Minimum length is ${errorValue?.requiredLength || 0} characters`,
      'maxlength': `Maximum length is ${errorValue?.requiredLength || 0} characters`,
      'min': `Minimum value is ${errorValue?.min || 0}`,
      'max': `Maximum value is ${errorValue?.max || 0}`,
      'pattern': `Please enter a valid ${this.field.label.toLowerCase()}`
    };
    
    return messages[errorKey] || `Invalid ${this.field.label.toLowerCase()}`;
  }
}
