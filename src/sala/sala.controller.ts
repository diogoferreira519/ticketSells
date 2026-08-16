import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { IsOrgGuard } from '../evento/is-org.guard';
import { CreateSalaDto } from './dto/create-sala.dto';
import { SalaService } from './sala.service';

@Controller('salas')
@UseGuards(JwtAuthGuard, IsOrgGuard)
export class SalaController {
  constructor(private readonly salaService: SalaService) {}

  @Get()
  findAll(@CurrentUser() user: { userId: string }) {
    return this.salaService.findAllByOrganizador(user.userId);
  }

  @Post()
  create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateSalaDto,
  ) {
    return this.salaService.create(user.userId, dto);
  }
}
