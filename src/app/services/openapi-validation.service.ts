import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import Ajv, { JSONSchemaType, ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { OpenAPIV3 } from 'openapi-types';
import { FormSchema, FormField, JSONSchema, JSONSchemaProperty, OpenAPIValidationSchema, FormFieldType } from '../models/form-schema.models';

@Injectable({
  providedIn: 'root'
})
export class OpenAPIValidationService {
  private ajv: Ajv;
  private validatorCache = new Map<string, ValidateFunction>();

  constructor(private http: HttpClient) {
    // Initialize AJV with formats support
    this.ajv = new Ajv({ 
      allErrors: true, 
      verbose: true,
      strict: false,
      removeAdditional: true
    });
    addFormats(this.ajv);
    
    // Add custom formats
    this.addCustomFormats();
  }

  private addCustomFormats(): void {
    // Add tel format for phone numbers
    this.ajv.addFormat('tel', /^[+]?[0-9\s\-\(\)]+$/);
    
    // Add custom validation keywords if needed
    this.ajv.addKeyword({
      keyword: 'x-field-type',
      schemaType: 'string',
      compile: () => () => true // Always valid, just metadata
    });
    
    this.ajv.addKeyword({
      keyword: 'x-validation-message',
      schemaType: 'string',
      compile: () => () => true // Always valid, just metadata
    });
    
    this.ajv.addKeyword({
      keyword: 'x-conditional',
      schemaType: 'object',
      compile: () => () => true // Always valid, just metadata
    });
  }

  /**
   * Generates an OpenAPI 3.0 specification for form validation
   */
  generateOpenAPISpec(formSchema: FormSchema): OpenAPIV3.Document {
    const requestSchema = this.generateRequestSchema(formSchema);
    
    const spec: OpenAPIV3.Document = {
      openapi: '3.0.3',
      info: {
        title: `${formSchema.title} API`,
        description: formSchema.description || `Validation API for ${formSchema.title}`,
        version: formSchema.version || '1.0.0'
      },
      servers: [
        {
          url: '/api',
          description: 'API server'
        }
      ],
      paths: {
        [`/forms/${formSchema.metadata.id}/validate`]: {
          post: {
            summary: `Validate ${formSchema.title} form data`,
            description: `Validates form data against the schema for ${formSchema.title}`,
            operationId: `validate${this.toPascalCase(formSchema.title)}`,
            tags: ['Form Validation'],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/FormData'
                  }
                }
              }
            },
            responses: {
              '200': {
                description: 'Validation successful',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ValidationSuccess'
                    }
                  }
                }
              },
              '400': {
                description: 'Validation failed',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ValidationError'
                    }
                  }
                }
              }
            }
          }
        },
        [`/forms/${formSchema.metadata.id}/submit`]: {
          post: {
            summary: `Submit ${formSchema.title} form`,
            description: `Submits and processes form data for ${formSchema.title}`,
            operationId: `submit${this.toPascalCase(formSchema.title)}`,
            tags: ['Form Submission'],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/FormData'
                  }
                }
              }
            },
            responses: {
              '201': {
                description: 'Form submitted successfully',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/SubmissionResponse'
                    }
                  }
                }
              },
              '400': {
                description: 'Invalid form data',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ValidationError'
                    }
                  }
                }
              }
            }
          }
        },
        [`/forms/${formSchema.metadata.id}/_openapi`]: {
          get: {
            summary: `Get OpenAPI specification for ${formSchema.title}`,
            description: 'Returns the OpenAPI specification for this form',
            operationId: `getOpenAPISpec${this.toPascalCase(formSchema.title)}`,
            tags: ['OpenAPI'],
            responses: {
              '200': {
                description: 'OpenAPI specification',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      description: 'OpenAPI 3.0 specification'
                    }
                  },
                  'application/x-yaml': {
                    schema: {
                      type: 'string',
                      description: 'OpenAPI 3.0 specification in YAML format'
                    }
                  }
                }
              }
            }
          }
        }
      },
      components: {
        schemas: {
          FormData: requestSchema as OpenAPIV3.SchemaObject,
          ValidationSuccess: {
            type: 'object',
            title: 'Validation Success Response',
            properties: {
              valid: { type: 'boolean', enum: [true] },
              message: { type: 'string', example: 'Validation successful' },
              timestamp: { type: 'string', format: 'date-time' }
            },
            required: ['valid'],
            additionalProperties: false
          },
          ValidationError: {
            type: 'object',
            title: 'Validation Error Response',
            properties: {
              valid: { type: 'boolean', enum: [false] },
              message: { type: 'string', example: 'Validation failed' },
              errors: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/FieldError'
                }
              },
              timestamp: { type: 'string', format: 'date-time' }
            },
            required: ['valid', 'errors'],
            additionalProperties: false
          },
          FieldError: {
            type: 'object',
            title: 'Field Validation Error',
            properties: {
              field: { 
                type: 'string', 
                description: 'Field name that failed validation',
                example: 'email'
              },
              code: { 
                type: 'string', 
                description: 'Validation error code',
                enum: ['required', 'minLength', 'maxLength', 'pattern', 'format', 'minimum', 'maximum', 'enum'],
                example: 'required'
              },
              message: { 
                type: 'string', 
                description: 'Human-readable error message',
                example: 'Email is required'
              },
              value: { 
                description: 'The invalid value that was provided'
              }
            },
            required: ['field', 'code', 'message'],
            additionalProperties: false
          },
          SubmissionResponse: {
            type: 'object',
            title: 'Form Submission Response',
            properties: {
              id: { 
                type: 'string', 
                description: 'Unique submission ID',
                example: 'sub_1234567890'
              },
              submittedAt: { 
                type: 'string', 
                format: 'date-time',
                description: 'Submission timestamp'
              },
              status: { 
                type: 'string', 
                enum: ['submitted', 'processing', 'completed', 'failed'],
                description: 'Current submission status',
                example: 'submitted'
              }
            },
            required: ['id', 'submittedAt', 'status'],
            additionalProperties: false
          }
        }
      }
    };

    return spec;
  }

  private toPascalCase(str: string): string {
    return str.replace(/\w+/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).replace(/\s+/g, '');
  }

  /**
   * Generates JSON Schema for form request validation
   */
  private generateRequestSchema(formSchema: FormSchema): JSONSchema {
    const properties: { [key: string]: JSONSchemaProperty } = {};
    const required: string[] = [];

    // Process steps or direct fields
    if (formSchema.steps && formSchema.steps.length > 0) {
      // Multi-step form
      for (const step of formSchema.steps) {
        const stepFields = formSchema.fields.filter(field => step.fields.includes(field.id));
        for (const field of stepFields) {
          this.addFieldToSchema(field, properties, required, formSchema);
        }
      }
    } else {
      // Single-step form
      for (const field of formSchema.fields) {
        this.addFieldToSchema(field, properties, required, formSchema);
      }
    }

    return {
      type: 'object',
      title: `${formSchema.title} Form Data`,
      description: `Input schema for ${formSchema.title}`,
      properties,
      required,
      additionalProperties: false
    };
  }

  /**
   * Adds a form field to the JSON schema
   */
  private addFieldToSchema(
    field: FormField,
    properties: { [key: string]: JSONSchemaProperty },
    required: string[],
    formSchema: FormSchema
  ): void {
    // Skip non-input fields
    if (['section_header', 'divider'].includes(field.type)) {
      return;
    }

    if (field.required) {
      required.push(field.name);
    }

    const property: JSONSchemaProperty = {
      type: 'string', // Default type, will be overridden
      title: field.label,
      description: field.helpText,
      'x-field-type': field.type
    };

    // Set type and format based on field type
    this.setPropertyTypeAndFormat(field, property);

    // Add validation rules from field validation
    this.addValidationRules(field, property, formSchema);

    // Add conditional logic
    if (field.conditional) {
      property['x-conditional'] = field.conditional;
    }

    // Add default value
    if (field.defaultValue !== undefined) {
      property.default = field.defaultValue;
    }

    // Add options for select/radio fields
    if (field.options && field.options.length > 0) {
      property.enum = field.options.map(opt => opt.value);
      property.examples = field.options.map(opt => opt.value);
    }

    properties[field.name] = property;
  }

  /**
   * Sets the JSON Schema type and format based on form field type
   */
  private setPropertyTypeAndFormat(field: FormField, property: JSONSchemaProperty): void {
    switch (field.type) {
      case 'text':
      case 'textarea':
      case 'password':
      case 'hidden':
        property.type = 'string';
        break;
      case 'email':
        property.type = 'string';
        property.format = 'email';
        break;
      case 'url':
        property.type = 'string';
        property.format = 'uri';
        break;
      case 'tel':
        property.type = 'string';
        property.pattern = '^[+]?[0-9\\s\\-\\(\\)]+$';
        break;
      case 'number':
      case 'range':
        property.type = 'number';
        break;
      case 'date':
        property.type = 'string';
        property.format = 'date';
        break;
      case 'datetime':
        property.type = 'string';
        property.format = 'date-time';
        break;
      case 'time':
        property.type = 'string';
        property.format = 'time';
        break;
      case 'checkbox':
        property.type = 'boolean';
        break;
      case 'select':
      case 'radio':
        property.type = 'string';
        break;
      case 'multiselect':
        property.type = 'array';
        property.items = { type: 'string' };
        break;
      case 'file':
      case 'image':
        property.type = 'string';
        property.format = 'binary';
        break;
      default:
        property.type = 'string';
    }
  }

  /**
   * Adds validation rules to the JSON Schema property
   */
  private addValidationRules(
    field: FormField,
    property: JSONSchemaProperty,
    formSchema: FormSchema
  ): void {
    if (!field.validation?.rules) return;

    for (const ruleId of field.validation.rules) {
      const rule = formSchema.validationRules?.find(r => r.id === ruleId);
      if (!rule) continue;

      // Apply JSON Schema from the validation rule
      if (rule.jsonSchema) {
        Object.assign(property, rule.jsonSchema);
      }

      // Apply built-in validation rules
      switch (rule.type) {
        case 'min_length':
          if (rule.parameters?.['value']) {
            property.minLength = rule.parameters['value'];
          }
          break;
        case 'max_length':
          if (rule.parameters?.['value']) {
            property.maxLength = rule.parameters['value'];
          }
          break;
        case 'pattern':
          if (rule.parameters?.['pattern']) {
            property.pattern = rule.parameters['pattern'];
          }
          break;
        case 'min_value':
          if (rule.parameters?.['value']) {
            property.minimum = rule.parameters['value'];
          }
          break;
        case 'max_value':
          if (rule.parameters?.['value']) {
            property.maximum = rule.parameters['value'];
          }
          break;
      }

      // Add custom validation message
      if (rule.message) {
        property['x-validation-message'] = rule.message;
      }
    }

    // Add field-level custom message
    if (field.validation.customMessage) {
      property['x-validation-message'] = field.validation.customMessage;
    }
  }

  /**
   * Generates response schemas for validation endpoints
   */
  private generateResponseSchema(): { success: JSONSchema; error: JSONSchema } {
    return {
      success: {
        type: 'object',
        title: 'Validation Success',
        properties: {
          valid: { type: 'boolean', const: true },
          message: { type: 'string', examples: ['Validation successful'] },
          timestamp: { type: 'string', format: 'date-time' }
        },
        required: ['valid'],
        additionalProperties: false
      },
      error: {
        type: 'object',
        title: 'Validation Error',
        properties: {
          valid: { type: 'boolean', const: false },
          message: { type: 'string', examples: ['Validation failed'] },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', description: 'Field name that failed validation' },
                code: { type: 'string', description: 'Validation error code' },
                message: { type: 'string', description: 'Human-readable error message' },
                value: { type: 'string', description: 'The invalid value that was provided' }
              },
              required: ['field', 'code', 'message'],
              additionalProperties: false
            }
          },
          timestamp: { type: 'string', format: 'date-time' }
        },
        required: ['valid', 'errors'],
        additionalProperties: false
      }
    };
  }

  /**
   * Validates form data against the generated JSON Schema using AJV
   */
  validateFormData(formSchema: FormSchema, formData: any): ValidationResult {
    try {
      const schema = this.generateRequestSchema(formSchema);
      const cacheKey = `${formSchema.metadata.id}_${formSchema.metadata.createdAt}`;
      
      let validator = this.validatorCache.get(cacheKey);
      if (!validator) {
        validator = this.ajv.compile(schema);
        this.validatorCache.set(cacheKey, validator);
      }

      const isValid = validator(formData);
      const errors: ValidationError[] = [];

      if (!isValid && validator.errors) {
        for (const error of validator.errors) {
          const fieldPath = error.instancePath ? error.instancePath.slice(1) : '';
          const field = fieldPath || (error.params as any)?.missingProperty || 'root';
          
          errors.push({
            field,
            code: error.keyword || 'unknown',
            message: this.getErrorMessage(error, formSchema, field),
            value: error.data
          });
        }
      }

      return {
        valid: isValid,
        errors,
        timestamp: new Date().toISOString(),
        message: isValid ? 'Validation successful' : 'Validation failed'
      };
    } catch (error) {
      return {
        valid: false,
        errors: [{
          field: 'root',
          code: 'schema_error',
          message: `Schema validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          value: formData
        }],
        timestamp: new Date().toISOString(),
        message: 'Schema validation error'
      };
    }
  }

  /**
   * Gets a user-friendly error message for AJV validation errors
   */
  private getErrorMessage(error: any, formSchema: FormSchema, fieldName: string): string {
    // First, try to get custom message from field validation rules
    const field = formSchema.fields.find(f => f.name === fieldName);
    if (field?.validation?.customMessage) {
      return field.validation.customMessage;
    }

    // Try to get message from validation rules
    if (field?.validation?.rules) {
      for (const ruleId of field.validation.rules) {
        const rule = formSchema.validationRules?.find(r => r.id === ruleId);
        if (rule && this.isMatchingValidationType(rule.type, error.keyword)) {
          return rule.message;
        }
      }
    }

    // Fallback to default AJV message with improvements
    const fieldLabel = field?.label || fieldName;
    
    switch (error.keyword) {
      case 'required':
        return `${fieldLabel} is required`;
      case 'type':
        return `${fieldLabel} must be of type ${error.schema}`;
      case 'format':
        return `${fieldLabel} must be a valid ${error.schema}`;
      case 'minLength':
        return `${fieldLabel} must be at least ${error.schema} characters long`;
      case 'maxLength':
        return `${fieldLabel} must not exceed ${error.schema} characters`;
      case 'minimum':
        return `${fieldLabel} must be at least ${error.schema}`;
      case 'maximum':
        return `${fieldLabel} must not exceed ${error.schema}`;
      case 'pattern':
        return `${fieldLabel} format is invalid`;
      case 'enum':
        return `${fieldLabel} must be one of: ${error.schema.join(', ')}`;
      default:
        return error.message || `${fieldLabel} is invalid`;
    }
  }

  /**
   * Validates form data against a remote API endpoint
   */
  validateFormDataRemote(formId: string, formData: any): Observable<ValidationResult> {
    return this.http.post<ValidationResult>(`/api/forms/${formId}/validate`, formData)
      .pipe(
        catchError((error) => {
          const validationResult: ValidationResult = {
            valid: false,
            errors: [{
              field: 'root',
              code: 'network_error',
              message: `Validation request failed: ${error.message || 'Network error'}`,
              value: formData
            }],
            timestamp: new Date().toISOString(),
            message: 'Network validation error'
          };
          return of(validationResult);
        })
      );
  }

  /**
   * Gets the OpenAPI specification from the server
   */
  getOpenAPISpec(formId: string, format: 'json' | 'yaml' = 'json'): Observable<any> {
    const headers = format === 'yaml' ? { 'Accept': 'application/x-yaml' } : { 'Accept': 'application/json' };
    return this.http.get(`/api/forms/${formId}/_openapi`, { headers });
  }

  /**
   * Clears the validator cache (useful when form schemas change)
   */
  clearValidatorCache(): void {
    this.validatorCache.clear();
  }

  /**
   * Checks if a validation rule type matches an AJV error keyword
   */
  private isMatchingValidationType(validationType: string, errorKeyword: string): boolean {
    const mapping: { [key: string]: string[] } = {
      'required': ['required'],
      'min_length': ['minLength'],
      'max_length': ['maxLength'],
      'pattern': ['pattern'],
      'email': ['format'],
      'url': ['format'],
      'numeric': ['type', 'pattern'],
      'min_value': ['minimum'],
      'max_value': ['maximum']
    };
    
    return mapping[validationType]?.includes(errorKeyword) || false;
  }
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  timestamp: string;
  message?: string;
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  value?: any;
}
