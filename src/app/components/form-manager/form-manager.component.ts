import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';

import { FormDesignerService } from '../../services/form-designer.service';
import { FormSchema } from '../../models/form-schema.models';

interface FormListItem {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  schema: FormSchema;
}

@Component({
  selector: 'app-form-manager',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  template: `
    <div class="form-manager-container">
      <mat-toolbar class="main-toolbar">
        <mat-icon>folder</mat-icon>
        <span>Form Manager</span>
        
        <span class="spacer"></span>
        
        <button mat-raised-button color="primary" (click)="onCreateNew()">
          <mat-icon>add</mat-icon>
          Create New Form
        </button>

        <button mat-button (click)="fileInput.click()">
          <mat-icon>upload</mat-icon>
          Import Form
        </button>

        <input 
          #fileInput
          type="file" 
          style="display: none" 
          accept=".json"
          (change)="onFileImport($event)">
      </mat-toolbar>

      <div class="content">
        <div *ngIf="loading" class="loading">
          <mat-icon>hourglass_empty</mat-icon>
          <p>Loading forms...</p>
        </div>

        <div *ngIf="!loading && error" class="error">
          <mat-icon>error</mat-icon>
          <p>{{error}}</p>
        </div>

        <div *ngIf="!loading && forms.length === 0 && !error" class="empty">
          <mat-icon>note_add</mat-icon>
          <h2>No Forms Created Yet</h2>
          <p>Create your first form to get started</p>
          <button mat-raised-button color="primary" (click)="onCreateNew()">
            <mat-icon>add</mat-icon>
            Create First Form
          </button>
        </div>

        <div *ngIf="!loading && forms.length > 0" class="forms-grid">
          <mat-card *ngFor="let form of forms" class="form-card">
            <mat-card-header>
              <mat-card-title>{{form.title}}</mat-card-title>
              <mat-card-subtitle>
                Created: {{form.created_at | date:'short'}} | 
                Updated: {{form.updated_at | date:'short'}}
              </mat-card-subtitle>
            </mat-card-header>
            
            <mat-card-content>
              <p *ngIf="form.description">{{form.description}}</p>
              <div class="form-stats">
                <span><mat-icon>layers</mat-icon> {{getStepCount(form.schema)}} steps</span>
                <span><mat-icon>input</mat-icon> {{getFieldCount(form.schema)}} fields</span>
              </div>
              <div class="form-author" *ngIf="form.schema?.metadata?.author">
                <mat-icon>person</mat-icon>
                by {{form.schema.metadata.author}}
              </div>
            </mat-card-content>
            
            <mat-card-actions>
              <button mat-button color="primary" (click)="onEdit(form.id)">
                <mat-icon>edit</mat-icon>
                Edit
              </button>
              <button mat-button (click)="onPreview(form.id)">
                <mat-icon>preview</mat-icon>
                Preview
              </button>
              <button mat-button (click)="onExport(form)">
                <mat-icon>download</mat-icon>
                Export
              </button>
              <button mat-button color="warn" (click)="onDelete(form.id, form.title)">
                <mat-icon>delete</mat-icon>
                Delete
              </button>
            </mat-card-actions>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form-manager-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .main-toolbar {
      flex-shrink: 0;
      background: #1976d2;
      color: white;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .content {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
    }

    .loading, .error, .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 300px;
      text-align: center;
    }

    .loading mat-icon, .error mat-icon, .empty mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }

    .forms-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 16px;
    }

    .form-card {
      height: fit-content;
    }

    .form-stats {
      display: flex;
      gap: 16px;
      margin: 8px 0;
      font-size: 0.9em;
      color: #666;
    }

    .form-stats span {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .form-stats mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .form-author {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 8px;
      font-size: 0.9em;
      color: #666;
    }

    .form-author mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    mat-card-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
  `]
})
export class FormManagerComponent implements OnInit {
  forms: FormListItem[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private formDesignerService: FormDesignerService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadForms();
  }

  loadForms(): void {
    this.loading = true;
    this.error = null;
    
    this.formDesignerService.getSavedForms()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (forms: FormListItem[]) => {
          this.forms = forms;
        },
        error: (err: any) => {
          this.error = 'Failed to load forms. Please try again.';
          console.error('Error loading forms:', err);
        }
      });
  }

  onCreateNew(): void {
    // Create a new form and navigate to design mode
    this.formDesignerService.createNewForm();
    this.router.navigate(['/design']);
  }

  onEdit(formId: string): void {
    // Load the form and navigate to design mode
    this.formDesignerService.loadFormSchema(formId).subscribe({
      next: (schema) => {
        this.formDesignerService.updateState({ schema });
        this.router.navigate(['/design']);
      },
      error: (err) => {
        this.snackBar.open('Failed to load form for editing', 'Close', { duration: 3000 });
      }
    });
  }

  onPreview(formId: string): void {
    this.router.navigate(['/preview', formId]);
  }

  onDelete(formId: string, formTitle: string): void {
    if (confirm(`Are you sure you want to delete "${formTitle}"? This action cannot be undone.`)) {
      this.formDesignerService.deleteForm(formId).subscribe({
        next: () => {
          this.snackBar.open('Form deleted successfully', 'Close', { duration: 3000 });
          this.loadForms(); // Refresh the list
        },
        error: (err: any) => {
          this.snackBar.open('Failed to delete form', 'Close', { duration: 3000 });
        }
      });
    }
  }

  onExport(form: FormListItem): void {
    const schemaJson = JSON.stringify(form.schema, null, 2);
    const blob = new Blob([schemaJson], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${form.title.replace(/\s+/g, '_')}_schema.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  onFileImport(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const schema = JSON.parse(content);
          
          // Validate basic schema structure
          if (!schema.title) {
            this.snackBar.open('Invalid form schema: missing title', 'Close', { duration: 3000 });
            return;
          }

          // Create a new form with imported schema
          this.formDesignerService.saveFormSchema(schema).subscribe({
            next: (savedSchema) => {
              this.snackBar.open(`Form "${savedSchema.title}" imported successfully`, 'Close', { duration: 3000 });
              this.loadForms(); // Refresh the list
            },
            error: (err) => {
              this.snackBar.open('Failed to import form', 'Close', { duration: 3000 });
            }
          });
        } catch (error) {
          console.error('Error importing schema:', error);
          this.snackBar.open('Invalid JSON file', 'Close', { duration: 3000 });
        }
      };
      reader.readAsText(file);
    }
  }

  getStepCount(schema: FormSchema): number {
    return schema?.steps?.length || 0;
  }

  getFieldCount(schema: FormSchema): number {
    if (!schema?.steps) return 0;
    return schema.steps.reduce((total, step) => total + (step.fields?.length || 0), 0);
  }
}
