import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { SqlTable, SqlColumn, SqlDataType, FormFieldType } from '../models/form-schema.models';

@Injectable({
  providedIn: 'root',
})
export class SqlSchemaService {
  private apiUrl = 'http://localhost:3000/api';
  private tablesSubject = new BehaviorSubject<SqlTable[]>([]);
  public tables$ = this.tablesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadSampleTables();
  }

  // Load sample tables for demo purposes
  private loadSampleTables(): void {
    const sampleTables: SqlTable[] = [
      {
        name: 'users',
        columns: [
          { name: 'id', type: 'INTEGER', nullable: false, primaryKey: true },
          { name: 'email', type: 'VARCHAR', nullable: false, primaryKey: false, maxLength: 255 },
          {
            name: 'first_name',
            type: 'VARCHAR',
            nullable: false,
            primaryKey: false,
            maxLength: 100,
          },
          {
            name: 'last_name',
            type: 'VARCHAR',
            nullable: false,
            primaryKey: false,
            maxLength: 100,
          },
          { name: 'phone', type: 'VARCHAR', nullable: true, primaryKey: false, maxLength: 20 },
          { name: 'birth_date', type: 'DATE', nullable: true, primaryKey: false },
          {
            name: 'is_active',
            type: 'BOOLEAN',
            nullable: false,
            primaryKey: false,
            defaultValue: true,
          },
          { name: 'created_at', type: 'TIMESTAMP', nullable: false, primaryKey: false },
          { name: 'updated_at', type: 'TIMESTAMP', nullable: false, primaryKey: false },
        ],
      },
      {
        name: 'orders',
        columns: [
          { name: 'id', type: 'INTEGER', nullable: false, primaryKey: true },
          {
            name: 'user_id',
            type: 'INTEGER',
            nullable: false,
            primaryKey: false,
            foreignKey: 'users.id',
          },
          {
            name: 'order_number',
            type: 'VARCHAR',
            nullable: false,
            primaryKey: false,
            maxLength: 50,
          },
          { name: 'total_amount', type: 'DECIMAL', nullable: false, primaryKey: false },
          { name: 'order_date', type: 'DATETIME', nullable: false, primaryKey: false },
          { name: 'status', type: 'VARCHAR', nullable: false, primaryKey: false, maxLength: 20 },
          { name: 'shipping_address', type: 'TEXT', nullable: true, primaryKey: false },
          { name: 'notes', type: 'TEXT', nullable: true, primaryKey: false },
        ],
        relationships: [
          {
            type: 'many-to-many',
            targetTable: 'users',
            foreignKey: 'user_id',
            targetKey: 'id',
          },
        ],
      },
      {
        name: 'products',
        columns: [
          { name: 'id', type: 'INTEGER', nullable: false, primaryKey: true },
          { name: 'name', type: 'VARCHAR', nullable: false, primaryKey: false, maxLength: 200 },
          { name: 'description', type: 'TEXT', nullable: true, primaryKey: false },
          { name: 'price', type: 'DECIMAL', nullable: false, primaryKey: false },
          { name: 'category', type: 'VARCHAR', nullable: false, primaryKey: false, maxLength: 100 },
          {
            name: 'in_stock',
            type: 'BOOLEAN',
            nullable: false,
            primaryKey: false,
            defaultValue: true,
          },
          { name: 'weight', type: 'FLOAT', nullable: true, primaryKey: false },
          { name: 'created_at', type: 'TIMESTAMP', nullable: false, primaryKey: false },
        ],
      },
    ];

    this.tablesSubject.next(sampleTables);
  }

  getTables(): Observable<SqlTable[]> {
    return this.http.get<SqlTable[]>(`${this.apiUrl}/tables`);
  }

  getTable(tableName: string): Observable<SqlTable> {
    return this.http.get<SqlTable>(`${this.apiUrl}/tables/${tableName}`);
  }

  uploadSchema(schemaFile: File): Observable<SqlTable[]> {
    const formData = new FormData();
    formData.append('schema', schemaFile);
    return this.http.post<SqlTable[]>(`${this.apiUrl}/upload-schema`, formData);
  }

  // Convert Sql column to form field type
  mapSqlTypeToFormFieldType(sqlType: SqlDataType, maxLength?: number): FormFieldType {
    switch (sqlType) {
      case 'INTEGER':
      case 'FLOAT':
      case 'DECIMAL':
        return 'number';
      case 'BOOLEAN':
        return 'checkbox';
      case 'DATE':
        return 'date';
      case 'DATETIME':
      case 'TIMESTAMP':
        return 'datetime';
      case 'VARCHAR':
        if (maxLength && maxLength > 255) {
          return 'textarea';
        }
        return 'text';
      case 'TEXT':
        return 'textarea';
      default:
        return 'text';
    }
  }

  // Generate suggested validation rules based on Sql column
  generateValidationRules(column: SqlColumn): string[] {
    const rules: string[] = [];

    if (!column.nullable) {
      rules.push('required');
    }

    if (column.maxLength) {
      rules.push(`max_length:${column.maxLength}`);
    }

    if (column.type === 'VARCHAR' && column.name.toLowerCase().includes('email')) {
      rules.push('email');
    }

    if (column.type === 'VARCHAR' && column.name.toLowerCase().includes('url')) {
      rules.push('url');
    }

    if (['INTEGER', 'FLOAT', 'DECIMAL'].includes(column.type)) {
      rules.push('numeric');
    }

    return rules;
  }

  // Get suggested field label from column name
  generateFieldLabel(columnName: string): string {
    return columnName
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }
}
