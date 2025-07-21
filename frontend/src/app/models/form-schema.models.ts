// Re-export generated models from OpenAPI spec - these now include all required properties
export * from '../generated/models';

import { Form } from '../generated/models/form';
import { FormField } from '../generated/models/formField';
import { FormFieldType } from '../generated/models/formFieldType';
import { FormStep } from '../generated/models/formStep';
import { SqlTable } from '../generated/models/sqlTable';
import { SqlColumn } from '../generated/models/sqlColumn';

// custom extended interfaces
export interface DragDropField {
  id: string;
  type: FormFieldType;
  label: string;
  icon: string;
  sqlColumn?: SqlColumn;
}

export interface FormDesignerState {
  schema: FormSchema;
  selectedField?: FormField;
  selectedStep?: FormStep;
  dragDropFields: DragDropField[];
  sqlTables: SqlTable[];
  previewMode: boolean;
}

export interface FormSchema extends Form {
  validationRules: ValidationRule[];
}

export interface ValidationRule {
  id: string;
  name: string;
  type: ValidationType;
  message: string;
  parameters?: { [key: string]: any };
}

export type ValidationType =
  | 'required'
  | 'min_length'
  | 'max_length'
  | 'pattern'
  | 'email'
  | 'url'
  | 'numeric'
  | 'min_value'
  | 'max_value'
  | 'date_range'
  | 'file_size'
  | 'file_type'
  | 'custom';

export interface CustomValidator {
  id: string;
  name: string;
  function: string; // JavaScript function as string
  async?: boolean;
  dependencies?: string[];
}

// Helper functions
export function generateFieldId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateFormId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
