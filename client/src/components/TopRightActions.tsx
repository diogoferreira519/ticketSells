import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { meRequest, type User } from '../api';
import { useAuth } from '../auth';
import { useToast } from '../toast';
import ThemeToggle from './ThemeToggle';

export default function TopRightActions() {
  const { token, logout } = useAuth();
  const { showSuccess } = useToast();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    let cancelled = false;
    meRequest(token)
      .then((data) => {
        if (!cancelled) setUser(data);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="fixed right-6 top-6 z-40 flex items-center gap-2">
      {user?.isCliente ? (
        <Link className="btn-ghost no-underline" to="/meus-ingressos">
          Meus ingressos
        </Link>
      ) : null}
      <ThemeToggle />
      <button
        className="btn-ghost"
        type="button"
        onClick={() => {
          logout();
          showSuccess('Sessão encerrada');
        }}
      >
        Sair
      </button>
    </div>
  );
}
