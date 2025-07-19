// Re-export generated models from OpenAPI spec - these now include all required properties
export * from '../generated/models';

// Import generated types for extensions
import type { 
  Form, 
  FormField,
  FormMetadata as GeneratedFormMetadata,
  ValidationRule as GeneratedValidationRule,
  ConditionalLogic as GeneratedConditionalLogic
} from '../generated/models';

// Use generated types directly since they now have all required properties
export type FormSchema = Form;
export type ExtendedFormField = FormField;

// Optional: Add frontend-specific extensions if needed
export interface ExtendedFormMetadata extends GeneratedFormMetadata {
  createdAt?: Date;
  updatedAt?: Date;
  category?: string;
}

// Multi-step form support (frontend-specific)
export interface FormStep {
  id: string;
  title: string;
  description?: string;
  order: number;
  fields: string[]; // field IDs
  conditionalLogic?: GeneratedConditionalLogic;
}

// Extended validation with custom functions (frontend-specific)
export interface ExtendedValidationRule extends GeneratedValidationRule {
  customValidation?: (value: any) => boolean | string;
}

// Custom validators for complex validation scenarios
export interface CustomValidator {
  id: string;
  name: string;
  description?: string;
  validator: (formData: any, field: FormField) => boolean | string;
  dependsOn?: string[]; // field IDs this validator depends on
}

// JSON Schema interfaces (still needed for AJV validation)
export interface JSONSchemaProperty {
  type: string;
  title?: string;
  description?: string;
  enum?: any[];
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  required?: boolean;
  default?: any;
  items?: JSONSchemaProperty;
  properties?: { [key: string]: JSONSchemaProperty };
  additionalProperties?: boolean | JSONSchemaProperty;
}

export interface JSONSchema {
  $schema?: string;
  type: 'object';
  title?: string;
  description?: string;
  properties: { [key: string]: JSONSchemaProperty };
  required?: string[];
  additionalProperties?: boolean;
}

// Helper functions
export function generateFieldId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateFormId(title: string): string {
  return title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
