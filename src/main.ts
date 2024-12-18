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
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.setGlobalPrefix('api/v1', { exclude: [''] });
  // const allowedOrigins = [
  //   'https://dehype.fun',
  //   'https://www.dehype.fun',
  //   // Add any other allowed origins here
  // ];

  // app.enableCors({
  //   origin: (origin, callback) => {
  //     // Allow requests with no origin (like mobile apps or curl requests)
  //     if (!origin || allowedOrigins.indexOf(origin) !== -1) {
  //       callback(null, true);
  //     } else {
  //       callback(new Error('Not allowed by CORS'));
  //     }
  //   },
  //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  //   credentials: true,
  // });

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
    { name: Tag.MARKET },
    { name: Tag.MARKET_COMMENT },
    { name: Tag.BLOG },
    { name: Tag.SEARCH },
    { name: Tag.CATEGORY },
    { name: Tag.STATISTICS },
  ];

  SwaggerModule.setup('api', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
  console.log(`Server running on port ${port}`);

  // Bind to all IPv4 addresses
  await app.listen(port, '0.0.0.0');
}
bootstrap();
