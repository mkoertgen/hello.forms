// SQL Schema Models
export interface SQLTable {
  name: string;
  columns: SQLColumn[];
  relationships?: SQLRelationship[];
}

export interface SQLColumn {
  name: string;
  type: SQLDataType;
  nullable: boolean;
  primaryKey: boolean;
  foreignKey?: string;
  maxLength?: number;
  defaultValue?: any;
  constraints?: string[];
}

export interface SQLRelationship {
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  targetTable: string;
  foreignKey: string;
  targetKey: string;
}

export type SQLDataType = 
  | 'INTEGER' 
  | 'VARCHAR' 
  | 'TEXT' 
  | 'BOOLEAN' 
  | 'DATE' 
  | 'DATETIME' 
  | 'DECIMAL' 
  | 'FLOAT' 
  | 'TIMESTAMP';

// Form Schema Models (OpenAPI-like structure)
export interface FormSchema {
  $schema?: string;
  title: string;
  description?: string;
  version: string;
  metadata: FormMetadata;
  steps?: FormStep[];
  fields: FormField[];
  validationRules: ValidationRule[];
  customValidators?: CustomValidator[];
}

export interface FormMetadata {
  id: string;
  originalId?: string; // Tracks the original ID when title changes
  createdAt: Date;
  updatedAt: Date;
  author: string;
  tags?: string[];
  category?: string;
}

export interface FormStep {
  id: string;
  title: string;
  description?: string;
  order: number;
  fields: string[]; // field IDs
  validationRules?: string[]; // validation rule IDs
  conditionalLogic?: ConditionalLogic;
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FormFieldType;
  sqlColumn?: string; // maps to SQL column
  required: boolean;
  placeholder?: string;
  helpText?: string;
  defaultValue?: any;
  options?: FieldOption[];
  validation?: FieldValidation;
  conditional?: ConditionalLogic;
  layout?: FieldLayout;
  customAttributes?: { [key: string]: any };
}

export interface FieldOption {
  value: any;
  label: string;
  disabled?: boolean;
}

export interface FieldValidation {
  rules: string[]; // references to validation rule IDs
  customMessage?: string;
}

export interface ConditionalLogic {
  show?: ConditionalRule[];
  hide?: ConditionalRule[];
  required?: ConditionalRule[];
  readonly?: ConditionalRule[];
}

export interface ConditionalRule {
  field: string;
  operator: ConditionalOperator;
  value: any;
  logic?: 'AND' | 'OR';
}

export type ConditionalOperator = 
  | 'equals' 
  | 'not_equals' 
  | 'greater_than' 
  | 'less_than' 
  | 'contains' 
  | 'not_contains' 
  | 'is_empty' 
  | 'is_not_empty';

export interface FieldLayout {
  width?: number; // percentage or grid columns
  order?: number;
  row?: number;
  column?: number;
  colspan?: number;
  rowspan?: number;
}

export type FormFieldType = 
  | 'text' 
  | 'email' 
  | 'password' 
  | 'number' 
  | 'tel' 
  | 'url' 
  | 'textarea' 
  | 'select' 
  | 'multiselect' 
  | 'radio' 
  | 'checkbox' 
  | 'date' 
  | 'datetime' 
  | 'time' 
  | 'file' 
  | 'image' 
  | 'range' 
  | 'hidden'
  | 'section_header'
  | 'divider';

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

// Designer-specific models
export interface DragDropField {
  id: string;
  type: FormFieldType;
  label: string;
  icon: string;
  sqlColumn?: SQLColumn;
}

export interface FormDesignerState {
  schema: FormSchema;
  selectedField?: FormField;
  selectedStep?: FormStep;
  dragDropFields: DragDropField[];
  sqlTables: SQLTable[];
  previewMode: boolean;
}
