import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormsModule } from './forms/forms.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import dbConfig from './ormconfig';

@Module({
  imports: [TypeOrmModule.forRoot(dbConfig), FormsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
