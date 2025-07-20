import { getDataSource } from '../ormconfig';
import { ApiSchema, ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsMongoId,
  IsSemVer,
  ValidateNested,
} from 'class-validator';
import { BaseEntity, Column, MongoRepository, ObjectIdColumn } from 'typeorm';
import { UUID } from 'mongodb';
import * as semver from 'semver';

type SemanticVersion = string & { __semverBrand: true };

/**
 * Metadata for the model, including title, description, author, tags, and version.
 */
@ApiSchema()
export class Meta {
  @ApiProperty({
    required: true,
    description: 'The technical name the model',
    example: 'form-123',
  })
  @IsString()
  name: string;

  @ApiProperty({
    required: true,
    description: 'The title of the model',
    example: 'My Model',
  })
  @IsString()
  @Column()
  title: string;

  @ApiProperty({
    required: false,
    description: 'A brief description of the model',
    example: 'This is a sample model.',
  })
  @IsString()
  @IsOptional()
  @Column({ nullable: true })
  description?: string;

  @ApiProperty({
    required: false,
    description: 'The author of the model',
    example: 'John Doe',
  })
  @IsString()
  @IsOptional()
  @Column({ nullable: true })
  author?: string;

  @ApiProperty({
    required: true,
    type: String,
    format: 'date-time',
    description: 'The creation date of the model',
    example: '2022-01-01T00:00:00Z',
  })
  @IsDateString()
  @Column({ default: new Date().toISOString() })
  createdAt: Date = new Date();

  @ApiProperty({
    required: false,
    type: String,
    format: 'date-time',
    description: 'The last update date of the model',
    example: '2022-01-02T00:00:00Z',
  })
  @IsDateString()
  @Column({ nullable: true })
  updatedAt?: Date;

  @ApiHideProperty()
  @Column('array')
  @Exclude()
  private _tags: string[];

  @ApiProperty({
    uniqueItems: true,
    description: 'The tags associated with the model',
    example: ['tag1', 'tag2'],
  })
  @IsOptional()
  @IsString({ each: true })
  get tags(): string[] {
    return Array.from(new Set(this._tags));
  }
  set tags(value: string[]) {
    this._tags = Array.from(new Set(value));
  }

  @ApiHideProperty()
  @Exclude()
  @Column({ nullable: true, default: '0.0.1' })
  private _version?: string = '0.0.1';

  @ApiProperty({
    required: false,
    type: String,
    format: 'semver',
    example: '0.0.1',
    description: 'Semantic version of the model',
    default: '0.0.1',
  })
  @IsSemVer()
  get version(): SemanticVersion | undefined {
    return this._version as SemanticVersion | undefined;
  }
  set version(value: string | undefined) {
    if (value && !semver.valid(value)) {
      throw new Error(`Invalid semantic version: ${value}`);
    }
    this._version = value;
  }

  merge(model?: Partial<Meta>): Meta {
    if (!model) return this;
    const version = semver.maximum(model.version || this.version) || '0.0.1';
    const tags = Array.from(new Set([...this._tags, ...(model.tags || [])]));

    Object.assign(this, model);

    this.updatedAt = new Date();
    this._version = semver.inc(version, 'patch');
    this.tags = tags;

    return this;
  }
}

/**
 * Base model class that extends TypeORM's BaseEntity.
 * Provides common properties and methods for all models.
 */
export class BaseModel extends BaseEntity {
  @ApiProperty({ description: 'The unique identifier of the model' })
  @IsMongoId()
  @ObjectIdColumn({ name: '_id' })
  id: string = BaseModel.generateId();

  @ApiProperty({ description: 'Metadata of the model' })
  @Column((type) => Meta)
  @ValidateNested()
  meta: Meta;

  merge(dto: Partial<BaseModel>): BaseModel {
    if (dto.id) this.id = dto.id;
    this.meta.merge(dto.meta);
    return this;
  }

  static generateId(): string {
    return UUID.generate().toString();
  }

  static getMongoRepository<T extends BaseModel>(): MongoRepository<T> {
    return getDataSource().getMongoRepository<T>(this);
  }
}
