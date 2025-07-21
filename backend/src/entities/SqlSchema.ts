import { ConflictException, NotFoundException } from '@nestjs/common';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Entity, Column } from 'typeorm';
import { BaseModel, Meta } from './BaseModel';
import { ValidateNested } from 'class-validator';

/**
 * Enum for SQL column types (string based)
 */
export enum SqlColumnType {
  STRING = 'string',
  INTEGER = 'integer',
  BOOLEAN = 'boolean',
  DATE = 'date',
  DATETIME = 'datetime',
  TIMESTAMP = 'timestamp',
  FLOAT = 'float',
  JSON = 'json',
}

@ApiSchema()
export class SqlColumn {
  @ApiProperty({
    required: true,
    description: 'The name of the column',
    example: 'user_id',
  })
  @Column()
  name: string;

  @ApiProperty({
    required: true,
    description: 'The data type of the column',
    enum: SqlColumnType,
    enumName: 'SqlColumnType',
    example: SqlColumnType.STRING,
  })
  @Column({ type: 'enum', enum: SqlColumnType })
  type: SqlColumnType;

  @ApiProperty({
    required: false,
    description: 'The maximum length of the column',
    example: 255,
  })
  @Column({ nullable: true })
  maxLength?: number;

  @ApiProperty({
    required: false,
    description: 'The minimum length of the column',
    example: 1,
  })
  @Column({ nullable: true })
  minLength?: number;

  @ApiProperty({
    required: false,
    description: 'Whether the column can be null',
    example: true,
  })
  @Column({ nullable: true })
  nullable?: boolean;

  @ApiProperty({
    required: false,
    description: 'Whether the column is a primary key',
    example: true,
  })
  @Column({ nullable: true })
  primaryKey?: boolean;

  @ApiProperty({
    required: false,
    description: 'The column default value',
    example: 'N/A',
  })
  @Column({ nullable: true })
  defaultValue?: any;

  @ApiProperty({
    required: false,
    description: 'The foreign key reference',
    example: 'user.id',
  })
  @Column({ nullable: true })
  foreignKey?: string;

  // constraints
  @ApiProperty({
    required: false,
    description: 'Additional constraints for the column',
    isArray: true,
    type: String,
    example: ['UNIQUE', 'CHECK (age > 0)'],
    uniqueItems: true,
  })
  @Column({ nullable: true })
  constraints?: string[];
}

@ApiSchema()
export class SqlRelation {
  @ApiProperty({
    required: true,
    description: 'The foreign key reference',
    example: 'user.id',
  })
  @Column()
  foreignKey: string;

  @ApiProperty({
    required: true,
    description: 'The target key reference',
    example: 'id',
  })
  @Column()
  targetKey: string;

  @ApiProperty({
    required: true,
    description: 'The target table reference',
    example: 'user',
  })
  targetTable: string;

  @ApiProperty({
    required: true,
    description: 'The type of relationship',
    example: 'many-to-many',
  })
  @Column()
  type: string | 'one-to-one' | 'one-to-many' | 'many-to-many';
}

@ApiSchema()
export class SqlTable {
  @ApiProperty({
    required: true,
    description: 'The name of the table',
    example: 'users',
  })
  @Column()
  name: string;

  @ApiProperty({
    required: true,
    description: 'The columns of the table',
    isArray: true,
    type: SqlColumn,
    example: [
      {
        name: 'id',
        type: 'INTEGER',
        primaryKey: true,
        nullable: false,
      },
    ],
  })
  @ValidateNested({ each: true })
  @Column((type) => SqlColumn)
  columns: SqlColumn[];

  @ApiProperty({
    required: false,
    description: 'The relationships of the table',
    example: [
      {
        foreignKey: 'user_id',
        targetKey: 'id',
        targetTable: 'users',
        type: 'many-to-many',
      },
    ],
  })
  @ValidateNested({ each: true })
  @Column((type) => SqlRelation)
  relationships?: SqlRelation[];
}

@ApiSchema()
@Entity('sql_schema')
export class SqlSchema extends BaseModel {
  @ApiProperty({
    required: true,
    description: 'The tables in the SQL schema',
    isArray: true,
    type: SqlTable,
  })
  @Column((type) => SqlTable)
  tables: SqlTable[];

  merge(dto: Partial<SqlSchema>) {
    super.merge(dto);
    if (dto.tables) this.tables = dto.tables;
    return this;
  }

  // Using Active Record pattern for simplicity, cf.:
  // https://typeorm.io/docs/guides/active-record-data-mapper
  // https://typeorm.io/docs/guides/mongodb
  static async getSchema(id: string): Promise<SqlSchema> {
    const model = await SqlSchema.findOneBy({ id: id });
    if (!model) {
      throw new NotFoundException(`Schema with id ${id} not found`);
    }
    return model;
  }

  static async createSchema(dto: Partial<SqlSchema>): Promise<SqlSchema> {
    if (dto.id) {
      // check for conflict
      const existing = await SqlSchema.findOneBy({ id: dto.id });
      if (existing) {
        throw new ConflictException(`Schema with id ${dto.id} already exists`);
      }
    }
    const model = new SqlSchema().merge(dto);
    await model.save();
    return model;
  }

  static async updateSchema(
    id: string,
    dto: Partial<SqlSchema>,
  ): Promise<SqlSchema | null> {
    const model = await SqlSchema.getSchema(id);

    model.meta.merge(dto.meta);
    model.tables = dto.tables || model.tables;

    await model.save();
    return model;
  }
}
