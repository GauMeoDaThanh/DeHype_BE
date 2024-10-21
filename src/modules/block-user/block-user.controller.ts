import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { BlockUserService } from './block-user.service';
import { CreateBlockUserDto } from './dto/create-block-user.dto';
import { UpdateBlockUserDto } from './dto/update-block-user.dto';
import { Public } from 'src/decorators/public-route';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  BlockUserResponseDto,
  CreateBlockUserResponseDto,
} from './dto/response-block-user.dto';
import { Tag } from 'src/constants/api-tag.enum';
import { Roles } from 'src/decorators/role-route';
import { Role } from 'src/constants/role.enum';

@ApiTags(Tag.USER)
@Controller('users/block')
export class BlockUserController {
  constructor(private readonly blockUserService: BlockUserService) {}

  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'add user to block list' })
  @ApiCreatedResponse({ type: CreateBlockUserResponseDto })
  @ApiBadRequestResponse({ description: 'User already in block list' })
  @Post(':id')
  blockUser(
    @Param('id') walletAddress: string,
    @Body() createBlockUserDto: CreateBlockUserDto,
  ) {
    return this.blockUserService.blockUser(walletAddress, createBlockUserDto);
  }

  @ApiOperation({ summary: 'get block info of user' })
  @ApiOkResponse({ type: BlockUserResponseDto })
  @ApiNotFoundResponse({ description: 'Not found user in block list' })
  @Get(':id')
  findOne(@Param('id') walletAddress: string) {
    return this.blockUserService.findOne(walletAddress);
  }

  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'delete user from block list' })
  @ApiOkResponse({ description: 'Successful Operation' })
  @ApiNotFoundResponse({ description: 'Not found user in block list' })
  @Delete(':id')
  remove(@Param('id') walletAddress: string) {
    return this.blockUserService.remove(walletAddress);
  }
}
