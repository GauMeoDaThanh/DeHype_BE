import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
} from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchMarketQueryDto } from './dto/create-search.dto';
import { UpdateSearchDto } from './dto/update-search.dto';
import { Public } from 'src/decorators/public-route';
import { Wallet } from 'src/decorators/current-wallet';
import {
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Tag } from 'src/constants/api-tag.enum';
import {
  GetAllMarketReponse,
  SimpleMarketResponse,
} from '../market/dto/market-detail.dto';

@ApiTags(Tag.SEARCH)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @ApiOperation({ summary: 'Search markets global' })
  @ApiQuery({
    name: 'q',
    description: 'search text',
    required: false,
    type: String,
  })
  @ApiInternalServerErrorResponse()
  @ApiOkResponse({ type: SimpleMarketResponse, isArray: true })
  @Public()
  @Get()
  findAll(@Query('q') searchText: string) {
    return this.searchService.findAll(searchText);
  }

  @ApiOperation({ summary: 'Search markets in detail' })
  @ApiInternalServerErrorResponse()
  @ApiOkResponse({ type: GetAllMarketReponse, isArray: true })
  @Public()
  @Get('details')
  findAllDetails(
    @Query() searchMarketqueryDto: SearchMarketQueryDto,
    @Req() req,
  ) {
    if (req.user) {
      return this.searchService.findAllDetails(
        searchMarketqueryDto,
        req.user.walletAddress,
      );
    }
    return this.searchService.findAllDetails(searchMarketqueryDto);
  }
}
