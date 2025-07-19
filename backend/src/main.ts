import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Forms API')
    .setDescription('API for dynamic forms')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  app.use('/api-json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(document);
  });
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log('Swagger UI available at http://localhost:3000/api-docs');
}
bootstrap();
