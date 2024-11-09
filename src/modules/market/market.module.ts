import { forwardRef, Module } from '@nestjs/common';
import { MarketService } from './market.service';
import { MarketController } from './market.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Market } from './entities/market.entity';
import { RedisCacheModule } from '../shared/cache/cache.module';
import { CategoryModule } from '../category/category.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Market]),
    RedisCacheModule,
    CategoryModule,
    UserModule,
  ],
  controllers: [MarketController],
  providers: [MarketService],
  exports: [MarketService],
})
export class MarketModule {}
