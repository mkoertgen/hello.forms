import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormsController } from './forms.controller';
import { Form } from '../entities/Form';

@Module({
  imports: [TypeOrmModule.forFeature([Form])],
  providers: [],
  controllers: [FormsController],
})
export class FormsModule {}
