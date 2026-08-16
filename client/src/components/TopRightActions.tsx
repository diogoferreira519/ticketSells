import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../auth';
import { useToast } from '../toast';

export default function TopRightActions() {
  const { logout } = useAuth();
  const { showSuccess } = useToast();

  return (
    <div className="fixed right-6 top-6 z-40 flex items-center gap-2">
      <Link className="btn-ghost no-underline" to="/meus-ingressos">
        Meus ingressos
      </Link>
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
