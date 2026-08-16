import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  confirmarPagamentoRequest,
  getCatalogoEventoRequest,
  meRequest,
  pollPagamentoStatus,
  recusarPagamentoRequest,
  reservarAssentoRequest,
  type CatalogoAssento,
  type CatalogoEventoDetalhe,
  type ReservaResult,
} from '../api';
import { useAuth } from '../auth';
import TopRightActions from '../components/TopRightActions';
import { useToast } from '../toast';

function formatSessao(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function agruparFilas(assentos: CatalogoAssento[]) {
  const filas = new Map<number, CatalogoAssento[]>();
  for (const assento of assentos) {
    const fila = filas.get(assento.fila) ?? [];
    fila.push(assento);
    filas.set(assento.fila, fila);
  }
  return Array.from(filas.entries())
    .sort(([a], [b]) => a - b)
    .map(([fila, lugares]) => ({
      fila,
      lugares: [...lugares].sort((a, b) => a.coluna - b.coluna),
    }));
}

export default function EventoReservaPage() {
  const { id } = useParams<{ id: string }>();
  const { token, logout } = useAuth();
  const { showSuccess } = useToast();
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [evento, setEvento] = useState<CatalogoEventoDetalhe | null>(null);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reservando, setReservando] = useState(false);
  const [processandoPagamento, setProcessandoPagamento] = useState(false);
  const [pedidoPendente, setPedidoPendente] = useState<ReservaResult | null>(
    null,
  );

  useEffect(() => {
    if (!token || !id) return;
    let cancelled = false;
    meRequest(token)
      .then((user) => {
        if (cancelled) return;
        if (user.isOrg) {
          setAllowed(false);
          return;
        }
        setAllowed(true);
        return getCatalogoEventoRequest(token, id).then((data) => {
          if (!cancelled) setEvento(data);
        });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Falha ao carregar sessão');
          if (err instanceof Error && err.message.toLowerCase().includes('unauthorized')) {
            logout();
          }
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token, id, logout]);

  const filas = useMemo(
    () => (evento ? agruparFilas(evento.assentos) : []),
    [evento],
  );

  const assentosSelecionados = useMemo(() => {
    if (!evento) return [];
    return selecionados
      .map((sid) => evento.assentos.find((a) => a.id === sid))
      .filter((a): a is CatalogoAssento => Boolean(a));
  }, [evento, selecionados]);

  const total = evento ? evento.preco * selecionados.length : 0;

  function toggleAssento(idAssento: string) {
    if (pedidoPendente) return;
    setSelecionados((atual) =>
      atual.includes(idAssento)
        ? atual.filter((seatId) => seatId !== idAssento)
        : [...atual, idAssento],
    );
  }

  async function recarregarMapa() {
    if (!token || !id) return;
    const atualizado = await getCatalogoEventoRequest(token, id);
    setEvento(atualizado);
    setSelecionados([]);
  }

  async function confirmar() {
    if (!token || !id || selecionados.length === 0 || !evento) return;
    setReservando(true);
    setError(null);
    try {
      const reserva = await reservarAssentoRequest(token, id, selecionados);
      setPedidoPendente(reserva);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao reservar');
      try {
        await recarregarMapa();
      } catch {
        /* keep current map */
      }
    } finally {
      setReservando(false);
    }
  }

  async function processarPagamento(acao: 'CONFIRMAR' | 'RECUSAR') {
    if (!token || !pedidoPendente) return;
    setProcessandoPagamento(true);
    setError(null);
    try {
      if (acao === 'CONFIRMAR') {
        await confirmarPagamentoRequest(token, pedidoPendente.idPedido);
      } else {
        await recusarPagamentoRequest(token, pedidoPendente.idPedido);
      }
      const resultado = await pollPagamentoStatus(
        token,
        pedidoPendente.idPedido,
      );
      if (resultado.pagamentoStatus === 'PAGO') {
        const qtd = pedidoPendente.ingressos.length;
        showSuccess(
          qtd === 1
            ? `Pagamento confirmado · lugar ${pedidoPendente.ingressos[0].descricaoAssento}`
            : `Pagamento confirmado · ${qtd} ingressos`,
        );
        navigate('/meus-ingressos', { replace: true });
        return;
      }
      setPedidoPendente(null);
      setError('Pagamento recusado. Os assentos foram liberados.');
      await recarregarMapa();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Falha ao processar pagamento',
      );
    } finally {
      setProcessandoPagamento(false);
    }
  }

  if (allowed === false) {
    return <Navigate to="/organizador/eventos" replace />;
  }

  return (
    <div className="bg-page min-h-screen p-6 pt-20 font-sans text-fg">
      <TopRightActions />
      <div className="mx-auto grid w-full max-w-3xl gap-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="m-0 text-sm font-bold uppercase tracking-[0.12em] text-red-500">
              ticketSells
            </p>
            <h1 className="m-0 text-3xl font-semibold">
              {evento?.titulo ?? 'Reservar lugar'}
            </h1>
            {evento ? (
              <p className="m-0 mt-1 text-sm text-muted">
                {evento.sala.descricao} · {formatSessao(evento.data)} · R${' '}
                {evento.preco.toFixed(2)} / assento
              </p>
            ) : null}
          </div>
          <Link className="btn-ghost px-3 py-1.5 text-sm no-underline" to="/">
            Voltar
          </Link>
        </header>

        {error ? <p className="m-0 text-sm text-red-500">{error}</p> : null}

        {!evento ? (
          <p className="m-0 text-muted">Carregando mapa…</p>
        ) : (
          <>
            <div className="rounded-2xl border bg-surface p-4 sm:p-6">
              <div className="mb-6 rounded-full bg-gradient-to-b from-zinc-300 to-zinc-500 py-2 text-center text-xs font-semibold tracking-[0.3em] text-zinc-800 dark:from-zinc-600 dark:to-zinc-800 dark:text-zinc-200">
                TELA
              </div>
              <div className="grid gap-2 overflow-x-auto">
                {filas.map(({ fila, lugares }) => (
                  <div key={fila} className="flex items-center justify-center gap-1.5">
                    {lugares.map((assento) => {
                      const ativo = selecionados.includes(assento.id);
                      return (
                        <button
                          key={assento.id}
                          type="button"
                          disabled={assento.ocupado || Boolean(pedidoPendente)}
                          title={assento.descricao}
                          className={`h-8 w-8 shrink-0 rounded-md text-[10px] font-semibold ${
                            assento.ocupado
                              ? 'cursor-not-allowed bg-zinc-400 text-zinc-100 dark:bg-zinc-700'
                              : ativo
                                ? 'bg-red-600 text-white'
                                : 'bg-emerald-500/80 text-white hover:bg-emerald-400'
                          }`}
                          onClick={() => toggleAssento(assento.id)}
                        >
                          {assento.descricao}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded bg-emerald-500/80" /> Livre
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded bg-red-600" /> Selecionado
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded bg-zinc-400 dark:bg-zinc-700" />{' '}
                  Ocupado
                </span>
              </div>
            </div>

            <div className="rounded-2xl border bg-surface p-4 sm:p-5">
              {pedidoPendente ? (
                <>
                  <h2 className="m-0 text-base font-semibold">
                    Pagamento simulado
                  </h2>
                  <p className="m-0 mt-2 text-sm text-muted">
                    Nenhuma cobrança real. Confirme ou recuse — o processamento
                    ocorre via fila RabbitMQ.
                  </p>
                  <div className="mt-3 grid gap-2 text-sm">
                    <p className="m-0 text-muted">
                      Assentos:{' '}
                      <span className="text-fg">
                        {pedidoPendente.ingressos
                          .map((i) => i.descricaoAssento)
                          .join(', ')}
                      </span>
                    </p>
                    <p className="m-0 text-lg font-semibold">
                      Total: R$ {pedidoPendente.total.toFixed(2)}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    <button
                      className="btn-ghost px-5 py-2.5 text-sm"
                      type="button"
                      disabled={processandoPagamento}
                      onClick={() => void processarPagamento('RECUSAR')}
                    >
                      {processandoPagamento ? 'Processando…' : 'Recusar pagamento'}
                    </button>
                    <button
                      className="btn-primary px-5 py-2.5 text-sm"
                      type="button"
                      disabled={processandoPagamento}
                      onClick={() => void processarPagamento('CONFIRMAR')}
                    >
                      {processandoPagamento
                        ? 'Processando…'
                        : 'Confirmar pagamento'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="m-0 text-base font-semibold">Resumo do pedido</h2>
                  {assentosSelecionados.length === 0 ? (
                    <p className="m-0 mt-2 text-sm text-muted">
                      Selecione um ou mais assentos livres · {evento.vagas}{' '}
                      {evento.vagas === 1 ? 'vaga' : 'vagas'}
                    </p>
                  ) : (
                    <div className="mt-3 grid gap-2 text-sm">
                      <p className="m-0 text-muted">
                        Assentos:{' '}
                        <span className="text-fg">
                          {assentosSelecionados.map((a) => a.descricao).join(', ')}
                        </span>
                      </p>
                      <p className="m-0 text-muted">
                        Unitário: R$ {evento.preco.toFixed(2)}
                      </p>
                      <p className="m-0 text-lg font-semibold">
                        Total: R$ {total.toFixed(2)}
                      </p>
                    </div>
                  )}
                  <div className="mt-4 flex justify-end">
                    <button
                      className="btn-primary px-5 py-2.5 text-sm"
                      type="button"
                      disabled={
                        selecionados.length === 0 ||
                        reservando ||
                        evento.vagas === 0
                      }
                      onClick={() => void confirmar()}
                    >
                      {reservando ? 'Reservando…' : 'Reservar e pagar'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
