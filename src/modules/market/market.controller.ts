import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
} from '@nestjs/common';
import { MarketService } from './market.service';
import {
  CreateBetDto,
  CreateMarketDto,
  CreateMarketTransactionDto,
} from './dto/create-market.dto';
import { UpdateMarketDto } from './dto/update-market.dto';
import { Public } from 'src/decorators/public-route';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Tag } from 'src/constants/api-tag.enum';
import { PublicKey } from '@solana/web3.js';
import { Wallet } from 'src/decorators/current-wallet';
import {
  MarketDetailDto,
  MarketStatsDto,
  VoterListDto,
} from './dto/market-detail.dto';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

@ApiTags(Tag.MARKET)
@Controller('markets')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Post('transaction')
  @Public()
  @ApiOperation({ summary: 'create a market transaction' })
  @ApiResponse({
    status: 201,
    description: 'The market transaction has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  createMarketTransaction(@Body() createMarketDto: CreateMarketTransactionDto) {
    return this.marketService.createMarketTransaction(createMarketDto);
  }

  @ApiOperation({ summary: 'add market to database' })
  @Public()
  @Post()
  create(@Body() createMarketDto: CreateMarketDto) {
    return this.marketService.createMarket(createMarketDto);
  }

  @ApiOperation({ summary: 'get all markets' })
  @ApiInternalServerErrorResponse({
    description: 'Failed to fetch markets',
  })
  @ApiOkResponse()
  @Public()
  @Get()
  findAll() {
    return this.marketService.getMarkets();
  }

  @ApiOperation({ summary: 'get detail market' })
  @ApiInternalServerErrorResponse({
    description: 'Failed to fetch market stats',
  })
  @ApiOkResponse({ type: MarketDetailDto })
  @ApiInternalServerErrorResponse({
    description: 'Failed to fetch market info',
  })
  @ApiParam({ name: 'id', type: String, description: 'Public key of market' })
  @Public()
  @Get(':id')
  findOne(@Param('id') id: PublicKey) {
    return this.marketService.getMarket(id);
  }

  @ApiOperation({ summary: 'get market stats' })
  @ApiOkResponse({ type: MarketStatsDto })
  @ApiParam({ name: 'id', type: String, description: 'Public key of market' })
  @ApiInternalServerErrorResponse({
    description: 'Failed to fetch market stats',
  })
  @UseInterceptors(CacheInterceptor)
  @Public()
  @Get(':id/stats')
  marketStats(@Param('id') id: PublicKey) {
    return this.marketService.marketStats(id);
  }

  @ApiOperation({ summary: 'get voters history' })
  @ApiInternalServerErrorResponse({
    description: 'Failed to fetch voters',
  })
  @ApiOkResponse({ type: VoterListDto })
  @ApiParam({ name: 'id', type: String, description: 'Public key of market' })
  @Public()
  @Get(':id/voters')
  votersInMarket(@Param('id') id: PublicKey) {
    return this.marketService.votersInMarket(id);
  }

  @ApiOperation({ summary: 'place bet in market' })
  @ApiBadRequestResponse({
    description: 'Bad request',
  })
  @ApiCreatedResponse({
    description: 'The betting transaction has been successfully created.',
  })
  @Public()
  @Post('bet')
  placeBet(createBetDto: CreateBetDto, @Wallet() voter: PublicKey) {
    return this.marketService.placeBet(createBetDto, voter);
  }
}
