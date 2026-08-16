import { FormEvent, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { createSalaRequest, meRequest } from '../api';
import { useAuth } from '../auth';
import TopRightActions from '../components/TopRightActions';
import { useToast } from '../toast';

export default function CreateSalaPage() {
  const { token, logout } = useAuth();
  const { showSuccess } = useToast();
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [descricao, setDescricao] = useState('');
  const [capacidade, setCapacidade] = useState('50');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    meRequest(token)
      .then((user) => {
        if (!cancelled) setAllowed(user.isOrg);
      })
      .catch(() => {
        if (!cancelled) logout();
      });
    return () => {
      cancelled = true;
    };
  }, [token, logout]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setAttempted(true);
    if (!token || !descricao.trim() || capacidade.trim() === '') return;
    setError(null);
    setLoading(true);
    try {
      await createSalaRequest(token, {
        descricao: descricao.trim(),
        capacidade: Number(capacidade),
      });
      showSuccess('Sala criada');
      navigate('/organizador/salas');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar sala');
    } finally {
      setLoading(false);
    }
  }

  if (allowed === false) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="bg-page min-h-screen p-6 pt-20 font-sans text-fg">
      <TopRightActions />
      <form className="mx-auto grid w-full max-w-lg gap-4" onSubmit={onSubmit}>
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="m-0 text-sm font-bold uppercase tracking-[0.12em] text-red-500">
              ticketSells
            </p>
            <h1 className="m-0 text-3xl font-semibold">Nova sala</h1>
            <p className="m-0 text-sm text-muted">Cadastre uma sala para usar nos eventos</p>
          </div>
          <Link className="btn-ghost px-3 py-1.5 text-sm no-underline" to="/organizador/salas">
            Voltar
          </Link>
        </header>

        {error ? <p className="m-0 text-sm text-red-500">{error}</p> : null}

        <label className="grid gap-1.5 text-sm text-muted">
          Descrição
          <input
            className={`input-field ${attempted && !descricao.trim() ? 'input-error' : ''}`}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Sala 1, Auditório…"
          />
          {attempted && !descricao.trim() ? (
            <p className="m-0 text-xs text-red-500">Preencha este campo</p>
          ) : null}
        </label>
        <label className="grid gap-1.5 text-sm text-muted">
          Capacidade
          <input
            className={`input-field ${attempted && capacidade.trim() === '' ? 'input-error' : ''}`}
            type="number"
            min={1}
            value={capacidade}
            onChange={(e) => setCapacidade(e.target.value)}
          />
          {attempted && capacidade.trim() === '' ? (
            <p className="m-0 text-xs text-red-500">Preencha este campo</p>
          ) : null}
        </label>
        <button className="btn-primary mt-1" type="submit" disabled={loading}>
          {loading ? 'Salvando…' : 'Criar sala'}
        </button>
      </form>
    </div>
  );
}
