import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type TmdbMovieListItem = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
};

type TmdbPagedResponse = {
  page: number;
  total_pages: number;
  total_results: number;
  results: TmdbMovieListItem[];
};

type TmdbGenre = {
  id: number;
  name: string;
};

type TmdbMovieDetails = TmdbMovieListItem & {
  original_title: string;
  runtime: number | null;
  vote_average: number;
  genres: TmdbGenre[];
};

type TmdbGenreListResponse = {
  genres: TmdbGenre[];
};

export type FilmeGenero = {
  id: number;
  nome: string;
};

export type FilmeResumo = {
  idFilme: string;
  titulo: string;
  descricao: string;
  imgFilme: string | null;
  dataLancamento: string | null;
};

export type FilmeDetalhe = FilmeResumo & {
  tituloOriginal: string;
  duracaoMinutos: number | null;
  notaMedia: number;
  generos: string[];
};

export type FilmeLista = {
  page: number;
  totalPages: number;
  totalResults: number;
  results: FilmeResumo[];
};

@Injectable()
export class TmdbClient {
  constructor(private readonly config: ConfigService) {}

  async searchMovies(query: string, page = 1): Promise<FilmeLista> {
    const params = new URLSearchParams({
      query,
      page: String(page),
      language: 'pt-BR',
    });
    const data = await this.get<TmdbPagedResponse>(`/search/movie?${params}`);
    return this.mapLista(data);
  }

  async popularMovies(page = 1): Promise<FilmeLista> {
    const params = new URLSearchParams({
      page: String(page),
      language: 'pt-BR',
    });
    const data = await this.get<TmdbPagedResponse>(`/movie/popular?${params}`);
    return this.mapLista(data);
  }

  async nowPlayingMovies(page = 1): Promise<FilmeLista> {
    const params = new URLSearchParams({
      page: String(page),
      language: 'pt-BR',
    });
    const data = await this.get<TmdbPagedResponse>(
      `/movie/now_playing?${params}`,
    );
    return this.mapLista(data);
  }

  async movieGenres(): Promise<FilmeGenero[]> {
    const params = new URLSearchParams({ language: 'pt-BR' });
    const data = await this.get<TmdbGenreListResponse>(
      `/genre/movie/list?${params}`,
    );
    return data.genres.map((genre) => ({
      id: genre.id,
      nome: genre.name,
    }));
  }

  async discoverByGenre(genreId: number, page = 1): Promise<FilmeLista> {
    const params = new URLSearchParams({
      with_genres: String(genreId),
      page: String(page),
      language: 'pt-BR',
      sort_by: 'popularity.desc',
    });
    const data = await this.get<TmdbPagedResponse>(
      `/discover/movie?${params}`,
    );
    return this.mapLista(data);
  }

  async movieDetails(id: string): Promise<FilmeDetalhe> {
    const params = new URLSearchParams({ language: 'pt-BR' });
    const data = await this.get<TmdbMovieDetails>(`/movie/${id}?${params}`);
    return {
      ...this.mapResumo(data),
      tituloOriginal: data.original_title,
      duracaoMinutos: data.runtime,
      notaMedia: data.vote_average,
      generos: (data.genres ?? []).map((genre) => genre.name),
    };
  }

  private async get<T>(path: string): Promise<T> {
    const baseUrl = this.config.get<string>(
      'TMDB_BASE_URL',
      'https://api.themoviedb.org/3',
    );
    const token = this.config.getOrThrow<string>('TMDB_ACCESS_TOKEN');

    const response = await fetch(`${baseUrl}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (response.status === 401) {
      throw new UnauthorizedException('Falha na autenticação com a TMDB');
    }
    if (response.status === 404) {
      throw new NotFoundException('Filme não encontrado');
    }
    if (!response.ok) {
      throw new InternalServerErrorException(
        `Erro ao consultar a TMDB (${response.status})`,
      );
    }

    return (await response.json()) as T;
  }

  private mapLista(data: TmdbPagedResponse): FilmeLista {
    return {
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
      results: data.results.map((item) => this.mapResumo(item)),
    };
  }

  private mapResumo(item: TmdbMovieListItem): FilmeResumo {
    return {
      idFilme: String(item.id),
      titulo: item.title,
      descricao: item.overview,
      imgFilme: this.posterUrl(item.poster_path),
      dataLancamento: item.release_date || null,
    };
  }

  private posterUrl(posterPath: string | null): string | null {
    if (!posterPath) {
      return null;
    }
    const imageBase = this.config.get<string>(
      'TMDB_IMAGE_BASE',
      'https://image.tmdb.org/t/p/w500',
    );
    return `${imageBase}${posterPath}`;
  }
}
