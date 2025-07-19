/**
 * Schema generation helpers for OpenAPI specification
 */

/**
 * Generates JSON Schema from form schema
 */
function generateRequestSchemaFromForm(formSchema) {
  const properties = {};
  const required = [];

  // Process form fields
  const fieldsToProcess = formSchema.steps && formSchema.steps.length > 0
    ? formSchema.fields.filter(field => 
        formSchema.steps.some(step => step.fields.includes(field.id))
      )
    : formSchema.fields;

  for (const field of fieldsToProcess) {
    if (['section_header', 'divider'].includes(field.type)) {
      continue; // Skip non-input fields
    }

    if (field.required) {
      required.push(field.name);
    }

    properties[field.name] = generatePropertySchema(field);
  }

  return {
    type: 'object',
    title: `${formSchema.title} Form Data`,
    properties,
    required,
    additionalProperties: false
  };
}

/**
 * Generates property schema for a form field
 */
function generatePropertySchema(field) {
  const property = {
    title: field.label,
    description: field.helpText
  };

  // Set type based on field type
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
      property.format = 'tel';
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
      if (field.options) {
        property.enum = field.options.map(opt => opt.value);
      }
      break;
    case 'multiselect':
      property.type = 'array';
      property.items = { type: 'string' };
      if (field.options) {
        property.items.enum = field.options.map(opt => opt.value);
      }
      break;
    default:
      property.type = 'string';
  }

  // Add validation rules
  if (field.validation && field.validation.rules) {
    // This would need to be expanded based on your validation rule structure
    // For now, we'll add basic validation
  }

  if (field.defaultValue !== undefined) {
    property.default = field.defaultValue;
  }

  return property;
}

/**
 * Generates OpenAPI specification for a form
 */
function generateOpenAPISpecForForm(formSchema) {
  const requestSchema = generateRequestSchemaFromForm(formSchema);
  
  return {
    openapi: '3.0.3',
    info: {
      title: `${formSchema.title} API`,
      description: formSchema.description || `Validation API for ${formSchema.title}`,
      version: '1.0.0'
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
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/FormData' }
              }
            }
          },
          responses: {
            '200': {
              description: 'Validation successful',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ValidationSuccess' }
                }
              }
            },
            '400': {
              description: 'Validation failed',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ValidationError' }
                }
              }
            }
          }
        }
      }
    },
    components: {
      schemas: {
        FormData: requestSchema,
        ValidationSuccess: {
          type: 'object',
          properties: {
            valid: { type: 'boolean', enum: [true] },
            message: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        ValidationError: {
          type: 'object',
          properties: {
            valid: { type: 'boolean', enum: [false] },
            message: { type: 'string' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  code: { type: 'string' },
                  message: { type: 'string' },
                  value: {}
                }
              }
            },
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  };
}

module.exports = {
  generateRequestSchemaFromForm,
  generatePropertySchema,
  generateOpenAPISpecForForm
};
