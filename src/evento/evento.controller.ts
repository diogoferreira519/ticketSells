import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { EventoService } from './evento.service';
import { IsOrgGuard } from './is-org.guard';

@Controller('eventos')
@UseGuards(JwtAuthGuard, IsOrgGuard)
export class EventoController {
  constructor(private readonly eventoService: EventoService) {}

  @Get()
  findAll(@CurrentUser() user: { userId: string }) {
    return this.eventoService.findAllByOrganizador(user.userId);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.eventoService.findOneForOrganizador(user.userId, id);
  }

  @Post()
  create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateEventoDto,
  ) {
    return this.eventoService.create(user.userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateEventoDto,
  ) {
    return this.eventoService.update(user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.eventoService.remove(user.userId, id);
  }
}
