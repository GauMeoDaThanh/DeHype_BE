import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreatePendingUserDto, CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdateUserRoleDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Brackets, ILike, In, IsNull, Repository } from 'typeorm';
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
import { MarketService } from '../market/market.service';
import { program } from 'src/constants';
import { getBettingAccounts } from 'src/helpers/utils';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(PendingUser)
    private pendingUserRepository: Repository<PendingUser>,
    private cloudinaryService: CloudinaryService,
    @Inject(forwardRef(() => MarketService))
    private marketService: MarketService,
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

  async updateRole(
    walletAddress: string,
    updateUserRoleDto: UpdateUserRoleDto,
  ) {
    const user = await this.getUser(walletAddress);

    if (user === null) throw new NotFoundException('Invalid user address');
    const { role } = updateUserRoleDto;
    return await this.usersRepository.update(walletAddress, { role });
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

  async findAllPendingUser() {
    return await this.pendingUserRepository.find();
  }

  async findAll(query: string) {
    const { filter, sort } = aqp(query);
    const allowedSortColumns = ['id', 'joinedAt', 'title', 'role'];

    let { pageSize, current, role, q, ...restFilter } = filter;
    if (!pageSize) pageSize = 10;
    if (!current) current = 1;
    if (sort) {
      const sortField = Object.keys(sort);
      sortField.forEach((field) => {
        if (allowedSortColumns.includes(field) === false)
          throw new BadRequestException(`Invalid sort column: ${field}`);
      });
    }
    const queryBuilder = this.usersRepository.createQueryBuilder('user');

    // perform filtering with a and (b or c) and sorting
    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    if (q) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.orWhere('user.username ILIKE :username', {
            username: `%${q}%`,
          });
          qb.orWhere('user.walletAddress ILIKE :walletAddress', {
            walletAddress: `%${q}%`,
          });
        }),
      );
    }

    if (sort) {
      Object.keys(sort).forEach((field) => {
        const direction = sort[field];
        queryBuilder.addOrderBy(
          `user.${field}`,
          direction === 1 ? 'ASC' : 'DESC',
        );
      });
    }

    const [results, totalItems] = await queryBuilder
      .select([
        'user.walletAddress',
        'user.username',
        'user.avatarUrl',
        'user.role',
      ])
      .skip((current - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    const meta: MetaDto = {
      current: current,
      pageSize: pageSize,
      pages: Math.ceil(totalItems / pageSize),
      total: totalItems,
    };

    const response: GetUserReponse = {
      users: results,
      meta: meta,
    };

    return response;
  }

  async findOne(walletAddress: string) {
    const bettingAccounts = await getBettingAccounts();
    const bettingAccountsOfUser = bettingAccounts.filter(
      (account) => account.voter.toBase58() === walletAddress,
    );

    const joinedMarkets = new Set(
      bettingAccountsOfUser.map((account) => account.marketKey.toString(16)),
    ).size;

    const totalAmount = bettingAccountsOfUser.reduce(
      (sum, account) => sum + account.tokens,
      0,
    );

    const profitLoss = 0;

    const user = await this.getUser(walletAddress);

    if (user === null) throw new NotFoundException('Invalid user address');
    return {
      ...instanceToPlain(user),
      joinedMarkets,
      totalAmount,
      profitLoss,
    };
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

  async getBettingHistory(walletAddress: string) {
    try {
      const user = await this.getUser(walletAddress);
      const bettingHistory =
        await this.marketService.getUserBettingHistory(walletAddress);
      return {
        user: {
          walletAddress: user.walletAddress,
          username: user.username,
        },
        bets: bettingHistory,
      };
    } catch (error) {
      console.error('Error in get user betting history:', error);
      throw new InternalServerErrorException(
        'Error in get user betting history',
      );
    }
  }

  async getUserByWalletAddress(walletAddress: string[]) {
    try {
      const users = await this.usersRepository.find({
        where: { walletAddress: In(walletAddress) },
        select: ['walletAddress'],
      });

      return users.map((user) => user.walletAddress);
    } catch (error) {
      console.error('Error in get user by wallet addess:', error);
      if (error instanceof Error) {
        throw new InternalServerErrorException(
          'Error in get user by wallet addess',
          error.message,
        );
      }
      throw new InternalServerErrorException(
        'Unexpected error in get user by wallet addess',
      );
    }
  }
}
