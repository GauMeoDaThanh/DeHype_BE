import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/passport/jwt-auth.guard';
import { MarketModule } from './modules/market/market.module';
import { MetadataModule } from './modules/metadata/metadata.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { MarketCommentModule } from './modules/market-comment/market-comment.module';
import typeorm from './config/typeorm';
import { BlogModule } from './modules/blog/blog.module';
import { BlockUserModule } from './modules/block-user/block-user.module';
import { CacheModule } from '@nestjs/cache-manager';
import { FavMarketModule } from './modules/fav-market/fav-market.module';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeorm],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: async (configService: ConfigService) =>
        configService.get('typeorm'),
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        url: configService.get<String>('REDIS_URL'),
        // host: configService.get<String>('REDIS_HOST'),
        // port: configService.get<Number>('REDIS_PORT'),
        // password: configService.get<String>('REDIS_PASSWORD'),
        ttl: 60 * 5,
      }),
    }),
    AuthModule,
    UserModule,
    MarketModule,
    MetadataModule,
    CloudinaryModule,
    MarketCommentModule,
    BlogModule,
    BlockUserModule,
    FavMarketModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
