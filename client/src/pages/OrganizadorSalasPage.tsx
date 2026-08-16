import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { listSalasRequest, meRequest, type Sala } from '../api';
import { useAuth } from '../auth';
import TopRightActions from '../components/TopRightActions';

export default function OrganizadorSalasPage() {
  const { token, logout } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    meRequest(token)
      .then(async (user) => {
        if (!user.isOrg) {
          if (!cancelled) setAllowed(false);
          return;
        }
        const list = await listSalasRequest(token);
        if (!cancelled) {
          setSalas(list);
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

  if (allowed === false) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="bg-page min-h-screen p-6 pt-20 font-sans text-fg">
      <TopRightActions />
      <div className="mx-auto grid w-full max-w-5xl gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="m-0 text-sm font-bold uppercase tracking-[0.12em] text-red-500">
              ticketSells
            </p>
            <h1 className="m-0 text-3xl font-semibold">Suas salas</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="btn-ghost px-4 py-2.5 no-underline" to="/organizador/eventos">
              Eventos
            </Link>
            <Link className="btn-primary px-4 py-2.5 no-underline" to="/organizador/salas/novo">
              Nova sala
            </Link>
          </div>
        </header>

        {error ? <p className="m-0 text-sm text-red-500">{error}</p> : null}

        {allowed === null ? (
          <p className="m-0 text-muted">Carregando…</p>
        ) : salas.length === 0 ? (
          <div className="rounded-2xl border bg-surface p-8 text-center">
            <p className="m-0 text-muted">Você ainda não cadastrou salas.</p>
            <Link
              className="mt-4 inline-block font-medium text-red-500 no-underline hover:underline"
              to="/organizador/salas/novo"
            >
              Cadastrar a primeira sala
            </Link>
          </div>
        ) : (
          <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {salas.map((sala) => (
              <li key={sala.id} className="grid gap-1 rounded-2xl border bg-surface p-4">
                <h2 className="m-0 text-lg font-semibold">{sala.descricao}</h2>
                <p className="m-0 text-sm text-muted">{sala.capacidade} lugares</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
