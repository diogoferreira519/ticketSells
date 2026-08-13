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
    <div className="page">
      <div className="panel home">
        <p className="brand">ticketSells</p>
        <h1>Área autenticada</h1>
        {error ? <p className="error">{error}</p> : null}
        {user ? (
          <p className="subtitle">
            Logado como <strong>{user.email}</strong>
          </p>
        ) : (
          <p className="subtitle">Carregando…</p>
        )}
        <button type="button" onClick={logout}>
          Sair
        </button>
      </div>
    </div>
  );
}
