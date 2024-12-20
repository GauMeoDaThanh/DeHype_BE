import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Req,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdateUserRoleDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { Public } from 'src/decorators/public-route';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiExcludeEndpoint,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Tag } from 'src/constants/api-tag.enum';
import { FileValidationPipe } from 'src/pipe/file-validation.pipe';
import {
  GetUserReponse,
  UserBettingHistoryResponse,
} from './dto/response-user.dto';
import { Wallet } from 'src/decorators/current-wallet';
import { MarketDetailDto } from '../market/dto/market-detail.dto';
import { Role } from 'src/constants/role.enum';
import { Roles } from 'src/decorators/role-route';

@ApiTags(Tag.USER)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'get all pending user - for dev only' })
  @Public()
  @Get('pending')
  findAllPendingUser() {
    return this.userService.findAllPendingUser();
  }

  @Public()
  @Post()
  @ApiOperation({ summary: 'create user' })
  @ApiResponse({ status: 201, description: 'Successful operation' })
  @ApiResponse({ status: 400, description: 'Bad Request - User already exist' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @ApiOperation({ summary: 'get user information' })
  @ApiParam({ name: 'id', type: String, description: 'user wallet address' })
  @ApiResponse({ status: 200, description: 'Successful operation' })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Invalid user address',
  })
  @Public()
  @Get(':id')
  findOne(@Param('id') walletAddress: string) {
    return this.userService.findOne(walletAddress);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'upload user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'The file has been successfully uploaded',
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          example: 'https://res.cloudinary.com/user/avatar.png',
        },
        public_id: { type: 'string', example: 'avatar_12345' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Cloudinary-specific error',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error - Cloudinary failure',
  })
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(
    @UploadedFile(new FileValidationPipe()) file: Express.Multer.File,
    @Req() req: Request,
  ) {
    return this.userService.uploadAvatar(file, req.user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'update user information' })
  @ApiOkResponse({ description: 'Successful operation' })
  @ApiInternalServerErrorResponse({ description: 'Server error' })
  @Patch()
  update(
    @Body() updateUserDto: UpdateUserDto,
    @Wallet() walletAddress: string,
  ) {
    return this.userService.update(walletAddress, updateUserDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'get all users information' })
  @ApiOkResponse({ type: GetUserReponse })
  @ApiQuery({ name: 'current', required: false, description: 'Current page' })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Number of record each page',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'sort by',
    example: '-createdAt',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'filter by username or wallet address',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    description: 'filter by role',
  })
  @Roles(Role.ADMIN)
  @Get()
  findAll(@Query() query: string) {
    return this.userService.findAll(query);
  }

  @ApiOperation({ summary: "get user's betting history" })
  @ApiOkResponse({ type: UserBettingHistoryResponse })
  @ApiInternalServerErrorResponse()
  @Public()
  @Get(':id/history')
  getBettingHistory(@Param('id') walletAddress: string) {
    return this.userService.getBettingHistory(walletAddress);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'update user role' })
  @ApiOkResponse({ description: 'Successful operation' })
  @ApiNotFoundResponse({ description: 'Invalid user address' })
  @Roles(Role.ADMIN)
  @Patch(':id/role')
  updateRole(
    @Param('id') walletAddress: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ) {
    return this.userService.updateRole(walletAddress, updateUserRoleDto);
  }
}
