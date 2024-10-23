import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBlockUserDto } from './dto/create-block-user.dto';
import { UpdateBlockUserDto } from './dto/update-block-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { BlockUser } from './entities/block-user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class BlockUserService {
  constructor(
    @InjectRepository(BlockUser)
    private blockUserRepository: Repository<BlockUser>,
  ) {}

  async findBlockUser(walletAddress: string) {
    return await this.blockUserRepository.findOne({
      where: { user: { walletAddress } },
    });
  }

  async blockUser(
    walletAddress: string,
    createBlockUserDto: CreateBlockUserDto,
  ) {
    const blockUserInfo = await this.findBlockUser(walletAddress);

    if (blockUserInfo)
      throw new BadRequestException(
        `User with wallet address ${walletAddress} already blocked`,
      );

    const blockUser = this.blockUserRepository.create({
      blockReason: createBlockUserDto.reason.trim(),
      user: { walletAddress: walletAddress },
    });

    return await this.blockUserRepository.save(blockUser);
  }

  async findOne(walletAddress: string) {
    const blockUserInfo = await this.findBlockUser(walletAddress);

    if (!blockUserInfo)
      throw new NotFoundException(`Address ${walletAddress} not in block list`);

    return blockUserInfo;
  }

  async remove(walletAddress: string) {
    const blockUserInfo = await this.findBlockUser(walletAddress);

    if (!blockUserInfo)
      throw new NotFoundException(`Address ${walletAddress} not in block list`);

    return this.blockUserRepository.delete(blockUserInfo.id);
  }
}
