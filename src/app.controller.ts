import { Controller, Get, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './decorators/public-route';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  getHello(): string {
    return this.appService.getHello();
  }
}
