import { Test, TestingModule } from '@nestjs/testing';
import { FavMarketController } from './fav-market.controller';
import { FavMarketService } from './fav-market.service';

describe('FavMarketController', () => {
  let controller: FavMarketController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FavMarketController],
      providers: [FavMarketService],
    }).compile();

    controller = module.get<FavMarketController>(FavMarketController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
