const { generateRequestSchemaFromForm, generatePropertySchema } = require('../schema-helpers');

describe('Schema Helpers', () => {
  describe('generatePropertySchema', () => {
    it('should generate schema for text field', () => {
      const field = {
        type: 'text',
        label: 'Full Name',
        helpText: 'Enter your full name'
      };

      const schema = generatePropertySchema(field);

      expect(schema).toEqual({
        type: 'string',
        title: 'Full Name',
        description: 'Enter your full name'
      });
    });

    it('should generate schema for email field', () => {
      const field = {
        type: 'email',
        label: 'Email Address'
      };

      const schema = generatePropertySchema(field);

      expect(schema.type).toBe('string');
      expect(schema.format).toBe('email');
      expect(schema.title).toBe('Email Address');
    });

    it('should generate schema for select field with options', () => {
      const field = {
        type: 'select',
        label: 'Country',
        options: [
          { value: 'us', label: 'United States' },
          { value: 'ca', label: 'Canada' }
        ]
      };

      const schema = generatePropertySchema(field);

      expect(schema.type).toBe('string');
      expect(schema.enum).toEqual(['us', 'ca']);
    });

    it('should generate schema for multiselect field', () => {
      const field = {
        type: 'multiselect',
        label: 'Languages',
        options: [
          { value: 'en', label: 'English' },
          { value: 'es', label: 'Spanish' }
        ]
      };

      const schema = generatePropertySchema(field);

      expect(schema.type).toBe('array');
      expect(schema.items.type).toBe('string');
      expect(schema.items.enum).toEqual(['en', 'es']);
    });

    it('should generate schema for number field', () => {
      const field = {
        type: 'number',
        label: 'Age'
      };

      const schema = generatePropertySchema(field);

      expect(schema.type).toBe('number');
    });

    it('should generate schema for checkbox field', () => {
      const field = {
        type: 'checkbox',
        label: 'Accept Terms'
      };

      const schema = generatePropertySchema(field);

      expect(schema.type).toBe('boolean');
    });

    it('should include default value when provided', () => {
      const field = {
        type: 'text',
        label: 'Country',
        defaultValue: 'United States'
      };

      const schema = generatePropertySchema(field);

      expect(schema.default).toBe('United States');
    });
  });

  describe('generateRequestSchemaFromForm', () => {
    it('should generate schema for simple form', () => {
      const formSchema = {
        title: 'Contact Form',
        fields: [
          {
            id: '1',
            name: 'name',
            type: 'text',
            label: 'Full Name',
            required: true
          },
          {
            id: '2',
            name: 'email',
            type: 'email',
            label: 'Email',
            required: true
          },
          {
            id: '3',
            name: 'message',
            type: 'textarea',
            label: 'Message',
            required: false
          }
        ]
      };

      const schema = generateRequestSchemaFromForm(formSchema);

      expect(schema.type).toBe('object');
      expect(schema.title).toBe('Contact Form Form Data');
      expect(schema.properties).toHaveProperty('name');
      expect(schema.properties).toHaveProperty('email');
      expect(schema.properties).toHaveProperty('message');
      expect(schema.required).toEqual(['name', 'email']);
      expect(schema.additionalProperties).toBe(false);
    });

    it('should skip non-input fields', () => {
      const formSchema = {
        title: 'Test Form',
        fields: [
          {
            id: '1',
            name: 'name',
            type: 'text',
            label: 'Name',
            required: true
          },
          {
            id: '2',
            name: 'section',
            type: 'section_header',
            label: 'Personal Information'
          },
          {
            id: '3',
            name: 'divider',
            type: 'divider'
          }
        ]
      };

      const schema = generateRequestSchemaFromForm(formSchema);

      expect(schema.properties).toHaveProperty('name');
      expect(schema.properties).not.toHaveProperty('section');
      expect(schema.properties).not.toHaveProperty('divider');
      expect(Object.keys(schema.properties)).toHaveLength(1);
    });

    it('should handle stepped forms', () => {
      const formSchema = {
        title: 'Multi-Step Form',
        fields: [
          {
            id: '1',
            name: 'name',
            type: 'text',
            label: 'Name',
            required: true
          },
          {
            id: '2',
            name: 'email',
            type: 'email',
            label: 'Email',
            required: true
          },
          {
            id: '3',
            name: 'phone',
            type: 'tel',
            label: 'Phone',
            required: false
          }
        ],
        steps: [
          {
            id: 'step1',
            title: 'Basic Info',
            fields: ['1', '2']
          },
          {
            id: 'step2',
            title: 'Contact Info',
            fields: ['3']
          }
        ]
      };

      const schema = generateRequestSchemaFromForm(formSchema);

      expect(schema.properties).toHaveProperty('name');
      expect(schema.properties).toHaveProperty('email');
      expect(schema.properties).toHaveProperty('phone');
      expect(schema.required).toEqual(['name', 'email']);
    });

    it('should handle empty form', () => {
      const formSchema = {
        title: 'Empty Form',
        fields: []
      };

      const schema = generateRequestSchemaFromForm(formSchema);

      expect(schema.type).toBe('object');
      expect(schema.properties).toEqual({});
      expect(schema.required).toEqual([]);
    });
  });
});
