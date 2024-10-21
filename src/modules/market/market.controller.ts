import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { MarketService } from './market.service';
import { CreateMarketDto } from './dto/create-market.dto';
import { UpdateMarketDto } from './dto/update-market.dto';
import { Public } from 'src/decorators/public-route';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Tag } from 'src/constants/api-tag.enum';

@ApiTags(Tag.MARKET)
@Controller('markets')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a market transaction' })
  @ApiResponse({
    status: 201,
    description: 'The market transaction has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  create(@Body() createMarketDto: CreateMarketDto) {
    return this.marketService.createMarketTransaction(createMarketDto);
  }

  @Public()
  @Get()
  findAll() {
    return this.marketService.getMarkets();
    // return this.marketService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    // return this.marketService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMarketDto: UpdateMarketDto) {
    // return this.marketService.update(+id, updateMarketDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    // return this.marketService.remove(+id);
  }
}
