import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { SqlSchemaService } from './sqlschema.service';
import { SqlSchemaDto } from '../dto/sqlschema.dto';
import { ApiTags, ApiResponse } from '@nestjs/swagger';

@ApiTags('sqlschema')
@Controller('sqlschema')
export class SqlSchemaController {
  constructor(private readonly sqlSchemaService: SqlSchemaService) {}

  @Get()
  @ApiResponse({
    status: 200,
    description: 'Get all SQL schemas',
    type: [SqlSchemaDto],
  })
  findAll(): Promise<SqlSchemaDto[]> {
    return this.sqlSchemaService.findAll();
  }

  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'Get SQL schema by id',
    type: SqlSchemaDto,
  })
  findOne(@Param('id') id: string): Promise<SqlSchemaDto | null> {
    return this.sqlSchemaService.findOne(id);
  }

  @Post()
  @ApiResponse({
    status: 201,
    description: 'Create SQL schema',
    type: SqlSchemaDto,
  })
  create(@Body() dto: Partial<SqlSchemaDto>): Promise<SqlSchemaDto> {
    return this.sqlSchemaService.create(dto);
  }

  @Put(':id')
  @ApiResponse({
    status: 200,
    description: 'Update SQL schema',
    type: SqlSchemaDto,
  })
  update(
    @Param('id') id: string,
    @Body() dto: Partial<SqlSchemaDto>,
  ): Promise<SqlSchemaDto | null> {
    return this.sqlSchemaService.update(id, dto);
  }

  @Delete(':id')
  @ApiResponse({ status: 204, description: 'Delete SQL schema' })
  remove(@Param('id') id: string): Promise<void> {
    return this.sqlSchemaService.remove(id);
  }
}
