import { Injectable } from '@nestjs/common';
import { TmdbClient } from './tmdb.client';

@Injectable()
export class FilmeService {
  constructor(private readonly tmdb: TmdbClient) {}

  search(query: string, page?: number) {
    return this.tmdb.searchMovies(query, page ?? 1);
  }

  popular(page?: number) {
    return this.tmdb.popularMovies(page ?? 1);
  }

  nowPlaying(page?: number) {
    return this.tmdb.nowPlayingMovies(page ?? 1);
  }

  findById(id: string) {
    return this.tmdb.movieDetails(id);
  }
}
