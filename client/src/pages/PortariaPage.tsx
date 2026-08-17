import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import {
  listCatalogoEventosRequest,
  meRequest,
  validarIngressoRequest,
  type CatalogoEvento,
  type User,
  type ValidarIngressoResponse,
  type ValidarIngressoResultado,
} from '../api';
import { useAuth } from '../auth';
import TopRightActions from '../components/TopRightActions';

const COOLDOWN_MS = 1500;
const SCANNER_ID = 'portaria-qr-reader';

function formatSessao(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function extractQrcode(raw: string): string {
  const trimmed = raw.trim();
  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/\/ingressos\/([^/]+)\/?$/);
    if (match?.[1]) return decodeURIComponent(match[1]);
  } catch {
    // not a URL
  }
  const pathMatch = trimmed.match(/\/ingressos\/([^/?#]+)\/?$/);
  if (pathMatch?.[1]) return decodeURIComponent(pathMatch[1]);
  return trimmed;
}

const RESULTADO_LABEL: Record<ValidarIngressoResultado, string> = {
  VALIDO: 'Válido',
  INVALIDO: 'Inválido',
  JA_UTILIZADO: 'Já utilizado',
  EVENTO_ERRADO: 'Evento errado',
};

function resultadoClasses(resultado: ValidarIngressoResultado): string {
  switch (resultado) {
    case 'VALIDO':
      return 'border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
    case 'JA_UTILIZADO':
      return 'border-amber-500/50 bg-amber-500/15 text-amber-800 dark:text-amber-200';
    case 'EVENTO_ERRADO':
      return 'border-orange-500/50 bg-orange-500/15 text-orange-800 dark:text-orange-200';
    case 'INVALIDO':
    default:
      return 'border-red-500/50 bg-red-500/15 text-red-700 dark:text-red-300';
  }
}

export default function PortariaPage() {
  const { token, logout } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [eventos, setEventos] = useState<CatalogoEvento[]>([]);
  const [idEvento, setIdEvento] = useState('');
  const [codigoManual, setCodigoManual] = useState('');
  const [resultado, setResultado] = useState<ValidarIngressoResponse | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const cooldownUntilRef = useRef(0);
  const validatingRef = useRef(false);
  const idEventoRef = useRef(idEvento);

  idEventoRef.current = idEvento;

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    meRequest(token)
      .then((data) => {
        if (cancelled) return;
        setUser(data);
        if (!data.isPortaria) return;
        return listCatalogoEventosRequest(token).then((lista) => {
          if (!cancelled) {
            setEventos(lista);
            if (lista.length > 0) setIdEvento((prev) => prev || lista[0].id);
          }
        });
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

  const validarCodigo = useCallback(
    async (raw: string) => {
      if (!token) return;
      const qrcode = extractQrcode(raw);
      if (!qrcode) return;

      const eventoId = idEventoRef.current;
      if (!eventoId) {
        setError('Selecione a sessão antes de validar');
        return;
      }

      if (validatingRef.current || Date.now() < cooldownUntilRef.current) {
        return;
      }

      validatingRef.current = true;
      setValidating(true);
      setError(null);

      try {
        const data = await validarIngressoRequest(token, {
          qrcode,
          idEvento: eventoId,
        });
        setResultado(data);
        cooldownUntilRef.current = Date.now() + COOLDOWN_MS;
      } catch (err: unknown) {
        setResultado(null);
        setError(err instanceof Error ? err.message : 'Falha ao validar');
        cooldownUntilRef.current = Date.now() + COOLDOWN_MS;
      } finally {
        validatingRef.current = false;
        setValidating(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (!user?.isPortaria) return;

    let cancelled = false;
    const scanner = new Html5Qrcode(SCANNER_ID);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 8, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          void validarCodigo(decoded);
        },
        () => undefined,
      )
      .then(() => {
        if (!cancelled) {
          setCameraReady(true);
          setCameraError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCameraReady(false);
          setCameraError(
            'Não foi possível abrir a câmera. Use a digitação manual. Em celular, a página precisa ser HTTPS ou localhost.',
          );
        }
      });

    return () => {
      cancelled = true;
      scannerRef.current = null;
      const stop = async () => {
        try {
          if (scanner.isScanning) {
            await scanner.stop();
          }
        } catch {
          // already stopped
        }
        try {
          scanner.clear();
        } catch {
          // already cleared
        }
      };
      void stop();
      setCameraReady(false);
    };
  }, [user?.isPortaria, validarCodigo]);

  if (user && !user.isPortaria) {
    return <Navigate to={user.isOrg ? '/organizador/eventos' : '/'} replace />;
  }

  const sessaoSelecionada = eventos.find((e) => e.id === idEvento);

  return (
    <div className="bg-page min-h-screen p-6 pt-20 font-sans text-fg">
      <TopRightActions />
      <div className="mx-auto grid w-full max-w-lg gap-5">
        <header>
          <p className="m-0 text-sm font-bold uppercase tracking-[0.12em] text-red-500">
            ticketSells
          </p>
          <h1 className="m-0 text-3xl font-semibold">Portaria</h1>
          <p className="m-0 mt-1 text-sm text-muted">
            Selecione a sessão e valide o ingresso na entrada.
          </p>
        </header>

        {!user ? <p className="m-0 text-muted">Carregando…</p> : null}

        {user?.isPortaria ? (
          <>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Sessão</span>
              <select
                className="input-field w-full"
                value={idEvento}
                onChange={(e) => {
                  setIdEvento(e.target.value);
                  setResultado(null);
                  setError(null);
                }}
                disabled={eventos.length === 0}
              >
                {eventos.length === 0 ? (
                  <option value="">Nenhuma sessão disponível</option>
                ) : (
                  eventos.map((evento) => (
                    <option key={evento.id} value={evento.id}>
                      {evento.titulo} · {formatSessao(evento.data)} ·{' '}
                      {evento.sala.descricao}
                    </option>
                  ))
                )}
              </select>
            </label>

            {sessaoSelecionada ? (
              <p className="m-0 text-sm text-muted">
                Validando para{' '}
                <strong className="text-fg">{sessaoSelecionada.titulo}</strong>
              </p>
            ) : null}

            <div className="grid gap-2">
              <p className="m-0 text-sm font-medium">Leitura por câmera</p>
              <div
                id={SCANNER_ID}
                className="overflow-hidden rounded-2xl border bg-surface"
              />
              {cameraError ? (
                <p className="m-0 text-sm text-amber-600 dark:text-amber-400">
                  {cameraError}
                </p>
              ) : null}
              {cameraReady && !cameraError ? (
                <p className="m-0 text-xs text-muted">
                  Aponte o QR do ingresso para a câmera.
                </p>
              ) : null}
            </div>

            <form
              className="grid gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void validarCodigo(codigoManual).then(() => {
                  setCodigoManual('');
                });
              }}
            >
              <label className="grid gap-1.5">
                <span className="text-sm font-medium">Código manual</span>
                <input
                  className="input-field w-full"
                  value={codigoManual}
                  onChange={(e) => setCodigoManual(e.target.value)}
                  placeholder="Cole o código ou URL do ingresso"
                  autoComplete="off"
                />
              </label>
              <button
                className="btn-buy"
                type="submit"
                disabled={!idEvento || !codigoManual.trim() || validating}
              >
                {validating ? 'Validando…' : 'Validar'}
              </button>
            </form>

            {error ? <p className="m-0 text-sm text-red-500">{error}</p> : null}

            {resultado ? (
              <div
                className={`grid gap-2 rounded-2xl border p-5 text-center ${resultadoClasses(resultado.resultado)}`}
                role="status"
              >
                <p className="m-0 text-2xl font-bold tracking-wide">
                  {RESULTADO_LABEL[resultado.resultado]}
                </p>
                {resultado.eventoTitulo ? (
                  <p className="m-0 text-sm opacity-90">{resultado.eventoTitulo}</p>
                ) : null}
                {resultado.assento ? (
                  <p className="m-0 text-lg">
                    Assento <strong>{resultado.assento}</strong>
                  </p>
                ) : null}
                {resultado.resultado === 'JA_UTILIZADO' && resultado.usadoEm ? (
                  <p className="m-0 text-xs opacity-80">
                    Utilizado em {formatSessao(resultado.usadoEm)}
                  </p>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
