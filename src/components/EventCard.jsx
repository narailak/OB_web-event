import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  MessageCircle,
  Radio,
  Trash2,
} from 'lucide-react';
import {
  formatThaiDate,
  formatTimeRange,
  getRelativeDayLabel,
} from '../utils/dateUtils';

export function EventCard({
  event,
  isRegistered = false,
  isPending = false,
  onRegister,
  onCancel,
}) {
  const isOpen = String(event.status || '').toUpperCase() === 'OPEN';
  const relativeLabel = getRelativeDayLabel(event.date);

  return (
    <article
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border transition-all ${
        isRegistered
          ? 'border-emerald-500/35 bg-zinc-900/90 shadow-lg shadow-emerald-950/10'
          : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700'
      }`}
    >
      {/* Top Broadcast Accent Strip */}
      <div
        className={`h-1 w-full ${
          isRegistered
            ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600'
            : isOpen
              ? 'bg-gradient-to-r from-red-600 via-rose-500 to-red-700'
              : 'bg-zinc-800'
        }`}
      />

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Header Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono-tech rounded-md border border-zinc-700/80 bg-zinc-950 px-2 py-0.5 text-[11px] font-semibold text-zinc-300">
              {event.eventId}
            </span>
            {relativeLabel && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-red-400">
                <Radio className="h-3 w-3" />
                {relativeLabel}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {isRegistered ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                ลงทะเบียนแล้ว
              </span>
            ) : (
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                  isOpen
                    ? 'border border-red-500/30 bg-red-500/10 text-red-400'
                    : 'border border-zinc-700 bg-zinc-800 text-zinc-400'
                }`}
              >
                {isOpen ? 'OPEN' : 'CLOSED'}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-3 text-base font-bold leading-snug text-zinc-100 sm:text-lg">
          {event.title}
        </h3>

        {/* Metadata */}
        <div className="mt-3 space-y-1.5 text-sm text-zinc-300">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-red-400" />
            <span>{formatThaiDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-zinc-400" />
            <span className="font-mono-tech text-xs sm:text-sm">
              {formatTimeRange(event.startTime, event.endTime)}
            </span>
          </div>
          {event.location && (
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
              <span className="text-zinc-300">{event.location}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <p className="mt-3 line-clamp-3 border-t border-zinc-800/80 pt-3 text-xs leading-relaxed text-zinc-400 sm:text-sm">
            {event.description}
          </p>
        )}

        {/* Actions */}
        <div className="mt-4 flex flex-col gap-2 pt-1 sm:flex-row sm:items-center">
          {!isRegistered && onRegister && (
            <button
              type="button"
              disabled={!isOpen || isPending}
              onClick={() => onRegister(event)}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                isOpen
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/40 hover:bg-red-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60'
                  : 'cursor-not-allowed border border-zinc-800 bg-zinc-800/60 text-zinc-500'
              }`}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  กำลังลงทะเบียน...
                </>
              ) : isOpen ? (
                'ลงทะเบียนเข้าร่วมงาน'
              ) : (
                'ปิดรับสมัครแล้ว'
              )}
            </button>
          )}

          {isRegistered && event.lineGroupUrl && (
            <a
              href={event.lineGroupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-600/20 px-4 py-2.5 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-600/30"
            >
              <MessageCircle className="h-4 w-4" />
              เข้ากลุ่ม LINE งานนี้
              <ExternalLink className="h-3.5 w-3.5 opacity-80" />
            </a>
          )}

          {isRegistered && onCancel && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => onCancel(event)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              ยกเลิกการลงทะเบียน
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
