const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const yaml = require('js-yaml');

// Import helper modules
const { generateOpenAPISpecForForm } = require('./schema-helpers');
const { validateFormData } = require('./validation-helpers');

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

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Forms API',
      version: '1.0.0',
      description: 'A comprehensive API for managing dynamic forms with OpenAPI validation',
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./index.js'], // Path to the API docs
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

/**
 * @swagger
 * components:
 *   schemas:
 *     Form:
 *       type: object
 *       required:
 *         - id
 *         - title
 *         - fields
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the form
 *         title:
 *           type: string
 *           description: Title of the form
 *         description:
 *           type: string
 *           description: Description of the form
 *         fields:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/FormField'
 *     FormField:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - label
 *       properties:
 *         name:
 *           type: string
 *         type:
 *           type: string
 *           enum: [text, email, tel, url, number, date, datetime-local, checkbox, select, radio, textarea, file]
 *         label:
 *           type: string
 *         required:
 *           type: boolean
 *         defaultValue:
 *           oneOf:
 *             - type: string
 *             - type: number
 *             - type: boolean
 *         options:
 *           type: array
 *           items:
 *             oneOf:
 *               - type: string
 *               - type: object
 *                 properties:
 *                   value:
 *                     type: string
 *                   label:
 *                     type: string
 */

/**
 * @swagger
 * /tables:
 *   get:
 *     summary: Get all table schemas
 *     responses:
 *       200:
 *         description: List of table schemas
 */
app.get('/api/tables', (req, res) => {
  db.all('SELECT * FROM sql_schemas ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    const schemas = rows.map(row => ({
      id: row.id,
      name: row.name,
      tables: JSON.parse(row.tables_json),
      created_at: row.created_at
    }));
    
    res.json(schemas);
  });
});

/**
 * @swagger
 * /tables/{tableName}:
 *   get:
 *     summary: Get specific table schema
 *     parameters:
 *       - in: path
 *         name: tableName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Table schema details
 *       404:
 *         description: Table not found
 */
app.get('/api/tables/:tableName', (req, res) => {
  const tableName = req.params.tableName;
  
  db.get('SELECT * FROM sql_schemas WHERE name = ?', [tableName], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Table schema not found' });
    }
    
    res.json({
      id: row.id,
      name: row.name,
      tables: JSON.parse(row.tables_json),
      created_at: row.created_at
    });
  });
});

/**
 * @swagger
 * /upload-schema:
 *   post:
 *     summary: Upload SQL schema
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               tables:
 *                 type: array
 *     responses:
 *       201:
 *         description: Schema uploaded successfully
 */
app.post('/api/upload-schema', (req, res) => {
  const { name, tables } = req.body;
  const id = Date.now().toString();
  
  db.run(
    'INSERT INTO sql_schemas (id, name, tables_json) VALUES (?, ?, ?)',
    [id, name, JSON.stringify(tables)],
    function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to save schema' });
      }
      res.status(201).json({ id, message: 'Schema uploaded successfully' });
    }
  );
});

/**
 * @swagger
 * /forms:
 *   get:
 *     summary: Get all forms
 *     responses:
 *       200:
 *         description: List of forms
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Form'
 */
app.get('/api/forms', (req, res) => {
  db.all('SELECT * FROM forms ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    const forms = rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      schema: JSON.parse(row.schema_json),
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
    
    res.json(forms);
  });
});

/**
 * @swagger
 * /forms/{id}:
 *   get:
 *     summary: Get a specific form
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Form details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Form'
 *       404:
 *         description: Form not found
 */
app.get('/api/forms/:id', (req, res) => {
  const formId = req.params.id;
  
  db.get('SELECT * FROM forms WHERE id = ?', [formId], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    res.json({
      id: row.id,
      title: row.title,
      description: row.description,
      schema: JSON.parse(row.schema_json),
      created_at: row.created_at,
      updated_at: row.updated_at
    });
  });
});

/**
 * @swagger
 * /forms:
 *   post:
 *     summary: Create a new form
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Form'
 *     responses:
 *       201:
 *         description: Form created successfully
 *       400:
 *         description: Invalid form data
 */
app.post('/api/forms', (req, res) => {
  const formData = req.body;
  
  if (!formData.id || !formData.title || !formData.fields) {
    return res.status(400).json({ error: 'Missing required fields: id, title, fields' });
  }
  
  db.get('SELECT id FROM forms WHERE id = ?', [formData.id], (err, existingForm) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (existingForm) {
      return res.status(400).json({ error: 'Form with this ID already exists' });
    }
    
    db.run(
      'INSERT INTO forms (id, title, description, schema_json) VALUES (?, ?, ?, ?)',
      [formData.id, formData.title, formData.description || null, JSON.stringify(formData)],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to create form' });
        }
        res.status(201).json({ id: formData.id, message: 'Form created successfully' });
      }
    );
  });
});

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
 *           enum: [application/json, application/x-yaml, text/yaml]
 *         description: Response format preference
 *     responses:
 *       200:
 *         description: OpenAPI specification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: OpenAPI 3.0.3 specification
 *           application/x-yaml:
 *             schema:
 *               type: string
 *               description: YAML formatted OpenAPI specification
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
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 submissionId:
 *                   type: string
 *                 message:
 *                   type: string
 *                   example: "Form submitted successfully"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation failed
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
      
      // For demo purposes, we'll just return a success message
      // In a real application, you'd save the submission to a database
      const submissionId = Date.now().toString();
      
      res.status(201).json({
        success: true,
        submissionId: submissionId,
        message: 'Form submitted successfully',
        timestamp: new Date().toISOString()
      });
    } catch (parseError) {
      console.error('Schema parsing error:', parseError);
      res.status(500).json({ error: 'Invalid form schema' });
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Hello Forms API'
  });
});

// Serve static files from the dist directory (for frontend)
app.use(express.static(path.join(__dirname, '../dist/hello-forms')));

// Fallback for Angular routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/hello-forms/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
  console.log(`API documentation available at http://localhost:${PORT}/api-docs`);
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
