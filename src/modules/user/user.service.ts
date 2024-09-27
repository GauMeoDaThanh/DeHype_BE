import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { IsNull, Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  isWalletExist = async (walletAddress: string) => {
    const user = await this.usersRepository.exists({
      where: { walletAddress: walletAddress },
    });
    if (user) return true;
    return false;
  };

  async create(createUserDto: CreateUserDto) {
    const { walletAddress } = createUserDto;

    const isExist = await this.isWalletExist(walletAddress);
    if (isExist === true) {
      throw new BadRequestException(
        `Wallet address ${walletAddress} already exists`,
      );
    }

    const user = this.usersRepository.create({
      walletAddress: walletAddress,
    });
    await this.usersRepository.save(user);

    return {
      walletAddress: user.walletAddress,
    };
  }

  findAll() {
    return `This action returns all user`;
  }

  async findOne(walletAddress: string) {
    const user = await this.usersRepository.findOne({
      where: { walletAddress: walletAddress || IsNull() },
    });

    if (user === null) throw new BadRequestException('Invalid user address');
    return user;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
