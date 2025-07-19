import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';

import { FormDesignerService } from '../../services/form-designer.service';
import { FormSchema } from '../../models/form-schema.models';
import { FormCardComponent, FormCardData, FormCardAction } from '../form-card/form-card.component';
import { SearchBarComponent } from '../search-bar/search-bar.component';
import { EmptyStateComponent, EmptyStateAction } from '../empty-state/empty-state.component';
import { LoadingStateComponent } from '../loading-state/loading-state.component';

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
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    FormCardComponent,
    SearchBarComponent,
    EmptyStateComponent,
    LoadingStateComponent
  ],
  templateUrl: './form-manager.component.html',
  styleUrls: ['./form-manager.component.scss']
})
export class FormManagerComponent implements OnInit {
  forms: FormListItem[] = [];
  filteredForms: FormListItem[] = [];
  searchTerm: string = '';
  availableTags: string[] = [];
  loading = false;
  error: string | null = null;

  // Empty state actions
  retryAction: EmptyStateAction = {
    label: 'Retry',
    icon: 'refresh',
    color: 'primary',
    raised: true
  };

  createFirstFormAction: EmptyStateAction = {
    label: 'Create First Form',
    icon: 'add',
    color: 'primary',
    raised: true
  };

  clearSearchAction: EmptyStateAction = {
    label: 'Clear Search',
    icon: 'clear'
  };

  constructor(
    private formDesignerService: FormDesignerService,
    private router: Router,
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
          this.updateAvailableTags();
          this.filterForms();
        },
        error: (err: any) => {
          this.error = 'Failed to load forms. Please try again.';
          console.error('Error loading forms:', err);
        }
      });
  }

  updateAvailableTags(): void {
    const allTags = new Set<string>();
    this.forms.forEach(form => {
      if (form.schema?.metadata?.tags) {
        form.schema.metadata.tags.forEach(tag => allTags.add(tag));
      }
    });
    this.availableTags = Array.from(allTags).sort();
  }

  onSearchChange(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.filterForms();
  }

  onTagSelected(tag: string): void {
    this.searchTerm = `tag:${tag}`;
    this.filterForms();
  }

  onTagClick(tag: string): void {
    this.onTagSelected(tag);
  }

  onFormAction(action: FormCardAction): void {
    switch (action.type) {
      case 'edit':
        this.onEdit(action.formId);
        break;
      case 'preview':
        this.onPreview(action.formId);
        break;
      case 'export':
        if (action.formData) {
          this.onExport(action.formData);
        }
        break;
      case 'delete':
        if (action.formData) {
          this.onDelete(action.formId, action.formData.title);
        }
        break;
    }
  }

  filterForms(): void {
    if (!this.searchTerm.trim()) {
      this.filteredForms = [...this.forms];
      return;
    }

    const searchTerm = this.searchTerm.toLowerCase();
    
    // Check if it's a tag-specific search
    if (searchTerm.startsWith('tag:')) {
      const tagSearch = searchTerm.replace('tag:', '').trim();
      this.filteredForms = this.forms.filter(form => {
        if (form.schema?.metadata?.tags) {
          return form.schema.metadata.tags.some(tag => 
            tag.toLowerCase().includes(tagSearch)
          );
        }
        return false;
      });
      return;
    }

    // Regular search across all fields
    this.filteredForms = this.forms.filter(form => {
      // Search in title
      if (form.title.toLowerCase().includes(searchTerm)) {
        return true;
      }

      // Search in description
      if (form.description && form.description.toLowerCase().includes(searchTerm)) {
        return true;
      }

      // Search in tags
      if (form.schema?.metadata?.tags) {
        return form.schema.metadata.tags.some(tag => 
          tag.toLowerCase().includes(searchTerm)
        );
      }

      return false;
    });
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filterForms();
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
          this.loadForms(); // Refresh the list and apply filters
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
              this.loadForms(); // Refresh the list and apply filters
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
}
