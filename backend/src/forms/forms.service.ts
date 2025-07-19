import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Form } from '../entities/Form';
import { FormDto } from '../dto/form.dto';
import { plainToInstance, instanceToPlain } from 'class-transformer';

@Injectable()
export class FormsService {
  constructor(
    @InjectRepository(Form)
    private formsRepository: Repository<Form>,
  ) {}

  async findAll(): Promise<FormDto[]> {
    const entities = await this.formsRepository.find();
    return entities.map((e) => plainToInstance(FormDto, e));
  }

  async findOne(id: string): Promise<FormDto | null> {
    const entity = await this.formsRepository.findOneBy({ id });
    return entity ? plainToInstance(FormDto, entity) : null;
  }

  async create(dto: Partial<FormDto>): Promise<FormDto> {
    const plain = instanceToPlain(dto);
    const entity = this.formsRepository.create(plain);
    const saved = await this.formsRepository.save(entity);
    return plainToInstance(FormDto, saved);
  }

  async update(id: string, dto: Partial<FormDto>): Promise<FormDto | null> {
    const plain = instanceToPlain(dto);
    await this.formsRepository.update(id, plain);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.formsRepository.delete(id);
  }
}
