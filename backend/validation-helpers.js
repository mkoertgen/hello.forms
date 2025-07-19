/**
 * Validation helpers using AJV
 */

const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const { generateRequestSchemaFromForm } = require('./schema-helpers');

// Initialize AJV
const ajv = new Ajv({ allErrors: true, verbose: true, strict: false });
addFormats(ajv);

// Add custom formats
ajv.addFormat('tel', /^[+]?[0-9\s\-\(\)]+$/);

// Add custom keywords for form field metadata
ajv.addKeyword({
  keyword: 'x-field-type',
  schemaType: 'string',
  compile: () => () => true
});

ajv.addKeyword({
  keyword: 'x-validation-message',
  schemaType: 'string',
  compile: () => () => true
});

ajv.addKeyword({
  keyword: 'x-conditional',
  schemaType: 'object',
  compile: () => () => true
});

/**
 * Validates form data using AJV
 */
function validateFormData(formSchema, formData) {
  try {
    const schema = generateRequestSchemaFromForm(formSchema);
    const validate = ajv.compile(schema);
    const isValid = validate(formData);
    
    const errors = [];
    if (!isValid && validate.errors) {
      for (const error of validate.errors) {
        const fieldPath = error.instancePath ? error.instancePath.slice(1) : '';
        const field = fieldPath || error.params?.missingProperty || 'root';
        
        errors.push({
          field,
          code: error.keyword,
          message: getErrorMessage(error, formSchema, field),
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
        message: `Schema validation error: ${error.message}`,
        value: formData
      }],
      timestamp: new Date().toISOString(),
      message: 'Schema validation error'
    };
  }
}

/**
 * Gets user-friendly error messages for validation errors
 */
function getErrorMessage(error, formSchema, fieldName) {
  const field = formSchema.fields.find(f => f.name === fieldName);
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
 * Validates a single field value
 */
function validateField(field, value) {
  const tempSchema = {
    title: 'Temp Schema',
    fields: [field]
  };
  
  const tempData = {};
  tempData[field.name] = value;
  
  return validateFormData(tempSchema, tempData);
}

module.exports = {
  validateFormData,
  validateField,
  getErrorMessage,
  ajv
};
