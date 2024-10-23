import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreatePendingUserDto, CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { IsNull, Repository } from 'typeorm';
import { PendingUser } from './entities/pendingUser.entity';
import { classToPlain, instanceToPlain } from 'class-transformer';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { extractPublicId } from 'cloudinary-build-url';
import aqp from 'api-query-params';
import {
  GetUserReponse,
  MetaDto,
  UserResultDto,
} from './dto/response-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(PendingUser)
    private pendingUserRepository: Repository<PendingUser>,
    private cloudinaryService: CloudinaryService,
  ) {}

  isWalletExist = async (walletAddress: string) => {
    const isExist = await this.usersRepository.exists({
      where: { walletAddress: walletAddress },
    });
    if (isExist) return true;
    return false;
  };

  getUser = async (walletAddress: string) => {
    const user = await this.usersRepository.findOne({
      where: { walletAddress: walletAddress || IsNull() },
    });

    return user;
  };

  getPendingUser = async (walletAddress: string) => {
    const pendingUser = await this.pendingUserRepository.findOne({
      where: { walletAddress: walletAddress || IsNull() },
    });

    return pendingUser;
  };

  async createPendingUser(createPendingUserDto: CreatePendingUserDto) {
    const { wallet, isLedger, nonce } = createPendingUserDto;

    const pendingUser = this.pendingUserRepository.create({
      walletAddress: wallet,
      isLedger: isLedger,
      nonce: nonce,
    });
    return await this.pendingUserRepository.save(pendingUser);
  }

  async createUser(createUserDto: CreateUserDto) {
    const { walletAddress, role } = createUserDto;

    const isExist = await this.isWalletExist(walletAddress);
    if (isExist === true) {
      throw new BadRequestException(
        `Wallet address ${walletAddress} already exists`,
      );
    }

    const user = this.usersRepository.create({
      walletAddress: walletAddress,
      role: role,
    });
    await this.usersRepository.save(user);

    return {
      username: user.username,
      walletAddress: user.walletAddress,
    };
  }

  async removePendingUserByNonce(nonce: string) {
    const foundNonce = await this.pendingUserRepository.findOne({
      where: { nonce },
    });

    if (foundNonce) {
      await this.pendingUserRepository.remove(foundNonce);
      return foundNonce;
    }
    return null;
  }

  async uploadAvatar(file: Express.Multer.File, user: any) {
    const { walletAddress } = user;
    const userInfo = await this.getUser(walletAddress);
    const publicId = extractPublicId(userInfo.avatarUrl);

    if (publicId !== 'User/default') {
      this.cloudinaryService.removeFile(publicId);
    }

    const folder = 'user';
    const uploadResult = await this.cloudinaryService.uploadFile(file, folder);

    this.usersRepository.update(walletAddress, { avatarUrl: uploadResult.url });

    return uploadResult;
  }

  async findAll(query: string) {
    const { filter, sort } = aqp(query);
    const allowedSortColumns = ['id', 'createdAt', 'title', 'updatedAt'];

    let { pageSize, current, ...restFilter } = filter;

    if (!pageSize) pageSize = 10;
    if (!current) current = 1;
    if (sort) {
      const sortField = Object.keys(sort);
      sortField.forEach((field) => {
        if (allowedSortColumns.includes(field) === false)
          throw new BadRequestException(`Invalid sort column: ${field}`);
      });
    }

    const [results, totalItems] = await this.usersRepository.findAndCount({
      relations: ['blockUser'],
      where: { ...restFilter },
      order: sort,
      take: pageSize,
      skip: (current - 1) * pageSize,
    });

    const customizedResults: UserResultDto[] = results.map((user) => ({
      walletAddress: user.walletAddress,
      username: user.username,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isBlocked: user.blockUser ? true : false,
    }));

    const meta: MetaDto = {
      current: current,
      pageSize: pageSize,
      pages: Math.ceil(totalItems / pageSize),
      total: totalItems,
    };

    const response: GetUserReponse = {
      users: customizedResults,
      meta: meta,
    };

    return response;
  }

  async findOne(walletAddress: string) {
    const user = await this.getUser(walletAddress);

    if (user === null) throw new NotFoundException('Invalid user address');
    return instanceToPlain(user);
  }

  async update(walletAddress: string, updateUserDto: UpdateUserDto) {
    try {
      const { username } = updateUserDto;
      return await this.usersRepository.update(walletAddress, {
        username: username,
      });
    } catch (error) {
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
