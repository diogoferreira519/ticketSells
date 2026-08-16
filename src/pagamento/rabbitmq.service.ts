import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp, {
  AmqpConnectionManager,
  ChannelWrapper,
} from 'amqp-connection-manager';
import type { ConfirmChannel, ConsumeMessage } from 'amqplib';

@Injectable()
export class RabbitmqService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitmqService.name);
  private connection: AmqpConnectionManager | null = null;
  private channel: ChannelWrapper | null = null;
  private queueName = 'pagamentos';

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const url =
      this.config.get<string>('RABBITMQ_URL') ??
      'amqp://guest:guest@localhost:5672';
    this.queueName =
      this.config.get<string>('RABBITMQ_QUEUE_PAGAMENTOS') ?? 'pagamentos';

    this.connection = amqp.connect([url]);
    this.connection.on('connect', () => {
      this.logger.log('Connected to RabbitMQ');
    });
    this.connection.on('disconnect', (params) => {
      this.logger.warn(
        `Disconnected from RabbitMQ: ${params.err?.message ?? 'unknown'}`,
      );
    });

    this.channel = this.connection.createChannel({
      json: false,
      setup: async (channel: ConfirmChannel) => {
        await channel.assertQueue(this.queueName, { durable: true });
      },
    });

    await this.channel.waitForConnect();
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }

  getQueueName() {
    return this.queueName;
  }

  async publish(payload: unknown): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not ready');
    }
    await this.channel.sendToQueue(
      this.queueName,
      Buffer.from(JSON.stringify(payload)),
      { persistent: true },
    );
  }

  async consume(
    handler: (msg: ConsumeMessage) => Promise<void>,
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not ready');
    }
    await this.channel.addSetup(async (channel: ConfirmChannel) => {
      await channel.assertQueue(this.queueName, { durable: true });
      await channel.consume(this.queueName, (msg) => {
        if (!msg) return;
        void handler(msg)
          .then(() => {
            channel.ack(msg);
          })
          .catch((err: unknown) => {
            this.logger.error(
              `Failed to process message: ${
                err instanceof Error ? err.message : String(err)
              }`,
            );
            channel.nack(msg, false, false);
          });
      });
    });
  }
}
