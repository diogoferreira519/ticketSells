import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  listCatalogoEventosRequest,
  meRequest,
  type CatalogoEvento,
  type User,
} from '../api';
import { useAuth } from '../auth';
import TopRightActions from '../components/TopRightActions';

function formatSessao(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

type FilmeGrupo = {
  idFilme: string;
  titulo: string;
  descricao: string;
  imgFilme: string;
  sessoes: CatalogoEvento[];
};

function agruparPorFilme(eventos: CatalogoEvento[]): FilmeGrupo[] {
  const mapa = new Map<string, FilmeGrupo>();
  for (const evento of eventos) {
    const existente = mapa.get(evento.idFilme);
    if (existente) {
      existente.sessoes.push(evento);
      continue;
    }
    mapa.set(evento.idFilme, {
      idFilme: evento.idFilme,
      titulo: evento.titulo,
      descricao: evento.descricao,
      imgFilme: evento.imgFilme,
      sessoes: [evento],
    });
  }
  return Array.from(mapa.values());
}

export default function HomePage() {
  const { token, logout } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [eventos, setEventos] = useState<CatalogoEvento[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    meRequest(token)
      .then((data) => {
        if (cancelled) return Promise.resolve();
        setUser(data);
        if (data.isOrg || data.isPortaria) return Promise.resolve();
        return listCatalogoEventosRequest(token)
          .then((lista) => {
            if (!cancelled) setEventos(lista);
          })
          .catch((err: unknown) => {
            if (!cancelled) {
              setError(err instanceof Error ? err.message : 'Falha ao carregar sessões');
            }
          });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load user');
          logout();
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, logout]);

  const filmes = useMemo(() => agruparPorFilme(eventos), [eventos]);

  if (user?.isOrg) {
    return <Navigate to="/organizador/eventos" replace />;
  }

  if (user?.isPortaria) {
    return <Navigate to="/portaria" replace />;
  }

  return (
    <div className="bg-page min-h-screen p-6 pt-20 font-sans text-fg">
      <TopRightActions />
      <div className="mx-auto grid w-full max-w-5xl gap-6">
        <header>
          <p className="m-0 text-sm font-bold uppercase tracking-[0.12em] text-red-500">
            ticketSells
          </p>
          <h1 className="m-0 text-3xl font-semibold">Em cartaz</h1>
          <p className="m-0 mt-1 text-sm text-muted">
            Sessões a partir de hoje. Escolha um horário para reservar seu lugar.
          </p>
        </header>

        {error ? <p className="m-0 text-sm text-red-500">{error}</p> : null}

        {!user ? (
          <p className="m-0 text-muted">Carregando…</p>
        ) : filmes.length === 0 ? (
          <div className="rounded-2xl border bg-surface p-8 text-center">
            <p className="m-0 text-muted">Nenhuma sessão disponível no momento.</p>
          </div>
        ) : (
          <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {filmes.map((filme) => {
              const sessaoComprar = filme.sessoes.find((s) => s.vagas > 0);
              return (
              <li key={filme.idFilme} className="overflow-hidden rounded-2xl border bg-surface">
                {filme.imgFilme ? (
                  <img alt="" className="h-50 w-full object-cover" src={filme.imgFilme} />
                ) : (
                  <div className="poster-empty grid h-48 place-items-center">Sem imagem</div>
                )}
                <div className="grid gap-2 p-4">
                  <h2 className="m-0 text-lg font-semibold">{filme.titulo}</h2>
                  <p className="m-0 line-clamp-2 text-sm text-muted">{filme.descricao}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {filme.sessoes.map((sessao) => (
                      <Link
                        key={sessao.id}
                        className="btn-ghost px-3 py-1.5 text-sm no-underline"
                        to={`/eventos/${sessao.id}`}
                      >
                        {formatSessao(sessao.data)}
                        {sessao.vagas === 0 ? ' · esgotado' : ''}
                      </Link>
                    ))}
                  </div>
                  {sessaoComprar ? (
                    <Link className="btn-buy mt-2" to={`/eventos/${sessaoComprar.id}`}>
                      Comprar
                    </Link>
                  ) : (
                    <button className="btn-buy mt-2" type="button" disabled>
                      Esgotado
                    </button>
                  )}
                </div>
              </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
