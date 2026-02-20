/**
 * Botivate HR Support - Notification Bell Component
 */

import { useState, useEffect, useRef } from 'react';
import { HiOutlineBell } from 'react-icons/hi';
import { notificationAPI } from '../api';
import { Badge } from './ui/Components';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getAll();
      setNotifications(res.data);
    } catch {
      // silently fail
    }
  };

  const markRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      // silently fail
    }
  };

  const typeColors = {
    approval_request: 'warning',
    decision_update: 'success',
    reminder: 'primary',
    escalation: 'danger',
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-all cursor-pointer"
      >
        <HiOutlineBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-[var(--color-danger)] text-white text-[10px] font-bold flex items-center justify-center animate-pulse-soft">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-[var(--shadow-lg)] overflow-hidden animate-fadeInUp z-50">
          <div className="p-4 border-b border-[var(--color-border)]">
            <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">Notifications</h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-[var(--color-text-secondary)]">
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 10).map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markRead(notif.id)}
                  className={`
                    p-4 border-b border-[var(--color-border)] cursor-pointer
                    hover:bg-[var(--color-surface-secondary)] transition-colors
                    ${!notif.is_read ? 'bg-[var(--color-primary)]/5' : ''}
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                        {notif.title}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1 line-clamp-2">
                        {notif.message}
                      </p>
                    </div>
                    <Badge variant={typeColors[notif.notification_type] || 'default'}>
                      {notif.notification_type?.replace('_', ' ')}
                    </Badge>
                  </div>
                  {!notif.is_read && (
                    <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] mt-2" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
