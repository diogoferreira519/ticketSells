import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginRequest } from '../api';
import { useAuth } from '../auth';

export default function LoginPage() {
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await loginRequest(email, password);
      setToken(data.access_token);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(ellipse_at_top,_rgba(220,38,38,0.4),_transparent_55%),linear-gradient(165deg,#000000_0%,#1a0505_40%,#450a0a_75%,#000000_100%)] p-6 font-sans text-white">
      <form
        className="grid w-full max-w-md gap-4 rounded-2xl border border-red-500/30 bg-gradient-to-b from-zinc-950/90 to-black/90 p-8 shadow-[0_0_60px_-20px_rgba(220,38,38,0.55)] backdrop-blur-md"
        onSubmit={onSubmit}
      >
        <p className="m-0 text-sm font-bold uppercase tracking-[0.12em] text-red-500">
          ticketSells
        </p>
        <h1 className="m-0 text-3xl font-semibold leading-tight">Entrar</h1>
        <p className="m-0 text-zinc-400">Acesse sua conta para continuar</p>

        <label className="grid gap-1.5 text-sm text-zinc-300">
          Email
          <input
            className="w-full rounded-lg border border-red-900/60 bg-black/70 px-3.5 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500 focus:ring-2 focus:ring-red-500/40"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="grid gap-1.5 text-sm text-zinc-300">
          Senha
          <input
            className="w-full rounded-lg border border-red-900/60 bg-black/70 px-3.5 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500 focus:ring-2 focus:ring-red-500/40"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </label>

        {error ? <p className="m-0 text-sm text-red-400">{error}</p> : null}

        <button
          className="mt-1 cursor-pointer rounded-lg border-0 bg-gradient-to-r from-red-700 via-red-600 to-red-500 px-4 py-3 font-bold text-white transition hover:from-red-600 hover:via-red-500 hover:to-red-400 disabled:cursor-wait disabled:opacity-70"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>

        <p className="m-0 text-center text-sm text-zinc-400">
          Não tem conta?{' '}
          <Link className="font-medium text-red-400 hover:text-red-300 hover:underline" to="/register">
            Criar conta
          </Link>
        </p>
      </form>
    </div>
  );
}
