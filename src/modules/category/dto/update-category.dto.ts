import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateCategoryDto {
  @IsOptional()
  @ApiProperty({ description: 'name of category - optional' })
  name: string;
}
