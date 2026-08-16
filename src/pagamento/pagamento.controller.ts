import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PagamentoService } from './pagamento.service';

@Controller('pagamentos')
@UseGuards(JwtAuthGuard)
export class PagamentoController {
  constructor(private readonly pagamentoService: PagamentoService) {}

  @Post(':idPedido/confirmar')
  confirmar(
    @CurrentUser() user: { userId: string },
    @Param('idPedido') idPedido: string,
  ) {
    return this.pagamentoService.enfileirar(
      user.userId,
      idPedido,
      'CONFIRMAR',
    );
  }

  @Post(':idPedido/recusar')
  recusar(
    @CurrentUser() user: { userId: string },
    @Param('idPedido') idPedido: string,
  ) {
    return this.pagamentoService.enfileirar(user.userId, idPedido, 'RECUSAR');
  }

  @Get(':idPedido')
  status(
    @CurrentUser() user: { userId: string },
    @Param('idPedido') idPedido: string,
  ) {
    return this.pagamentoService.status(user.userId, idPedido);
  }
}
