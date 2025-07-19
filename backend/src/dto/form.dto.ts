import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FormSchema } from '../types/form-schema';

@ApiSchema({ name: 'Form' })
export class FormDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: () => FormSchema })
  @ValidateNested()
  @Type(() => FormSchema)
  schemaJson: FormSchema;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
