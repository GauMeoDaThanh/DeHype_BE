import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configServer = app.get(ConfigService);
  const port = configServer.get('PORT') || 8080;

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  app.setGlobalPrefix('api/v1', { exclude: [''] });

  const config = new DocumentBuilder()
    .setTitle('Dehype API docs')
    .setDescription('Dehype API description')
    .setVersion('1.0')
    .addTag('dehype')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  console.log(`Server running on http://localhost:${port}`);
  await app.listen(port);
}
bootstrap();
