import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { FavMarketService } from './fav-market.service';
import { CreateFavMarketDto } from './dto/create-fav-market.dto';
import { UpdateFavMarketDto } from './dto/update-fav-market.dto';
import { Wallet } from 'src/decorators/current-wallet';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Tag } from 'src/constants/api-tag.enum';

@ApiTags(Tag.MARKET)
@Controller('markets')
export class FavMarketController {
  constructor(private readonly favMarketService: FavMarketService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'add like to market' })
  @ApiCreatedResponse()
  @ApiInternalServerErrorResponse()
  @Post(':id/like')
  AddMarketToFavorties(@Param('id') id: string, @Wallet() walletAddress: string) {
    return this.favMarketService.addFavMarket(id, walletAddress);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'remove market like' })
  @ApiOkResponse()
  @ApiInternalServerErrorResponse()
  @Delete(':id/unlike')
  RemoveMarketFromFavorites(@Param('id') id: string, @Wallet() walletAddress: string) {
    return this.favMarketService.removeFavMarket(id, walletAddress);
  }
}
