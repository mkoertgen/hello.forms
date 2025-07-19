import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { FormSchema, FormField, FormStep } from '../../models/form-schema.models';
import { FormFieldComponent } from '../form-field/form-field.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-form-preview',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    FormFieldComponent
  ],
  templateUrl: './form-preview.component.html',
  styleUrls: ['./form-preview.component.scss']
})
export class FormPreviewComponent implements OnInit, OnDestroy {
  @Input() schema!: FormSchema;
  
  stepFormGroups: FormGroup[] = [];
  singleFormGroup: FormGroup = new FormGroup({});
  private subscriptions = new Subscription();

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.buildForm();
  }

  ngOnChanges(): void {
    this.buildForm();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private buildForm(): void {
    if (!this.schema) return;

    if (this.schema.steps && this.schema.steps.length > 0) {
      // Build step forms
      this.stepFormGroups = this.schema.steps.map(step => {
        const formGroup = this.formBuilder.group({});
        
        if (step.fields && Array.isArray(step.fields)) {
          step.fields.forEach(fieldId => {
            const field = this.getFieldById(fieldId);
            if (field && field.name) {
              const validators = this.buildValidators(field);
              formGroup.addControl(field.name, this.formBuilder.control('', validators));
            }
          });
        }
        
        return formGroup;
      });
    } else {
      // Build single form
      const formControls: { [key: string]: [string, any[]] } = {};
      
      if (this.schema.fields && Array.isArray(this.schema.fields)) {
        this.schema.fields.forEach(field => {
          if (field && field.name) {
            const validators = this.buildValidators(field);
            formControls[field.name] = ['', validators];
          }
        });
      }
      
      this.singleFormGroup = this.formBuilder.group(formControls);
    }
  }

  private buildValidators(field: FormField): any[] {
    const validators: any[] = [];
    
    if (field.required) {
      validators.push(Validators.required);
    }
    
    if (field.type === 'email') {
      validators.push(Validators.email);
    }
    
    // Add more validators based on field type
    if (field.type === 'number') {
      validators.push(Validators.pattern(/^\d+$/));
    }
    
    return validators;
  }

  getFieldById(fieldId: string): FormField | undefined {
    return this.schema.fields?.find(field => field.id === fieldId);
  }

  isFormValid(): boolean {
    if (this.schema.steps && this.schema.steps.length > 0) {
      return this.stepFormGroups.every(formGroup => formGroup.valid);
    } else {
      return this.singleFormGroup.valid;
    }
  }

  getFormData(): any {
    if (this.schema.steps && this.schema.steps.length > 0) {
      return this.stepFormGroups.reduce((acc, formGroup, index) => {
        const stepData = formGroup.value;
        if (Object.keys(stepData).length > 0) {
          acc[this.schema.steps![index].title || `Step ${index + 1}`] = stepData;
        }
        return acc;
      }, {} as any);
    } else {
      return this.singleFormGroup.value;
    }
  }

  getFieldCount(): number {
    return this.schema.fields?.length || 0;
  }

  getCompletedFieldCount(): number {
    const formData = this.getFormData();
    let completedCount = 0;

    if (this.schema.steps && this.schema.steps.length > 0) {
      // Count completed fields across all steps
      Object.values(formData).forEach((stepData: any) => {
        Object.values(stepData).forEach((value: any) => {
          if (value !== null && value !== undefined && value !== '') {
            completedCount++;
          }
        });
      });
    } else {
      // Count completed fields in single form
      Object.values(formData).forEach((value: any) => {
        if (value !== null && value !== undefined && value !== '') {
          completedCount++;
        }
      });
    }

    return completedCount;
  }
}
