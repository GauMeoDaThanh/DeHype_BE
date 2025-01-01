import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationType } from './entities/notification-type.entity';
import { Notification } from './entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationType)
    private notificationTypeRepository: Repository<NotificationType>,
    private notificationGateway: NotificationsGateway,
  ) {}

  async createEndMarketNotifications(
    walletAddresss: string[],
    marketTitle: string,
    result: string,
  ) {
    const content = `Market ${marketTitle} has been ended with the final result is ${result.toUpperCase()}. Please checkout market details to claim your rewards if you are the winner.`;
    const notificationType = await this.notificationTypeRepository.findOne({
      where: { type: 'end_market' },
    });
    const notifications = walletAddresss.map((walletAddress) => {
      this.notificationGateway.sendNotificationToUser(walletAddress, 1);

      return this.notificationRepository.create({
        content,
        type: notificationType,
        user: { walletAddress: walletAddress },
      });
    });

    return await this.notificationRepository.save(notifications);
  }

  async getAllNotifications(walletAddress: string) {
    try {
      const notifications = await this.notificationRepository.find({
        where: { user: { walletAddress } },
        relations: ['type'],
        order: { createdAt: 'DESC' },
      });
      return notifications.map((notification) => {
        return {
          ...notification,
          type: notification.type.type,
        };
      });
    } catch (error) {
      console.error('Error in get notifications:', error);
      if (error instanceof Error) {
        throw new InternalServerErrorException(
          'Error in get notifications',
          error.message,
        );
      }
      throw new InternalServerErrorException(
        'Unexpected error in get notifications',
      );
    }
  }

  async updateReadStatus(walletAddress: string) {
    try {
      return await this.notificationRepository.update(
        { user: { walletAddress } },
        { isRead: true },
      );
    } catch (error) {
      console.error('Error in update read status:', error);
      if (error instanceof Error) {
        throw new InternalServerErrorException(
          'Error in update read status',
          error.message,
        );
      }
      throw new InternalServerErrorException(
        'Unexpected error in update read status',
      );
    }
  }
}
