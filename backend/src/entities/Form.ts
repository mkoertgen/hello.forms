import { ConflictException, NotFoundException } from '@nestjs/common';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Entity, Column } from 'typeorm';
import { ValidateNested } from 'class-validator';
import { BaseModel } from './BaseModel';

@ApiSchema()
export class FormStep {
  @ApiProperty({
    required: true,
    description: 'Unique identifier for the step',
    example: 'step1',
  })
  @Column()
  id: string;

  @ApiProperty({
    required: true,
    description: 'Order of the step in the form',
    type: Number,
  })
  order: number = 1;

  @ApiProperty({ required: true, description: 'Title of the step' })
  @Column()
  title: string = 'Step 1';

  @ApiProperty({ description: 'Description of the step', required: false })
  description?: string = 'This is the first step';

  @ApiProperty({
    description: 'Field IDs included in this step',
    type: String,
    isArray: true,
    uniqueItems: true,
    example: ['field1', 'field2'],
  })
  fields: string[];
}

export enum FormFieldType {
  TEXT = 'text',
  EMAIL = 'email',
  PASSWORD = 'password',
  NUMBER = 'number',
  TEL = 'tel',
  URL = 'url',
  TEXTAREA = 'textarea',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  DATE = 'date',
  DATETIME = 'datetime',
  TIME = 'time',
  FILE = 'file',
  IMAGE = 'image',
  RANGE = 'range',
  HIDDEN = 'hidden',
  SECTION_HEADER = 'section_header',
  DIVIDER = 'divider',
}

@ApiSchema()
export class FormField {
  @ApiProperty({
    required: true,
    description: 'Unique identifier for the field',
    example: 'field1',
  })
  @Column()
  id: string;

  @ApiProperty({
    required: true,
    description: 'Name of the field',
    example: 'Field 1',
  })
  @Column()
  name: string;

  @ApiProperty({
    required: true,
    description: 'Label of the field',
    example: 'Field 1',
  })
  @Column()
  label: string;

  @ApiProperty({
    required: true,
    description: 'Type of the field',
    enum: FormFieldType,
    enumName: 'FormFieldType',
    default: FormFieldType.TEXT,
    example: FormFieldType.TEXT,
  })
  @Column()
  type: FormFieldType;

  @ApiProperty({
    required: false,
    description: 'SQL column mapping for the field',
    example: 'User.name',
  })
  @Column()
  sqlColumn?: string; // maps to SQL column

  @ApiProperty({
    required: false,
    description: 'Whether the field is required',
    example: true,
  })
  @Column({ nullable: true, default: false })
  required?: boolean = false;

  @ApiProperty({
    required: false,
    description: 'Placeholder text for the field',
    example: 'Enter your name',
  })
  @Column({ nullable: true })
  placeholder?: string;

  @ApiProperty({
    required: false,
    description: 'Help text for the field',
    example: 'This is your full name',
  })
  @Column({ nullable: true })
  helpText?: string;

  @ApiProperty({
    required: false,
    description: 'Default value for the field',
    type: String,
  })
  defaultValue?: any;
}

@ApiSchema()
@Entity('form')
export class Form extends BaseModel {
  @ApiProperty({
    required: true,
    description: 'The fields of the form',
    type: FormField,
    isArray: true,
  })
  @ValidateNested({ each: true })
  @Column((type) => FormField)
  fields: FormField[] = [];

  @ApiProperty({
    required: false,
    description: 'The steps of the form',
    type: FormStep,
    isArray: true,
  })
  @ValidateNested({ each: true })
  @Column((type) => FormStep)
  steps?: FormStep[];

  // @ApiProperty({ description: 'JSON Schema for the form' })
  // @ValidateNested()
  // @Column('json')
  // schema: JSONSchema7 = { type: 'object', properties: {} };

  // Using Active Record pattern for simplicity, cf.:
  // https://typeorm.io/docs/guides/active-record-data-mapper
  // https://typeorm.io/docs/guides/mongodb
  static async getForm(id: string): Promise<Form> {
    const form = await Form.findOneBy({ id: id });
    if (!form) {
      throw new NotFoundException(`Form with id ${id} not found`);
    }
    return form;
  }

  static async createForm(dto: Partial<Form>): Promise<Form> {
    if (dto.id) {
      // check for conflict
      const existing = await Form.findOneBy({ id: dto.id });
      if (existing) {
        throw new ConflictException(`Form with id ${dto.id} already exists`);
      }
    }
    const form = new Form().merge(dto);
    await form.save();
    return form;
  }

  merge(dto: Partial<Form>) {
    super.merge(dto);
    // this.schema = dto.schema || this.schema;
    this.fields = dto.fields || this.fields;
    this.steps = dto.steps || this.steps;
    return this;
  }

  static async updateForm(
    id: string,
    dto: Partial<Form>,
  ): Promise<Form | null> {
    const form = await Form.getForm(id);
    form.meta.merge(dto.meta);
    //form.schema = dto.schema || form.schema;
    form.fields = dto.fields || form.fields;
    form.steps = dto.steps || form.steps;
    await form.save();
    return form;
  }

  // find by tags, special handling for MongoDB, cf.:
  // https://typeorm.io/docs/guides/mongodb#using-mongoentitymanager-and-mongorepository
  static async findByTags(tags: string[]): Promise<Form[]> {
    return await Form.getMongoRepository<Form>().find({
      where: { 'meta.tags': { $in: tags } },
    });
  }
}
