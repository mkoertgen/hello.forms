import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { SqlSchema } from '../entities/SqlSchema';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

@ApiTags('sqlschema')
@Controller('sqlschema')
export class SqlSchemaController {
  @Get()
  @ApiResponse({
    status: 200,
    description: 'Get all SQL schemas',
    type: [SqlSchema],
  })
  async findAll(): Promise<SqlSchema[]> {
    const models = await SqlSchema.find();
    return models.map((m) => plainToInstance(SqlSchema, m));
  }

  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'Get SQL schema by id',
    type: SqlSchema,
  })
  async findOne(@Param('id') id: string): Promise<SqlSchema> {
    const model = await SqlSchema.getSchema(id);
    return plainToInstance(SqlSchema, model);
  }

  @Post()
  @ApiResponse({
    status: 201,
    description: 'Create SQL schema',
    type: SqlSchema,
  })
  async create(@Body() dto: SqlSchema): Promise<SqlSchema> {
    const model = await SqlSchema.createSchema(dto);
    return plainToInstance(SqlSchema, model);
  }

  @Patch(':id')
  @ApiResponse({
    status: 200,
    description: 'Update SQL schema',
    type: SqlSchema,
  })
  async patch(
    @Param('id') id: string,
    @Body() dto: SqlSchema,
  ): Promise<SqlSchema> {
    const model = await SqlSchema.updateSchema(id, dto);
    return plainToInstance(SqlSchema, model);
  }

  @Delete(':id')
  @ApiResponse({ status: 204, description: 'Delete SQL schema' })
  async remove(@Param('id') id: string): Promise<void> {
    await SqlSchema.delete(id);
  }
}
