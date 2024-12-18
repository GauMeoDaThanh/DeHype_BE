import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { PendingUser } from './entities/pendingUser.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { MarketModule } from '../market/market.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, PendingUser]),
    CloudinaryModule,
    forwardRef(() => MarketModule),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService, TypeOrmModule],
})
export class UserModule {}
