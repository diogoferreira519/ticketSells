import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { listMeusIngressosRequest, type MeuIngresso } from '../api';
import { useAuth } from '../auth';
import TopRightActions from '../components/TopRightActions';
import { useToast } from '../toast';

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

export default function MeusIngressosPage() {
  const { token, logout } = useAuth();
  const { showSuccess } = useToast();
  const [ingressos, setIngressos] = useState<MeuIngresso[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    listMeusIngressosRequest(token)
      .then((data) => {
        if (!cancelled) setIngressos(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Falha ao carregar ingressos');
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

  return (
    <div className="bg-page min-h-screen p-6 pt-20 font-sans text-fg">
      <TopRightActions />
      <div className="mx-auto grid w-full max-w-3xl gap-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
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

        {error ? <p className="m-0 text-sm text-red-500">{error}</p> : null}

        {loading ? (
          <p className="m-0 text-muted">Carregando…</p>
        ) : ingressos.length === 0 ? (
          <p className="m-0 text-muted">Você ainda não tem ingressos.</p>
        ) : (
          <ul className="m-0 grid list-none gap-4 p-0">
            {ingressos.map((ingresso) => {
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
                        {ingresso.status}
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
      </div>
    </div>
  );
}
