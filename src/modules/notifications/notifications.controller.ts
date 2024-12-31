import { Controller, Get, Patch, Post } from '@nestjs/common';
import { Public } from 'src/decorators/public-route';
import { NotificationsService } from './notifications.service';
import { Wallet } from 'src/decorators/current-wallet';
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ReponseNotificationDto } from './dto/reponse-notification.dto';
import { Tag } from 'src/constants/api-tag.enum';

@ApiTags(Tag.NOTIFICATIONS)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'get all notifications of user' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiOkResponse({ type: ReponseNotificationDto, isArray: true })
  @Get()
  findAll(@Wallet() walletAddress: string) {
    return this.notificationsService.getAllNotifications(walletAddress);
  }

  @ApiExcludeEndpoint()
  @Public()
  @Post()
  create() {
    return this.notificationsService.createEndMarketNotifications(
      ['2a6uU2UfXtNd5NS9Vyzr8WmzS9HHEjfuVeFiBfoBTDRp'],
      '1415151',
      'no',
    );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'update read status of notification' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiOkResponse({ description: 'update read status successfully' })
  @Patch()
  update(@Wallet() walletAddress: string) {
    return this.notificationsService.updateReadStatus(walletAddress);
  }
}
