import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  listMeusIngressosRequest,
  meRequest,
  type MeuIngresso,
  type User,
} from '../api';
import { useAuth } from '../auth';
import TopRightActions from '../components/TopRightActions';
import { useToast } from '../toast';

type FiltroIngressos = 'todos' | 'validos' | 'usados' | 'cancelados';

const FILTROS: { id: FiltroIngressos; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'validos', label: 'Válidos' },
  { id: 'usados', label: 'Usados' },
  { id: 'cancelados', label: 'Cancelados' },
];

function formatSessao(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function shareUrl(link: string) {
  if (link.startsWith('http')) return link;
  return `${window.location.origin}${link.startsWith('/') ? link : `/${link}`}`;
}

function statusDoFiltro(filtro: FiltroIngressos): string | null {
  switch (filtro) {
    case 'validos':
      return 'VALIDO';
    case 'usados':
      return 'USADO';
    case 'cancelados':
      return 'CANCELADO';
    default:
      return null;
  }
}

function filtrarIngressos(
  ingressos: MeuIngresso[],
  filtro: FiltroIngressos,
  idEvento: string,
) {
  const status = statusDoFiltro(filtro);
  return ingressos
    .filter((ingresso) => {
      if (status && ingresso.status !== status) return false;
      if (idEvento && ingresso.evento.id !== idEvento) return false;
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.evento.data).getTime() - new Date(a.evento.data).getTime(),
    );
}

function labelStatus(status: string) {
  switch (status) {
    case 'VALIDO':
      return 'Válido';
    case 'USADO':
      return 'Usado';
    case 'CANCELADO':
      return 'Cancelado';
    default:
      return status;
  }
}

export default function MeusIngressosPage() {
  const { token, logout } = useAuth();
  const { showSuccess } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [ingressos, setIngressos] = useState<MeuIngresso[]>([]);
  const [filtro, setFiltro] = useState<FiltroIngressos>('todos');
  const [idEvento, setIdEvento] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const eventos = useMemo(() => {
    const mapa = new Map<string, { id: string; titulo: string; data: string }>();
    for (const ingresso of ingressos) {
      if (!mapa.has(ingresso.evento.id)) {
        mapa.set(ingresso.evento.id, {
          id: ingresso.evento.id,
          titulo: ingresso.evento.titulo,
          data: ingresso.evento.data,
        });
      }
    }
    return Array.from(mapa.values()).sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
    );
  }, [ingressos]);

  const visiveis = useMemo(
    () => filtrarIngressos(ingressos, filtro, idEvento),
    [ingressos, filtro, idEvento],
  );

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    meRequest(token)
      .then((data) => {
        if (cancelled) return Promise.resolve();
        setUser(data);
        if (!data.isCliente) return Promise.resolve();
        return listMeusIngressosRequest(token)
          .then((lista) => {
            if (!cancelled) setIngressos(lista);
          })
          .catch((err: unknown) => {
            if (!cancelled) {
              setError(
                err instanceof Error ? err.message : 'Falha ao carregar ingressos',
              );
              if (
                err instanceof Error &&
                err.message.toLowerCase().includes('unauthorized')
              ) {
                logout();
              }
            }
          });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Falha ao carregar usuário');
          if (
            err instanceof Error &&
            err.message.toLowerCase().includes('unauthorized')
          ) {
            logout();
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, logout]);

  async function copiarLink(link: string) {
    const url = shareUrl(link);
    try {
      await navigator.clipboard.writeText(url);
      showSuccess('Link copiado');
    } catch {
      setError('Não foi possível copiar o link');
    }
  }

  if (user && !user.isCliente) {
    return (
      <Navigate to={user.isOrg ? '/organizador/eventos' : '/'} replace />
    );
  }

  const vazioGeral = !loading && user && ingressos.length === 0;
  const vazioFiltro =
    !loading && user && ingressos.length > 0 && visiveis.length === 0;

  return (
    <div className="bg-page flex h-dvh flex-col overflow-hidden p-6 pt-20 font-sans text-fg">
      <TopRightActions />
      <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col gap-4">
        <header className="flex shrink-0 flex-wrap items-start justify-between gap-3">
          <div>
            <p className="m-0 text-sm font-bold uppercase tracking-[0.12em] text-red-500">
              ticketSells
            </p>
            <h1 className="m-0 text-3xl font-semibold">Meus ingressos</h1>
            <p className="m-0 mt-1 text-sm text-muted">
              Visualize o QR code e compartilhe o link de cada ingresso.
            </p>
          </div>
          <Link className="btn-ghost px-3 py-1.5 text-sm no-underline" to="/">
            Catálogo
          </Link>
        </header>

        {error ? <p className="m-0 shrink-0 text-sm text-red-500">{error}</p> : null}

        {loading || !user ? (
          <p className="m-0 text-muted">Carregando…</p>
        ) : vazioGeral ? (
          <p className="m-0 text-muted">Você ainda não tem ingressos.</p>
        ) : (
          <>
            <div className="flex shrink-0 flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {FILTROS.map((item) => (
                  <button
                    key={item.id}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      filtro === item.id ? 'border-red-500 text-red-500' : ''
                    }`}
                    style={{
                      borderColor:
                        filtro === item.id ? undefined : 'var(--surface-border)',
                    }}
                    type="button"
                    onClick={() => setFiltro(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {eventos.length > 1 ? (
                <label className="grid gap-1.5">
                  <span className="text-sm font-medium">Sessão</span>
                  <select
                    className="input-field w-full py-2.5 text-sm"
                    value={idEvento}
                    onChange={(e) => setIdEvento(e.target.value)}
                  >
                    <option value="">Todas as sessões</option>
                    {eventos.map((evento) => (
                      <option key={evento.id} value={evento.id}>
                        {evento.titulo} · {formatSessao(evento.data)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>

            {vazioFiltro ? (
              <p className="m-0 text-muted">
                Nenhum ingresso neste filtro.
              </p>
            ) : (
              <ul className="m-0 grid min-h-0 flex-1 list-none content-start gap-4 overflow-y-auto p-0 pb-2">
                {visiveis.map((ingresso) => {
                  const url = shareUrl(ingresso.link);
                  return (
                    <li
                      key={ingresso.id}
                      className="grid gap-4 rounded-2xl border bg-surface p-4 sm:grid-cols-[auto_1fr] sm:p-5"
                    >
                      <div className="flex justify-center rounded-xl bg-white p-3">
                        <QRCodeSVG value={url} size={132} level="M" />
                      </div>
                      <div className="grid gap-2">
                        <h2 className="m-0 text-lg font-semibold">
                          {ingresso.evento.titulo}
                        </h2>
                        <p className="m-0 text-sm text-muted">
                          {ingresso.evento.sala.descricao} ·{' '}
                          {formatSessao(ingresso.evento.data)}
                        </p>
                        <p className="m-0 text-sm">
                          Assento <strong>{ingresso.assento.descricao}</strong>
                          {' · '}
                          <span className="uppercase tracking-wide text-muted">
                            {labelStatus(ingresso.status)}
                          </span>
                        </p>
                        <p className="m-0 break-all text-xs text-muted">{url}</p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          <button
                            className="btn-primary px-3 py-1.5 text-sm"
                            type="button"
                            onClick={() => void copiarLink(ingresso.link)}
                          >
                            Copiar link
                          </button>
                          <Link
                            className="btn-ghost px-3 py-1.5 text-sm no-underline"
                            to={ingresso.link}
                          >
                            Abrir
                          </Link>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
