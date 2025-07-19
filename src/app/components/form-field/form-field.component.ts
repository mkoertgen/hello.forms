import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
// Core Material modules (lightweight)
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
// Only import heavy modules when needed
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { FormField } from '../../models/form-schema.models';

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
  template: `
    <div [ngSwitch]="field.type">
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
        <mat-error *ngIf="formGroup.get(field.name)?.errors?.['required']">
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
        <mat-error *ngIf="formGroup.get(field.name)?.errors?.['required']">
          {{field.label}} is required
        </mat-error>
        <mat-error *ngIf="formGroup.get(field.name)?.errors?.['email']">
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
        <mat-error *ngIf="formGroup.get(field.name)?.errors?.['required']">
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
        <mat-error *ngIf="formGroup.get(field.name)?.errors?.['required']">
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
        <mat-error *ngIf="formGroup.get(field.name)?.errors?.['required']">
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

      <!-- Date input (simplified without datepicker) -->
      <mat-form-field 
        appearance="outline" 
        *ngSwitchCase="'date'"
        class="full-width">
        <mat-label>{{field.label}}</mat-label>
        <input 
          matInput 
          type="date"
          [formControlName]="field.name"
          [required]="field.required">
        <mat-hint *ngIf="field.helpText">{{field.helpText}}</mat-hint>
        <mat-error *ngIf="formGroup.get(field.name)?.errors?.['required']">
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
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .radio-group {
      margin-bottom: 16px;
      
      .field-label {
        display: block;
        font-weight: 500;
        margin-bottom: 8px;
        color: rgba(0, 0, 0, 0.6);
      }
      
      .radio-group-content {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .field-hint {
        font-size: 12px;
        color: rgba(0, 0, 0, 0.6);
        margin-top: 4px;
      }
    }

    .checkbox-field {
      margin-bottom: 16px;
      
      .field-hint {
        font-size: 12px;
        color: rgba(0, 0, 0, 0.6);
        margin-top: 4px;
      }
    }

    .section-header {
      margin: 24px 0 16px 0;
      
      h4 {
        margin: 0 0 8px 0;
        color: rgba(0, 0, 0, 0.87);
      }
      
      p {
        margin: 0;
        color: rgba(0, 0, 0, 0.6);
        font-size: 14px;
      }
    }

    .form-divider {
      margin: 24px 0;
      border: none;
      border-top: 1px solid rgba(0, 0, 0, 0.12);
    }
  `]
})
export class FormFieldComponent {
  @Input() field!: FormField;
  @Input() formGroup!: FormGroup;
}
