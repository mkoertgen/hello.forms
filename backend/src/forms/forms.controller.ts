import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { FormsService } from './forms.service';
import { FormDto } from '../dto/form.dto';
import { ApiTags, ApiResponse } from '@nestjs/swagger';

@ApiTags('forms')
@Controller('forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Get all forms', type: [FormDto] })
  findAll(): Promise<FormDto[]> {
    return this.formsService.findAll();
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Get form by id', type: FormDto })
  findOne(@Param('id') id: string): Promise<FormDto | null> {
    return this.formsService.findOne(id);
  }

  @Post()
  @ApiResponse({ status: 201, description: 'Create form', type: FormDto })
  create(@Body() dto: Partial<FormDto>): Promise<FormDto> {
    return this.formsService.create(dto);
  }

  @Put(':id')
  @ApiResponse({ status: 200, description: 'Update form', type: FormDto })
  update(
    @Param('id') id: string,
    @Body() dto: Partial<FormDto>,
  ): Promise<FormDto | null> {
    return this.formsService.update(id, dto);
  }

  @Delete(':id')
  @ApiResponse({ status: 204, description: 'Delete form' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.formsService.remove(id);
  }
}
