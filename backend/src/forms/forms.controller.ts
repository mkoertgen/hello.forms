import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { Form } from '../entities/Form';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

@ApiTags('forms')
@Controller('forms')
export class FormsController {
  @Get()
  @ApiResponse({ status: 200, description: 'Get all forms', type: [Form] })
  async findAll(): Promise<Form[]> {
    const models = await Form.find();
    return models.map((m) => plainToInstance(Form, m));
  }

  @Get('tags/:tags')
  @ApiResponse({ status: 200, description: 'Get forms by tags', type: [Form] })
  async findByTags(@Param('tags') tags: string[]): Promise<Form[]> {
    return await Form.findByTags(tags);
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Get form by id', type: Form })
  @ApiResponse({ status: 404, description: 'Form not found' })
  async findOne(@Param('id') id: string): Promise<Form> {
    const entity = await Form.getForm(id);
    return plainToInstance(Form, entity);
  }

  @Post()
  @ApiResponse({ status: 201, description: 'Create form', type: Form })
  async create(@Body() dto: Form): Promise<Form> {
    const form = await Form.createForm(dto);
    return plainToInstance(Form, form);
  }

  @Patch(':id')
  @ApiResponse({ status: 200, description: 'Update form', type: Form })
  @ApiResponse({ status: 404, description: 'Form not found' })
  async patch(@Param('id') id: string, @Body() dto: Form): Promise<Form> {
    const form = await Form.updateForm(id, dto);
    return plainToInstance(Form, form);
  }

  @Delete(':id')
  @ApiResponse({ status: 204, description: 'Delete form' })
  async remove(@Param('id') id: string): Promise<void> {
    await Form.delete(id);
  }
}
