import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsIn, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ example: 'Dehype user1' })
  @IsNotEmpty()
  username: string;
}

export class UpdateUserRoleDto {
  @ApiProperty({ example: 'admin' })
  @IsNotEmpty()
  @IsIn(['admin', 'user'], {
    message: "by must be one of the following values: 'admin', 'user'",
  })
  role: string;
}
