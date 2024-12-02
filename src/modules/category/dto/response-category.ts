import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryResponseDto {
  @ApiProperty({ example: 1 })
  id: number;
  @ApiProperty({ example: 'Sport' })
  name: string;

  @ApiProperty({ example: 'https://www.avatar.com' })
  coverUrl: string;
}
