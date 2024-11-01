import { Test, TestingModule } from '@nestjs/testing';
import { FavMarketService } from './fav-market.service';

describe('FavMarketService', () => {
  let service: FavMarketService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FavMarketService],
    }).compile();

    service = module.get<FavMarketService>(FavMarketService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
