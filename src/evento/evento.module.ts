import { Module } from '@nestjs/common';
import { EventoController } from './evento.controller';
import { EventoService } from './evento.service';
import { IsOrgGuard } from './is-org.guard';

@Module({
  controllers: [EventoController],
  providers: [EventoService, IsOrgGuard],
})
export class EventoModule {}
