// ...existing imports...
import { FormSchema } from '../../models/form-schema.models';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { Subscription } from 'rxjs';

import { FormDesignerService } from '../../services/form-designer.service';
import { SqlSchemaService } from '../../services/sql-schema.service';
import { FormPreviewComponent } from '../form-preview/form-preview.component';
import { 
  FormDesignerState, 
  FormField, 
  SQLTable, 
  SQLColumn,
  DragDropField,
  FormStep
} from '../../models/form-schema.models';

@Component({
  selector: 'app-form-designer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    MatSidenavModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatTabsModule,
    MatExpansionModule,
    MatToolbarModule,
    MatListModule,
    MatChipsModule,
    FormPreviewComponent
  ],
  templateUrl: './form-designer.component.html',
  styleUrls: ['./form-designer.component.scss']
})
export class FormDesignerComponent implements OnInit, OnDestroy {
  state: FormDesignerState;
  private subscription = new Subscription();

  constructor(
    private formDesignerService: FormDesignerService,
    private sqlSchemaService: SqlSchemaService,
    private http: HttpClient
  ) {
    this.state = this.formDesignerService.getState();
  }
  // --- Save/Load Form Logic ---
  onSaveForm(): void {
    const schema = this.state.schema;
    
    // Validate form before saving
    if (!schema.title || schema.title.trim().length === 0) {
      alert('Please enter a form title before saving.');
      return;
    }
    
    const isUpdate = !!schema.metadata.originalId || this.isExistingForm(schema);
    
    console.log('Saving form:', {
      title: schema.title,
      isUpdate,
      originalId: schema.metadata.originalId,
      currentId: schema.metadata.id,
      createdAt: schema.metadata.createdAt
    });
    
    this.formDesignerService.saveFormSchema(schema).subscribe({
      next: (savedSchema) => {
        const action = isUpdate ? 'updated' : 'created';
        console.log(`Form ${action} successfully:`, savedSchema);
        
        // Update the current schema with the saved data
        this.formDesignerService.updateState({ schema: savedSchema });
        
        // Show success message with any ID changes
        const idChanged = schema.metadata.id !== savedSchema.metadata.id;
        const idMessage = idChanged ? ` (ID changed from "${schema.metadata.id}" to "${savedSchema.metadata.id}")` : '';
        
        alert(`Form "${savedSchema.title}" ${action} successfully with ID: ${savedSchema.metadata.id}${idMessage}`);
      },
      error: (err) => {
        console.error('Save error details:', {
          status: err.status,
          statusText: err.statusText,
          error: err.error,
          url: err.url,
          message: err.message
        });
        
        if (err.status === 404) {
          alert(`Error: Form not found (404). The form may have been deleted or the ID changed.\n\nDetails: ${err.error?.message || err.message}`);
        } else if (err.status === 409) {
          alert('A form with this title already exists. Please choose a different title.');
        } else {
          alert(`Error saving form (${err.status}): ${err.error?.message || err.message || 'Unknown error'}`);
        }
      }
    });
  }

  private isExistingForm(schema: FormSchema): boolean {
    // Check if this form was loaded from the API (has creation date that's not recent)
    const createdAt = new Date(schema.metadata.createdAt);
    const now = new Date();
    const timeDiff = now.getTime() - createdAt.getTime();
    // If created more than 1 minute ago, consider it existing
    return timeDiff > 60000;
  }

  ngOnInit(): void {
    this.subscription.add(
      this.formDesignerService.state$.subscribe(state => {
        this.state = state;
      })
    );

    this.subscription.add(
      this.sqlSchemaService.tables$.subscribe(tables => {
        this.formDesignerService.updateState({ sqlTables: tables });
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  // Helper method to get connected drop lists
  getConnectedDropLists(): string[] {
    const lists = ['field-palette', 'main-drop-zone'];
    
    // Add SQL column drop lists for each table
    if (this.state.sqlTables) {
      for (let i = 0; i < this.state.sqlTables.length; i++) {
        lists.push(`sql-columns-${i}`);
      }
    }
    
    // Add step drop zones if they exist
    if (this.state.schema.steps) {
      for (let i = 0; i < this.state.schema.steps.length; i++) {
        lists.push(`step-drop-zone-${i}`);
      }
    }
    
    return lists;
  }

  // Helper method to get target drop lists (for SQL columns - they should only drop into form areas)
  getTargetDropLists(): string[] {
    const lists = ['main-drop-zone'];
    
    // Add step drop zones if they exist
    if (this.state.schema.steps) {
      for (let i = 0; i < this.state.schema.steps.length; i++) {
        lists.push(`step-drop-zone-${i}`);
      }
    }
    
    return lists;
  }

  // Drag and Drop Operations
  onFieldDrop(event: CdkDragDrop<any[]>): void {

    // Check if dropping into a step
    const containerId = event.container.id;
    const isStepDrop = containerId.startsWith('step-drop-zone-');
    const isMainDrop = containerId === 'main-drop-zone';

    if (event.previousContainer === event.container) {
      // Reorder existing fields within the same container
      if (isStepDrop) {
        // Reordering within a step
        const stepIndex = parseInt(containerId.replace('step-drop-zone-', ''));
        this.formDesignerService.moveFieldInStep(stepIndex, event.previousIndex, event.currentIndex);
      } else if (isMainDrop) {
        // Reordering in main form area
        this.formDesignerService.moveField(event.previousIndex, event.currentIndex);
      }
    } else {
      // Moving between containers or adding new field
      const dragData = event.item.data;
      
      // Check if it has the structure of a DragDropField (from palette)
      if (dragData && 'type' in dragData && 'label' in dragData && 'icon' in dragData) {
        const dragDropField = dragData as DragDropField;
        
        if (isStepDrop) {
          const stepIndex = parseInt(containerId.replace('step-drop-zone-', ''));
          this.addFieldFromPaletteToStep(dragDropField, stepIndex, event.currentIndex);
        } else if (isMainDrop) {
          this.addFieldFromPalette(dragDropField, event.currentIndex);
        }
      } else if (dragData && 'name' in dragData && 'type' in dragData) {
        // Handle SQL column drop
        const column = dragData as SQLColumn;
        const tableName = this.findTableNameForColumn(column);
        if (tableName) {
          const field = this.formDesignerService.createFieldFromSqlColumn(column, tableName);
          
          if (isStepDrop) {
            const stepIndex = parseInt(containerId.replace('step-drop-zone-', ''));
            this.formDesignerService.addFieldToStep(field, stepIndex, event.currentIndex);
          } else if (isMainDrop) {
            this.formDesignerService.addField(field, event.currentIndex);
          }
        } else {
          console.error('Could not find table for column:', column);
        }
      } else {
        console.error('Unknown drag data structure:', dragData);
      }
    }
  }

  // Add method to handle adding fields to steps
  private addFieldFromPaletteToStep(dragDropField: DragDropField, stepIndex: number, insertAt: number): void {
    const field: Partial<FormField> = {
      type: dragDropField.type,
      label: dragDropField.label,
      name: dragDropField.label.toLowerCase().replace(/\s+/g, '_')
    };
    
    const newField = this.formDesignerService.createField(field);
    this.formDesignerService.addFieldToStep(newField, stepIndex, insertAt);
  }

  onSqlColumnDrop(event: CdkDragDrop<any[]>): void {
    if (event.previousContainer !== event.container) {
      const column = event.previousContainer.data[event.previousIndex] as SQLColumn;
      const tableName = this.findTableNameForColumn(column);
      if (tableName) {
        const field = this.formDesignerService.createFieldFromSqlColumn(column, tableName);
        this.formDesignerService.addField(field, event.currentIndex);
      }
    }
  }

  private addFieldFromPalette(dragDropField: DragDropField, insertAt: number): void {
    const field: Partial<FormField> = {
      type: dragDropField.type,
      label: dragDropField.label,
      name: dragDropField.label.toLowerCase().replace(/\s+/g, '_')
    };

    if (dragDropField.sqlColumn) {
      const tableName = this.findTableNameForColumn(dragDropField.sqlColumn);
      if (tableName) {
        const fullField = this.formDesignerService.createFieldFromSqlColumn(
          dragDropField.sqlColumn, 
          tableName
        );
        this.formDesignerService.addField(fullField, insertAt);
        return;
      }
    }

    this.formDesignerService.addField(field, insertAt);
  }

  private findTableNameForColumn(column: SQLColumn): string | null {
    for (const table of this.state.sqlTables) {
      if (table.columns.some(col => col.name === column.name && col.type === column.type)) {
        return table.name;
      }
    }
    return null;
  }

  // Field Operations
  selectField(field: FormField): void {
    this.formDesignerService.selectField(field.id);
  }

  updateSelectedField(updates: Partial<FormField>): void {
    if (this.state.selectedField) {
      this.formDesignerService.updateField(this.state.selectedField.id, updates);
    }
  }

  onFieldPropertyChange(event: Event, property: keyof FormField): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    this.updateSelectedField({ [property]: target.value });
  }

  removeField(fieldId: string): void {
    this.formDesignerService.removeField(fieldId);
  }

  duplicateField(field: FormField): void {
    const duplicated = { 
      ...field, 
      id: undefined, 
      name: `${field.name}_copy`,
      label: `${field.label} (Copy)`
    };
    this.formDesignerService.addField(duplicated);
  }

  // Form Operations
  updateFormTitle(title: string): void {
    this.formDesignerService.updateState({
      schema: { ...this.state.schema, title }
    });
  }

  updateFormDescription(description: string): void {
    this.formDesignerService.updateState({
      schema: { ...this.state.schema, description }
    });
  }

  onFormTitleChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.updateFormTitle(target.value);
  }

  onFormDescriptionChange(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.updateFormDescription(target.value);
  }

  // Tag management
  get formTags(): string[] {
    return this.state.schema.metadata.tags || [];
  }

  addTag(tag: string): void {
    if (!tag.trim()) return;
    
    const normalizedTag = tag.trim().toLowerCase();
    const currentTags = this.formTags.map(t => t.toLowerCase());
    
    if (currentTags.includes(normalizedTag)) return;
    
    const updatedTags = [...this.formTags, tag.trim()];
    this.formDesignerService.updateState({
      schema: {
        ...this.state.schema,
        metadata: {
          ...this.state.schema.metadata,
          tags: updatedTags
        }
      }
    });
  }

  removeTag(tagToRemove: string): void {
    const updatedTags = this.formTags.filter(tag => tag !== tagToRemove);
    this.formDesignerService.updateState({
      schema: {
        ...this.state.schema,
        metadata: {
          ...this.state.schema.metadata,
          tags: updatedTags
        }
      }
    });
  }

  trackByTag(index: number, tag: string): string {
    return tag;
  }

  // Step/Wizard Operations
  addStep(): void {
    this.formDesignerService.addStep({
      title: `Step ${(this.state.schema.steps?.length || 0) + 1}`,
      description: 'Enter step description'
    });
  }

  updateStep(stepId: string, updates: Partial<FormStep>): void {
    this.formDesignerService.updateStep(stepId, updates);
  }

  onStepTitleChange(event: Event, stepId: string): void {
    const target = event.target as HTMLInputElement;
    this.updateStep(stepId, { title: target.value });
  }

  onStepDescriptionChange(event: Event, stepId: string): void {
    const target = event.target as HTMLTextAreaElement;
    this.updateStep(stepId, { description: target.value });
  }

  removeStep(stepId: string): void {
    this.formDesignerService.removeStep(stepId);
  }

  onStepReorder(event: CdkDragDrop<FormStep[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      this.formDesignerService.moveStep(event.previousIndex, event.currentIndex);
    }
  }

  addFieldToStep(stepId: string, fieldId: string): void {
    const step = this.state.schema.steps?.find(s => s.id === stepId);
    if (step) {
      const updatedFields = [...step.fields, fieldId];
      this.formDesignerService.updateStep(stepId, { fields: updatedFields });
    }
  }

  removeFieldFromStep(stepId: string, fieldId: string): void {
    const step = this.state.schema.steps?.find(s => s.id === stepId);
    if (step) {
      const updatedFields = step.fields.filter(id => id !== fieldId);
      this.formDesignerService.updateStep(stepId, { fields: updatedFields });
    }
  }

  // Preview Operations
  togglePreview(): void {
    this.formDesignerService.updateState({
      previewMode: !this.state.previewMode
    });
  }

  // Utility methods
  getFieldIcon(fieldType: string): string {
    const fieldTypeMap: { [key: string]: string } = {
      'text': 'text_fields',
      'email': 'email',
      'password': 'lock',
      'number': 'pin',
      'tel': 'phone',
      'url': 'link',
      'textarea': 'notes',
      'select': 'arrow_drop_down',
      'multiselect': 'checklist',
      'radio': 'radio_button_checked',
      'checkbox': 'check_box',
      'date': 'date_range',
      'datetime': 'schedule',
      'time': 'access_time',
      'file': 'attach_file',
      'image': 'image',
      'range': 'tune',
      'hidden': 'visibility_off',
      'section_header': 'title',
      'divider': 'horizontal_rule'
    };
    return fieldTypeMap[fieldType] || 'help';
  }

  getSqlTypeIcon(sqlType: string): string {
    const typeMap: { [key: string]: string } = {
      'INTEGER': 'pin',
      'VARCHAR': 'text_fields',
      'TEXT': 'notes',
      'BOOLEAN': 'check_box',
      'DATE': 'date_range',
      'DATETIME': 'schedule',
      'TIMESTAMP': 'schedule',
      'DECIMAL': 'pin',
      'FLOAT': 'pin'
    };
    return typeMap[sqlType] || 'storage';
  }

  getStepFields(step: FormStep): FormField[] {
    return this.state.schema.fields.filter(field => step.fields.includes(field.id));
  }

  getOptionsText(options?: any[]): string {
    if (!options || options.length === 0) return '';
    return options.map(opt => typeof opt === 'string' ? opt : opt.label || opt.value).join('\n');
  }

  updateFieldOptions(optionsText: string): void {
    if (!this.state.selectedField) return;
    
    const options = optionsText
      .split('\n')
      .filter(line => line.trim())
      .map(line => ({
        value: line.trim(),
        label: line.trim()
      }));
    
    this.updateSelectedField({ options });
  }

  onFieldOptionsChange(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.updateFieldOptions(target.value);
  }
}
