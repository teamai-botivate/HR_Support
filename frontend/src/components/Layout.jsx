/**
 * Botivate HR Support - Main Layout (Navbar + Content)
 */

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import { HiOutlineSun, HiOutlineMoon, HiOutlineLogout, HiOutlineChat } from 'react-icons/hi';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(false);

  const toggleDark = () => {
    setDark(!dark);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Navbar ─────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 glass border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="text-lg font-bold text-[var(--color-text-primary)]">
                Botivate <span className="text-[var(--color-primary)]">HR</span>
              </span>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {user && (
                <>
                  <button
                    onClick={() => navigate('/chat')}
                    className="p-2 rounded-xl hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-all cursor-pointer"
                    title="Open Chat"
                  >
                    <HiOutlineChat className="w-5 h-5" />
                  </button>

                  <NotificationBell />

                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
                    <div className="w-7 h-7 rounded-full gradient-accent flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {user.employee_name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-[var(--color-text-primary)] leading-tight">
                        {user.employee_name}
                      </p>
                      <p className="text-[var(--color-text-secondary)] leading-tight capitalize">
                        {user.role}
                      </p>
                    </div>
                  </div>
                </>
              )}

              <button
                onClick={toggleDark}
                className="p-2 rounded-xl hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] transition-all cursor-pointer"
                title="Toggle theme"
              >
                {dark ? <HiOutlineSun className="w-5 h-5" /> : <HiOutlineMoon className="w-5 h-5" />}
              </button>

              {user && (
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl hover:bg-red-50 text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] transition-all cursor-pointer"
                  title="Logout"
                >
                  <HiOutlineLogout className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Main Content ──────────────────────────────── */}
      <main className="flex-1">
        {children}
      </main>

      {/* ── Footer ────────────────────────────────────── */}
      <footer className="border-t border-[var(--color-border)] py-4">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-[var(--color-text-secondary)]">
            © {new Date().getFullYear()} Botivate HR Support — Powered by AI
          </p>
        </div>
      </footer>
    </div>
  );
}
