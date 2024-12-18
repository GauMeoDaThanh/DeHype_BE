import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import {
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Tag } from 'src/constants/api-tag.enum';
import { Public } from 'src/decorators/public-route';
import { Role } from 'src/constants/role.enum';
import { Roles } from 'src/decorators/role-route';
import { QueryStatisticDto } from './dto/query-statistic.dto';
import { query } from 'express';
import {
  MemberStatisticsResponse,
  MostBettingLeaderboardResponse,
  TransactionStatisticsResponse,
  TransactionVolumeStatisticsResponse,
} from './dto/response-statistic.dto';

@ApiTags(Tag.STATISTICS)
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @ApiOperation({ summary: 'Get most betting leaderboard' })
  @Public()
  @Get('/most-betting')
  @ApiInternalServerErrorResponse()
  @ApiOkResponse({ type: [MostBettingLeaderboardResponse] })
  getMostBettingLeaderboard() {
    return this.statisticsService.getMostBettingLeaderboard();
  }

  @ApiOperation({ summary: 'Get most profit leaderboard' })
  @Public()
  @Get('/most-profit')
  getMostProfitLeaderboard() {
    return this.statisticsService.getMostProfitLeaderboard();
  }

  @ApiOperation({ summary: 'Get member statistics by period' })
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @ApiInternalServerErrorResponse()
  @ApiOkResponse({ type: [MemberStatisticsResponse] })
  @Get('/member')
  getMemberStatistics(@Query() query: QueryStatisticDto) {
    return this.statisticsService.getMemberStatistics(query);
  }

  @ApiOperation({ summary: 'Get transaction statistics by period' })
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @ApiInternalServerErrorResponse()
  @ApiOkResponse({ type: [TransactionStatisticsResponse] })
  @Get('/transactions')
  getTransactionStatistics(@Query() query: QueryStatisticDto) {
    return this.statisticsService.getTransactionStatistics(query);
  }

  @ApiOperation({ summary: 'Get transaction volume statistics by period' })
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @ApiInternalServerErrorResponse()
  @ApiOkResponse({ type: [TransactionVolumeStatisticsResponse] })
  @Get('/transactions-volume')
  getTransactionVolumeStatistics(@Query() query: QueryStatisticDto) {
    return this.statisticsService.getTransactionVolumeStatistics(query);
  }
}
