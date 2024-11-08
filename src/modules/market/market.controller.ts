import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { MarketService } from './market.service';
import {
  CreateBetDto,
  CreateMarketDto,
  CreateMarketTransactionDto,
} from './dto/create-market.dto';
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
  GetMarketsStatsDto,
  GetAllMarketReponse,
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
  @ApiOkResponse({ type: GetAllMarketReponse })
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
    return this.marketService.getMarket(id.toString());
  }

  @ApiOperation({ summary: 'get market stats' })
  @ApiOkResponse({ type: MarketStatsDto })
  @ApiParam({ name: 'id', type: String, description: 'Public key of market' })
  @ApiInternalServerErrorResponse({
    description: 'Failed to fetch market stats',
  })
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

  @ApiOperation({ summary: 'up view for market' })
  @ApiInternalServerErrorResponse()
  @ApiCreatedResponse()
  @Public()
  @Post(':id/view')
  addMarketView(@Param('id') id: string) {
    return this.marketService.addMarketView(id);
  }

  @ApiOperation({
    summary: 'Get stats for multiple markets',
    description:
      'Fetches participation, liquidity and answer statistics for multiple markets',
  })
  @ApiOkResponse({
    description: 'Market stats retrieved successfully',
    type: Object,
  })
  @Public()
  @Post('stats')
  async getMarketsStat(@Body() dto: GetMarketsStatsDto) {
    return this.marketService.getBatchMarketStats(dto.marketIds);
  }
}
