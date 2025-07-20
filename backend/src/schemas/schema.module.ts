import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SqlSchemaController } from './schema.controller';
import { SqlSchema } from '../entities/SqlSchema';

@Module({
  imports: [TypeOrmModule.forFeature([SqlSchema])],
  providers: [],
  controllers: [SqlSchemaController],
})
export class SchemaModule {}
