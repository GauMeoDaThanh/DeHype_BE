import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from 'src/decorators/public-route';
import { Role } from 'src/constants/role.enum';
import { ROLE } from 'src/decorators/role-route';
import { BlockUserService } from 'src/modules/block-user/block-user.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private blockUserService: BlockUserService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiresAuth = request.query?.fav === 'true';

    if (isPublic && !requiresAuth) {
      return true;
    }

    // Active to get the req.user for role checking
    const canActivate = await super.canActivate(context);
    if (!canActivate) {
      return false;
    }

    const { user } = context.switchToHttp().getRequest();
    const blockInfo = await this.blockUserService.findBlockUser(
      user.walletAddress,
    );

    if (blockInfo) {
      throw new ForbiddenException({
        error: 'This address has been banned',
        blockInfo,
      });
    }

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLE, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (
      requiredRoles &&
      !requiredRoles.some((role) => user?.role?.includes(role))
    ) {
      throw new ForbiddenException('You do not have the permission');
    }

    return true;
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid access token');
    }
    return user;
  }
}
