import { PartialType } from '@nestjs/swagger';
import { CreateBlockUserDto } from './create-block-user.dto';

export class UpdateBlockUserDto extends PartialType(CreateBlockUserDto) {}
