import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { deleteEventoRequest, listEventosRequest, meRequest, type Evento } from '../api';
import { useAuth } from '../auth';
import TopRightActions from '../components/TopRightActions';
import { useToast } from '../toast';

type FiltroEventos = 'proximos' | 'encerrados';

function formatDate(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function inicioDoDiaLocal() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function filtrarEventos(eventos: Evento[], filtro: FiltroEventos) {
  const inicio = inicioDoDiaLocal().getTime();
  const filtrados = eventos.filter((evento) => {
    const timestamp = new Date(evento.data).getTime();
    return filtro === 'proximos' ? timestamp >= inicio : timestamp < inicio;
  });
  filtrados.sort((a, b) => {
    const da = new Date(a.data).getTime();
    const db = new Date(b.data).getTime();
    return filtro === 'proximos' ? da - db : db - da;
  });
  return filtrados;
}

function labelVendas(vendas: number) {
  return `${vendas} ${vendas === 1 ? 'venda' : 'vendas'}`;
}

export default function OrganizadorEventosPage() {
  const { token, logout } = useAuth();
  const { showSuccess } = useToast();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [filtro, setFiltro] = useState<FiltroEventos>('proximos');
  const [error, setError] = useState<string | null>(null);
  const [eventoParaExcluir, setEventoParaExcluir] = useState<Evento | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const visiveis = useMemo(() => filtrarEventos(eventos, filtro), [eventos, filtro]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    meRequest(token)
      .then(async (user) => {
        if (!user.isOrg) {
          if (!cancelled) setAllowed(false);
          return;
        }
        const list = await listEventosRequest(token);
        if (!cancelled) {
          setEventos(list);
          setAllowed(true);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Falha ao carregar');
          logout();
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, logout]);

  useEffect(() => {
    if (!eventoParaExcluir) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !excluindo) {
        setEventoParaExcluir(null);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [eventoParaExcluir, excluindo]);

  async function confirmarExclusao() {
    if (!token || !eventoParaExcluir) return;
    setExcluindo(true);
    setError(null);
    try {
      await deleteEventoRequest(token, eventoParaExcluir.id);
      setEventos((lista) => lista.filter((evento) => evento.id !== eventoParaExcluir.id));
      setEventoParaExcluir(null);
      showSuccess('Evento excluído');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir evento');
      setEventoParaExcluir(null);
    } finally {
      setExcluindo(false);
    }
  }

  if (allowed === false) {
    return <Navigate to="/" replace />;
  }

  const vazioGeral = allowed === true && eventos.length === 0;
  const vazioFiltro = allowed === true && eventos.length > 0 && visiveis.length === 0;

  return (
    <div className="bg-page min-h-screen p-6 pt-20 font-sans text-fg">
      <TopRightActions />
      <div className="mx-auto grid w-full max-w-5xl gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="m-0 text-sm font-bold uppercase tracking-[0.12em] text-red-500">
              ticketSells
            </p>
            <h1 className="m-0 text-3xl font-semibold">Seus eventos</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="btn-ghost px-4 py-2.5 no-underline" to="/organizador/salas">
              Salas
            </Link>
            <Link className="btn-primary px-4 py-2.5 no-underline" to="/organizador/eventos/novo">
              Novo evento
            </Link>
          </div>
        </header>

        {error ? <p className="m-0 text-sm text-red-500">{error}</p> : null}

        {allowed === true && eventos.length > 0 ? (
          <div className="flex gap-2">
            <button
              className={`flex-1 rounded-lg border px-3 py-2 text-sm sm:flex-none ${
                filtro === 'proximos' ? 'border-red-500 text-red-500' : ''
              }`}
              style={{
                borderColor: filtro === 'proximos' ? undefined : 'var(--surface-border)',
              }}
              type="button"
              onClick={() => setFiltro('proximos')}
            >
              Próximos
            </button>
            <button
              className={`flex-1 rounded-lg border px-3 py-2 text-sm sm:flex-none ${
                filtro === 'encerrados' ? 'border-red-500 text-red-500' : ''
              }`}
              style={{
                borderColor: filtro === 'encerrados' ? undefined : 'var(--surface-border)',
              }}
              type="button"
              onClick={() => setFiltro('encerrados')}
            >
              Encerrados
            </button>
          </div>
        ) : null}

        {allowed === null ? (
          <p className="m-0 text-muted">Carregando…</p>
        ) : vazioGeral ? (
          <div className="rounded-2xl border bg-surface p-8 text-center">
            <p className="m-0 text-muted">Você ainda não criou eventos.</p>
            <Link
              className="mt-4 inline-block font-medium text-red-500 no-underline hover:underline"
              to="/organizador/eventos/novo"
            >
              Criar o primeiro evento
            </Link>
          </div>
        ) : vazioFiltro ? (
          <div className="rounded-2xl border bg-surface p-8 text-center">
            <p className="m-0 text-muted">
              {filtro === 'proximos' ? 'Nenhum evento próximo.' : 'Nenhum evento encerrado.'}
            </p>
          </div>
        ) : (
          <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {visiveis.map((evento) => (
              <li key={evento.id} className="overflow-hidden rounded-2xl border bg-surface">
                {evento.imgFilme ? (
                  <img alt="" className="h-48 w-full object-cover" src={evento.imgFilme} />
                ) : (
                  <div className="poster-empty grid h-48 place-items-center">Sem imagem</div>
                )}
                <div className="grid gap-1 p-4">
                  <h2 className="m-0 text-lg font-semibold">{evento.titulo}</h2>
                  <p className="m-0 text-sm text-muted">{evento.sala.descricao}</p>
                  <p className="m-0 text-sm text-muted">{formatDate(evento.data)}</p>
                  <p className="m-0 text-sm text-muted">
                    R$ {evento.preco.toFixed(2)} · {evento.sala.capacidade} lugares ·{' '}
                    {labelVendas(evento.vendas)}
                  </p>
                  {evento.vendas === 0 ? (
                    <div className="mt-2 flex gap-2">
                      <Link
                        className="btn-ghost flex-1 px-3 py-2 text-center text-sm no-underline"
                        to={`/organizador/eventos/${evento.id}/editar`}
                      >
                        Editar
                      </Link>
                      <button
                        className="btn-ghost flex-1 px-3 py-2 text-sm text-red-500"
                        type="button"
                        onClick={() => setEventoParaExcluir(evento)}
                      >
                        Excluir
                      </button>
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {eventoParaExcluir ? (
        <div
          className="fixed inset-0 z-[90] grid place-items-center bg-black/60 p-4"
          onClick={() => {
            if (!excluindo) setEventoParaExcluir(null);
          }}
        >
          <div
            className="grid w-full max-w-md gap-4 rounded-2xl border bg-surface p-6 shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="excluir-evento-titulo"
            onClick={(event) => event.stopPropagation()}
          >
            <div>
              <h2 id="excluir-evento-titulo" className="m-0 text-xl font-semibold">
                Excluir evento
              </h2>
              <p className="m-0 mt-2 text-sm text-muted">
                Tem certeza que deseja excluir <strong className="text-fg">{eventoParaExcluir.titulo}</strong>?
                Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="btn-ghost px-4 py-2.5 text-sm"
                type="button"
                disabled={excluindo}
                onClick={() => setEventoParaExcluir(null)}
              >
                Cancelar
              </button>
              <button
                className="btn-primary px-4 py-2.5 text-sm"
                type="button"
                disabled={excluindo}
                onClick={() => void confirmarExclusao()}
              >
                {excluindo ? 'Excluindo…' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
