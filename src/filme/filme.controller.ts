import { Controller, Get, Param, Query } from '@nestjs/common';
import { FilmeService } from './filme.service';
import { SearchFilmeDto } from './dto/search-filme.dto';
import { PageFilmeDto } from './dto/page-filme.dto';

@Controller('filmes')
export class FilmeController {
  constructor(private readonly filmeService: FilmeService) {}

  @Get('search')
  search(@Query() dto: SearchFilmeDto) {
    return this.filmeService.search(dto.query, dto.page);
  }

  @Get('popular')
  popular(@Query() dto: PageFilmeDto) {
    console.log('chegou')
    return this.filmeService.popular(dto.page);
  }

  @Get('now-playing')
  nowPlaying(@Query() dto: PageFilmeDto) {
    return this.filmeService.nowPlaying(dto.page);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.filmeService.findById(id);
  }
}
