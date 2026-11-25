import { useMemo, useState } from 'react';
import { CalendarDays, Search } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { EventCard } from '../components/EventCard';
import { EventCardSkeleton } from '../components/Skeletons';
import { useClubApp } from '../hooks/useClubApp';

export function EventsPage() {
  const {
    events,
    registeredEventIdSet,
    pendingEventIds,
    isRefreshing,
    handleRegisterEvent,
  } = useClubApp();

  const [filter, setFilter] = useState('OPEN');
  const [query, setQuery] = useState('');

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((ev) => {
      const status = String(ev.status || '').toUpperCase();
      if (filter === 'OPEN' && status !== 'OPEN') return false;
      if (!q) return true;
      return (
        ev.title?.toLowerCase().includes(q) ||
        ev.location?.toLowerCase().includes(q) ||
        ev.eventId?.toLowerCase().includes(q)
      );
    });
  }, [events, filter, query]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100 sm:text-2xl">
            กิจกรรมทั้งหมด
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            เลือกงานที่ต้องการเข้าร่วมและกดลงทะเบียนเพื่อรับลิงก์กลุ่ม LINE และปฏิทิน (.ics)
          </p>
        </div>

        <div className="inline-flex rounded-xl border border-zinc-800 bg-zinc-900 p-1">
          <button
            type="button"
            onClick={() => setFilter('OPEN')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              filter === 'OPEN'
                ? 'bg-red-600 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            เปิดรับสมัคร
          </button>
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              filter === 'ALL'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            ทั้งหมด ({events.length})
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหาชื่องาน, สถานที่, หรือรหัสงาน..."
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
        />
      </div>

      {/* Event List */}
      {isRefreshing && events.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <EventCardSkeleton />
          <EventCardSkeleton />
        </div>
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="ไม่พบรายการกิจกรรม"
          description={
            query
              ? 'ลองเปลี่ยนคำค้นหาหรือล้างตัวกรองเพื่อดูรายการทั้งหมด'
              : 'ยังไม่มีกิจกรรมที่เปิดรับสมัครในขณะนี้'
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.eventId}
              event={event}
              isRegistered={registeredEventIdSet.has(event.eventId)}
              isPending={pendingEventIds.includes(event.eventId)}
              onRegister={(ev) => handleRegisterEvent(ev.eventId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
