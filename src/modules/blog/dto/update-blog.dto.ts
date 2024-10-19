import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateBlogDto } from './create-blog.dto';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateBlogDto {
  @IsOptional()
  @ApiProperty()
  title?: string;

  @IsOptional()
  @ApiProperty()
  content?: string;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  blogImageIds: string[];
}
