import { ConflictException, NotFoundException } from '@nestjs/common';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Entity, Column } from 'typeorm';
import { JSONSchema7 } from 'json-schema';
import { ValidateNested } from 'class-validator';
import { BaseModel, Meta } from './BaseModel';

@ApiSchema({ name: 'Form' })
@Entity('form')
export class Form extends BaseModel {
  @ApiProperty({ description: 'JSON Schema for the form' })
  @ValidateNested()
  @Column('json')
  schema: JSONSchema7 = { type: 'object', properties: {} };

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
    this.schema = dto.schema || this.schema;
    return this;
  }

  static async updateForm(
    id: string,
    dto: Partial<Form>,
  ): Promise<Form | null> {
    const form = await Form.getForm(id);
    form.meta.merge(dto.meta);
    form.schema = dto.schema || form.schema;
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
