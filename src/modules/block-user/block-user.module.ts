import { Module } from '@nestjs/common';
import { BlockUserService } from './block-user.service';
import { BlockUserController } from './block-user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockUser } from './entities/block-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BlockUser])],
  controllers: [BlockUserController],
  providers: [BlockUserService],
  exports: [BlockUserService],
})
export class BlockUserModule {}
