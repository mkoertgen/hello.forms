import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormsModule } from './forms/forms.module';
import { dbConfig } from './ormconfig';
import { SchemaModule } from './schemas/schema.module';

@Module({
  imports: [TypeOrmModule.forRoot(dbConfig), FormsModule, SchemaModule],
})
export class AppModule {}
