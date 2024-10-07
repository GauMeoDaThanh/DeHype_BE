import { ApiProperty } from '@nestjs/swagger';

export class CreateMarketDto {
  @ApiProperty({ description: 'The name of the event' })
  eventName: string;

  @ApiProperty({ description: 'The outcome options for the event', type: [String] })
  outcomeOptions: string[];

  @ApiProperty({ description: 'The public key of the user' })
  userPublicKey: string;
}


export class ResolveMarketDto {
  marketAddress: string;        // Public key of the market as a string
  winningOutcome: string;       // The winning outcome to resolve the market
  userPublicKey: string;
}