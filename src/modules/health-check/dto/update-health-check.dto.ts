import { PartialType } from '@nestjs/swagger';
import { CreateHealthCheckDto } from './create-health-check.dto';

export class UpdateHealthCheckDto extends PartialType(CreateHealthCheckDto) {}
