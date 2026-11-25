import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clapperboard,
  Radio,
  Sparkles,
} from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { EventCard } from '../components/EventCard';
import { useClubApp } from '../hooks/useClubApp';
import { isUpcomingOrToday } from '../utils/dateUtils';

export function HomePage() {
  const {
    user,
    liffProfile,
    events,
    registrations,
    registeredEventIdSet,
    pendingEventIds,
    handleRegisterEvent,
  } = useClubApp();

  const openEvents = useMemo(
    () =>
      events.filter(
        (ev) =>
          String(ev.status || '').toUpperCase() === 'OPEN' &&
          isUpcomingOrToday(ev.date)
      ),
    [events]
  );

  const upcomingRegisteredEvents = useMemo(
    () =>
      events.filter(
        (ev) => registeredEventIdSet.has(ev.eventId) && isUpcomingOrToday(ev.date)
      ),
    [events, registeredEventIdSet]
  );

  const featuredUpcoming = upcomingRegisteredEvents[0] || openEvents[0] || null;

  return (
    <div className="space-y-6">
      {/* Broadcast Welcome Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-red-950/30 p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-red-600/10 blur-3xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {liffProfile?.pictureUrl ? (
              <img
                src={liffProfile.pictureUrl}
                alt={user?.nickname}
                className="h-14 w-14 rounded-2xl border-2 border-red-500/40 object-cover shadow-lg"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/40 bg-red-600/20 text-xl font-bold text-red-400">
                {user?.nickname?.slice(0, 1) || 'O'}
              </div>
            )}

            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-red-400">
                <span className="animate-live-dot h-1.5 w-1.5 rounded-full bg-red-500" />
                ON AIR • OB LIVESTREAMING
              </div>
              <h1 className="mt-1.5 text-xl font-bold tracking-tight text-white sm:text-2xl">
                สวัสดี, {user?.nickname || 'สมาชิก'}
              </h1>
              <p className="mt-0.5 text-sm text-zinc-400">
                ตำแหน่ง:{' '}
                <span className="font-semibold text-zinc-200">
                  {user?.role || 'สมาชิกชมรม'}
                </span>
              </p>
            </div>
          </div>

          <Link
            to="/events"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-950/40 transition hover:bg-red-500"
          >
            <CalendarDays className="h-4 w-4" />
            ดูกิจกรรมทั้งหมด
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Summary Stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard
          icon={CheckCircle2}
          label="งานที่ลงทะเบียนไว้"
          value={registrations.length}
          accent="text-emerald-400"
          bg="bg-emerald-500/10"
        />
        <StatCard
          icon={Radio}
          label="งานของฉันที่ใกล้ถึง"
          value={upcomingRegisteredEvents.length}
          accent="text-red-400"
          bg="bg-red-500/10"
        />
        <StatCard
          icon={Clapperboard}
          label="งานที่เปิดรับสมัคร"
          value={openEvents.length}
          accent="text-sky-400"
          bg="bg-sky-500/10"
          className="col-span-2 sm:col-span-1"
        />
      </section>

      {/* Upcoming Event */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-red-500" />
            <h2 className="text-base font-bold text-zinc-100 sm:text-lg">
              {upcomingRegisteredEvents.length > 0
                ? 'งานของคุณที่กำลังจะมาถึงเร็วๆ นี้'
                : 'กิจกรรมที่กำลังจะมาถึงเร็วๆ นี้'}
            </h2>
          </div>
          <Link
            to={upcomingRegisteredEvents.length > 0 ? '/my-events' : '/events'}
            className="text-xs font-semibold text-red-400 transition hover:text-red-300"
          >
            ดูทั้งหมด →
          </Link>
        </div>

        {featuredUpcoming ? (
          <EventCard
            event={featuredUpcoming}
            isRegistered={registeredEventIdSet.has(featuredUpcoming.eventId)}
            isPending={pendingEventIds.includes(featuredUpcoming.eventId)}
            onRegister={(ev) => handleRegisterEvent(ev.eventId)}
          />
        ) : (
          <EmptyState
            icon={CalendarDays}
            title="ยังไม่มีกิจกรรมที่กำลังจะมาถึง"
            description="เมื่อแอดมินเปิดรับสมัครงานใหม่ รายการจะแสดงที่นี่โดยอัตโนมัติ"
          />
        )}
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent, bg, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-zinc-800 bg-zinc-900/75 p-4 ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400">{label}</span>
        <div className={`rounded-lg p-1.5 ${bg}`}>
          <Icon className={`h-4 w-4 ${accent}`} />
        </div>
      </div>
      <p className="font-mono-tech mt-2 text-2xl font-bold text-zinc-100 sm:text-3xl">
        {value}
      </p>
    </div>
  );
}
