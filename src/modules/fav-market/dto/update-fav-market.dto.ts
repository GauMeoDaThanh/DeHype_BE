import { PartialType } from '@nestjs/swagger';
import { CreateFavMarketDto } from './create-fav-market.dto';

export class UpdateFavMarketDto extends PartialType(CreateFavMarketDto) {}
