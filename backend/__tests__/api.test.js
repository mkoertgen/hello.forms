const request = require('supertest');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Import the app (we'll need to refactor index.js to export the app)
// For now, we'll create a test app
const app = express();
app.use(express.json());

// Test database path
const testDbPath = path.join(__dirname, 'test.db');

describe('Forms API', () => {
  let db;

  beforeAll((done) => {
    // Create test database
    db = new sqlite3.Database(testDbPath);
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS forms (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          schema_json TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, done);
    });
  });

  afterAll((done) => {
    db.close(() => {
      // Clean up test database
      if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
      }
      done();
    });
  });

  beforeEach((done) => {
    // Clear test data before each test
    db.run('DELETE FROM forms', done);
  });

  describe('Health Check', () => {
    // Mock health endpoint for testing
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'Hello Forms API'
      });
    });

    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('service', 'Hello Forms API');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Form Schema Generation', () => {
    const { generateRequestSchemaFromForm, generatePropertySchema } = require('../schema-helpers');

    it('should generate request schema for simple form', () => {
      const formSchema = {
        title: 'Test Form',
        fields: [
          {
            id: 'field1',
            name: 'email',
            type: 'email',
            label: 'Email Address',
            required: true
          },
          {
            id: 'field2',
            name: 'name',
            type: 'text',
            label: 'Full Name',
            required: false
          }
        ]
      };

      const schema = generateRequestSchemaFromForm(formSchema);

      expect(schema.type).toBe('object');
      expect(schema.title).toBe('Test Form Form Data');
      expect(schema.properties).toHaveProperty('email');
      expect(schema.properties).toHaveProperty('name');
      expect(schema.required).toContain('email');
      expect(schema.required).not.toContain('name');
    });

    it('should generate property schema for email field', () => {
      const field = {
        type: 'email',
        label: 'Email Address',
        helpText: 'Enter your email address'
      };

      const property = generatePropertySchema(field);

      expect(property.type).toBe('string');
      expect(property.format).toBe('email');
      expect(property.title).toBe('Email Address');
      expect(property.description).toBe('Enter your email address');
    });

    it('should generate property schema for select field with options', () => {
      const field = {
        type: 'select',
        label: 'Country',
        options: [
          { value: 'us', label: 'United States' },
          { value: 'ca', label: 'Canada' },
          { value: 'uk', label: 'United Kingdom' }
        ]
      };

      const property = generatePropertySchema(field);

      expect(property.type).toBe('string');
      expect(property.enum).toEqual(['us', 'ca', 'uk']);
    });
  });

  describe('Form Validation', () => {
    const { validateFormData } = require('../validation-helpers');

    it('should validate form data successfully', () => {
      const formSchema = {
        title: 'Test Form',
        fields: [
          {
            id: 'field1',
            name: 'email',
            type: 'email',
            label: 'Email Address',
            required: true
          }
        ]
      };

      const formData = {
        email: 'test@example.com'
      };

      const result = validateFormData(formSchema, formData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return validation errors for invalid data', () => {
      const formSchema = {
        title: 'Test Form',
        fields: [
          {
            id: 'field1',
            name: 'email',
            type: 'email',
            label: 'Email Address',
            required: true
          }
        ]
      };

      const formData = {
        email: 'invalid-email'
      };

      const result = validateFormData(formSchema, formData);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].field).toBe('email');
    });

    it('should return validation errors for missing required fields', () => {
      const formSchema = {
        title: 'Test Form',
        fields: [
          {
            id: 'field1',
            name: 'email',
            type: 'email',
            label: 'Email Address',
            required: true
          }
        ]
      };

      const formData = {};

      const result = validateFormData(formSchema, formData);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toBe('required');
    });
  });
});
