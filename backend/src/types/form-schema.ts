// This is a scaffold. Adjust fields as needed to match your actual schema structure.
import { ApiProperty } from '@nestjs/swagger';

export class FormSchemaField {
  @ApiProperty()
  name: string;

  @ApiProperty()
  type: string;

  @ApiProperty({ required: false })
  label?: string;

  @ApiProperty({ required: false })
  required?: boolean;
}

export class FormSchema {
  @ApiProperty({ type: [FormSchemaField] })
  fields: FormSchemaField[];
}
