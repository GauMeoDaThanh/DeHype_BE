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
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { Public } from 'src/decorators/public-route';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiExcludeEndpoint,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Tag } from 'src/constants/api-tag.enum';
import { FileValidationPipe } from 'src/pipe/file-validation.pipe';
import { GetUserReponse } from './dto/response-user.dto';
import { Wallet } from 'src/decorators/current-wallet';

@ApiTags(Tag.USER)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

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
  @ApiBearerAuth()
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

  @ApiExcludeEndpoint()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }

  // @ApiBearerAuth()
  @ApiOperation({ summary: 'get all users information' })
  @ApiOkResponse({ type: GetUserReponse })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Number of record each page',
  })
  @ApiQuery({ name: 'current', required: false, description: 'Current page' })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Number of record each page',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'Current page',
    example: '-createdAt',
  })
  @Public()
  @Get()
  findAll(@Query() query: string) {
    return this.userService.findAll(query);
  }
}
