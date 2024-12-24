import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateMarketCategoryDto {
  @IsNotEmpty()
  @IsNumber({}, { each: true })
  @ApiProperty({ description: 'List of categories id' })
  categoryIds: number[];
}
