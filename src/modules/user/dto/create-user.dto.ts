import { IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'wallet address should not be empty' })
  walletAddress: string;
}
