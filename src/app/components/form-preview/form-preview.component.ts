import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { FormSchema, FormField, FormStep } from '../../models/form-schema.models';

@Component({
  selector: 'app-form-preview',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatRadioModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  template: `
    <div class="form-preview-container">
      <mat-card class="form-card">
        <mat-card-header>
          <mat-card-title>{{schema.title}}</mat-card-title>
          <mat-card-subtitle *ngIf="schema.description">{{schema.description}}</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <!-- Multi-step form -->
          <mat-stepper 
            *ngIf="schema.steps && schema.steps.length > 0; else singleForm"
            linear="true"
            #stepper>
            <mat-step 
              *ngFor="let step of schema.steps; let i = index"
              [stepControl]="stepFormGroups[i]"
              [label]="step.title">
              <div class="step-content">
                <h3>{{step.title}}</h3>
                <p *ngIf="step.description">{{step.description}}</p>
                
                <form [formGroup]="stepFormGroups[i]" class="step-form">
                  <ng-container *ngFor="let fieldId of step.fields">
                    <ng-container *ngIf="getFieldById(fieldId) as field">
                      <div class="field-container" [ngSwitch]="field.type">
                        <!-- Text inputs -->
                        <mat-form-field 
                          appearance="outline" 
                          *ngSwitchCase="'text'"
                          class="full-width">
                          <mat-label>{{field.label}}</mat-label>
                          <input 
                            matInput 
                            [formControlName]="field.name"
                            [placeholder]="field.placeholder || ''"
                            [required]="field.required">
                          <mat-hint *ngIf="field.helpText">{{field.helpText}}</mat-hint>
                          <mat-error *ngIf="stepFormGroups[i].get(field.name)?.errors?.['required']">
                            {{field.label}} is required
                          </mat-error>
                        </mat-form-field>

                        <!-- Email input -->
                        <mat-form-field 
                          appearance="outline" 
                          *ngSwitchCase="'email'"
                          class="full-width">
                          <mat-label>{{field.label}}</mat-label>
                          <input 
                            matInput 
                            type="email"
                            [formControlName]="field.name"
                            [placeholder]="field.placeholder || ''"
                            [required]="field.required">
                          <mat-hint *ngIf="field.helpText">{{field.helpText}}</mat-hint>
                          <mat-error *ngIf="stepFormGroups[i].get(field.name)?.errors?.['required']">
                            {{field.label}} is required
                          </mat-error>
                          <mat-error *ngIf="stepFormGroups[i].get(field.name)?.errors?.['email']">
                            Please enter a valid email address
                          </mat-error>
                        </mat-form-field>

                        <!-- Number input -->
                        <mat-form-field 
                          appearance="outline" 
                          *ngSwitchCase="'number'"
                          class="full-width">
                          <mat-label>{{field.label}}</mat-label>
                          <input 
                            matInput 
                            type="number"
                            [formControlName]="field.name"
                            [placeholder]="field.placeholder || ''"
                            [required]="field.required">
                          <mat-hint *ngIf="field.helpText">{{field.helpText}}</mat-hint>
                          <mat-error *ngIf="stepFormGroups[i].get(field.name)?.errors?.['required']">
                            {{field.label}} is required
                          </mat-error>
                        </mat-form-field>

                        <!-- Textarea -->
                        <mat-form-field 
                          appearance="outline" 
                          *ngSwitchCase="'textarea'"
                          class="full-width">
                          <mat-label>{{field.label}}</mat-label>
                          <textarea 
                            matInput 
                            [formControlName]="field.name"
                            [placeholder]="field.placeholder || ''"
                            [required]="field.required"
                            rows="4">
                          </textarea>
                          <mat-hint *ngIf="field.helpText">{{field.helpText}}</mat-hint>
                          <mat-error *ngIf="stepFormGroups[i].get(field.name)?.errors?.['required']">
                            {{field.label}} is required
                          </mat-error>
                        </mat-form-field>

                        <!-- Select dropdown -->
                        <mat-form-field 
                          appearance="outline" 
                          *ngSwitchCase="'select'"
                          class="full-width">
                          <mat-label>{{field.label}}</mat-label>
                          <mat-select 
                            [formControlName]="field.name"
                            [required]="field.required">
                            <mat-option 
                              *ngFor="let option of field.options" 
                              [value]="option.value">
                              {{option.label}}
                            </mat-option>
                          </mat-select>
                          <mat-hint *ngIf="field.helpText">{{field.helpText}}</mat-hint>
                          <mat-error *ngIf="stepFormGroups[i].get(field.name)?.errors?.['required']">
                            {{field.label}} is required
                          </mat-error>
                        </mat-form-field>

                        <!-- Radio buttons -->
                        <div *ngSwitchCase="'radio'" class="radio-group">
                          <label class="field-label">{{field.label}}</label>
                          <mat-radio-group 
                            [formControlName]="field.name"
                            class="radio-group-content">
                            <mat-radio-button 
                              *ngFor="let option of field.options" 
                              [value]="option.value"
                              class="radio-option">
                              {{option.label}}
                            </mat-radio-button>
                          </mat-radio-group>
                          <div *ngIf="field.helpText" class="field-hint">{{field.helpText}}</div>
                        </div>

                        <!-- Checkbox -->
                        <div *ngSwitchCase="'checkbox'" class="checkbox-field">
                          <mat-checkbox 
                            [formControlName]="field.name"
                            [required]="field.required">
                            {{field.label}}
                          </mat-checkbox>
                          <div *ngIf="field.helpText" class="field-hint">{{field.helpText}}</div>
                        </div>

                        <!-- Date picker -->
                        <mat-form-field 
                          appearance="outline" 
                          *ngSwitchCase="'date'"
                          class="full-width">
                          <mat-label>{{field.label}}</mat-label>
                          <input 
                            matInput 
                            [matDatepicker]="picker"
                            [formControlName]="field.name"
                            [required]="field.required">
                          <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                          <mat-datepicker #picker></mat-datepicker>
                          <mat-hint *ngIf="field.helpText">{{field.helpText}}</mat-hint>
                          <mat-error *ngIf="stepFormGroups[i].get(field.name)?.errors?.['required']">
                            {{field.label}} is required
                          </mat-error>
                        </mat-form-field>

                        <!-- Section header -->
                        <div *ngSwitchCase="'section_header'" class="section-header">
                          <h4>{{field.label}}</h4>
                          <p *ngIf="field.helpText">{{field.helpText}}</p>
                        </div>

                        <!-- Divider -->
                        <hr *ngSwitchCase="'divider'" class="form-divider">
                      </div>
                    </ng-container>
                  </ng-container>
                </form>
              </div>

              <div class="step-actions">
                <button 
                  mat-button 
                  matStepperPrevious 
                  *ngIf="i > 0">
                  Back
                </button>
                <button 
                  mat-raised-button 
                  color="primary"
                  matStepperNext
                  *ngIf="i < schema.steps!.length - 1">
                  Next
                </button>
                <button 
                  mat-raised-button 
                  color="primary"
                  *ngIf="i === schema.steps!.length - 1"
                  (click)="submitForm()">
                  Submit
                </button>
              </div>
            </mat-step>
          </mat-stepper>

          <!-- Single form template -->
          <ng-template #singleForm>
            <form [formGroup]="singleFormGroup" class="single-form">
              <ng-container *ngFor="let field of schema.fields">
                <div class="field-container" [ngSwitch]="field.type">
                  <!-- Same field templates as above -->
                  <mat-form-field 
                    appearance="outline" 
                    *ngSwitchCase="'text'"
                    class="full-width">
                    <mat-label>{{field.label}}</mat-label>
                    <input 
                      matInput 
                      [formControlName]="field.name"
                      [placeholder]="field.placeholder || ''"
                      [required]="field.required">
                    <mat-hint *ngIf="field.helpText">{{field.helpText}}</mat-hint>
                    <mat-error *ngIf="singleFormGroup.get(field.name)?.errors?.['required']">
                      {{field.label}} is required
                    </mat-error>
                  </mat-form-field>

                  <!-- Add other field types here similar to step form -->
                </div>
              </ng-container>

              <div class="form-actions">
                <button 
                  mat-raised-button 
                  color="primary"
                  (click)="submitForm()"
                  [disabled]="singleFormGroup.invalid">
                  Submit
                </button>
              </div>
            </form>
          </ng-template>
        </mat-card-content>
      </mat-card>

      <!-- Form Data Preview -->
      <mat-card class="data-preview" *ngIf="showDataPreview">
        <mat-card-header>
          <mat-card-title>Form Data</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <pre>{{getFormData() | json}}</pre>
        </mat-card-content>
      </mat-card>
    </div>
  `,
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
    if (this.schema.steps && this.schema.steps.length > 0) {
      this.buildStepForms();
    } else {
      this.buildSingleForm();
    }
  }

  private buildStepForms(): void {
    this.stepFormGroups = [];
    
    this.schema.steps!.forEach(step => {
      const group: any = {};
      
      step.fields.forEach(fieldId => {
        const field = this.getFieldById(fieldId);
        if (field) {
          const validators = this.getValidators(field);
          group[field.name] = [field.defaultValue || '', validators];
        }
      });
      
      this.stepFormGroups.push(this.formBuilder.group(group));
    });
  }

  private buildSingleForm(): void {
    const group: any = {};
    
    this.schema.fields.forEach(field => {
      const validators = this.getValidators(field);
      group[field.name] = [field.defaultValue || '', validators];
    });
    
    this.singleFormGroup = this.formBuilder.group(group);
  }

  private getValidators(field: FormField): any[] {
    const validators = [];
    
    if (field.required) {
      validators.push(Validators.required);
    }
    
    if (field.type === 'email') {
      validators.push(Validators.email);
    }
    
    // Add more validators based on field validation rules
    if (field.validation?.rules) {
      field.validation.rules.forEach(ruleId => {
        const rule = this.schema.validationRules.find(r => r.id === ruleId);
        if (rule) {
          switch (rule.type) {
            case 'min_length':
              if (rule.parameters?.['min']) {
                validators.push(Validators.minLength(rule.parameters['min']));
              }
              break;
            case 'max_length':
              if (rule.parameters?.['max']) {
                validators.push(Validators.maxLength(rule.parameters['max']));
              }
              break;
            case 'pattern':
              if (rule.parameters?.['pattern']) {
                validators.push(Validators.pattern(rule.parameters['pattern']));
              }
              break;
          }
        }
      });
    }
    
    return validators;
  }

  getFieldById(fieldId: string): FormField | undefined {
    return this.schema.fields.find(field => field.id === fieldId);
  }

  submitForm(): void {
    console.log('Form submitted:', this.getFormData());
    this.showDataPreview = true;
  }

  getFormData(): any {
    if (this.schema.steps && this.schema.steps.length > 0) {
      const data: any = {};
      this.stepFormGroups.forEach((group, index) => {
        data[`step_${index + 1}`] = group.value;
      });
      return data;
    } else {
      return this.singleFormGroup.value;
    }
  }
}
