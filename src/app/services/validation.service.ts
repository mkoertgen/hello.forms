import { Injectable } from '@angular/core';
import { AbstractControl, ValidatorFn, Validators } from '@angular/forms';
import { ValidationRule, ValidationType, FormField } from '../models/form-schema.models';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {

  // Create default validation rules
  createDefaultValidationRules(): ValidationRule[] {
    return [
      {
        id: 'required',
        name: 'Required Field',
        type: 'required',
        message: 'This field is required'
      },
      {
        id: 'email',
        name: 'Email Format',
        type: 'email',
        message: 'Please enter a valid email address'
      },
      {
        id: 'url',
        name: 'URL Format',
        type: 'url',
        message: 'Please enter a valid URL'
      },
      {
        id: 'min_length_3',
        name: 'Minimum 3 Characters',
        type: 'min_length',
        message: 'Must be at least 3 characters long',
        parameters: { length: 3 }
      },
      {
        id: 'max_length_255',
        name: 'Maximum 255 Characters',
        type: 'max_length',
        message: 'Must be no more than 255 characters long',
        parameters: { length: 255 }
      },
      {
        id: 'numeric',
        name: 'Numbers Only',
        type: 'numeric',
        message: 'Please enter numbers only',
        parameters: { pattern: '^[0-9]+$' }
      },
      {
        id: 'phone',
        name: 'Phone Number',
        type: 'pattern',
        message: 'Please enter a valid phone number',
        parameters: { pattern: '^[+]?[0-9\\s\\-\\(\\)]+$' }
      },
      {
        id: 'min_value_0',
        name: 'Minimum Value 0',
        type: 'min_value',
        message: 'Value must be at least 0',
        parameters: { min: 0 }
      },
      {
        id: 'max_value_100',
        name: 'Maximum Value 100',
        type: 'max_value',
        message: 'Value must be no more than 100',
        parameters: { max: 100 }
      }
    ];
  }

  // Create custom validation rule
  createValidationRule(
    name: string, 
    type: ValidationType, 
    message: string, 
    parameters?: { [key: string]: any }
  ): ValidationRule {
    return {
      id: this.generateId(),
      name,
      type,
      message,
      parameters
    };
  }

  // Convert validation rules to Angular validators
  getValidatorsForField(field: FormField, validationRules: ValidationRule[]): ValidatorFn[] {
    const validators: ValidatorFn[] = [];

    // Add required validator
    if (field.required) {
      validators.push(Validators.required);
    }

    // Add field-specific validation rules
    if (field.validation?.rules) {
      for (const ruleId of field.validation.rules) {
        const rule = validationRules.find(r => r.id === ruleId);
        if (rule) {
          const validator = this.createValidatorFromRule(rule);
          if (validator) {
            validators.push(validator);
          }
        }
      }
    }

    // Add type-specific validators
    validators.push(...this.getTypeSpecificValidators(field.type));

    return validators;
  }

  private createValidatorFromRule(rule: ValidationRule): ValidatorFn | null {
    switch (rule.type) {
      case 'min_length':
        return Validators.minLength(rule.parameters?.['length'] || 1);
      
      case 'max_length':
        return Validators.maxLength(rule.parameters?.['length'] || 255);
      
      case 'pattern':
        return Validators.pattern(rule.parameters?.['pattern'] || '');
      
      case 'email':
        return Validators.email;
      
      case 'min_value':
        return Validators.min(rule.parameters?.['min'] || 0);
      
      case 'max_value':
        return Validators.max(rule.parameters?.['max'] || Number.MAX_VALUE);
      
      case 'numeric':
        return Validators.pattern(/^[0-9]+$/);
      
      case 'url':
        return this.urlValidator;
      
      case 'custom':
        return this.createCustomValidator(rule);
      
      default:
        return null;
    }
  }

  private getTypeSpecificValidators(fieldType: string): ValidatorFn[] {
    switch (fieldType) {
      case 'email':
        return [Validators.email];
      case 'url':
        return [this.urlValidator];
      case 'number':
        return [Validators.pattern(/^-?[0-9]+(\.[0-9]+)?$/)];
      default:
        return [];
    }
  }

  private urlValidator: ValidatorFn = (control: AbstractControl) => {
    if (!control.value) return null;
    
    try {
      new URL(control.value);
      return null;
    } catch {
      return { url: true };
    }
  };

  private createCustomValidator(rule: ValidationRule): ValidatorFn {
    return (control: AbstractControl) => {
      if (!rule.parameters?.['function']) return null;
      
      try {
        // Create function from string (be careful with security in production)
        const customValidatorFn = new Function('value', 'control', rule.parameters['function']);
        const result = customValidatorFn(control.value, control);
        
        return result === true ? null : { custom: true };
      } catch (error) {
        console.error('Custom validator error:', error);
        return { custom: true };
      }
    };
  }

  // Server-side validation
  validateFormData(formId: string, formData: any): Promise<ValidationResult> {
    // This will call the backend validation endpoint
    return fetch(`/api/forms/${formId}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    }).then(response => response.json());
  }

  private generateId(): string {
    return 'validation_' + Math.random().toString(36).substr(2, 9);
  }
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}
