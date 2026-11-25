import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useToast } from '../hooks/useToast';

const TOAST_STYLES = {
  success: {
    border: 'border-emerald-500/40',
    bg: 'bg-zinc-900/95',
    icon: CheckCircle2,
    iconColor: 'text-emerald-400',
  },
  error: {
    border: 'border-red-500/50',
    bg: 'bg-zinc-900/95',
    icon: XCircle,
    iconColor: 'text-red-400',
  },
  warning: {
    border: 'border-amber-500/40',
    bg: 'bg-zinc-900/95',
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
  },
  info: {
    border: 'border-zinc-700',
    bg: 'bg-zinc-900/95',
    icon: Info,
    iconColor: 'text-sky-400',
  },
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-3 md:inset-x-auto md:right-4 md:top-4 md:w-96 md:items-end md:px-0"
    >
      {toasts.map((item) => {
        const style = TOAST_STYLES[item.type] || TOAST_STYLES.info;
        const Icon = style.icon;

        return (
          <div
            key={item.id}
            role="status"
            className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border ${style.border} ${style.bg} p-3.5 shadow-2xl shadow-black/60 backdrop-blur-md transition-all`}
          >
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.iconColor}`} />
            <div className="min-w-0 flex-1">
              {item.title && (
                <p className="text-sm font-semibold text-zinc-100">{item.title}</p>
              )}
              {item.message && (
                <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">
                  {item.message}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeToast(item.id)}
              className="rounded-lg p-1 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
              aria-label="ปิดการแจ้งเตือน"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
