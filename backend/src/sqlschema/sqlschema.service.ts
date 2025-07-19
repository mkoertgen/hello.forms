import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SqlSchema } from '../entities/SqlSchema';
import { SqlSchemaDto } from '../dto/sqlschema.dto';
import { plainToInstance, instanceToPlain } from 'class-transformer';

@Injectable()
export class SqlSchemaService {
  constructor(
    @InjectRepository(SqlSchema)
    private sqlSchemaRepository: Repository<SqlSchema>,
  ) {}

  async findAll(): Promise<SqlSchemaDto[]> {
    const entities = await this.sqlSchemaRepository.find();
    return entities.map((e) => plainToInstance(SqlSchemaDto, e));
  }

  async findOne(id: string): Promise<SqlSchemaDto | null> {
    const entity = await this.sqlSchemaRepository.findOneBy({ id });
    return entity ? plainToInstance(SqlSchemaDto, entity) : null;
  }

  async create(dto: Partial<SqlSchemaDto>): Promise<SqlSchemaDto> {
    const plain = instanceToPlain(dto);
    const entity = this.sqlSchemaRepository.create(plain);
    const saved = await this.sqlSchemaRepository.save(entity);
    return plainToInstance(SqlSchemaDto, saved);
  }

  async update(
    id: string,
    dto: Partial<SqlSchemaDto>,
  ): Promise<SqlSchemaDto | null> {
    const plain = instanceToPlain(dto);
    await this.sqlSchemaRepository.update(id, plain);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.sqlSchemaRepository.delete(id);
  }
}
