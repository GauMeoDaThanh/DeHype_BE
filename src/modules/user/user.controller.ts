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
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Tag } from 'src/constants/api-tag.enum';

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
  uploadAvatar(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    return this.userService.uploadAvatar(file, req.user);
  }

  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'update user information' })
  @ApiParam({ name: 'id', type: String, description: 'user wallet address' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @ApiExcludeEndpoint()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }

  @ApiExcludeEndpoint()
  @Get()
  findAll() {
    return this.userService.findAll();
  }
}
