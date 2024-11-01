import { Module } from '@nestjs/common';
import { MarketService } from './market.service';
import { MarketController } from './market.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Market } from './entities/market.entity';
import { RedisCacheModule } from '../shared/cache/cache.module';

@Module({
  imports: [TypeOrmModule.forFeature([Market]), RedisCacheModule],
  controllers: [MarketController],
  providers: [MarketService],
  exports: [MarketService],
})
export class MarketModule {}
