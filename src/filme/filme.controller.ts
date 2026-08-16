import { Controller, Get, Param, Query } from '@nestjs/common';
import { FilmeService } from './filme.service';
import { SearchFilmeDto } from './dto/search-filme.dto';
import { PageFilmeDto } from './dto/page-filme.dto';
import { DiscoverFilmeDto } from './dto/discover-filme.dto';

@Controller('filmes')
export class FilmeController {
  constructor(private readonly filmeService: FilmeService) {}

  @Get('search')
  search(@Query() dto: SearchFilmeDto) {
    return this.filmeService.search(dto.query, dto.page);
  }

  @Get('popular')
  popular(@Query() dto: PageFilmeDto) {
    return this.filmeService.popular(dto.page);
  }

  @Get('now-playing')
  nowPlaying(@Query() dto: PageFilmeDto) {
    return this.filmeService.nowPlaying(dto.page);
  }

  @Get('generos')
  genres() {
    return this.filmeService.genres();
  }

  @Get('discover')
  discover(@Query() dto: DiscoverFilmeDto) {
    return this.filmeService.discoverByGenre(dto.genreId, dto.page);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.filmeService.findById(id);
  }
}
