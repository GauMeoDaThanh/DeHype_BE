import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';

export const Wallet = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    try {
      const request = ctx.switchToHttp().getRequest();
      return request.user.walletAddress;
    } catch (error) {
      throw new InternalServerErrorException(
        'Error in get wallet address from request',
      );
    }
  },
);
