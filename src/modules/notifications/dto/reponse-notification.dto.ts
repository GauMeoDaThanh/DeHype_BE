import { ApiProperty } from '@nestjs/swagger';

export class ReponseNotificationDto {
  @ApiProperty({ description: 'id of notification' })
  id: string;

  @ApiProperty({ description: 'content of notification' })
  content: string;

  @ApiProperty({ description: 'type of notification' })
  type: string;

  @ApiProperty({ description: 'status of notification' })
  isRead: boolean;

  @ApiProperty({ description: 'created date of notification' })
  createdAt: Date;
}
