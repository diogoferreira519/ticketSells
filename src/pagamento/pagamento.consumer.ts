import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PagamentoService } from './pagamento.service';
import { PagamentoMensagem } from './pagamento.types';
import { RabbitmqService } from './rabbitmq.service';

@Injectable()
export class PagamentoConsumer implements OnModuleInit {
  private readonly logger = new Logger(PagamentoConsumer.name);

  constructor(
    private readonly rabbitmq: RabbitmqService,
    private readonly pagamentoService: PagamentoService,
  ) {}

  async onModuleInit() {
    await this.rabbitmq.consume(async (msg) => {
      const raw = msg.content.toString('utf8');
      let mensagem: PagamentoMensagem;
      try {
        mensagem = JSON.parse(raw) as PagamentoMensagem;
      } catch {
        this.logger.error(`Invalid payment message: ${raw}`);
        return;
      }
      if (
        !mensagem?.idPedido ||
        !mensagem?.userId ||
        (mensagem.acao !== 'CONFIRMAR' && mensagem.acao !== 'RECUSAR')
      ) {
        this.logger.error(`Malformed payment message: ${raw}`);
        return;
      }
      await this.pagamentoService.aplicarResultado(mensagem);
    });
    this.logger.log(
      `Consuming queue ${this.rabbitmq.getQueueName()} for simulated payments`,
    );
  }
}
