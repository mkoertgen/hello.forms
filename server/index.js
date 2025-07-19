const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const yaml = require('js-yaml');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize SQLite database
const dbPath = path.join(__dirname, 'data', 'forms.db');
const dataDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Forms table
  db.run(`
    CREATE TABLE IF NOT EXISTS forms (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      schema_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // SQL schema tables metadata
  db.run(`
    CREATE TABLE IF NOT EXISTS sql_schemas (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tables_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Initialize AJV for validation
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

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Forms API',
      version: '1.0.0',
      description: 'Dynamic form builder and validation API'
    },
    servers: [
      {
        url: '/api',
        description: 'API server'
      }
    ]
  },
  apis: ['./index.js'] // Path to the API docs
};

const swaggerSpecs = swaggerJsdoc(swaggerOptions);

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Sample SQL schema data
const sampleSqlSchema = {
  id: 'sample-schema',
  name: 'Sample E-commerce Schema',
  tables: [
    {
      name: 'users',
      columns: [
        { name: 'id', type: 'INTEGER', nullable: false, primaryKey: true },
        { name: 'email', type: 'VARCHAR', nullable: false, primaryKey: false, maxLength: 255 },
        { name: 'first_name', type: 'VARCHAR', nullable: false, primaryKey: false, maxLength: 100 },
        { name: 'last_name', type: 'VARCHAR', nullable: false, primaryKey: false, maxLength: 100 },
        { name: 'phone', type: 'VARCHAR', nullable: true, primaryKey: false, maxLength: 20 },
        { name: 'birth_date', type: 'DATE', nullable: true, primaryKey: false },
        { name: 'is_active', type: 'BOOLEAN', nullable: false, primaryKey: false, defaultValue: true },
        { name: 'created_at', type: 'TIMESTAMP', nullable: false, primaryKey: false },
        { name: 'updated_at', type: 'TIMESTAMP', nullable: false, primaryKey: false }
      ]
    },
    {
      name: 'orders',
      columns: [
        { name: 'id', type: 'INTEGER', nullable: false, primaryKey: true },
        { name: 'user_id', type: 'INTEGER', nullable: false, primaryKey: false, foreignKey: 'users.id' },
        { name: 'order_number', type: 'VARCHAR', nullable: false, primaryKey: false, maxLength: 50 },
        { name: 'total_amount', type: 'DECIMAL', nullable: false, primaryKey: false },
        { name: 'order_date', type: 'DATETIME', nullable: false, primaryKey: false },
        { name: 'status', type: 'VARCHAR', nullable: false, primaryKey: false, maxLength: 20 },
        { name: 'shipping_address', type: 'TEXT', nullable: true, primaryKey: false },
        { name: 'notes', type: 'TEXT', nullable: true, primaryKey: false }
      ],
      relationships: [
        {
          type: 'many-to-many',
          targetTable: 'users',
          foreignKey: 'user_id',
          targetKey: 'id'
        }
      ]
    },
    {
      name: 'products',
      columns: [
        { name: 'id', type: 'INTEGER', nullable: false, primaryKey: true },
        { name: 'name', type: 'VARCHAR', nullable: false, primaryKey: false, maxLength: 200 },
        { name: 'description', type: 'TEXT', nullable: true, primaryKey: false },
        { name: 'price', type: 'DECIMAL', nullable: false, primaryKey: false },
        { name: 'category', type: 'VARCHAR', nullable: false, primaryKey: false, maxLength: 100 },
        { name: 'in_stock', type: 'BOOLEAN', nullable: false, primaryKey: false, defaultValue: true },
        { name: 'weight', type: 'FLOAT', nullable: true, primaryKey: false },
        { name: 'created_at', type: 'TIMESTAMP', nullable: false, primaryKey: false }
      ]
    }
  ]
};

// Insert sample data if not exists
db.get("SELECT * FROM sql_schemas WHERE id = ?", [sampleSqlSchema.id], (err, row) => {
  if (!row) {
    db.run(
      "INSERT INTO sql_schemas (id, name, tables_json) VALUES (?, ?, ?)",
      [sampleSqlSchema.id, sampleSqlSchema.name, JSON.stringify(sampleSqlSchema.tables)]
    );
  }
});

// API Routes

// Get all SQL tables
app.get('/api/tables', (req, res) => {
  db.get("SELECT * FROM sql_schemas WHERE id = ?", [sampleSqlSchema.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (row) {
      const tables = JSON.parse(row.tables_json);
      res.json(tables);
    } else {
      res.json([]);
    }
  });
});

// Get specific table
app.get('/api/tables/:tableName', (req, res) => {
  const tableName = req.params.tableName;
  
  db.get("SELECT * FROM sql_schemas WHERE id = ?", [sampleSqlSchema.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (row) {
      const tables = JSON.parse(row.tables_json);
      const table = tables.find(t => t.name === tableName);
      
      if (table) {
        res.json(table);
      } else {
        res.status(404).json({ error: 'Table not found' });
      }
    } else {
      res.status(404).json({ error: 'Schema not found' });
    }
  });
});

// Upload SQL schema file
app.post('/api/upload-schema', (req, res) => {
  // This would handle file upload and parse SQL schema
  // For now, returning sample data
  res.json(sampleSqlSchema.tables);
});

// Form CRUD operations

// Get all forms
app.get('/api/forms', (req, res) => {
  db.all("SELECT * FROM forms ORDER BY updated_at DESC", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    const forms = rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      created_at: row.created_at,
      updated_at: row.updated_at,
      schema: JSON.parse(row.schema_json)
    }));
    
    res.json(forms);
  });
});

// Get specific form
app.get('/api/forms/:id', (req, res) => {
  const formId = req.params.id;
  
  db.get("SELECT * FROM forms WHERE id = ?", [formId], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (row) {
      const form = {
        id: row.id,
        title: row.title,
        description: row.description,
        created_at: row.created_at,
        updated_at: row.updated_at,
        schema: JSON.parse(row.schema_json)
      };
      res.json(form.schema);
    } else {
      res.status(404).json({ error: 'Form not found' });
    }
  });
});

// Create new form
app.post('/api/forms', (req, res) => {
  const schema = req.body;
  const formId = schema.metadata?.id || generateTitleSlug(schema.title);
  
  const formData = {
    id: formId,
    title: schema.title,
    description: schema.description || '',
    schema_json: JSON.stringify(schema)
  };
  
  // Check if form with this ID already exists
  db.get("SELECT id FROM forms WHERE id = ?", [formId], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (row) {
      res.status(409).json({ error: 'A form with this title already exists' });
      return;
    }
    
    db.run(
      `INSERT INTO forms (id, title, description, schema_json) 
       VALUES (?, ?, ?, ?)`,
      [formData.id, formData.title, formData.description, formData.schema_json],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        // Return the saved schema with the generated ID
        schema.metadata.id = formId;
        res.status(201).json(schema);
      }
    );
  });
});

// Update form
app.put('/api/forms/:id', (req, res) => {
  const formId = req.params.id;
  const schema = req.body;
  
  // Generate new ID based on the current title
  const newFormId = generateTitleSlug(schema.title);
  
  const formData = {
    title: schema.title,
    description: schema.description || '',
    schema_json: JSON.stringify(schema)
  };
  
  // Check if we need to update the ID (title changed)
  if (formId !== newFormId) {
    // Check if the new ID already exists (different form)
    db.get("SELECT id FROM forms WHERE id = ? AND id != ?", [newFormId, formId], (err, existingRow) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (existingRow) {
        res.status(409).json({ error: 'A form with this title already exists' });
        return;
      }
      
      // Update with new ID - we need to insert new record and delete old one
      // because SQLite doesn't support updating primary keys directly
      db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        
        // Insert new record with new ID
        db.run(
          `INSERT INTO forms (id, title, description, schema_json, created_at, updated_at) 
           SELECT ?, ?, ?, ?, created_at, CURRENT_TIMESTAMP FROM forms WHERE id = ?`,
          [newFormId, formData.title, formData.description, formData.schema_json, formId],
          function(insertErr) {
            if (insertErr) {
              db.run("ROLLBACK");
              res.status(500).json({ error: insertErr.message });
              return;
            }
            
            // Delete old record
            db.run("DELETE FROM forms WHERE id = ?", [formId], function(deleteErr) {
              if (deleteErr) {
                db.run("ROLLBACK");
                res.status(500).json({ error: deleteErr.message });
                return;
              }
              
              if (this.changes === 0) {
                db.run("ROLLBACK");
                res.status(404).json({ error: 'Original form not found' });
                return;
              }
              
              db.run("COMMIT");
              
              // Update the schema with the new ID
              schema.metadata.id = newFormId;
              res.json(schema);
            });
          }
        );
      });
    });
  } else {
    // Simple update - ID stays the same
    db.run(
      `UPDATE forms 
       SET title = ?, description = ?, schema_json = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [formData.title, formData.description, formData.schema_json, formId],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        if (this.changes === 0) {
          res.status(404).json({ error: 'Form not found' });
          return;
        }
        
        // Update the schema with the current ID
        schema.metadata.id = formId;
        res.json(schema);
      }
    );
  }
});

// Delete form
app.delete('/api/forms/:id', (req, res) => {
  const formId = req.params.id;
  
  db.run("DELETE FROM forms WHERE id = ?", [formId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Form not found' });
      return;
    }
    
    res.json({ message: 'Form deleted successfully' });
  });
});

// Form submission endpoint
app.post('/api/forms/:id/submit', (req, res) => {
  const formId = req.params.id;
  const submissionData = req.body;
  
  // Here you would typically:
  // 1. Validate the submission against the form schema
  // 2. Store the submission in a submissions table
  // 3. Send confirmation email, etc.
  
  console.log(`Form ${formId} submission:`, submissionData);
  
  res.json({
    success: true,
    message: 'Form submitted successfully',
    submissionId: generateId()
  });
});

// Utility functions
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function generateTitleSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '');   // Remove leading/trailing hyphens
}

/**
 * @swagger
 * /forms/{id}/_openapi:
 *   get:
 *     summary: Get OpenAPI specification for a form
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Form ID
 *       - in: header
 *         name: Accept
 *         schema:
 *           type: string
 *           enum: [application/json, application/x-yaml]
 *         description: Response format
 *     responses:
 *       200:
 *         description: OpenAPI specification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *           application/x-yaml:
 *             schema:
 *               type: string
 *       404:
 *         description: Form not found
 */
app.get('/api/forms/:id/_openapi', (req, res) => {
  const formId = req.params.id;
  const acceptHeader = req.headers.accept || 'application/json';
  
  db.get('SELECT * FROM forms WHERE id = ?', [formId], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    try {
      const formSchema = JSON.parse(row.schema_json);
      const openApiSpec = generateOpenAPISpecForForm(formSchema);
      
      if (acceptHeader.includes('application/x-yaml') || acceptHeader.includes('text/yaml')) {
        res.setHeader('Content-Type', 'application/x-yaml');
        res.send(yaml.dump(openApiSpec));
      } else {
        res.json(openApiSpec);
      }
    } catch (parseError) {
      console.error('Schema parsing error:', parseError);
      res.status(500).json({ error: 'Invalid form schema' });
    }
  });
});

/**
 * @swagger
 * /forms/{id}/validate:
 *   post:
 *     summary: Validate form data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Form ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Form data to validate
 *     responses:
 *       200:
 *         description: Validation successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Validation successful"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Validation failed"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                       code:
 *                         type: string
 *                       message:
 *                         type: string
 *                       value:
 *                         type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Form not found
 */
app.post('/api/forms/:id/validate', (req, res) => {
  const formId = req.params.id;
  const formData = req.body;
  
  db.get('SELECT * FROM forms WHERE id = ?', [formId], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    try {
      const formSchema = JSON.parse(row.schema_json);
      const validationResult = validateFormData(formSchema, formData);
      
      if (validationResult.valid) {
        res.json(validationResult);
      } else {
        res.status(400).json(validationResult);
      }
    } catch (parseError) {
      console.error('Schema parsing error:', parseError);
      res.status(500).json({ error: 'Invalid form schema' });
    }
  });
});

/**
 * @swagger
 * /forms/{id}/submit:
 *   post:
 *     summary: Submit form data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Form ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Form data to submit
 *     responses:
 *       201:
 *         description: Form submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Submission ID
 *                 submittedAt:
 *                   type: string
 *                   format: date-time
 *                 status:
 *                   type: string
 *                   enum: [submitted, processing, completed]
 *       400:
 *         description: Invalid form data
 *       404:
 *         description: Form not found
 */
app.post('/api/forms/:id/submit', (req, res) => {
  const formId = req.params.id;
  const formData = req.body;
  
  db.get('SELECT * FROM forms WHERE id = ?', [formId], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    try {
      const formSchema = JSON.parse(row.schema_json);
      const validationResult = validateFormData(formSchema, formData);
      
      if (!validationResult.valid) {
        return res.status(400).json(validationResult);
      }
      
      // Generate submission ID and save (in a real app, you'd save to a submissions table)
      const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const submittedAt = new Date().toISOString();
      
      // For demo purposes, just return success
      // In a real application, you would save the submission to a database
      
      res.status(201).json({
        id: submissionId,
        submittedAt,
        status: 'submitted'
      });
      
    } catch (parseError) {
      console.error('Schema parsing error:', parseError);
      res.status(500).json({ error: 'Invalid form schema' });
    }
  });
});

// Helper function to generate OpenAPI spec for a form
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

// Helper function to generate JSON Schema from form schema
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

// Helper function to generate property schema for a field
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

// Helper function to validate form data using AJV
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

// Helper function to get user-friendly error messages
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Hello Forms API'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Closing database connection...');
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed.');
    process.exit(0);
  });
});
