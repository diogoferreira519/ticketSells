import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { getIngressoPorCodigoRequest, type IngressoPublico } from '../api';

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

export default function IngressoPublicoPage() {
  const { qrcode } = useParams<{ qrcode: string }>();
  const [ingresso, setIngresso] = useState<IngressoPublico | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!qrcode) return;
    let cancelled = false;
    setLoading(true);
    getIngressoPorCodigoRequest(qrcode)
      .then((data) => {
        if (!cancelled) setIngresso(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Ingresso não encontrado');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [qrcode]);

  const url = ingresso ? shareUrl(ingresso.link) : '';

  return (
    <div className="bg-page min-h-screen p-6 font-sans text-fg">
      <div className="mx-auto grid w-full max-w-md gap-6 pt-8">
        <header>
          <p className="m-0 text-sm font-bold uppercase tracking-[0.12em] text-red-500">
            ticketSells
          </p>
          <h1 className="m-0 text-3xl font-semibold">Ingresso</h1>
        </header>

        {loading ? <p className="m-0 text-muted">Carregando…</p> : null}
        {error ? <p className="m-0 text-sm text-red-500">{error}</p> : null}

        {ingresso ? (
          <div className="grid gap-4 rounded-2xl border bg-surface p-5 text-center">
            <div className="mx-auto rounded-xl bg-white p-3">
              <QRCodeSVG value={url} size={180} level="M" />
            </div>
            <div className="grid gap-1">
              <h2 className="m-0 text-xl font-semibold">{ingresso.evento.titulo}</h2>
              <p className="m-0 text-sm text-muted">
                {ingresso.evento.sala.descricao} ·{' '}
                {formatSessao(ingresso.evento.data)}
              </p>
              <p className="m-0 mt-2 text-base">
                Assento <strong>{ingresso.assento.descricao}</strong>
              </p>
              <p className="m-0 text-xs uppercase tracking-wide text-muted">
                {ingresso.status}
              </p>
            </div>
          </div>
        ) : null}

        <Link className="btn-ghost mx-auto px-3 py-1.5 text-sm no-underline" to="/">
          Ir ao catálogo
        </Link>
      </div>
    </div>
  );
}
