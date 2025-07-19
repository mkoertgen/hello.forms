import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { 
  FormSchema, 
  FormField, 
  FormStep, 
  ValidationRule, 
  FormDesignerState,
  DragDropField,
  FormFieldType,
  SQLColumn
} from '../models/form-schema.models';

@Injectable({
  providedIn: 'root'
})
export class FormDesignerService {
  private apiUrl = 'http://localhost:3000/api';
  
  private initialState: FormDesignerState = {
    schema: {
      title: 'New Form',
      description: '',
      version: '1.0.0',
      metadata: {
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        author: 'User'
      },
      fields: [],
      validationRules: this.getDefaultValidationRules()
    },
    dragDropFields: this.getDefaultFieldTypes(),
    sqlTables: [],
    previewMode: false
  };

  private stateSubject = new BehaviorSubject<FormDesignerState>(this.initialState);
  public state$ = this.stateSubject.asObservable();

  constructor(private http: HttpClient) {}

  getState(): FormDesignerState {
    return this.stateSubject.value;
  }

  updateState(updates: Partial<FormDesignerState>): void {
    const currentState = this.stateSubject.value;
    const newState = { ...currentState, ...updates };
    
    if (updates.schema) {
      newState.schema.metadata.updatedAt = new Date();
    }
    
    this.stateSubject.next(newState);
  }

  // Form Schema Operations
  saveFormSchema(schema: FormSchema): Observable<FormSchema> {
    return this.http.post<FormSchema>(`${this.apiUrl}/forms`, schema);
  }

  loadFormSchema(id: string): Observable<FormSchema> {
    return this.http.get<FormSchema>(`${this.apiUrl}/forms/${id}`);
  }

  exportFormSchema(): string {
    const schema = this.getState().schema;
    return JSON.stringify(schema, null, 2);
  }

  importFormSchema(schemaJson: string): void {
    try {
      const schema: FormSchema = JSON.parse(schemaJson);
      this.updateState({ schema });
    } catch (error) {
      throw new Error('Invalid schema format');
    }
  }

  // Field Operations
  addField(field: Partial<FormField>, insertAt?: number): void {
    const currentState = this.getState();
    const newField: FormField = {
      id: this.generateId(),
      name: field.name || `field_${Date.now()}`,
      label: field.label || 'New Field',
      type: field.type || 'text',
      required: field.required || false,
      ...field
    };

    const fields = [...currentState.schema.fields];
    if (insertAt !== undefined && insertAt >= 0) {
      fields.splice(insertAt, 0, newField);
    } else {
      fields.push(newField);
    }

    this.updateState({
      schema: { ...currentState.schema, fields }
    });
  }

  updateField(fieldId: string, updates: Partial<FormField>): void {
    const currentState = this.getState();
    const fields = currentState.schema.fields.map(field =>
      field.id === fieldId ? { ...field, ...updates } : field
    );

    this.updateState({
      schema: { ...currentState.schema, fields }
    });
  }

  removeField(fieldId: string): void {
    const currentState = this.getState();
    const fields = currentState.schema.fields.filter(field => field.id !== fieldId);

    this.updateState({
      schema: { ...currentState.schema, fields }
    });
  }

  moveField(fromIndex: number, toIndex: number): void {
    const currentState = this.getState();
    const fields = [...currentState.schema.fields];
    const [movedField] = fields.splice(fromIndex, 1);
    fields.splice(toIndex, 0, movedField);

    this.updateState({
      schema: { ...currentState.schema, fields }
    });
  }

  selectField(fieldId: string): void {
    const currentState = this.getState();
    const selectedField = currentState.schema.fields.find(f => f.id === fieldId);
    this.updateState({ selectedField });
  }

  // Step/Wizard Operations
  addStep(step: Partial<FormStep>): void {
    const currentState = this.getState();
    const newStep: FormStep = {
      id: this.generateId(),
      title: step.title || 'New Step',
      order: step.order || (currentState.schema.steps?.length || 0) + 1,
      fields: step.fields || [],
      ...step
    };

    const steps = [...(currentState.schema.steps || []), newStep];
    this.updateState({
      schema: { ...currentState.schema, steps }
    });
  }

  updateStep(stepId: string, updates: Partial<FormStep>): void {
    const currentState = this.getState();
    const steps = (currentState.schema.steps || []).map(step =>
      step.id === stepId ? { ...step, ...updates } : step
    );

    this.updateState({
      schema: { ...currentState.schema, steps }
    });
  }

  removeStep(stepId: string): void {
    const currentState = this.getState();
    const steps = (currentState.schema.steps || []).filter(step => step.id !== stepId);

    this.updateState({
      schema: { ...currentState.schema, steps }
    });
  }

  // Validation Rules
  addValidationRule(rule: Partial<ValidationRule>): void {
    const currentState = this.getState();
    const newRule: ValidationRule = {
      id: this.generateId(),
      name: rule.name || 'New Rule',
      type: rule.type || 'required',
      message: rule.message || 'Validation failed',
      ...rule
    };

    const validationRules = [...currentState.schema.validationRules, newRule];
    this.updateState({
      schema: { ...currentState.schema, validationRules }
    });
  }

  // Field creation from SQL columns
  createFieldFromSqlColumn(column: SQLColumn, tableName: string): FormField {
    return {
      id: this.generateId(),
      name: `${tableName}_${column.name}`,
      label: this.generateFieldLabel(column.name),
      type: this.mapSqlTypeToFormFieldType(column.type, column.maxLength),
      sqlColumn: column.name,
      required: !column.nullable,
      placeholder: this.generatePlaceholder(column),
      validation: {
        rules: this.generateValidationRules(column)
      }
    };
  }

  // Utility Methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private generateFieldLabel(columnName: string): string {
    return columnName
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  private generatePlaceholder(column: SQLColumn): string {
    switch (column.type) {
      case 'VARCHAR':
        if (column.name.toLowerCase().includes('email')) return 'Enter email address';
        if (column.name.toLowerCase().includes('phone')) return 'Enter phone number';
        if (column.name.toLowerCase().includes('name')) return 'Enter name';
        return `Enter ${this.generateFieldLabel(column.name).toLowerCase()}`;
      case 'INTEGER':
      case 'DECIMAL':
      case 'FLOAT':
        return 'Enter number';
      case 'DATE':
        return 'Select date';
      case 'DATETIME':
      case 'TIMESTAMP':
        return 'Select date and time';
      case 'TEXT':
        return 'Enter detailed information';
      default:
        return `Enter ${this.generateFieldLabel(column.name).toLowerCase()}`;
    }
  }

  private mapSqlTypeToFormFieldType(sqlType: string, maxLength?: number): FormFieldType {
    switch (sqlType) {
      case 'INTEGER':
      case 'FLOAT':
      case 'DECIMAL':
        return 'number';
      case 'BOOLEAN':
        return 'checkbox';
      case 'DATE':
        return 'date';
      case 'DATETIME':
      case 'TIMESTAMP':
        return 'datetime';
      case 'VARCHAR':
        if (maxLength && maxLength > 255) return 'textarea';
        return 'text';
      case 'TEXT':
        return 'textarea';
      default:
        return 'text';
    }
  }

  private generateValidationRules(column: SQLColumn): string[] {
    const rules: string[] = [];
    
    if (!column.nullable) {
      rules.push('required');
    }
    
    if (column.maxLength) {
      rules.push(`max_length_${column.maxLength}`);
    }
    
    return rules;
  }

  private getDefaultValidationRules(): ValidationRule[] {
    return [
      { id: 'required', name: 'Required', type: 'required', message: 'This field is required' },
      { id: 'email', name: 'Email', type: 'email', message: 'Please enter a valid email address' },
      { id: 'numeric', name: 'Numeric', type: 'numeric', message: 'Please enter a valid number' },
      { id: 'min_length_3', name: 'Min Length 3', type: 'min_length', message: 'Must be at least 3 characters', parameters: { min: 3 } },
      { id: 'max_length_255', name: 'Max Length 255', type: 'max_length', message: 'Must be less than 255 characters', parameters: { max: 255 } }
    ];
  }

  private getDefaultFieldTypes(): DragDropField[] {
    return [
      { id: 'text', type: 'text', label: 'Text Input', icon: 'text_fields' },
      { id: 'email', type: 'email', label: 'Email', icon: 'email' },
      { id: 'number', type: 'number', label: 'Number', icon: 'pin' },
      { id: 'textarea', type: 'textarea', label: 'Text Area', icon: 'notes' },
      { id: 'select', type: 'select', label: 'Dropdown', icon: 'arrow_drop_down' },
      { id: 'radio', type: 'radio', label: 'Radio Buttons', icon: 'radio_button_checked' },
      { id: 'checkbox', type: 'checkbox', label: 'Checkbox', icon: 'check_box' },
      { id: 'date', type: 'date', label: 'Date Picker', icon: 'date_range' },
      { id: 'datetime', type: 'datetime', label: 'Date Time', icon: 'schedule' },
      { id: 'file', type: 'file', label: 'File Upload', icon: 'attach_file' },
      { id: 'section_header', type: 'section_header', label: 'Section Header', icon: 'title' },
      { id: 'divider', type: 'divider', label: 'Divider', icon: 'horizontal_rule' }
    ];
  }
}
