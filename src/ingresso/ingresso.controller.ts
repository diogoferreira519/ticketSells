import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { IngressoService } from './ingresso.service';

@Controller('ingressos')
export class IngressoController {
  constructor(private readonly ingressoService: IngressoService) {}

  @Get('meus')
  @UseGuards(JwtAuthGuard)
  listMeus(@CurrentUser() user: { userId: string }) {
    return this.ingressoService.listMeus(user.userId);
  }

  @Get('por-codigo/:qrcode')
  findByQrcode(@Param('qrcode') qrcode: string) {
    return this.ingressoService.findByQrcode(qrcode);
  }
}
