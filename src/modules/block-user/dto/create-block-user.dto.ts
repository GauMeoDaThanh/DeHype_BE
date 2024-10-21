import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateBlockUserDto {
  @ApiProperty({ example: 'cheating' })
  @IsNotEmpty()
  reason: string;
}
