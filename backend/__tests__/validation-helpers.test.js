const { validateFormData, validateField } = require('../validation-helpers');

describe('Validation Helpers', () => {
  describe('validateFormData', () => {
    it('should validate simple form successfully', () => {
      const formSchema = {
        title: 'Test Form',
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
          }
        ]
      };

      const formData = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      const result = validateFormData(formSchema, formData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.message).toBe('Validation successful');
      expect(result.timestamp).toBeDefined();
    });

    it('should return validation errors for missing required fields', () => {
      const formSchema = {
        title: 'Test Form',
        fields: [
          {
            id: '1',
            name: 'name',
            type: 'text',
            label: 'Full Name',
            required: true
          }
        ]
      };

      const formData = {};

      const result = validateFormData(formSchema, formData);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('name');
      expect(result.errors[0].code).toBe('required');
      expect(result.errors[0].message).toBe('Full Name is required');
    });

    it('should return validation errors for invalid email format', () => {
      const formSchema = {
        title: 'Test Form',
        fields: [
          {
            id: '1',
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
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('email');
      expect(result.errors[0].code).toBe('format');
      expect(result.errors[0].message).toBe('Email Address must be a valid email');
    });

    it('should validate select field with enum values', () => {
      const formSchema = {
        title: 'Test Form',
        fields: [
          {
            id: '1',
            name: 'country',
            type: 'select',
            label: 'Country',
            required: true,
            options: [
              { value: 'us', label: 'United States' },
              { value: 'ca', label: 'Canada' }
            ]
          }
        ]
      };

      // Valid case
      let result = validateFormData(formSchema, { country: 'us' });
      expect(result.valid).toBe(true);

      // Invalid case
      result = validateFormData(formSchema, { country: 'invalid' });
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('enum');
    });

    it('should validate number fields', () => {
      const formSchema = {
        title: 'Test Form',
        fields: [
          {
            id: '1',
            name: 'age',
            type: 'number',
            label: 'Age',
            required: true
          }
        ]
      };

      // Valid case
      let result = validateFormData(formSchema, { age: 25 });
      expect(result.valid).toBe(true);

      // Invalid type case
      result = validateFormData(formSchema, { age: 'not-a-number' });
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('type');
    });

    it('should validate checkbox fields', () => {
      const formSchema = {
        title: 'Test Form',
        fields: [
          {
            id: '1',
            name: 'terms',
            type: 'checkbox',
            label: 'Accept Terms',
            required: true
          }
        ]
      };

      // Valid case
      let result = validateFormData(formSchema, { terms: true });
      expect(result.valid).toBe(true);

      // Invalid type case
      result = validateFormData(formSchema, { terms: 'yes' });
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('type');
    });

    it('should handle multiselect arrays', () => {
      const formSchema = {
        title: 'Test Form',
        fields: [
          {
            id: '1',
            name: 'languages',
            type: 'multiselect',
            label: 'Languages',
            required: false,
            options: [
              { value: 'en', label: 'English' },
              { value: 'es', label: 'Spanish' },
              { value: 'fr', label: 'French' }
            ]
          }
        ]
      };

      // Valid case
      let result = validateFormData(formSchema, { languages: ['en', 'es'] });
      expect(result.valid).toBe(true);

      // Invalid enum value case
      result = validateFormData(formSchema, { languages: ['en', 'invalid'] });
      expect(result.valid).toBe(false);

      // Invalid type case
      result = validateFormData(formSchema, { languages: 'not-an-array' });
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('type');
    });

    it('should handle optional fields correctly', () => {
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
            name: 'nickname',
            type: 'text',
            label: 'Nickname',
            required: false
          }
        ]
      };

      // Valid with only required field
      let result = validateFormData(formSchema, { name: 'John' });
      expect(result.valid).toBe(true);

      // Valid with both fields
      result = validateFormData(formSchema, { name: 'John', nickname: 'Johnny' });
      expect(result.valid).toBe(true);

      // Invalid without required field
      result = validateFormData(formSchema, { nickname: 'Johnny' });
      expect(result.valid).toBe(false);
    });
  });

  describe('validateField', () => {
    it('should validate single field', () => {
      const field = {
        id: '1',
        name: 'email',
        type: 'email',
        label: 'Email',
        required: true
      };

      // Valid case
      let result = validateField(field, 'test@example.com');
      expect(result.valid).toBe(true);

      // Invalid case
      result = validateField(field, 'invalid-email');
      expect(result.valid).toBe(false);
    });
  });
});
