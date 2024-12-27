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
  Sse,
  Res,
  Req,
  UploadedFile,
} from '@nestjs/common';
import { MarketService } from './market.service';
import {
  CreateBetDto,
  CreateMarketTransactionDto,
  CreateMarketDto,
  GetVoterHistoryQueryDto,
  ResolveMarketDto,
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
  ApiQuery,
  ApiExcludeEndpoint,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
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
import {
  MarketLiveUpdateResponseDto,
  MarketOptionStatDto,
} from './dto/response-market.dto';
import { FileValidationPipe } from 'src/pipe/file-validation.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from 'src/constants/role.enum';
import { Roles } from 'src/decorators/role-route';
import { UploadImageReponseDto } from '../blog/dto/response-blog';
import { UpdateMarketCategoryDto } from './dto/update-market.dto';
import { resolve } from 'path';

@ApiTags(Tag.MARKET)
@Controller('markets')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Public()
  @ApiOperation({
    summary: 'Get live updates for a market',
    description:
      "This endpoint provides live updates for the specified market via SSE (Server-Sent Events). The updates are pushed every specified interval.\n CAN'T TEST IN SWAGGER",
  })
  @ApiOkResponse({ type: MarketLiveUpdateResponseDto })
  @Sse(':id/live-updates')
  getMarketUpdates(@Param('id') id: string, @Res() res) {
    return this.marketService.getMarketLiveUpdate(id, res);
  }

  @Public()
  @ApiOperation({
    summary: 'Get market stats updates for a market',
  })
  @ApiOkResponse({ type: [MarketOptionStatDto] })
  @Get(':id/stats-updates')
  getMarketStatsUpdates(
    @Param('id') id: string,
    @Query('init') isInit: boolean,
  ) {
    return this.marketService.getMarketStatsUpdateByPolling(id, isInit);
  }

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

  @ApiBearerAuth()
  @ApiOperation({ summary: 'upload cover of market' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({
    description: 'Successfull Operation',
    type: UploadImageReponseDto,
  })
  @Roles(Role.ADMIN)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(
    @UploadedFile(new FileValidationPipe()) image: Express.Multer.File,
  ) {
    return this.marketService.uploadMarketCover(image);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'add market to database' })
  @ApiBody({ type: CreateMarketDto })
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() createMarketDto: CreateMarketDto) {
    return this.marketService.createMarket(createMarketDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'update categories of market' })
  @ApiBody({ type: UpdateMarketCategoryDto })
  @Roles(Role.ADMIN)
  @Patch(':id/categories')
  updateCategories(
    @Param('id') id: string,
    @Body() updateMarketCategoryDto: UpdateMarketCategoryDto,
  ) {
    return this.marketService.updateMarketCategories(
      id,
      updateMarketCategoryDto,
    );
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
  votersInMarket(
    @Param('id') id: PublicKey,
    @Query() query: GetVoterHistoryQueryDto,
  ) {
    return this.marketService.votersInMarket(id, query);
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

  @ApiExcludeEndpoint()
  @Public()
  @Get('test/:id')
  test(@Param('id') id: string) {
    return this.marketService.handleMarketOptionStats(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'resolve market' })
  @Post(':id/resolve')
  @Roles(Role.ADMIN)
  resolveMarket(
    @Param('id') marketPublicKey: string,
    @Body() resolveMarketDto: ResolveMarketDto,
  ) {
    return this.marketService.resolveMarket(marketPublicKey, resolveMarketDto);
  }
}
