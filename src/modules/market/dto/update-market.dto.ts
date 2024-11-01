import { PartialType } from '@nestjs/swagger';
import { CreateMarketTransactionDto } from './create-market.dto';

export class UpdateMarketDto extends PartialType(CreateMarketTransactionDto) {}
