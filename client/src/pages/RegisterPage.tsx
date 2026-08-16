import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerRequest } from '../api';
import { useAuth } from '../auth';
import catalogoFilmes from '../assets/catalogofilmes.jpg';
import ThemeToggle from '../components/ThemeToggle';
import { useToast } from '../toast';

export default function RegisterPage() {
  const { setToken } = useAuth();
  const { showSuccess } = useToast();
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await registerRequest(nome, email, password);
      setToken(data.access_token);
      showSuccess('Conta criada');
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Register failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden p-6 font-sans text-fg">
      <img
        alt=""
        src={catalogoFilmes}
        className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-40"
      />
      <div className="bg-page-overlay pointer-events-none absolute inset-0 z-[1]" />
      <div className="fixed right-6 top-6 z-20">
        <ThemeToggle />
      </div>
      <form
        className="relative z-10 grid w-full max-w-md gap-3 rounded-2xl border bg-surface p-8 shadow-[0_0_60px_-20px_rgba(220,38,38,0.55)] backdrop-blur-md"
        onSubmit={onSubmit}
      >
        <p className="m-0 text-center text-2xl font-bold uppercase tracking-[0.12em] text-red-500">
          ticketSells
        </p>
        <h1 className="m-0 text-xl font-semibold leading-tight">Criar conta</h1>
        <p className="m-0 text-muted">Registre-se para começar</p>

        <label className="grid gap-1.5 text-sm text-muted">
          Nome
          <input
            className="input-field"
            type="text"
            autoComplete="name"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </label>

        <label className="grid gap-1.5 text-sm text-muted">
          Email
          <input
            className="input-field"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="grid gap-1.5 text-sm text-muted">
          Senha
          <div className="relative">
            <input
              className="input-field pr-12"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-md border-0 bg-transparent p-1.5 text-muted hover:text-fg"
              type="button"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3l18 18" />
                  <path d="M10.6 10.6a2 2 0 102.8 2.8" />
                  <path d="M9.9 5.1A10.9 10.9 0 0121 12c-.7 1.2-1.6 2.3-2.7 3.2M6.1 6.1C4.4 7.4 3 9.1 2 12c1.8 5 6.5 8 10 8 1.5 0 3-.4 4.4-1.1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </label>

        {error ? <p className="m-0 text-sm text-red-500">{error}</p> : null}

        <button className="btn-primary mt-1" type="submit" disabled={loading}>
          {loading ? 'Criando…' : 'Criar conta'}
        </button>

        <p className="m-0 text-center text-sm text-muted">
          Já tem conta?{' '}
          <Link className="font-medium text-red-500 hover:text-red-400 hover:underline" to="/login">
            Entrar
          </Link>
        </p>
      </form>
    </div>
  );
}
