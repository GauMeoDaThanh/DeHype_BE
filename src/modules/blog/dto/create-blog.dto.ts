import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateBlogDto {
  @ApiProperty()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  content: string;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  blogImages: string[];
}

export class GetBlogDto {
  @IsUUID('4', { message: 'ID must be a valid UUID' })
  id: string;
}
