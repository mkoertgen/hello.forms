const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

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
  
  const formData = {
    title: schema.title,
    description: schema.description || '',
    schema_json: JSON.stringify(schema)
  };
  
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
      
      res.json(schema);
    }
  );
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
