import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Tag } from './constants/api-tag.enum';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configServer = app.get(ConfigService);
  const port = configServer.get('PORT') || 8080;

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  app.setGlobalPrefix('api/v1', { exclude: [''] });
  app.enableCors();

  const config = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('Dehype API docs')
    .setDescription('Dehype API description')
    .setVersion('1.0')
    .addTag('dehype')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  document.tags = [
    { name: Tag.AUTHENTICATE },
    { name: Tag.USER },
    { name: Tag.MARKET_COMMENT },
    { name: Tag.BLOG },
  ];

  SwaggerModule.setup('api', app, document);
  console.log(`Server running on port ${port}`);
  await app.listen(port);
}
bootstrap();
