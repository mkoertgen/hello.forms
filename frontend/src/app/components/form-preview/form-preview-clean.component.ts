import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { FormSchema, FormField, FormStep } from '../../models/form-schema.models';
import { FormFieldComponent } from '../form-field/form-field.component';

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
export class FormPreviewComponent implements OnInit {
  @Input() schema!: FormSchema;
  
  stepFormGroups: FormGroup[] = [];
  singleFormGroup: FormGroup = new FormGroup({});
  showDataPreview = false;

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.buildForm();
  }

  ngOnChanges(): void {
    this.buildForm();
  }

  private buildForm(): void {
    if (!this.schema) return;

    if (this.schema.steps && this.schema.steps.length > 0) {
      // Build step forms
      this.stepFormGroups = this.schema.steps.map(step => {
        const formGroup = this.formBuilder.group({});
        step.fields.forEach(fieldId => {
          const field = this.getFieldById(fieldId);
          if (field) {
            const validators = field.required ? [Validators.required] : [];
            if (field.type === 'email') {
              validators.push(Validators.email);
            }
            formGroup.addControl(field.name, this.formBuilder.control('', validators));
          }
        });
        return formGroup;
      });
    } else {
      // Build single form
      const formControls: any = {};
      this.schema.fields?.forEach(field => {
        const validators = field.required ? [Validators.required] : [];
        if (field.type === 'email') {
          validators.push(Validators.email);
        }
        formControls[field.name] = ['', validators];
      });
      this.singleFormGroup = this.formBuilder.group(formControls);
    }
  }

  getFieldById(fieldId: string): FormField | undefined {
    return this.schema.fields?.find(field => field.id === fieldId);
  }

  onSubmit(): void {
    if (this.schema.steps && this.schema.steps.length > 0) {
      // Multi-step form submission
      const allData = this.stepFormGroups.reduce((acc, formGroup, index) => {
        acc[`step_${index + 1}`] = formGroup.value;
        return acc;
      }, {} as any);
      
      console.log('Multi-step form submitted:', allData);
      this.showDataPreview = true;
    } else {
      // Single form submission
      console.log('Single form submitted:', this.singleFormGroup.value);
      this.showDataPreview = true;
    }
  }

  isFormValid(): boolean {
    if (this.schema.steps && this.schema.steps.length > 0) {
      return this.stepFormGroups.every(formGroup => formGroup.valid);
    } else {
      return this.singleFormGroup.valid;
    }
  }
}
