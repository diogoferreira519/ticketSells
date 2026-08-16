import { FormEvent, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  createEventoRequest,
  filmeByIdRequest,
  filmesDiscoverRequest,
  filmesGenerosRequest,
  filmesNowPlayingRequest,
  filmesPopularRequest,
  filmesSearchRequest,
  getEventoRequest,
  listSalasRequest,
  meRequest,
  updateEventoRequest,
  type FilmeDetalhe,
  type FilmeGenero,
  type FilmeResumo,
  type Sala,
} from '../api';
import { useAuth } from '../auth';
import TopRightActions from '../components/TopRightActions';
import { useToast } from '../toast';

type CatalogoFiltro = 'popular' | 'now-playing';

function toLocalDateInput(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toLocalTimeInput(value: string) {
  const date = new Date(value);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export default function CreateEventoPage() {
  const { token, logout } = useAuth();
  const { showSuccess } = useToast();
  const navigate = useNavigate();
  const { id: eventoId } = useParams<{ id: string }>();
  const isEdit = Boolean(eventoId);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [editBlocked, setEditBlocked] = useState(false);
  const [editLoaded, setEditLoaded] = useState(!isEdit);
  const [filmes, setFilmes] = useState<FilmeResumo[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filtro, setFiltro] = useState<CatalogoFiltro>('popular');
  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');
  const [generos, setGeneros] = useState<FilmeGenero[]>([]);
  const [genreId, setGenreId] = useState<number | null>(null);
  const [selected, setSelected] = useState<FilmeResumo | null>(null);
  const [detalhe, setDetalhe] = useState<FilmeDetalhe | null>(null);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [idSala, setIdSala] = useState('');
  const [data, setData] = useState('');
  const [hora, setHora] = useState('19:00');
  const [preco, setPreco] = useState('0');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setBuscaDebounced(busca.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [busca]);

  useEffect(() => {
    setPage(1);
  }, [filtro, buscaDebounced, genreId]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    meRequest(token)
      .then((user) => {
        if (!cancelled) setAllowed(user.isOrg);
      })
      .catch(() => {
        if (!cancelled) logout();
      });
    return () => {
      cancelled = true;
    };
  }, [token, logout]);

  useEffect(() => {
    if (allowed !== true) return;
    let cancelled = false;
    filmesGenerosRequest()
      .then((lista) => {
        if (!cancelled) setGeneros(lista);
      })
      .catch(() => {
        if (!cancelled) setGeneros([]);
      });
    return () => {
      cancelled = true;
    };
  }, [allowed]);

  useEffect(() => {
    if (allowed !== true || !token) return;
    let cancelled = false;
    listSalasRequest(token)
      .then((lista) => {
        if (cancelled) return;
        setSalas(lista);
        setIdSala((current) => current || lista[0]?.id || '');
      })
      .catch(() => {
        if (!cancelled) setSalas([]);
      });
    return () => {
      cancelled = true;
    };
  }, [allowed, token]);

  useEffect(() => {
    if (!isEdit || allowed !== true || !token || !eventoId) return;
    let cancelled = false;
    getEventoRequest(token, eventoId)
      .then((evento) => {
        if (cancelled) return;
        if (evento.vendas > 0) {
          setEditBlocked(true);
          return;
        }
        setSelected({
          idFilme: evento.idFilme,
          titulo: evento.titulo,
          descricao: evento.descricao,
          imgFilme: evento.imgFilme || null,
          dataLancamento: null,
        });
        setIdSala(evento.idSala);
        setData(toLocalDateInput(evento.data));
        setHora(toLocalTimeInput(evento.data));
        setPreco(String(evento.preco));
        setEditLoaded(true);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Falha ao carregar evento');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isEdit, allowed, token, eventoId]);

  useEffect(() => {
    if (allowed !== true) return;
    let cancelled = false;
    const load = buscaDebounced
      ? filmesSearchRequest(buscaDebounced, page)
      : genreId != null
        ? filmesDiscoverRequest(genreId, page)
        : filtro === 'now-playing'
          ? filmesNowPlayingRequest(page)
          : filmesPopularRequest(page);

    load
      .then((lista) => {
        if (cancelled) return;
        setFilmes(lista.results);
        setTotalPages(lista.totalPages);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Falha ao carregar filmes');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [allowed, page, filtro, buscaDebounced, genreId]);

  useEffect(() => {
    if (!selected) {
      setDetalhe(null);
      return;
    }
    setDetalhe(null);
    let cancelled = false;
    filmeByIdRequest(selected.idFilme)
      .then((data) => {
        if (!cancelled) setDetalhe(data);
      })
      .catch(() => {
        if (!cancelled) setDetalhe(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selected]);

  function filmeAno(filme: FilmeResumo) {
    return filme.dataLancamento ? filme.dataLancamento.slice(0, 4) : null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setAttempted(true);
    const precoVazio = preco.trim() === '';
    if (!token || !selected || !idSala || !data || !hora || precoVazio) {
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const payload = {
        idFilme: selected.idFilme,
        idSala,
        titulo: selected.titulo,
        descricao: selected.descricao,
        imgFilme: selected.imgFilme ?? '',
        data: new Date(`${data}T${hora}`).toISOString(),
        preco: Number(preco),
      };
      if (eventoId) {
        await updateEventoRequest(token, eventoId, payload);
        showSuccess('Evento atualizado');
      } else {
        await createEventoRequest(token, payload);
        showSuccess('Evento criado');
      }
      navigate('/organizador/eventos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar evento');
    } finally {
      setLoading(false);
    }
  }

  if (allowed === false) {
    return <Navigate to="/" replace />;
  }

  if (editBlocked) {
    return <Navigate to="/organizador/eventos" replace />;
  }

  return (
    <div className="bg-page min-h-screen font-sans text-fg">
      <TopRightActions />
      <div className="mx-auto grid min-h-screen w-full max-w-6xl gap-0 pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:pt-0">
        <form className="grid content-start gap-4 p-6 pt-8 lg:h-screen lg:overflow-y-auto lg:pt-20" onSubmit={onSubmit}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="m-0 text-sm font-bold uppercase tracking-[0.12em] text-red-500">
                ticketSells
              </p>
              <h1 className="m-0 text-3xl font-semibold">{isEdit ? 'Editar evento' : 'Novo evento'}</h1>
              <p className="m-0 text-sm text-muted">
                {isEdit ? 'Altere o filme, a sala, data ou preço' : 'Escolha o filme, a sala, data e preço'}
              </p>
            </div>
            <Link className="btn-ghost px-3 py-1.5 text-sm no-underline" to="/organizador/eventos">
              Voltar
            </Link>
          </div>

          {error ? <p className="m-0 text-sm text-red-500">{error}</p> : null}
          {isEdit && !editLoaded && !error ? (
            <p className="m-0 text-muted">Carregando evento…</p>
          ) : null}

          {selected ? (
            <div
              className="flex items-start gap-3 overflow-hidden rounded-xl border p-2"
              style={{ borderColor: 'var(--surface-border)' }}
            >
              {selected.imgFilme ? (
                <img alt="" className="h-full w-2/6 size-40 w-14 shrink-0 rounded object-cover" src={selected.imgFilme} />
              ) : (
                <div className="poster-empty grid h-20 w-14 place-items-center text-[10px]">—</div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="m-0 text-xs uppercase tracking-wide text-muted">Filme</p>
                    <p className="m-0 font-semibold">{selected.titulo}</p>
                  </div>
                  <p className="m-0 shrink-0 text-right text-xs text-muted">
                    {[
                      filmeAno(detalhe ?? selected),
                      detalhe?.generos.length ? detalhe.generos.join(', ') : null,
                      detalhe?.duracaoMinutos != null ? `${detalhe.duracaoMinutos} min` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <p className="m-0 mt-1 font-extralight">{selected.descricao}</p>
              </div>
            </div>
          ) : (
            <div>
              <p
                className={`m-0 rounded-xl border px-3 py-3 text-sm ${attempted ? 'border-red-500 text-red-500' : 'text-muted'}`}
                style={attempted ? undefined : { borderColor: 'var(--surface-border)' }}
              >
                Selecione um filme na lista ao lado
              </p>
              {attempted ? <p className="m-0 mt-1 text-xs text-red-500">Preencha este campo</p> : null}
            </div>
          )}

          <label className="grid gap-1.5 text-sm text-muted">
            Sala
            {salas.length === 0 ? (
              <p className={`m-0 text-sm ${attempted ? 'text-red-500' : ''}`}>
                Nenhuma sala cadastrada.{' '}
                <Link className="text-red-500 no-underline hover:underline" to="/organizador/salas/novo">
                  Cadastrar sala
                </Link>
              </p>
            ) : (
              <select
                className={`input-field ${attempted && !idSala ? 'input-error' : ''}`}
                value={idSala}
                onChange={(e) => setIdSala(e.target.value)}
              >
                {salas.map((sala) => (
                  <option key={sala.id} value={sala.id}>
                    {sala.descricao} ({sala.capacidade} lugares)
                  </option>
                ))}
              </select>
            )}
            {attempted && !idSala ? <p className="m-0 text-xs text-red-500">Preencha este campo</p> : null}
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm text-muted">
              Data
              <input
                className={`input-field ${attempted && !data ? 'input-error' : ''}`}
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
              {attempted && !data ? <p className="m-0 text-xs text-red-500">Preencha este campo</p> : null}
            </label>
            <label className="grid gap-1.5 text-sm text-muted">
              Horário
              <input
                className={`input-field ${attempted && !hora ? 'input-error' : ''}`}
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
              />
              {attempted && !hora ? <p className="m-0 text-xs text-red-500">Preencha este campo</p> : null}
            </label>
          </div>
          <label className="grid gap-1.5 text-sm text-muted">
            Preço
            <input
              className={`input-field ${attempted && preco.trim() === '' ? 'input-error' : ''}`}
              type="number"
              min={0}
              step="0.01"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
            />
            {attempted && preco.trim() === '' ? (
              <p className="m-0 text-xs text-red-500">Preencha este campo</p>
            ) : null}
          </label>
          <button className="btn-primary mt-1" type="submit" disabled={loading || (isEdit && !editLoaded)}>
            {loading ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar evento'}
          </button>
        </form>

        <aside
          className="grid h-[70vh] grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-3 border-t p-4 lg:h-screen lg:border-l lg:border-t-0 lg:pt-20"
          style={{ borderColor: 'var(--surface-border)' }}
        >
          <h2 className="m-0 text-sm font-semibold uppercase tracking-wide text-red-500">
            Filmes disponíveis
          </h2>
          <div className="grid gap-2">
            <input
              className="input-field py-2"
              placeholder="Pesquisar filme"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                className={`flex-1 rounded-lg border px-2 py-1.5 text-xs ${
                  filtro === 'popular' && !buscaDebounced && genreId == null
                    ? 'border-red-500 text-red-500'
                    : ''
                }`}
                style={{
                  borderColor:
                    filtro === 'popular' && !buscaDebounced && genreId == null
                      ? undefined
                      : 'var(--surface-border)',
                }}
                type="button"
                onClick={() => {
                  setBusca('');
                  setGenreId(null);
                  setFiltro('popular');
                }}
              >
                Populares
              </button>
              <button
                className={`flex-1 rounded-lg border px-2 py-1.5 text-xs ${
                  filtro === 'now-playing' && !buscaDebounced && genreId == null
                    ? 'border-red-500 text-red-500'
                    : ''
                }`}
                style={{
                  borderColor:
                    filtro === 'now-playing' && !buscaDebounced && genreId == null
                      ? undefined
                      : 'var(--surface-border)',
                }}
                type="button"
                onClick={() => {
                  setBusca('');
                  setGenreId(null);
                  setFiltro('now-playing');
                }}
              >
                Em cartaz
              </button>
            </div>
            <select
              className="input-field py-2 text-sm"
              value={genreId ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                setBusca('');
                setGenreId(value ? Number(value) : null);
              }}
            >
              <option value="">Todos os gêneros</option>
              {generos.map((genero) => (
                <option key={genero.id} value={genero.id}>
                  {genero.nome}
                </option>
              ))}
            </select>
          </div>
          <ul className="m-0 grid list-none content-start gap-2 overflow-y-auto p-0">
            {filmes.map((filme) => (
              <li key={filme.idFilme}>
                <button
                  className={`flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-xl border p-0 text-left ${
                    selected?.idFilme === filme.idFilme
                      ? 'border-red-500 ring-2 ring-red-500/40'
                      : ''
                  }`}
                  style={{
                    borderColor:
                      selected?.idFilme === filme.idFilme ? undefined : 'var(--surface-border)',
                  }}
                  type="button"
                  onClick={() => setSelected(filme)}
                >
                  {filme.imgFilme ? (
                    <img alt="" className="h-16 w-12 shrink-0 object-cover" src={filme.imgFilme} />
                  ) : (
                    <div className="poster-empty grid h-16 w-12 place-items-center text-[10px]">
                      —
                    </div>
                  )}
                  <span className="pr-2 text-sm font-medium">{filme.titulo}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between text-xs text-muted">
            <button
              className="btn-ghost px-2 py-1 text-xs disabled:opacity-40"
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </button>
            <span>
              {page}/{totalPages || 1}
            </span>
            <button
              className="btn-ghost px-2 py-1 text-xs disabled:opacity-40"
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
