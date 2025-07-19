# Hello Forms - Form Designer Application

A comprehensive form designer application that generates dynamic forms based on SQL schemas. Built with Angular and Node.js, this application allows users to visually design forms through drag-and-drop operations, create multi-step wizards, apply custom validation, and export form templates in an OpenAPI-like schema format.

## Features

### 🎨 Visual Form Designer

- **Drag & Drop Interface**: Intuitive drag-and-drop form field creation
- **SQL Schema Integration**: Automatically generate form fields from SQL table columns
- **Field Palette**: Pre-built form field components (text, email, number, date, select, etc.)
- **Real-time Preview**: Live preview of forms as you design them

### 📊 SQL Schema Support

- **Multiple Tables**: Support for complex database schemas with multiple tables
- **Column Mapping**: Automatic mapping of SQL column types to appropriate form field types
- **Relationship Awareness**: Understanding of table relationships and foreign keys
- **Constraint Recognition**: Automatic validation rule generation based on SQL constraints

### 🧙‍♂️ Multi-Step Wizards

- **Step Management**: Create and manage multi-step form wizards
- **Field Organization**: Organize fields into logical steps
- **Navigation Controls**: Built-in step navigation with validation
- **Conditional Logic**: Show/hide steps based on user input

### ✅ Advanced Validation

- **Built-in Validators**: Required, email, pattern, length, numeric validations
- **Custom Validators**: Define custom JavaScript validation functions
- **Conditional Validation**: Dynamic validation based on field dependencies
- **Real-time Feedback**: Instant validation feedback as users type

### 📋 Form Templates

- **OpenAPI-like Schema**: Export forms in structured JSON schema format
- **Import/Export**: Save and load form designs
- **Version Control**: Track form schema versions
- **Template Library**: Reusable form templates

### 🎯 User Experience

- **Material Design**: Modern Angular Material UI components
- **Responsive Layout**: Works on desktop, tablet, and mobile devices
- **Accessibility**: WCAG compliant form controls
- **Internationalization**: Multi-language support ready

## Technology Stack

### Frontend

- **Angular 17**: Modern Angular framework with standalone components
- **Angular Material**: Google's Material Design components
- **Angular CDK**: Drag-and-drop functionality
- **RxJS**: Reactive programming for state management
- **TypeScript**: Type-safe development
- **SCSS**: Styled components

### Backend

- **Node.js**: Server runtime
- **Express.js**: Web application framework
- **SQLite**: Local database for development
- **CORS**: Cross-origin resource sharing
- **Body Parser**: Request parsing middleware

## Project Structure

```
hello.forms/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── form-designer/          # Main designer interface
│   │   │   └── form-preview/           # Form preview component
│   │   ├── models/
│   │   │   └── form-schema.models.ts   # TypeScript interfaces
│   │   ├── services/
│   │   │   ├── form-designer.service.ts # Form management
│   │   │   └── sql-schema.service.ts   # SQL schema operations
│   │   ├── app.component.ts            # Root component
│   │   ├── app.config.ts              # Application configuration
│   │   └── app.routes.ts              # Routing configuration
│   ├── styles.scss                    # Global styles
│   └── index.html                     # Main HTML file
├── server/
│   ├── index.js                       # Express server
│   └── data/                          # SQLite database files
├── package.json                       # Dependencies and scripts
├── angular.json                       # Angular CLI configuration
├── tsconfig.json                      # TypeScript configuration
└── README.md                          # This file
```

## Installation and Setup

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Angular CLI (v17 or higher)

### Installation Steps

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd hello.forms
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Install Angular CLI globally (if not already installed)**
   ```bash
   npm install -g @angular/cli
   ```

## Running the Application

### Development Mode

Run both the frontend and backend simultaneously:

```bash
npm run dev
```

This will start:

- Angular development server on `http://localhost:4200`
- Express API server on `http://localhost:3000`

### Individual Services

**Frontend only:**

```bash
npm start
# or
ng serve
```

**Backend only:**

```bash
npm run serve:api
```

**Build for production:**

```bash
npm run build
```

## Usage Guide

### 1. SQL Schema Integration

The application comes with sample SQL schemas for demonstration:

- **Users Table**: Basic user information (id, email, name, phone, etc.)
- **Orders Table**: Order management (order_number, total_amount, status, etc.)
- **Products Table**: Product catalog (name, description, price, category, etc.)

### 2. Creating Forms

1. **Start with SQL Schema**: Drag columns from the SQL schema panel on the left
2. **Add Custom Fields**: Use the field palette on the right to add additional form fields
3. **Configure Properties**: Select any field to edit its properties (label, validation, help text, etc.)
4. **Organize Layout**: Drag fields to reorder them in the form

### 3. Multi-Step Wizards

1. **Add Steps**: Click "Add Step" in the toolbar
2. **Configure Step**: Set step title and description
3. **Assign Fields**: Drag fields to specific steps
4. **Navigation**: The system automatically generates step navigation

### 4. Validation Rules

The application automatically generates validation rules based on SQL constraints:

- **Required**: Non-nullable columns become required fields
- **Length**: VARCHAR columns get max-length validation
- **Type**: Appropriate input types for different data types
- **Format**: Email fields get email validation

### 5. Export/Import

- **Export**: Click "Export" to download the form schema as JSON
- **Import**: Click "Import" to load a previously saved form schema

## Form Schema Format

The application uses an OpenAPI-inspired schema format:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "User Registration Form",
  "description": "Form for user registration",
  "version": "1.0.0",
  "metadata": {
    "id": "user-reg-001",
    "createdAt": "2025-01-19T10:00:00Z",
    "updatedAt": "2025-01-19T10:00:00Z",
    "author": "Admin"
  },
  "steps": [
    {
      "id": "step-1",
      "title": "Personal Information",
      "description": "Enter your personal details",
      "order": 1,
      "fields": ["field-1", "field-2"]
    }
  ],
  "fields": [
    {
      "id": "field-1",
      "name": "email",
      "label": "Email Address",
      "type": "email",
      "required": true,
      "validation": {
        "rules": ["required", "email"]
      }
    }
  ],
  "validationRules": [
    {
      "id": "required",
      "name": "Required",
      "type": "required",
      "message": "This field is required"
    }
  ]
}
```

## API Endpoints

### SQL Schema

- `GET /api/tables` - Get all SQL tables
- `GET /api/tables/:tableName` - Get specific table schema
- `POST /api/upload-schema` - Upload SQL schema file

### Forms

- `GET /api/forms` - Get all forms
- `GET /api/forms/:id` - Get specific form
- `POST /api/forms` - Create new form
- `PUT /api/forms/:id` - Update form
- `DELETE /api/forms/:id` - Delete form
- `POST /api/forms/:id/submit` - Submit form data

### System

- `GET /api/health` - Health check endpoint

## Customization

### Adding New Field Types

1. **Define the field type** in `form-schema.models.ts`:

   ```typescript
   export type FormFieldType = "text" | "email" | "your-new-type";
   ```

2. **Add to field palette** in `form-designer.service.ts`:

   ```typescript
   { id: 'your-new-type', type: 'your-new-type', label: 'Your New Field', icon: 'icon-name' }
   ```

3. **Add rendering logic** in form components templates

### Custom Validation Rules

Define custom validators in the form schema:

```json
{
  "customValidators": [
    {
      "id": "custom-validator",
      "name": "Custom Rule",
      "function": "function(value) { return value.length > 5; }",
      "async": false
    }
  ]
}
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Roadmap

- [ ] Database schema import from various SQL dialects
- [ ] Advanced conditional logic builder
- [ ] Form analytics and usage tracking
- [ ] Integration with popular backends (Supabase, Firebase, etc.)
- [ ] Advanced theming and customization
- [ ] Form collaboration and sharing
- [ ] Mobile app for form filling
- [ ] Integration with workflow engines

## Support

For questions, issues, or feature requests, please:

1. Check the [Issues](../../issues) page
2. Create a new issue if your question isn't already addressed
3. Provide detailed information about your environment and use case
