import { ConflictException, NotFoundException } from '@nestjs/common';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Entity, Column } from 'typeorm';
import { BaseModel, Meta } from './BaseModel';
import { ValidateNested } from 'class-validator';

@ApiSchema({ name: 'SqlColumn' })
export class SqlSchemaColumn {
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
    example: 'string',
  })
  @Column()
  type: string;

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
}

@ApiSchema({ name: 'SqlRelation' })
export class SqlSchemaRelationship {
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
  type: string;
}

@ApiSchema({ name: 'SqlTable' })
export class SqlSchemaTable {
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
  @Column((type) => SqlSchemaColumn)
  columns: SqlSchemaColumn[];

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
  @Column((type) => SqlSchemaRelationship)
  relationships?: SqlSchemaRelationship[];
}

@ApiSchema({ name: 'SqlSchema' })
@Entity('sql_schema')
export class SqlSchema extends BaseModel {
  @ApiProperty({
    required: true,
    description: 'The tables in the SQL schema',
  })
  @Column((type) => SqlSchemaTable)
  tables: SqlSchemaTable[];

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
