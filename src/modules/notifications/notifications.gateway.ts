import { InternalServerErrorException } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket): any {
    try {
      const walletAddress = client.handshake.query.walletAddress;
      if (!walletAddress) {
        throw new InternalServerErrorException('WalletAddress is required');
      } else {
        client.join(walletAddress);
        console.log('client connected', walletAddress);
      }
    } catch (error) {
      console.error('Error in connect to socket:', error);
      client.disconnect();
      if (error instanceof Error) {
        throw new InternalServerErrorException(
          'Error in connect to socket',
          error.message,
        );
      }
      throw new InternalServerErrorException(
        'Unexpected error in connect to socket',
      );
    }
  }

  handleDisconnect(client: Socket): any {
    console.log(`client ${client.id} disconnected`);
  }

  sendNotificationToUser(walletAddress: string, notification: number) {
    this.server.to(walletAddress).emit('notification', notification);
  }
}
