import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ValidarIngressoDto } from './dto/validar-ingresso.dto';
import { IsPortariaGuard } from './is-portaria.guard';
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

  @Post('validar')
  @UseGuards(JwtAuthGuard, IsPortariaGuard)
  validar(@Body() dto: ValidarIngressoDto) {
    return this.ingressoService.validar(dto.qrcode, dto.idEvento);
  }
}
