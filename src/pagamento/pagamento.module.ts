import { Module } from '@nestjs/common';
import { PagamentoConsumer } from './pagamento.consumer';
import { PagamentoController } from './pagamento.controller';
import { PagamentoService } from './pagamento.service';
import { RabbitmqService } from './rabbitmq.service';

@Module({
  controllers: [PagamentoController],
  providers: [RabbitmqService, PagamentoService, PagamentoConsumer],
})
export class PagamentoModule {}
