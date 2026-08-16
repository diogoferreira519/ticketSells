import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CatalogoService } from './catalogo.service';
import { ReservarAssentoDto } from './dto/reservar-assento.dto';

@Controller('catalogo/eventos')
@UseGuards(JwtAuthGuard)
export class CatalogoController {
  constructor(private readonly catalogoService: CatalogoService) {}

  @Get()
  list() {
    return this.catalogoService.listProximos();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.catalogoService.getDetalhe(id);
  }

  @Post(':id/reservar')
  reservar(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: ReservarAssentoDto,
  ) {
    return this.catalogoService.reservar(user.userId, id, dto.idAssentos);
  }
}
