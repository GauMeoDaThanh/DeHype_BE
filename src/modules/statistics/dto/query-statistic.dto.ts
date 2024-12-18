import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class QueryStatisticDto {
  @ApiProperty({ description: 'period of time', required: false })
  @IsOptional()
  @IsIn(['d', 'm', 'y'], {
    message: "by must be one of the following values: 'd', 'm', 'y'",
  })
  by?: string;
}
