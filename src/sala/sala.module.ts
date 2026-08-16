import { Module } from '@nestjs/common';
import { IsOrgGuard } from '../evento/is-org.guard';
import { SalaController } from './sala.controller';
import { SalaService } from './sala.service';

@Module({
  controllers: [SalaController],
  providers: [SalaService, IsOrgGuard],
})
export class SalaModule {}
