import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormsModule } from './forms/forms.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { dbConfig } from './ormconfig';
import { SchemaModule } from './schemas/schema.module';

@Module({
  imports: [TypeOrmModule.forRoot(dbConfig), FormsModule, SchemaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
