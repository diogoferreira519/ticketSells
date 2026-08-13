import { useEffect, useState } from 'react';
import { meRequest, type User } from '../api';
import { useAuth } from '../auth';

export default function HomePage() {
  const { token, logout } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    meRequest(token)
      .then((data) => {
        if (!cancelled) setUser(data);
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

  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(ellipse_at_top,_rgba(220,38,38,0.4),_transparent_55%),linear-gradient(165deg,#000000_0%,#1a0505_40%,#450a0a_75%,#000000_100%)] p-6 font-sans text-white">
      <div className="grid w-full max-w-md gap-4 rounded-2xl border border-red-500/30 bg-gradient-to-b from-zinc-950/90 to-black/90 p-8 text-center shadow-[0_0_60px_-20px_rgba(220,38,38,0.55)] backdrop-blur-md">
        <p className="m-0 text-sm font-bold uppercase tracking-[0.12em] text-red-500">
          ticketSells
        </p>
        <h1 className="m-0 text-3xl font-semibold leading-tight">Área autenticada</h1>
        {error ? <p className="m-0 text-sm text-red-400">{error}</p> : null}
        {user ? (
          <p className="m-0 text-zinc-400">
            Logado como <strong className="text-white">{user.email}</strong>
          </p>
        ) : (
          <p className="m-0 text-zinc-400">Carregando…</p>
        )}
        <button
          className="mt-1 cursor-pointer rounded-lg border-0 bg-gradient-to-r from-red-700 via-red-600 to-red-500 px-4 py-3 font-bold text-white transition hover:from-red-600 hover:via-red-500 hover:to-red-400"
          type="button"
          onClick={logout}
        >
          Sair
        </button>
      </div>
    </div>
  );
}
