/**
 * Botivate HR Support - Reusable UI Components
 * Premium, minimal, animated components.
 */

/* ── Button ───────────────────────────────────────────── */

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  className = '',
  type = 'button',
}) {
  const baseStyles = `
    inline-flex items-center justify-center gap-2 font-semibold rounded-xl
    transition-all duration-200 ease-out cursor-pointer select-none
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-[0.97]
  `;

  const variants = {
    primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] focus:ring-[var(--color-primary)] shadow-md hover:shadow-lg',
    secondary: 'bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:border-[var(--color-primary)] focus:ring-[var(--color-primary)]',
    danger: 'bg-[var(--color-danger)] text-white hover:opacity-90 focus:ring-[var(--color-danger)]',
    ghost: 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)]',
    accent: 'gradient-accent text-white hover:opacity-90 focus:ring-[var(--color-accent)] shadow-md',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {icon && !loading && <span>{icon}</span>}
      {children}
    </button>
  );
}

/* ── Input ────────────────────────────────────────────── */

export function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  error,
  icon,
  required = false,
  className = '',
  ...props
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-[var(--color-text-secondary)]">
          {label} {required && <span className="text-[var(--color-danger)]">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`
            w-full px-4 py-2.5 rounded-xl text-sm
            bg-[var(--color-surface)] text-[var(--color-text-primary)]
            border border-[var(--color-border)]
            focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20
            outline-none transition-all duration-200
            placeholder:text-[var(--color-text-secondary)]/50
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-[var(--color-danger)]' : ''}
          `}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-[var(--color-danger)]">{error}</span>}
    </div>
  );
}

/* ── Select ───────────────────────────────────────────── */

export function Select({ label, value, onChange, options = [], placeholder, required, className = '' }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-[var(--color-text-secondary)]">
          {label} {required && <span className="text-[var(--color-danger)]">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        required={required}
        className="
          w-full px-4 py-2.5 rounded-xl text-sm
          bg-[var(--color-surface)] text-[var(--color-text-primary)]
          border border-[var(--color-border)]
          focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20
          outline-none transition-all duration-200 cursor-pointer
        "
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ── Card ─────────────────────────────────────────────── */

export function Card({ children, className = '', hover = false, onClick = null }) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)]
        shadow-[var(--shadow-sm)] p-6
        transition-all duration-300 ease-out
        ${hover ? 'hover:shadow-[var(--shadow-md)] hover:border-[var(--color-primary)]/30 hover:-translate-y-0.5 cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/* ── Modal ────────────────────────────────────────────── */

export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className={`
          relative ${sizes[size]} w-full bg-[var(--color-surface)] rounded-2xl
          shadow-[var(--shadow-lg)] border border-[var(--color-border)]
          animate-fadeInUp max-h-[85vh] overflow-y-auto
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] transition-colors cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ── Badge ────────────────────────────────────────────── */

export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]',
    primary: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
    success: 'bg-green-100 text-green-700',
    danger: 'bg-red-100 text-red-700',
    warning: 'bg-amber-100 text-amber-700',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

/* ── Textarea ─────────────────────────────────────────── */

export function Textarea({ label, value, onChange, placeholder, rows = 4, required, className = '' }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-[var(--color-text-secondary)]">
          {label} {required && <span className="text-[var(--color-danger)]">*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
        className="
          w-full px-4 py-2.5 rounded-xl text-sm resize-y
          bg-[var(--color-surface)] text-[var(--color-text-primary)]
          border border-[var(--color-border)]
          focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20
          outline-none transition-all duration-200
          placeholder:text-[var(--color-text-secondary)]/50
        "
      />
    </div>
  );
}
