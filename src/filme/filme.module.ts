import { Module } from '@nestjs/common';
import { FilmeController } from './filme.controller';
import { FilmeService } from './filme.service';
import { TmdbClient } from './tmdb.client';

@Module({
  controllers: [FilmeController],
  providers: [FilmeService, TmdbClient],
})
export class FilmeModule {}
