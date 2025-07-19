import { Column, Entity } from 'typeorm';
import { FormSchema } from '../types/form-schema';

@Entity('form')
export class Form {
  @Column('text', { primary: true, name: 'id', nullable: true, unique: true })
  id: string | null;

  @Column('text', { name: 'title' })
  title: string;

  @Column('text', { name: 'description', nullable: true })
  description: string | null;

  @Column('simple-json', { name: 'schema_json' })
  schemaJson: FormSchema;

  @Column('datetime', {
    name: 'created_at',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date | null;

  @Column('datetime', {
    name: 'updated_at',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date | null;
}
