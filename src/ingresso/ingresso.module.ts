import { Module } from '@nestjs/common';
import { IngressoController } from './ingresso.controller';
import { IngressoService } from './ingresso.service';
import { IsPortariaGuard } from './is-portaria.guard';

@Module({
  controllers: [IngressoController],
  providers: [IngressoService, IsPortariaGuard],
})
export class IngressoModule {}
