import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class SearchMarketQueryDto {
  @IsOptional()
  @ApiProperty({ description: 'Search query', required: false })
  q?: string;

  @IsOptional()
  @ApiProperty({ description: 'Search by category', required: false })
  c?: string;

  @IsOptional()
  @ApiProperty({ description: 'Search in favourite only', required: false })
  fav: boolean;
}
