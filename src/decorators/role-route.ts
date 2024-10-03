import { SetMetadata } from '@nestjs/common';
import { Role } from 'src/constants/role.enum';

export const ROLE = 'role';
export const Roles = (...roles: Role[]) => SetMetadata(ROLE, roles);
